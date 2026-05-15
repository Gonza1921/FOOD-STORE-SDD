"""Repository for profile operations on Usuario model.

Inherits from ``BaseRepository[Usuario]`` and adds profile-specific queries.
All methods use ``flush()`` (never ``commit()``) for UnitOfWork compatibility.
"""

from datetime import datetime

from sqlalchemy import update

from backend.core.repository import BaseRepository
from backend.models.usuario import RefreshToken, Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    """Repository for user profile data and token management.

    Inherits all ``BaseRepository[Usuario]`` methods (get_by_id, create,
    update, delete, count…) and adds profile-specific queries.
    """

    async def revoke_all_user_tokens(self, usuario_id: int) -> None:
        """Revoke ALL active refresh tokens for a user.

        Used when the user changes their password — all existing sessions
        are invalidated to force re-login.

        Args:
            usuario_id: The user whose tokens should be revoked.
        """
        statement = (
            update(RefreshToken)
            .where(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.utcnow())
        )
        await self.session.execute(statement)
        await self.session.flush()
