from typing import Optional

from sqlalchemy import text
from sqlmodel import select

from backend.core.repository import BaseRepository
from backend.models.categoria import Categoria
from backend.models.producto_categoria import ProductoCategoria


class CategoriaRepository(BaseRepository[Categoria]):

    async def find_by_nombre_and_parent(
        self, nombre: str, parent_id: Optional[int]
    ) -> Optional[Categoria]:
        statement = select(Categoria).where(
            Categoria.nombre == nombre,
            Categoria.parent_id == parent_id,
            Categoria.deleted_at.is_(None),
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_children_count(self, categoria_id: int) -> int:
        statement = select(Categoria).where(
            Categoria.parent_id == categoria_id,
            Categoria.deleted_at.is_(None),
        )
        result = await self.session.execute(statement)
        return len(result.scalars().all())

    async def find_by_slug(self, slug: str) -> Optional[Categoria]:
        statement = select(Categoria).where(
            Categoria.slug == slug,
            Categoria.deleted_at.is_(None),
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_tree(self) -> list[Categoria]:
        result = await self.session.execute(
            text("""
                WITH RECURSIVE cat_tree AS (
                    SELECT id, nombre, descripcion, slug, parent_id, creado_en, actualizado_en, 1 as nivel
                    FROM categoria WHERE parent_id IS NULL AND deleted_at IS NULL
                    UNION ALL
                    SELECT c.id, c.nombre, c.descripcion, c.slug, c.parent_id, c.creado_en, c.actualizado_en, ct.nivel + 1
                    FROM categoria c
                    INNER JOIN cat_tree ct ON c.parent_id = ct.id
                    WHERE c.deleted_at IS NULL
                )
                SELECT id, nombre, descripcion, slug, parent_id, creado_en, actualizado_en, nivel
                FROM cat_tree ORDER BY nivel, nombre
            """)
        )
        return result.all()

    async def reassign_children(
        self, parent_id_old: int, new_parent_id: Optional[int]
    ) -> None:
        statement = (
            select(Categoria)
            .where(
                Categoria.parent_id == parent_id_old,
                Categoria.deleted_at.is_(None),
            )
        )
        result = await self.session.execute(statement)
        children = result.scalars().all()
        for child in children:
            child.parent_id = new_parent_id
            self.session.add(child)
        await self.session.flush()

    async def has_active_products(self, categoria_id: int) -> bool:
        statement = select(ProductoCategoria).where(
            ProductoCategoria.categoria_id == categoria_id
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none() is not None

    async def get_all_active(self) -> list[Categoria]:
        """Get all non-deleted categories ordered by name."""
        statement = (
            select(Categoria)
            .where(Categoria.deleted_at.is_(None))
            .order_by(Categoria.nombre)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_product_count(self, categoria_id: int) -> int:
        """Count active products in a category."""
        from sqlmodel import func
        statement = (
            select(func.count(ProductoCategoria.producto_id))
            .where(ProductoCategoria.categoria_id == categoria_id)
        )
        result = await self.session.execute(statement)
        return result.scalar() or 0

    async def get_children(self, categoria_id: int) -> list[Categoria]:
        """Get direct child categories."""
        statement = (
            select(Categoria)
            .where(
                Categoria.parent_id == categoria_id,
                Categoria.deleted_at.is_(None),
            )
            .order_by(Categoria.nombre)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_descendant_ids(self, categoria_id: int) -> list[int]:
        result = await self.session.execute(
            text("""
                WITH RECURSIVE descendants AS (
                    SELECT id FROM categoria WHERE parent_id = :cat_id AND deleted_at IS NULL
                    UNION ALL
                    SELECT c.id FROM categoria c
                    INNER JOIN descendants d ON c.parent_id = d.id
                    WHERE c.deleted_at IS NULL
                )
                SELECT id FROM descendants
            """),
            {"cat_id": categoria_id},
        )
        return [row[0] for row in result.all()]
