"""Repository for auth operations on Usuario and RefreshToken models.

Inherits from ``BaseRepository[Usuario]`` for user CRUD and adds
refresh-token-specific methods that operate on ``RefreshToken`` directly.
All methods use ``flush()`` (never ``commit()``) for UnitOfWork compatibility.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import update
from sqlmodel import select

from backend.core.repository import BaseRepository
from backend.models.usuario import RefreshToken, Usuario


class AuthRepository(BaseRepository[Usuario]):
    """Repository for authentication and token management.

    Inherits all ``BaseRepository[Usuario]`` methods (get_by_id, create,
    update, delete, count…) and adds auth-specific queries.
    """

    # ------------------------------------------------------------------
    # Usuario queries
    # ------------------------------------------------------------------

    async def find_by_email(self, email: str) -> Optional[Usuario]:
        """Find a non-deleted user by email address.

        Args:
            email: User's email address (case-insensitive lookup).

        Returns:
            The matching ``Usuario`` with roles eagerly loaded, or ``None``.
        """
        from sqlalchemy.orm import selectinload

        statement = (
            select(Usuario)
            .where(Usuario.email == email, Usuario.deleted_at.is_(None))
            .options(selectinload(Usuario.roles))
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    # ------------------------------------------------------------------
    # RefreshToken queries
    # ------------------------------------------------------------------

    async def create_refresh_token(
        self,
        usuario_id: int,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        """Persist a new refresh token.

        Args:
            usuario_id: FK to the owning user.
            token_hash: SHA-256 hash of the raw token.
            expires_at: Expiration timestamp (UTC).

        Returns:
            The newly created ``RefreshToken`` with generated PK.
        """
        token = RefreshToken(
            usuario_id=usuario_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.session.add(token)
        await self.session.flush()
        await self.session.refresh(token)
        return token

    async def find_refresh_token(self, token_hash: str) -> Optional[RefreshToken]:
        """Find a refresh token by its SHA-256 hash.

        Args:
            token_hash: The hex-encoded hash to look up (64 chars).

        Returns:
            The matching ``RefreshToken`` or ``None``.
        """
        statement = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def revoke_refresh_token(self, token: RefreshToken) -> None:
        """Mark a refresh token as revoked (soft-invalidation).

        Sets ``revoked_at`` to the current UTC timestamp.

        Args:
            token: The ``RefreshToken`` instance to revoke.
        """
        token.revoked_at = datetime.now(timezone.utc)
        self.session.add(token)
        await self.session.flush()

    async def revoke_all_user_tokens(self, usuario_id: int) -> None:
        """Revoke ALL active refresh tokens for a user.

        Used when a replay attack is detected — all tokens belonging to
        the user are invalidated immediately via a single bulk ``UPDATE``.

        Args:
            usuario_id: The user whose tokens should be revoked.
        """
        statement = (
            update(RefreshToken)
            .where(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await self.session.execute(statement)
        await self.session.flush()
