"""FastAPI router for auth endpoints (register, login, refresh, logout).

All endpoints are mounted at ``/api/v1/auth/`` when included in ``main.py``.
"""

from fastapi import APIRouter, Depends, Request, status

from backend.auth.schemas import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
)
from backend.auth.service import AuthService
from backend.core.dependencies import get_current_user
from backend.core.rate_limit import limiter, limiter_register
from backend.models.usuario import Usuario

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
@limiter_register.limit("3/hour")
async def register(request: Request, register_request: RegisterRequest):
    """Create a new user with role ``CLIENT`` and return a token pair.

    The password is hashed with bcrypt before storage. The ``CLIENT``
    role is assigned automatically by the service layer (RN-AU07).

    Rate-limited to 3 registrations per hour per IP.
    """
    service = AuthService()
    return await service.register(register_request)


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate with email + password",
)
@limiter.limit("5/15minutes")
async def login(request: Request, login_request: LoginRequest):
    """Authenticate and receive an access + refresh token pair.

    Rate-limited to 5 attempts per 15 minutes per IP (RN-AU06).
    Returns a generic error for invalid credentials (RN-AU08).
    """
    service = AuthService()
    return await service.login(login_request)


@router.post(
    "/refresh",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate an expired access token",
)
async def refresh(request: RefreshRequest):
    """Exchange a valid refresh token for a new token pair (rotation).

    Implements replay attack detection — if a revoked token is reused,
    all tokens for the user are invalidated (RN-AU04, RN-AU05).
    """
    service = AuthService()
    return await service.refresh(request)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke a refresh token (logout)",
)
async def logout(
    request: LogoutRequest,
    current_user: Usuario = Depends(get_current_user),
):
    """Revoke the given refresh token. Idempotent — returns 204 even
    if the token was already revoked or does not exist.
    """
    service = AuthService()
    await service.logout(request)
