"""FastAPI dependencies for authentication and authorization.

Provides:
- ``get_current_user``: Extracts the authenticated user from a JWT Bearer token.
- ``require_role``: Factory that returns a dependency to check role-based access.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from backend.core.database import get_async_session
from backend.core.security import verify_token
from backend.models.usuario import Usuario

# OAuth2 scheme that extracts Bearer tokens from the Authorization header.
# The ``tokenUrl`` parameter is used by OpenAPI's Swagger UI to display the
# login form. This should point to the actual auth login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_async_session),
) -> Usuario:
    """Dependency that validates a JWT and returns the authenticated user.

    Expects an ``Authorization: Bearer <token>`` header. Decodes the JWT,
    extracts the ``sub`` claim (the user's primary key), and fetches the
    corresponding ``Usuario`` from the database.

    **Role relationships are eagerly loaded** via ``selectinload`` so that
    downstream role checks (e.g. ``require_role``) work without additional
    queries and without triggering async lazy-loading issues.

    Raises:
        HTTPException 401: Token is missing, invalid, expired, or the user
                           does not exist (or was soft-deleted).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode and validate the JWT
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Fetch user from the database with roles eagerly loaded
    statement = (
        select(Usuario)
        .where(Usuario.id == int(user_id), Usuario.deleted_at.is_(None))
        .options(selectinload(Usuario.roles))
    )
    result = await session.execute(statement)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


def require_role(roles: list[str]):
    """Dependency factory that ensures the current user has at least one of
    the required roles.

    Usage in a router::

        from backend.core.dependencies import require_role
        from backend.models.usuario import Usuario

        @router.get("/admin/dashboard")
        async def admin_dashboard(
            current_user: Usuario = Depends(require_role(["ADMIN"])),
        ):
            ...

    Args:
        roles: List of role codes to check (e.g. ``["ADMIN"]``,
               ``["STOCK", "PEDIDOS"]``).

    Returns:
        A FastAPI dependency callable that returns the authenticated
        ``Usuario`` if they have the required role, or raises
        ``403 Forbidden`` otherwise.
    """
    async def _role_checker(
        current_user: Usuario = Depends(get_current_user),
    ) -> Usuario:
        user_role_codes = {rol.codigo for rol in current_user.roles}

        if not user_role_codes.intersection(roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Insufficient permissions. "
                    f"Required one of: {', '.join(roles)}"
                ),
            )

        return current_user

    return _role_checker
