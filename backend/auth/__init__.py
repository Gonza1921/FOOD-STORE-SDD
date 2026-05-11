"""Auth module — registration, login, token refresh, and logout.

This module follows the feature-first convention:
- ``router.py``: FastAPI route handlers (Phase 3)
- ``schemas.py``: Pydantic request/response models
- ``service.py``: Business logic layer (Phase 3)
- ``repository.py``: Data access layer (inherits ``BaseRepository``)
"""

from .repository import AuthRepository
from .schemas import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    UserResponse,
)

__all__ = [
    "AuthRepository",
    "RegisterRequest",
    "LoginRequest",
    "RefreshRequest",
    "LogoutRequest",
    "UserResponse",
    "AuthResponse",
]
