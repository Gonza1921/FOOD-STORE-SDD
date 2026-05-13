"""Business logic layer for authentication operations.

Each method is self-contained — it creates its own ``UnitOfWork`` with
an ``AuthRepository`` so the caller (router) only needs to pass request
data and handle the response.
"""

from datetime import datetime, timedelta, timezone

from backend.auth.repository import AuthRepository
from backend.auth.schemas import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    UserResponse,
)
from backend.core.config import settings
from backend.core.exceptions import APIError, ConflictError, UnauthorizedError
from backend.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from backend.core.unit_of_work import UnitOfWork
from backend.models.usuario import Usuario


class AuthService:
    """Authentication service — register, login, refresh, logout."""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def register(self, request: RegisterRequest) -> AuthResponse:
        """Register a new user account.

        Creates the user, assigns the ``CLIENT`` role, and returns
        an access + refresh token pair — all inside a single atomic
        transaction (UnitOfWork).
        """
        async with UnitOfWork() as uow:
            repo = uow.register("auth", AuthRepository, Usuario)

            # 1. Email uniqueness check
            existing = await repo.find_by_email(request.email)
            if existing:
                raise ConflictError("El email ya está registrado")

            # 2. Hash password and create user
            hashed_pw = get_password_hash(request.password)
            user = Usuario(
                nombre=request.nombre,
                apellido=request.apellido,
                email=request.email,
                password_hash=hashed_pw,
            )
            user = await repo.create(user)

            # 3. Assign CLIENT role (business rule RN-AU07)
            await repo.assign_role(user.id, "CLIENT")

            # 4. Generate and persist tokens
            access_token = self._generate_access_token(user)
            raw_refresh = create_refresh_token()
            await self._persist_refresh_token(repo, user.id, raw_refresh)

            # 5. Build response inside UoW (before commit expires objects)
            response = AuthResponse(
                access_token=access_token,
                refresh_token=raw_refresh,
                user=UserResponse(
                    id=user.id,
                    nombre=user.nombre,
                    email=user.email,
                    roles=["CLIENT"],
                ),
            )

        return response

    async def login(self, request: LoginRequest) -> AuthResponse:
        """Authenticate a user with email and password.

        Returns a token pair on success. Returns a **generic** error
        message regardless of whether the email exists or the password
        is wrong (security best practice — RN-AU08).
        """
        async with UnitOfWork() as uow:
            repo = uow.register("auth", AuthRepository, Usuario)

            # 1. Lookup user
            user = await repo.find_by_email(request.email)

            # 2. Verify password (same error for missing user or wrong pw)
            if not user or not verify_password(request.password, user.password_hash):
                raise UnauthorizedError("Credenciales inválidas")

            # 3. Generate and persist tokens
            access_token = self._generate_access_token(user)
            raw_refresh = create_refresh_token()
            await self._persist_refresh_token(repo, user.id, raw_refresh)

            # 4. Build response
            response = AuthResponse(
                access_token=access_token,
                refresh_token=raw_refresh,
                user=UserResponse(
                    id=user.id,
                    nombre=user.nombre,
                    email=user.email,
                    roles=[rol.codigo for rol in user.roles],
                ),
            )

        return response

    async def refresh(self, request: RefreshRequest) -> AuthResponse:
        """Rotate an existing refresh token.

        Implements **token rotation** (RFC 6749 recommended practice):
        the old token is revoked and a new pair is issued. If the old
        token was **already revoked** (replay attack), ALL tokens for
        that user are invalidated.
        """
        token_hash = hash_token(request.refresh_token)

        async with UnitOfWork() as uow:
            repo = uow.register("auth", AuthRepository, Usuario)

            # 1. Lookup stored token
            stored = await repo.find_refresh_token(token_hash)
            if not stored:
                raise UnauthorizedError("Token de refresco inválido")

            # 2. Replay attack detection
            if stored.revoked_at is not None:
                await repo.revoke_all_user_tokens(stored.usuario_id)
                raise APIError(
                    message=(
                        "Sesión comprometida. "
                        "Todos los tokens han sido revocados."
                    ),
                    status_code=401,
                    error_code="SESSION_COMPROMISED",
                )

            # 3. Check expiration
            if stored.expires_at < datetime.utcnow():
                raise UnauthorizedError("Token de refresco expirado")

            # 4. Revoke old token
            await repo.revoke_refresh_token(stored)

            # 5. Load user (needed for token claims)
            user = await repo.get_by_id(stored.usuario_id)
            if not user:
                raise UnauthorizedError("Usuario no encontrado")

            # 6. Generate and persist new tokens
            access_token = self._generate_access_token(user)
            raw_refresh = create_refresh_token()
            await self._persist_refresh_token(repo, user.id, raw_refresh)

            # 7. Build response
            response = AuthResponse(
                access_token=access_token,
                refresh_token=raw_refresh,
                user=UserResponse(
                    id=user.id,
                    nombre=user.nombre,
                    email=user.email,
                    roles=[rol.codigo for rol in user.roles],
                ),
            )

        return response

    async def logout(self, request: LogoutRequest) -> None:
        """Revoke a refresh token (logout).

        Idempotent — revoking an already-revoked or non-existent token
        succeeds silently (returns 204).
        """
        token_hash = hash_token(request.refresh_token)

        async with UnitOfWork() as uow:
            repo = uow.register("auth", AuthRepository, Usuario)

            stored = await repo.find_refresh_token(token_hash)
            if stored and stored.revoked_at is None:
                await repo.revoke_refresh_token(stored)

        # Nothing to return — caller sends 204 No Content

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_access_token(user: Usuario) -> str:
        """Create a JWT access token with standard claims.

        Claims:
            - ``sub``: user ID (as string, per JWT standard)
            - ``email``: user's email
            - ``roles``: list of role codes for fast auth checks
        """
        roles = [rol.codigo for rol in user.roles]
        return create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "roles": roles,
            },
        )

    @staticmethod
    async def _persist_refresh_token(
        repo: AuthRepository,
        usuario_id: int,
        raw_token: str,
    ) -> None:
        """Hash a raw refresh token and store it in the database."""
        token_hash = hash_token(raw_token)
        expires_at = datetime.utcnow() + timedelta(
            days=settings.jwt_refresh_token_expire_days
        )
        await repo.create_refresh_token(usuario_id, token_hash, expires_at)
