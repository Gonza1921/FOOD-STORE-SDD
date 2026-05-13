"""ProductoService — business logic and transaction orchestration

Encapsulates:
- Producto CRUD with M2M associations (Replace All strategy)
- Stock management with pessimistic validation (>= 0 before update)
- Atomicity via UnitOfWork context manager
- Error handling and mapping to HTTP status codes

Architecture: Router → Service → UnitOfWork → Repository → Model
Matches patterns used in: auth, categorias, ingredientes
"""

from decimal import Decimal
from typing import Optional

from sqlmodel import select

from backend.core.exceptions import ConflictError, NotFoundError, ValidationError
from backend.core.unit_of_work import UnitOfWork
from backend.models.categoria import Categoria
from backend.models.producto import (
    Producto,
    ProductoCategoria,
    ProductoIngrediente,
    Ingrediente,
)
from .repository import (
    ProductoRepository,
    ProductoCategoriaRepository,
    ProductoIngredienteRepository,
)


class ProductoService:
    """ProductoService — business logic for Producto CRUD with M2M and stock.

    All DB operations run inside UnitOfWork for atomicity.
    No direct session access — always through repositories inside UoW.
    """

    # ========================================================================
    # Read operations (get_all_paginated, get_by_id, get_public_paginated)
    # ========================================================================

    async def get_all_paginated(
        self, skip: int = 0, limit: int = 20, include_deleted: bool = False
    ) -> tuple[list[Producto], int]:
        """Get all productos with pagination and soft delete filtering.

        Args:
            skip: Number of records to skip (offset).
            limit: Maximum number of records to return.
            include_deleted: If True, include soft-deleted products (admin only).

        Returns:
            Tuple of (list of Producto, total count of all matching records).
        """
        async with UnitOfWork() as uow:
            repo = uow.register("productos", ProductoRepository, Producto)
            return await repo.get_all_paginated(skip, limit, include_deleted)

    async def get_by_id(self, producto_id: int) -> Optional[Producto]:
        """Get producto by ID with eager-loaded associations.

        Args:
            producto_id: Product ID.

        Returns:
            Producto with categorias and ingredientes loaded,
            or None if not found/deleted.
        """
        async with UnitOfWork() as uow:
            repo = uow.register("productos", ProductoRepository, Producto)
            return await repo.get_con_asociaciones(producto_id)

    async def get_public_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        categoria_id: Optional[int] = None,
    ) -> tuple[list[Producto], int]:
        """Get public catalog (disponible=true, not deleted) with filters.

        Args:
            skip: Number of records to skip.
            limit: Maximum records to return.
            search: Search term to filter by nombre or descripcion.
            categoria_id: Optional category ID to filter by.

        Returns:
            Tuple of (list of Producto, total count).
        """
        async with UnitOfWork() as uow:
            repo = uow.register("productos", ProductoRepository, Producto)
            return await repo.get_public_paginated(skip, limit, search, categoria_id)

    # ========================================================================
    # Create with validations (categoria_id exists) and M2M associations
    # ========================================================================

    async def create(
        self,
        producto_data: dict,
        categorias: Optional[list[int]] = None,
        ingredientes: Optional[list[int]] = None,
    ) -> Producto:
        """Create new producto with M2M associations (atomic UoW).

        Validations:
        - nombre: required, non-empty, max 200
        - precio_base: > 0
        - stock_cantidad: >= 0
        - categoria_id: must exist and not deleted
        - categorias[]: must all exist and not deleted (409 if not)
        - ingredientes[]: must all exist and not deleted (409 if not)

        M2M Strategy: Insert all associations atomically. If error → rollback.

        Args:
            producto_data: Dict with producto fields.
            categorias: Optional list of categoria IDs to associate.
            ingredientes: Optional list of ingrediente IDs to associate.

        Returns:
            Created Producto with id and timestamps.

        Raises:
            ConflictError: If categoria/ingrediente not found or nombre duplicado.
            NotFoundError: If categoria/ingrediente does not exist.
            ValueError: If validation fails (invalid input).
        """
        async with UnitOfWork() as uow:

            # ---- Validations (BEFORE any DB mutation) ----

            nombre = (
                producto_data.get("nombre", "").strip()
                if producto_data.get("nombre")
                else ""
            )
            if not nombre:
                raise ValidationError("El nombre es requerido")
            if len(nombre) > 200:
                raise ValidationError("El nombre debe tener máximo 200 caracteres")

            precio = producto_data.get("precio_base")
            if precio is None:
                raise ValidationError("El precio base es requerido")
            if not isinstance(precio, (int, float, Decimal)):
                raise ValidationError("El precio debe ser un valor numérico")
            precio = Decimal(str(precio))
            if precio <= 0:
                raise ValidationError("El precio debe ser mayor a 0")

            stock = producto_data.get("stock_cantidad", 0)
            if not isinstance(stock, int):
                raise ValidationError("El stock debe ser un número entero")
            if stock < 0:
                raise ValidationError("El stock no puede ser negativo")

            descripcion = producto_data.get("descripcion")
            if descripcion and len(descripcion) > 500:
                raise ValidationError("La descripción debe tener máximo 500 caracteres")

            categoria_id = producto_data.get("categoria_id")
            if not categoria_id:
                raise ValidationError("La categoría principal es requerida")

            # Validate categoria_id exists
            cat_stmt = select(Categoria).where(
                Categoria.id == categoria_id,
                Categoria.deleted_at.is_(None),
            )
            cat_result = await uow.session.execute(cat_stmt)
            if not cat_result.scalar_one_or_none():
                raise ConflictError(
                    f"La categoría {categoria_id} no existe o está eliminada"
                )

            # Validate categorias[] (if provided)
            if categorias:
                for cat_id in categorias:
                    stmt = select(Categoria).where(
                        Categoria.id == cat_id,
                        Categoria.deleted_at.is_(None),
                    )
                    result = await uow.session.execute(stmt)
                    if not result.scalar_one_or_none():
                        raise ConflictError(
                            f"La categoría {cat_id} no existe o está eliminada"
                        )

            # Validate ingredientes[] (if provided)
            if ingredientes:
                for ing_id in ingredientes:
                    ing_stmt = select(Ingrediente).where(Ingrediente.id == ing_id)
                    ing_result = await uow.session.execute(ing_stmt)
                    if not ing_result.scalar_one_or_none():
                        raise ConflictError(f"El ingrediente {ing_id} no existe")

            # ---- DB Operations (atomic via UoW commit/rollback) ----

            # Create Producto
            producto = Producto(
                nombre=nombre,
                descripcion=descripcion,
                precio_base=precio,
                stock_cantidad=stock,
                disponible=producto_data.get("disponible", True),
                categoria_id=categoria_id,
            )
            uow.session.add(producto)
            await uow.session.flush()

            # Associate categorias
            if categorias:
                for cat_id in categorias:
                    prod_cat = ProductoCategoria(
                        producto_id=producto.id,
                        categoria_id=cat_id,
                        es_principal=(cat_id == categoria_id),
                    )
                    uow.session.add(prod_cat)
                await uow.session.flush()

            # Associate ingredientes
            if ingredientes:
                for ing_id in ingredientes:
                    prod_ing = ProductoIngrediente(
                        producto_id=producto.id,
                        ingrediente_id=ing_id,
                        es_removible=False,
                    )
                    uow.session.add(prod_ing)
                await uow.session.flush()

            await uow.session.refresh(producto)
            return producto

    # ========================================================================
    # Update with Replace All M2M strategy
    # ========================================================================

    async def update(
        self,
        producto_id: int,
        producto_data: dict,
        categorias: Optional[list[int]] = None,
        ingredientes: Optional[list[int]] = None,
    ) -> Producto:
        """Update existing producto with optional M2M replacement (atomic UoW).

        Args:
            producto_id: ID of producto to update.
            producto_data: Dict with fields to update.
            categorias: Optional list of categoria IDs to REPLACE current ones.
            ingredientes: Optional list of ingrediente IDs to REPLACE current ones.

        Returns:
            Updated Producto with refreshed relations.

        Raises:
            NotFoundError: If producto not found.
            ConflictError: If categoria/ingrediente not found.
            ValueError: If validation fails.
        """
        async with UnitOfWork() as uow:
            repo = uow.register("productos", ProductoRepository, Producto)
            cat_repo = uow.register(
                "prod_categorias", ProductoCategoriaRepository, ProductoCategoria
            )
            ing_repo = uow.register(
                "prod_ingredientes", ProductoIngredienteRepository, ProductoIngrediente
            )

            # Fetch existing producto
            producto = await repo.get_by_id(producto_id)
            if not producto:
                raise NotFoundError(f"Producto {producto_id} no encontrado")

            # Validate and update simple fields
            if "nombre" in producto_data:
                nombre = str(producto_data["nombre"]).strip()
                if not nombre:
                    raise ValidationError("El nombre no puede estar vacío")
                if len(nombre) > 200:
                    raise ValidationError("El nombre debe tener máximo 200 caracteres")
                producto.nombre = nombre

            if "descripcion" in producto_data:
                desc = producto_data.get("descripcion")
                if desc and len(desc) > 500:
                    raise ValidationError(
                        "La descripción debe tener máximo 500 caracteres"
                    )
                producto.descripcion = desc

            if "precio_base" in producto_data:
                precio = Decimal(str(producto_data["precio_base"]))
                if precio <= 0:
                    raise ValidationError("El precio debe ser mayor a 0")
                producto.precio_base = precio

            if "disponible" in producto_data:
                producto.disponible = bool(producto_data["disponible"])

            if "categoria_id" in producto_data:
                cat_id_val = producto_data["categoria_id"]
                stmt = select(Categoria).where(
                    Categoria.id == cat_id_val,
                    Categoria.deleted_at.is_(None),
                )
                result = await uow.session.execute(stmt)
                if not result.scalar_one_or_none():
                    raise ConflictError(
                        f"La categoría {cat_id_val} no existe o está eliminada"
                    )
                producto.categoria_id = cat_id_val

            # Flush main record changes
            uow.session.add(producto)
            await uow.session.flush()

            # Replace All: categorias
            if categorias is not None:
                await cat_repo.delete_by_producto(producto_id)

                for cat_id in categorias:
                    stmt = select(Categoria).where(
                        Categoria.id == cat_id,
                        Categoria.deleted_at.is_(None),
                    )
                    result = await uow.session.execute(stmt)
                    if not result.scalar_one_or_none():
                        raise ConflictError(
                            f"La categoría {cat_id} no existe o está eliminada"
                        )

                    prod_cat = ProductoCategoria(
                        producto_id=producto_id,
                        categoria_id=cat_id,
                        es_principal=(cat_id == producto.categoria_id),
                    )
                    uow.session.add(prod_cat)
                await uow.session.flush()

            # Replace All: ingredientes
            if ingredientes is not None:
                await ing_repo.delete_by_producto(producto_id)

                for ing_id in ingredientes:
                    ing_stmt = select(Ingrediente).where(Ingrediente.id == ing_id)
                    ing_result = await uow.session.execute(ing_stmt)
                    if not ing_result.scalar_one_or_none():
                        raise ConflictError(f"El ingrediente {ing_id} no existe")

                    prod_ing = ProductoIngrediente(
                        producto_id=producto_id,
                        ingrediente_id=ing_id,
                        es_removible=False,
                    )
                    uow.session.add(prod_ing)
                await uow.session.flush()

            await uow.session.refresh(producto)
            return producto

    # ========================================================================
    # Stock operations (update_stock, decrement_stock)
    # ========================================================================

    async def update_stock(self, producto_id: int, nuevo_stock: int) -> Producto:
        """Update producto stock with pessimistic validation (atomic UoW).

        Args:
            producto_id: Product ID.
            nuevo_stock: New stock quantity (absolute value, not delta).

        Returns:
            Updated Producto.

        Raises:
            NotFoundError: If producto not found.
            ValueError: If nuevo_stock < 0.
        """
        async with UnitOfWork() as uow:
            repo = uow.register("productos", ProductoRepository, Producto)

            producto = await repo.get_by_id(producto_id)
            if not producto:
                raise NotFoundError(f"Producto {producto_id} no encontrado")

            if not isinstance(nuevo_stock, int):
                raise ValidationError("El stock debe ser un número entero")
            if nuevo_stock < 0:
                raise ValidationError("El stock no puede ser negativo")

            producto.stock_cantidad = nuevo_stock
            uow.session.add(producto)
            await uow.session.flush()

            return producto

    async def decrement_stock(self, producto_id: int, cantidad: int) -> bool:
        """Decrement stock (for order confirmation with pessimistic check).

        Args:
            producto_id: Product ID.
            cantidad: Quantity to decrement.

        Returns:
            True if successful.

        Raises:
            NotFoundError: If producto not found.
            ValueError: If cantidad invalid or insufficient stock.
        """
        async with UnitOfWork() as uow:
            repo = uow.register("productos", ProductoRepository, Producto)

            producto = await repo.get_by_id(producto_id)
            if not producto:
                raise NotFoundError(f"Producto {producto_id} no encontrado")

            if not isinstance(cantidad, int):
                raise ValidationError("La cantidad debe ser un número entero")
            if cantidad < 0:
                raise ValidationError("La cantidad no puede ser negativa")

            if producto.stock_cantidad < cantidad:
                raise ConflictError(
                    f"Stock insuficiente para producto {producto.id}. "
                    f"Disponible: {producto.stock_cantidad}, Solicitado: {cantidad}"
                )

            producto.stock_cantidad -= cantidad
            uow.session.add(producto)
            await uow.session.flush()

            return True

    # ========================================================================
    # Soft delete and error mapping
    # ========================================================================

    async def delete(self, producto_id: int) -> bool:
        """Soft delete producto (set deleted_at = NOW()) via UoW.

        Args:
            producto_id: Product ID to delete.

        Returns:
            True if successful.

        Raises:
            NotFoundError: If producto not found.
        """
        async with UnitOfWork() as uow:
            repo = uow.register("productos", ProductoRepository, Producto)

            producto = await repo.get_by_id(producto_id)
            if not producto:
                raise NotFoundError(f"Producto {producto_id} no encontrado")

            await repo.delete(producto_id)
            return True
