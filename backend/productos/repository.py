"""ProductoRepository, ProductoCategoriaRepository, ProductoIngredienteRepository

Provides CRUD and query methods for products, product-category associations,
and product-ingredient associations.

Patterns:
- Soft delete filtering (deleted_at IS NULL)
- Eager loading with selectinload to avoid N+1 queries
- M2M Replace All strategy (DELETE old + INSERT new atomically)
"""

from decimal import Decimal
from typing import Optional

from sqlalchemy import delete, exists, func, not_
from sqlalchemy.orm import selectinload
from sqlmodel import select

from backend.core.repository import BaseRepository
from backend.models.categoria import Categoria
from backend.models.ingrediente import Ingrediente
from backend.models.producto import Producto
from backend.models.producto_categoria import ProductoCategoria
from backend.models.producto_ingrediente import ProductoIngrediente


class ProductoRepository(BaseRepository[Producto]):
    """Repository for Producto CRUD with search and pagination."""

    async def get_all_paginated(
        self, skip: int = 0, limit: int = 20, include_deleted: bool = False
    ) -> tuple[list[Producto], int]:
        """Get paginated list of products with eager-loaded relations.

        Args:
            skip: Number of records to skip (offset).
            limit: Maximum number of records to return.
            include_deleted: If True, include soft-deleted products.

        Returns:
            Tuple of (list of Producto, total count of all matching records).
        """
        # Base query
        statement = select(Producto)

        # Apply soft delete filter
        if not include_deleted:
            statement = statement.where(Producto.deleted_at.is_(None))

        # Eager load relations
        statement = statement.options(
            selectinload(Producto.categorias), selectinload(Producto.ingredientes)
        )

        # Count total BEFORE pagination
        count_statement = select(func.count()).select_from(Producto)
        if not include_deleted:
            count_statement = count_statement.where(Producto.deleted_at.is_(None))
        count_result = await self.session.execute(count_statement)
        total = count_result.scalar() or 0

        # Apply pagination
        statement = statement.offset(skip).limit(limit)

        # Execute query
        result = await self.session.execute(statement)
        items = list(result.unique().scalars().all())

        return items, total

    async def get_by_nombre(self, nombre: str) -> Optional[Producto]:
        """Get product by name (case-insensitive).

        Args:
            nombre: Product name to search for.

        Returns:
            Producto if found and not deleted, else None.
        """
        statement = select(Producto).where(
            Producto.nombre.ilike(f"%{nombre}%"),
            Producto.deleted_at.is_(None),
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_con_asociaciones(self, producto_id: int) -> Optional[Producto]:
        """Get product with eager-loaded categorias and ingredientes.

        Args:
            producto_id: Product ID.

        Returns:
            Producto with relations loaded, or None if not found/deleted.
        """
        statement = select(Producto).where(
            Producto.id == producto_id,
            Producto.deleted_at.is_(None),
        )
        statement = statement.options(
            selectinload(Producto.categorias), selectinload(Producto.ingredientes)
        )
        result = await self.session.execute(statement)
        return result.unique().scalar_one_or_none()

    async def get_public_by_id(self, producto_id: int) -> Optional[Producto]:
        """Get public product detail (available or not, but not deleted).

        Unlike `get_con_asociaciones`, this includes `es_alergeno` on ingredients
        and does NOT require authentication. Used for the public detail endpoint.

        Args:
            producto_id: Product ID.

        Returns:
            Producto with categorias and ingredientes loaded, or None if not found/deleted.
        """
        statement = select(Producto).where(
            Producto.id == producto_id,
            Producto.deleted_at.is_(None),
        )
        statement = statement.options(
            selectinload(Producto.categorias),
            selectinload(Producto.ingredientes),
        )
        result = await self.session.execute(statement)
        return result.unique().scalar_one_or_none()

    async def get_public_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        categoria_id: Optional[int] = None,
        price_min: Optional[int] = None,
        price_max: Optional[int] = None,
        sort_by: str = "reciente",
        excluir_alergenos: Optional[list[int]] = None,
    ) -> tuple[list[Producto], int]:
        """Get public catalog (disponible=true, not deleted) with filters and sorting.

        Args:
            skip: Number of records to skip.
            limit: Maximum records to return.
            search: Search term to filter by nombre or descripcion.
            categoria_id: Optional category ID to filter by.
            price_min: Optional minimum price in cents (inclusive).
            price_max: Optional maximum price in cents (inclusive).
            sort_by: Sorting option: 'price_asc', 'price_desc', 'nombre_asc', 'nombre_desc', 'reciente'.
            excluir_alergenos: Optional list of ingredient IDs to exclude.
                Products containing ANY of these ingredients are filtered out.

        Returns:
            Tuple of (list of Producto, total count).
        """
        # Base query: only available and not deleted
        statement = select(Producto).where(
            Producto.disponible.is_(True),
            Producto.deleted_at.is_(None),
        )

        # Optional category filter
        if categoria_id is not None:
            statement = statement.join(ProductoCategoria).where(
                ProductoCategoria.categoria_id == categoria_id
            )

        # Optional search filter
        if search:
            statement = statement.where(
                Producto.nombre.ilike(f"%{search}%")
                | Producto.descripcion.ilike(f"%{search}%")
            )
        
        # Optional price range filter
        if price_min is not None:
            statement = statement.where(Producto.precio_base >= price_min)
        if price_max is not None:
            statement = statement.where(Producto.precio_base <= price_max)

        # Optional allergen exclusion (subquery NOT EXISTS)
        if excluir_alergenos:
            allergen_subq = (
                select(ProductoIngrediente.producto_id)
                .where(
                    ProductoIngrediente.ingrediente_id.in_(excluir_alergenos),
                    ProductoIngrediente.producto_id == Producto.id,
                )
                .correlate(Producto)
            )
            statement = statement.where(not_(exists(allergen_subq)))
        
        # Apply sorting
        if sort_by == "price_asc":
            statement = statement.order_by(Producto.precio_base.asc())
        elif sort_by == "price_desc":
            statement = statement.order_by(Producto.precio_base.desc())
        elif sort_by == "nombre_asc":
            statement = statement.order_by(Producto.nombre.asc())
        elif sort_by == "nombre_desc":
            statement = statement.order_by(Producto.nombre.desc())
        else:  # reciente (default)
            statement = statement.order_by(Producto.creado_en.desc())

        # Eager load relations
        statement = statement.options(
            selectinload(Producto.categorias), selectinload(Producto.ingredientes)
        )

        # Count total BEFORE pagination
        count_statement = (
            select(func.count())
            .select_from(Producto)
            .where(
                Producto.disponible.is_(True),
                Producto.deleted_at.is_(None),
            )
        )
        if categoria_id is not None:
            count_statement = count_statement.join(ProductoCategoria).where(
                ProductoCategoria.categoria_id == categoria_id
            )
        if search:
            count_statement = count_statement.where(
                Producto.nombre.ilike(f"%{search}%")
                | Producto.descripcion.ilike(f"%{search}%")
            )
        if price_min is not None:
            count_statement = count_statement.where(Producto.precio_base >= price_min)
        if price_max is not None:
            count_statement = count_statement.where(Producto.precio_base <= price_max)
        if excluir_alergenos:
            allergen_subq = (
                select(ProductoIngrediente.producto_id)
                .where(
                    ProductoIngrediente.ingrediente_id.in_(excluir_alergenos),
                    ProductoIngrediente.producto_id == Producto.id,
                )
                .correlate(Producto)
            )
            count_statement = count_statement.where(not_(exists(allergen_subq)))

        count_result = await self.session.execute(count_statement)
        total = count_result.scalar() or 0

        # Apply pagination
        statement = statement.offset(skip).limit(limit)

        # Execute query
        result = await self.session.execute(statement)
        items = list(result.unique().scalars().all())

        return items, total


