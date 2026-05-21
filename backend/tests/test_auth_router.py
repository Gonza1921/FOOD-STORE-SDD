"""Integration tests for auth endpoints.

Task 11.5:
- POST /api/v1/auth/register → 201
- POST /api/v1/auth/login → 200
- POST /api/v1/auth/refresh → 200
- POST /api/v1/auth/logout → 204
- Protected route without token → 401
- Route with insufficient role → 403

NOTE: These tests require a running database. They are skipped
      automatically if database is not configured.
"""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

# Skip all tests if no database URL is configured
skip_if_no_db = pytest.mark.skipif(
    not os.getenv("DATABASE_URL"),
    reason="Requires DATABASE_URL environment variable",
)


# ===========================================================================
# Helper: register a test user and return tokens
# ===========================================================================


def register_test_user(client: TestClient, email: str = "test@example.com") -> dict:
    """Helper to register a test user and return the auth response."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "nombre": "Test",
            "apellido": "User",
            "email": email,
            "password": "TestPass123!",
        },
    )
    return response.json()


# ===========================================================================
# Task 11.5 — Integration tests
# ===========================================================================


class TestAuthEndpoints:
    """Integration tests for auth API endpoints."""

    @skip_if_no_db
    def test_register_returns_201(self):
        """POST /api/v1/auth/register → 201 + verificar persistencia."""
        email = f"register-{uuid.uuid4().hex[:8]}@test.com"
        response = client.post(
            "/api/v1/auth/register",
            json={
                "nombre": "Test",
                "apellido": "User",
                "email": email,
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" in data
        assert "user" in data
        assert data["user"]["email"] == email

    @skip_if_no_db
    def test_register_duplicate_email_returns_409(self):
        """Email duplicado devuelve 409 Conflict."""
        with TestClient(app) as client:
            email = "duplicate@example.com"
            # First registration
            client.post(
                "/api/v1/auth/register",
                json={
                    "nombre": "First",
                    "apellido": "User",
                    "email": email,
                    "password": "TestPass123!",
                },
            )
            # Second registration with same email
            response = client.post(
                "/api/v1/auth/register",
                json={
                    "nombre": "Second",
                    "apellido": "User",
                    "email": email,
                    "password": "TestPass456!",
                },
            )
            assert response.status_code == 409

    @skip_if_no_db
    def test_login_returns_200(self):
        """POST /api/v1/auth/login → 200 + verificar tokens válidos."""
        with TestClient(app) as client:
            email = "login-test@example.com"
            client.post(
                "/api/v1/auth/register",
                json={
                    "nombre": "Login",
                    "apellido": "Test",
                    "email": email,
                    "password": "TestPass123!",
                },
            )
            response = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": "TestPass123!"},
            )
            assert response.status_code == 200
            data = response.json()
            assert "accessToken" in data
            assert "refreshToken" in data
            assert data["user"]["email"] == email

    @skip_if_no_db
    def test_login_invalid_credentials_returns_401(self):
        """Credenciales inválidas devuelven 401."""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrongpass"},
        )
        assert response.status_code == 401
        # Generic error message (no revelation of whether email exists)
        data = response.json()
        assert "credenciales" in data.get("detail", "").lower() or "credenciales" in str(data)

    @skip_if_no_db
    def test_refresh_returns_200(self):
        """POST /api/v1/auth/refresh → 200 + verificar rotación."""
        with TestClient(app) as client:
            # Register and get tokens
            auth_data = register_test_user(client, f"refresh-{uuid.uuid4().hex[:8]}@test.com")
            old_refresh = auth_data["refreshToken"]

            # Refresh
            response = client.post(
                "/api/v1/auth/refresh",
                json={"refreshToken": old_refresh},
            )
            assert response.status_code == 200
            new_data = response.json()
            assert new_data["refreshToken"] != old_refresh  # Rotation

    @skip_if_no_db
    def test_logout_returns_204(self):
        """POST /api/v1/auth/logout → 204 + verificar token revocado."""
        with TestClient(app) as client:
            # Register and get tokens
            auth_data = register_test_user(client, f"logout-{uuid.uuid4().hex[:8]}@test.com")
            access_token = auth_data["accessToken"]
            refresh_token = auth_data["refreshToken"]

            # Logout
            response = client.post(
                "/api/v1/auth/logout",
                json={"refreshToken": refresh_token},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            assert response.status_code == 204

            # Refresh with revoked token should fail → session compromised
            refresh_response = client.post(
                "/api/v1/auth/refresh",
                json={"refreshToken": refresh_token},
            )
            assert refresh_response.status_code == 401

    @skip_if_no_db
    def test_protected_route_without_token_returns_401(self):
        """Ruta protegida sin token → 401."""
        # /api/v1/auth/logout requires authentication
        response = client.post(
            "/api/v1/auth/logout",
            json={"refreshToken": "some-token"},
        )
        assert response.status_code == 401

    @skip_if_no_db
    def test_protected_route_with_insufficient_role_returns_403(self):
        """Ruta con rol insuficiente → 403."""
        with TestClient(app) as client:
            # Register a CLIENT user
            auth_data = register_test_user(client, f"rbac-{uuid.uuid4().hex[:8]}@test.com")
            access_token = auth_data["accessToken"]

            # Try to create a product (requires STOCK or ADMIN)
            response = client.post(
                "/api/v1/productos",
                json={
                    "nombre": "Test Product",
                    "precio_base": "10.00",
                    "categoria_id": 1,
                },
                headers={"Authorization": f"Bearer {access_token}"},
            )
            # CLIENT role does not have STOCK/ADMIN → expect 403
            assert response.status_code == 403
