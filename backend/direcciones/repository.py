"""Repository for DireccionEntrega — extends BaseRepository with ownership queries"""

from typing import Optional

from sqlmodel import select, update

from backend.core.repository import BaseRepository
from backend.models.direccion import DireccionEntrega


class DireccionRepository(BaseRepository[DireccionEntrega]):
    """Repository for delivery addresses with user-scoped queries"""

    async def find_by_usuario(self, usuario_id: int) -> list[DireccionEntrega]:
        """Get all (non-deleted) addresses for a given user, primary first."""
        statement = (
            select(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
            )
            .order_by(DireccionEntrega.es_principal.desc(), DireccionEntrega.id)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def find_by_usuario_and_id(
        self, direccion_id: int, usuario_id: int
    ) -> Optional[DireccionEntrega]:
        """Get a specific address ensuring it belongs to the user."""
        statement = select(DireccionEntrega).where(
            DireccionEntrega.id == direccion_id,
            DireccionEntrega.usuario_id == usuario_id,
            DireccionEntrega.deleted_at.is_(None),
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def find_principal(self, usuario_id: int) -> Optional[DireccionEntrega]:
        """Get the current primary address for a user (if any)."""
        statement = select(DireccionEntrega).where(
            DireccionEntrega.usuario_id == usuario_id,
            DireccionEntrega.es_principal.is_(True),
            DireccionEntrega.deleted_at.is_(None),
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def unset_principal(self, usuario_id: int) -> None:
        """Unset primary flag for all of a user's addresses."""
        statement = (
            update(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.es_principal.is_(True),
            )
            .values(es_principal=False)
        )
        await self.session.execute(statement)
