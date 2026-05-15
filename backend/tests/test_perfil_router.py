"""Integration tests for perfil (user profile) endpoints.

Task 4.2 — CH-014 Perfil de Usuario:
- GET  /api/v1/usuarios/perfil → 200 (profile data)
- PUT  /api/v1/usuarios/perfil → 200 (update nombre, apellido, telefono)
- POST /api/v1/usuarios/perfil/cambiar-contrasena → 200 (password change)
- All endpoints require auth → 401 without token
- Email is immutable in PUT

NOTE: These tests require a running database. They are skipped
      automatically if database is not configured.
"""

import os

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
# Helpers
# ===========================================================================


def register_and_login(email: str, password: str = "TestPass123!") -> dict:
    """Register a test user and return access token + user data."""
    # Register
    client.post(
        "/api/v1/auth/register",
        json={
            "nombre": "Test",
            "apellido": "User",
            "email": email,
            "password": password,
        },
    )
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    return response.json()


# ===========================================================================
# Tests: Auth guard — all perfil endpoints require authentication
# ===========================================================================


class TestAuthGuard:
    """All perfil endpoints require valid access token."""

    @skip_if_no_db
    def test_get_perfil_without_token_returns_401(self):
        """GET sin token → 401."""
        response = client.get("/api/v1/usuarios/perfil")
        assert response.status_code == 401

    @skip_if_no_db
    def test_update_perfil_without_token_returns_401(self):
        """PUT sin token → 401."""
        response = client.put(
            "/api/v1/usuarios/perfil",
            json={"nombre": "Updated"},
        )
        assert response.status_code == 401

    @skip_if_no_db
    def test_cambiar_contrasena_without_token_returns_401(self):
        """POST cambiar-contrasena sin token → 401."""
        response = client.post(
            "/api/v1/usuarios/perfil/cambiar-contrasena",
            json={
                "contrasena_actual": "old",
                "nueva_contrasena": "NewPass123!",
            },
        )
        assert response.status_code == 401


# ===========================================================================
# Tests: GET /api/v1/usuarios/perfil
# ===========================================================================


class TestGetPerfil:
    """GET /api/v1/usuarios/perfil — view own profile."""

    @skip_if_no_db
    def test_get_perfil_returns_profile_data(self):
        """Should return nombre, apellido, email, telefono, creado_en."""
        import uuid
        email = f"get-perfil-{uuid.uuid4().hex[:8]}@test.com"
        auth = register_and_login(email)
        token = auth["accessToken"]

        response = client.get(
            "/api/v1/usuarios/perfil",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email
        assert data["nombre"] == "Test"
        assert data["apellido"] == "User"
        assert "telefono" in data
        assert "creado_en" in data
        assert "id" in data


# ===========================================================================
# Tests: PUT /api/v1/usuarios/perfil
# ===========================================================================


class TestUpdatePerfil:
    """PUT /api/v1/usuarios/perfil — update own profile."""

    @skip_if_no_db
    def test_update_nombre_apellido_telefono(self):
        """Should update nombre, apellido, telefono."""
        import uuid
        email = f"update-perfil-{uuid.uuid4().hex[:8]}@test.com"
        auth = register_and_login(email)
        token = auth["accessToken"]

        response = client.put(
            "/api/v1/usuarios/perfil",
            json={
                "nombre": "Juan Carlos",
                "apellido": "Pérez López",
                "telefono": "+5491123456789",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Juan Carlos"
        assert data["apellido"] == "Pérez López"
        assert data["telefono"] == "+5491123456789"
        assert data["email"] == email  # email unchanged

    @skip_if_no_db
    def test_email_is_immutable(self):
        """Email should NOT change after PUT (email is the user identifier)."""
        import uuid
        email = f"email-immutable-{uuid.uuid4().hex[:8]}@test.com"
        auth = register_and_login(email)
        token = auth["accessToken"]

        # Attempt to change email
        response = client.put(
            "/api/v1/usuarios/perfil",
            json={"email": "hacked@evil.com"},
            headers={"Authorization": f"Bearer {token}"},
        )
        # Should succeed but email stays the same
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email  # immutable!
        assert data["email"] != "hacked@evil.com"

    @skip_if_no_db
    def test_empty_update_returns_current_profile(self):
        """PUT sin campos (empty JSON) should return current profile without error."""
        import uuid
        email = f"empty-update-{uuid.uuid4().hex[:8]}@test.com"
        auth = register_and_login(email)
        token = auth["accessToken"]

        response = client.put(
            "/api/v1/usuarios/perfil",
            json={},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email
        assert data["nombre"] == "Test"


# ===========================================================================
# Tests: POST /api/v1/usuarios/perfil/cambiar-contrasena
# ===========================================================================


class TestCambiarContrasena:
    """POST /api/v1/usuarios/perfil/cambiar-contrasena — change password."""

    @skip_if_no_db
    def test_cambiar_contrasena_success(self):
        """Should change password and allow login with new password."""
        import uuid
        email = f"change-pw-{uuid.uuid4().hex[:8]}@test.com"
        password = "OldPass123!"
        auth = register_and_login(email, password)
        token = auth["accessToken"]

        # Change password
        response = client.post(
            "/api/v1/usuarios/perfil/cambiar-contrasena",
            json={
                "contrasena_actual": password,
                "nueva_contrasena": "NewPass456!",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "contraseña" in data["message"].lower()

        # Verify old password no longer works
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert login_response.status_code == 401

        # Verify new password works
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "NewPass456!"},
        )
        assert login_response.status_code == 200

    @skip_if_no_db
    def test_cambiar_contrasena_wrong_current_password_returns_400(self):
        """Should reject with 400 INVALID_PASSWORD on wrong current password."""
        import uuid
        email = f"wrong-pw-{uuid.uuid4().hex[:8]}@test.com"
        auth = register_and_login(email)
        token = auth["accessToken"]

        response = client.post(
            "/api/v1/usuarios/perfil/cambiar-contrasena",
            json={
                "contrasena_actual": "WrongPassword!",
                "nueva_contrasena": "NewPass456!",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400
        data = response.json()
        # Should indicate invalid password
        error_str = str(data).lower()
        assert "contraseña" in error_str or "password" in error_str