class ProductoCategoriaRepository(BaseRepository[ProductoCategoria]):
    """Repository for M2M ProductoCategoria associations."""

    async def delete_by_producto(self, producto_id: int) -> None:
        """Delete all category associations for a product (Replace All strategy).

        Args:
            producto_id: Product ID whose associations to delete.
        """
        statement = delete(ProductoCategoria).where(
            ProductoCategoria.producto_id == producto_id
        )
        await self.session.execute(statement)
        await self.session.flush()

    async def get_by_producto(self, producto_id: int) -> list[ProductoCategoria]:
        """Get all category associations for a product.

        Args:
            producto_id: Product ID.

        Returns:
            List of ProductoCategoria (may be empty).
        """
        statement = select(ProductoCategoria).where(
            ProductoCategoria.producto_id == producto_id
        )
        # Optional: join with Categoria to ensure category not deleted
        statement = statement.join(Categoria).where(Categoria.deleted_at.is_(None))
        result = await self.session.execute(statement)
        return list(result.scalars().all())


class ProductoIngredienteRepository(BaseRepository[ProductoIngrediente]):
    """Repository for M2M ProductoIngrediente associations."""

    async def delete_by_producto(self, producto_id: int) -> None:
        """Delete all ingredient associations for a product (Replace All strategy).

        Args:
            producto_id: Product ID whose associations to delete.
        """
        statement = delete(ProductoIngrediente).where(
            ProductoIngrediente.producto_id == producto_id
        )
        await self.session.execute(statement)
        await self.session.flush()

    async def get_by_producto(self, producto_id: int) -> list[ProductoIngrediente]:
        """Get all ingredient associations for a product.

        Args:
            producto_id: Product ID.

        Returns:
            List of ProductoIngrediente (may be empty).
        """
        statement = select(ProductoIngrediente).where(
            ProductoIngrediente.producto_id == producto_id
        )
        # Optional: join with Ingrediente to ensure ingredient not deleted
        statement = statement.join(Ingrediente).where(Ingrediente.deleted_at.is_(None))
        result = await self.session.execute(statement)
        return list(result.scalars().all())
