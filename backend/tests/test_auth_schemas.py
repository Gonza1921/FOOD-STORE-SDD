"""Tests for auth Pydantic schemas — validation and serialization.

Task 11.x (schema-level validation tests):
- RegisterRequest validation (email, password min/max)
- LoginRequest validation
- RefreshRequest / LogoutRequest
- AuthResponse serialization (camelCase aliases)
"""

from datetime import datetime

import pytest
from pydantic import ValidationError

from backend.auth.schemas import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    UserResponse,
)


class TestRegisterRequest:
    """Task 11.x — RegisterRequest schema validation."""

    def test_valid_register_request(self):
        """All required fields with valid values pass validation."""
        data = RegisterRequest(
            nombre="Juan",
            apellido="Pérez",
            email="juan@example.com",
            password="SecurePass1!",
        )
        assert data.nombre == "Juan"
        assert data.apellido == "Pérez"
        assert data.email == "juan@example.com"
        assert data.password == "SecurePass1!"

    def test_email_validation(self):
        """Invalid email raises ValidationError."""
        with pytest.raises(ValidationError):
            RegisterRequest(
                nombre="Juan",
                apellido="Pérez",
                email="not-an-email",
                password="SecurePass1!",
            )

    def test_password_min_length(self):
        """Password shorter than 8 chars raises ValidationError."""
        with pytest.raises(ValidationError):
            RegisterRequest(
                nombre="Juan",
                apellido="Pérez",
                email="juan@example.com",
                password="Short1!",
            )

    def test_password_max_length(self):
        """Password longer than 128 chars raises ValidationError."""
        with pytest.raises(ValidationError):
            RegisterRequest(
                nombre="Juan",
                apellido="Pérez",
                email="juan@example.com",
                password="A" * 129,
            )

    def test_nombre_required(self):
        """Empty nombre raises ValidationError."""
        with pytest.raises(ValidationError):
            RegisterRequest(
                nombre="",
                apellido="Pérez",
                email="juan@example.com",
                password="SecurePass1!",
            )

    def test_apellido_required(self):
        """Empty apellido raises ValidationError."""
        with pytest.raises(ValidationError):
            RegisterRequest(
                nombre="Juan",
                apellido="",
                email="juan@example.com",
                password="SecurePass1!",
            )


class TestLoginRequest:
    """Task 11.x — LoginRequest schema validation."""

    def test_valid_login_request(self):
        """Valid email + password pass validation."""
        data = LoginRequest(email="juan@example.com", password="SecurePass1!")
        assert data.email == "juan@example.com"
        assert data.password == "SecurePass1!"

    def test_invalid_email(self):
        """Malformed email raises ValidationError."""
        with pytest.raises(ValidationError):
            LoginRequest(email="bad-email", password="SecurePass1!")


class TestRefreshRequest:
    """Task 11.x — RefreshRequest schema validation."""

    def test_valid_refresh_request(self):
        """Valid refresh_token passes validation."""
        data = RefreshRequest(refresh_token="some-uuid-string")
        assert data.refresh_token == "some-uuid-string"

    def test_empty_token(self):
        """Empty refresh_token raises ValidationError."""
        with pytest.raises(ValidationError):
            RefreshRequest(refresh_token="")


class TestLogoutRequest:
    """Task 11.x — LogoutRequest schema validation."""

    def test_valid_logout_request(self):
        """Valid refresh_token passes validation."""
        data = LogoutRequest(refresh_token="some-uuid-string")
        assert data.refresh_token == "some-uuid-string"

    def test_empty_token(self):
        """Empty refresh_token raises ValidationError."""
        with pytest.raises(ValidationError):
            LogoutRequest(refresh_token="")


class TestUserResponse:
    """Task 11.x — UserResponse schema."""

    def test_valid_user_response(self):
        """All fields serialize correctly."""
        data = UserResponse(id=1, nombre="Juan", email="juan@example.com", roles=["CLIENT"])
        assert data.id == 1
        assert data.nombre == "Juan"
        assert data.email == "juan@example.com"
        assert data.roles == ["CLIENT"]


class TestAuthResponse:
    """Task 11.x — AuthResponse schema with camelCase aliases."""

    def test_valid_auth_response(self):
        """AuthResponse with all nested fields."""
        user = UserResponse(id=1, nombre="Juan", email="juan@example.com", roles=["CLIENT"])
        data = AuthResponse(
            access_token="eyJ...",
            refresh_token="uuid-123",
            user=user,
        )
        assert data.access_token == "eyJ..."
        assert data.refresh_token == "uuid-123"
        assert data.user.id == 1

    def test_camelcase_serialization(self):
        """AuthResponse serializes with camelCase aliases."""
        user = UserResponse(id=1, nombre="Juan", email="juan@example.com", roles=["CLIENT"])
        data = AuthResponse(
            access_token="eyJ...",
            refresh_token="uuid-123",
            user=user,
        )
        json_data = data.model_dump(by_alias=True)
        assert "accessToken" in json_data
        assert "refreshToken" in json_data
        assert "user" in json_data
