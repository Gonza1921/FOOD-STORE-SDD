"""ProductoService — business logic and transaction orchestration

Encapsulates:
- Producto CRUD with M2M associations (Replace All strategy)
- Stock management with pessimistic validation (>= 0 before update)
- Atomicity via UnitOfWork context manager
- Error handling and mapping to HTTP status codes
"""

from typing import Optional
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from backend.core.unit_of_work import UnitOfWork
from backend.core.exceptions import NotFoundError
from backend.models.producto import (
    Producto,
    ProductoCategoria,
    ProductoIngrediente,
)
from backend.models.categoria import Categoria
from backend.models.ingrediente import Ingrediente
from .repository import (
    ProductoRepository,
    ProductoCategoriaRepository,
    ProductoIngredienteRepository,
)


class ProductoService:
    """ProductoService — business logic for Producto CRUD with M2M and stock."""

    def __init__(self, session: AsyncSession):
        """Initialize service with a session (will be used inside UoW context).

        Args:
            session: An active AsyncSession.
        """
        self.session = session
        self.repo = ProductoRepository(session, Producto)
        self.cat_repo = ProductoCategoriaRepository(session, ProductoCategoria)
        self.ing_repo = ProductoIngredienteRepository(session, ProductoIngrediente)

    # ========================================================================
    # TASK 3.1: Inherited CRUD methods (delegated to repository)
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
        return await self.repo.get_all_paginated(skip, limit, include_deleted)

    async def get_by_id(self, producto_id: int) -> Optional[Producto]:
        """Get producto by ID with eager-loaded associations.

        Args:
            producto_id: Product ID.

        Returns:
            Producto with categorias and ingredientes loaded, or None if not found/deleted.
        """
        return await self.repo.get_con_asociaciones(producto_id)

    async def get_public_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        categoria_id: Optional[int] = None,
    ) -> tuple[list[Producto], int]:
        """Get public catalog (disponible=true, not deleted) with optional filters.

        Args:
            skip: Number of records to skip.
            limit: Maximum records to return.
            search: Search term to filter by nombre or descripcion.
            categoria_id: Optional category ID to filter by.

        Returns:
            Tuple of (list of Producto, total count).
        """
        return await self.repo.get_public_paginated(skip, limit, search, categoria_id)

    # ========================================================================
    # TASK 3.2: Create with validation (categoria_id exists) and M2M
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
            producto_data: Dict with producto fields {nombre, descripcion, precio_base, ...}
            categorias: Optional list of categoria IDs to associate.
            ingredientes: Optional list of ingrediente IDs to associate.

        Returns:
            Created Producto with id and timestamps.

        Raises:
            ValueError: If validation fails (400 Bad Request).
            ValueError: If categoria/ingrediente not found (409 Conflict).
        """
        # ===== Validations (BEFORE any DB operation) =====

        # Validate nombre
        nombre = producto_data.get("nombre", "").strip() if producto_data.get("nombre") else ""
        if not nombre:
            raise ValueError("Nombre es requerido")
        if len(nombre) > 200:
            raise ValueError("Nombre debe ser <= 200 caracteres")

        # Validate precio_base
        precio = producto_data.get("precio_base")
        if precio is None:
            raise ValueError("Precio base es requerido")
        if not isinstance(precio, (int, float, Decimal)):
            raise ValueError("Precio debe ser numérico")
        precio = Decimal(str(precio))
        if precio <= 0:
            raise ValueError("Precio debe ser > 0")

        # Validate stock_cantidad
        stock = producto_data.get("stock_cantidad", 0)
        if not isinstance(stock, int):
            raise ValueError("Stock debe ser entero")
        if stock < 0:
            raise ValueError("Stock no puede ser negativo")

        # Validate descripcion
        descripcion = producto_data.get("descripcion")
        if descripcion and len(descripcion) > 500:
            raise ValueError("Descripción debe ser <= 500 caracteres")

        # Validate categoria_id (FK, must exist and not deleted)
        categoria_id = producto_data.get("categoria_id")
        if not categoria_id:
            raise ValueError("Categoría primaria es requerida")

        cat_stmt = select(Categoria).where(
            (Categoria.id == categoria_id) & (Categoria.deleted_at.is_(None))
        )
        cat_result = await self.session.execute(cat_stmt)
        if not cat_result.scalar_one_or_none():
            raise ValueError(f"Categoría {categoria_id} no existe o está eliminada")

        # Validate categorias[] (if provided)
        if categorias:
            for cat_id in categorias:
                cat_stmt = select(Categoria).where(
                    (Categoria.id == cat_id) & (Categoria.deleted_at.is_(None))
                )
                cat_result = await self.session.execute(cat_stmt)
                if not cat_result.scalar_one_or_none():
                    raise ValueError(f"Categoría {cat_id} no existe o está eliminada")

        # Validate ingredientes[] (if provided)
        if ingredientes:
            for ing_id in ingredientes:
                ing_stmt = select(Ingrediente).where(
                    (Ingrediente.id == ing_id) & (Ingrediente.deleted_at.is_(None))
                )
                ing_result = await self.session.execute(ing_stmt)
                if not ing_result.scalar_one_or_none():
                    raise ValueError(f"Ingrediente {ing_id} no existe o está eliminada")

        # ===== DB Operations (atomic via session) =====

        # Create Producto
        producto = Producto(
            nombre=nombre,
            descripcion=descripcion,
            precio_base=precio,
            stock_cantidad=stock,
            disponible=producto_data.get("disponible", True),
            categoria_id=categoria_id,
        )
        self.session.add(producto)
        await self.session.flush()  # Get the ID without commit

        # Associate categorias (Replace All: insert all provided)
        if categorias:
            for cat_id in categorias:
                prod_cat = ProductoCategoria(
                    producto_id=producto.id,
                    categoria_id=cat_id,
                    es_principal=(cat_id == categoria_id),  # Primary = the main one
                )
                self.session.add(prod_cat)
            await self.session.flush()

        # Associate ingredientes (Replace All: insert all provided)
        if ingredientes:
            for ing_id in ingredientes:
                prod_ing = ProductoIngrediente(
                    producto_id=producto.id,
                    ingrediente_id=ing_id,
                    es_removible=False,  # Default, can be set per-ingrediente in schema
                )
                self.session.add(prod_ing)
            await self.session.flush()

        # Refresh to load relations
        await self.session.refresh(producto)
        return producto

    # ========================================================================
    # TASK 3.3: Update with Replace All M2M strategy
    # ========================================================================

    async def update(
        self,
        producto_id: int,
        producto_data: dict,
        categorias: Optional[list[int]] = None,
        ingredientes: Optional[list[int]] = None,
    ) -> Producto:
        """Update existing producto with optional M2M replacement.

        Validations:
        - producto_id must exist and not deleted
        - precio_base: if provided, must be > 0
        - categorias/ingredientes: if provided, must all exist

        M2M Strategy: Replace All
        - DELETE all old ProductoCategoria rows
        - INSERT all new ProductoCategoria rows
        - Same for ingredientes
        - All atomic within session.

        Args:
            producto_id: ID of producto to update.
            producto_data: Dict with fields to update (nombre, descripcion, precio_base, disponible, categoria_id).
            categorias: Optional list of categoria IDs to REPLACE the current ones.
            ingredientes: Optional list of ingrediente IDs to REPLACE the current ones.

        Returns:
            Updated Producto with refreshed relations.

        Raises:
            ValueError: If producto not found or validations fail.
        """
        # Fetch existing producto
        producto = await self.repo.get_by_id(producto_id)
        if not producto:
            raise ValueError(f"Producto {producto_id} no existe")

        # Validate and update simple fields
        if "nombre" in producto_data:
            nombre = str(producto_data["nombre"]).strip()
            if not nombre:
                raise ValueError("Nombre no puede estar vacío")
            if len(nombre) > 200:
                raise ValueError("Nombre debe ser <= 200 caracteres")
            producto.nombre = nombre

        if "descripcion" in producto_data:
            desc = producto_data.get("descripcion")
            if desc and len(desc) > 500:
                raise ValueError("Descripción debe ser <= 500 caracteres")
            producto.descripcion = desc

        if "precio_base" in producto_data:
            precio = Decimal(str(producto_data["precio_base"]))
            if precio <= 0:
                raise ValueError("Precio debe ser > 0")
            producto.precio_base = precio

        if "disponible" in producto_data:
            producto.disponible = bool(producto_data["disponible"])

        if "categoria_id" in producto_data:
            categoria_id = producto_data["categoria_id"]
            cat_stmt = select(Categoria).where(
                (Categoria.id == categoria_id) & (Categoria.deleted_at.is_(None))
            )
            cat_result = await self.session.execute(cat_stmt)
            if not cat_result.scalar_one_or_none():
                raise ValueError(f"Categoría {categoria_id} no existe o está eliminada")
            producto.categoria_id = categoria_id

        # Update main record
        self.session.add(producto)
        await self.session.flush()

        # Replace All: categorias
        if categorias is not None:
            # Delete old associations
            await self.cat_repo.delete_by_producto(producto_id)

            # Validate new categorias exist
            from sqlmodel import select
            for cat_id in categorias:
                cat_stmt = select(Categoria).where(
                    (Categoria.id == cat_id) & (Categoria.deleted_at.is_(None))
                )
                cat_result = await self.session.execute(cat_stmt)
                if not cat_result.scalar_one_or_none():
                    raise ValueError(f"Categoría {cat_id} no existe o está eliminada")

            # Insert new associations
            for cat_id in categorias:
                prod_cat = ProductoCategoria(
                    producto_id=producto_id,
                    categoria_id=cat_id,
                    es_principal=(cat_id == producto.categoria_id),
                )
                self.session.add(prod_cat)
            await self.session.flush()

        # Replace All: ingredientes
        if ingredientes is not None:
            # Delete old associations
            await self.ing_repo.delete_by_producto(producto_id)

            # Validate new ingredientes exist
            from sqlmodel import select
            for ing_id in ingredientes:
                ing_stmt = select(Ingrediente).where(
                    (Ingrediente.id == ing_id) & (Ingrediente.deleted_at.is_(None))
                )
                ing_result = await self.session.execute(ing_stmt)
                if not ing_result.scalar_one_or_none():
                    raise ValueError(f"Ingrediente {ing_id} no existe o está eliminada")

            # Insert new associations
            for ing_id in ingredientes:
                prod_ing = ProductoIngrediente(
                    producto_id=producto_id,
                    ingrediente_id=ing_id,
                    es_removible=False,
                )
                self.session.add(prod_ing)
            await self.session.flush()

        # Refresh to load updated relations
        await self.session.refresh(producto)
        return producto

    # ========================================================================
    # TASK 3.4: Update stock with pessimistic validation
    # ========================================================================

    async def update_stock(self, producto_id: int, nuevo_stock: int) -> Producto:
        """Update producto stock with pessimistic validation.

        Validations:
        - Producto exists and not deleted
        - nuevo_stock >= 0 (BEFORE update, pessimistic)

        Args:
            producto_id: Product ID.
            nuevo_stock: New stock quantity (absolute value, not delta).

        Returns:
            Updated Producto.

        Raises:
            ValueError: If producto not found or nuevo_stock < 0.
        """
        # Fetch existing producto
        producto = await self.repo.get_by_id(producto_id)
        if not producto:
            raise ValueError(f"Producto {producto_id} no existe")

        # Pessimistic validation: BEFORE update
        if not isinstance(nuevo_stock, int):
            raise ValueError("Stock debe ser entero")
        if nuevo_stock < 0:
            raise ValueError("Stock no puede ser negativo")

        # Update
        producto.stock_cantidad = nuevo_stock
        self.session.add(producto)
        await self.session.flush()

        return producto

    async def decrement_stock(self, producto_id: int, cantidad: int) -> bool:
        """Decrement stock (for order confirmation with pessimistic check).

        Validations:
        - Producto exists
        - Current stock >= cantidad requested (pessimistic)

        Args:
            producto_id: Product ID.
            cantidad: Quantity to decrement.

        Returns:
            True if successful.

        Raises:
            ValueError: If producto not found, cantidad invalid, or insufficient stock.
        """
        # Fetch existing producto
        producto = await self.repo.get_by_id(producto_id)
        if not producto:
            raise ValueError(f"Producto {producto_id} no existe")

        # Validate cantidad
        if not isinstance(cantidad, int):
            raise ValueError("Cantidad debe ser entero")
        if cantidad < 0:
            raise ValueError("Cantidad no puede ser negativa")

        # Pessimistic validation: sufficient stock BEFORE update
        if producto.stock_cantidad < cantidad:
            raise ValueError(
                f"Stock insuficiente para {producto.id}. "
                f"Disponible: {producto.stock_cantidad}, Solicitado: {cantidad}"
            )

        # Decrement
        producto.stock_cantidad -= cantidad
        self.session.add(producto)
        await self.session.flush()

        return True

    # ========================================================================
    # TASK 3.5: Soft delete and error mapping
    # ========================================================================

    async def delete(self, producto_id: int) -> bool:
        """Soft delete producto (set deleted_at = NOW()).

        Cascading: ProductoCategoria and ProductoIngrediente are NOT physically deleted,
        but queries filter them out via producto's soft delete.

        Args:
            producto_id: Product ID to delete.

        Returns:
            True if successful.

        Raises:
            ValueError: If producto not found.
        """
        # Fetch existing producto
        producto = await self.repo.get_by_id(producto_id)
        if not producto:
            raise ValueError(f"Producto {producto_id} no existe")

        # Soft delete (BaseRepository.delete sets deleted_at)
        await self.repo.delete(producto_id)
        return True

    def map_error_to_response(self, error: Exception) -> tuple[int, dict]:
        """Map service exceptions to HTTP status codes and error response.

        Used by router to convert exceptions to JSON responses.

        Args:
            error: Exception raised by service.

        Returns:
            Tuple of (status_code, error_dict) where error_dict has 'detail' and optionally 'code'.
        """
        error_msg = str(error)

        # 400 Bad Request: validation errors
        if any(
            phrase in error_msg
            for phrase in [
                "no puede ser negativo",
                "debe ser",
                "requerido",
                "no vacío",
                "debe ser entero",
                "no ser vacío",
                "> 0",
                "<= ",
            ]
        ):
            return (400, {"detail": error_msg, "code": "INVALID_INPUT"})

        # 404 Not Found
        if "no existe" in error_msg.lower():
            return (404, {"detail": error_msg, "code": "NOT_FOUND"})

        # 409 Conflict: validation conflict (categoria/ingrediente not found = 409 per spec)
        if "no existe o está eliminada" in error_msg.lower():
            return (409, {"detail": error_msg, "code": "CONFLICT"})

        # 500 Internal Server Error (fallback)
        return (500, {"detail": "Error interno del servidor", "code": "INTERNAL_ERROR"})
