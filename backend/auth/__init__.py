"""Auth module — registration, login, token refresh, and logout.

This module follows the feature-first convention:
- ``router.py``: FastAPI route handlers
- ``schemas.py``: Pydantic request/response models
- ``service.py``: Business logic layer
- ``repository.py``: Data access layer (inherits ``BaseRepository``)
"""

from .repository import AuthRepository
from .router import router as auth_router
from .schemas import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    UserResponse,
)
from .service import AuthService

__all__ = [
    "AuthRepository",
    "AuthService",
    "auth_router",
    "RegisterRequest",
    "LoginRequest",
    "RefreshRequest",
    "LogoutRequest",
    "UserResponse",
    "AuthResponse",
]
