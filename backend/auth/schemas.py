"""Pydantic schemas for the auth API — request validation and response serialization.

All request schemas use snake_case field names (Python convention).
Response schemas use ``serialization_alias`` to emit camelCase in JSON
(API contract convention per spec).
"""

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    """Payload for ``POST /api/v1/auth/register``."""

    nombre: str = Field(..., min_length=1, max_length=50)
    apellido: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    """Payload for ``POST /api/v1/auth/login``."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Payload for ``POST /api/v1/auth/refresh``."""

    refresh_token: str = Field(..., min_length=1)


class LogoutRequest(BaseModel):
    """Payload for ``POST /api/v1/auth/logout``."""

    refresh_token: str = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class UserResponse(BaseModel):
    """Public user representation returned after auth operations."""

    id: int
    nombre: str
    email: str
    roles: list[str]

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    """Standard auth response with tokens and user data."""

    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")
    user: UserResponse
