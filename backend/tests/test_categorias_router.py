"""Integration tests for Categoria CRUD endpoints.

All categorias endpoints require ADMIN role:
- POST   /api/v1/categorias — Create
- GET    /api/v1/categorias — List all
- GET    /api/v1/categorias/{id} — Get by ID
- PUT    /api/v1/categorias/{id} — Update
- DELETE /api/v1/categorias/{id} — Soft delete

NOTE: CRUD tests require a running database. Auth enforcement tests
(401/403) work without DB because auth validation happens before
database access.
"""

import os

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

# Skip CRUD tests if no database URL is configured
skip_if_no_db = pytest.mark.skipif(
    not os.getenv("DATABASE_URL"),
    reason="Requires DATABASE_URL environment variable",
)


# ===========================================================================
# Helpers
# ===========================================================================


def get_client_token() -> dict:
    """Register a CLIENT user and return tokens."""
    import uuid
    email = f"client-{uuid.uuid4().hex[:8]}@cattest.com"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "nombre": "Test",
            "apellido": "User",
            "email": email,
            "password": "TestPass123!",
        },
    )
    data = response.json()
    return data


# ===========================================================================
# Tests: Auth guard — all endpoints require ADMIN role
# ===========================================================================


class TestAuthGuard:
    """All categorias endpoints require ADMIN role."""

    def test_list_categorias_without_token_returns_401(self):
        """GET / sin token → 401."""
        response = client.get("/api/v1/categorias/")
        assert response.status_code == 401

    def test_get_categoria_without_token_returns_401(self):
        """GET /{id} sin token → 401."""
        response = client.get("/api/v1/categorias/1")
        assert response.status_code == 401

    def test_create_categoria_without_token_returns_401(self):
        """POST / sin token → 401."""
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Test", "descripcion": "Test"},
        )
        assert response.status_code == 401

    def test_update_categoria_without_token_returns_401(self):
        """PUT /{id} sin token → 401."""
        response = client.put(
            "/api/v1/categorias/1",
            json={"nombre": "Updated"},
        )
        assert response.status_code == 401

    def test_delete_categoria_without_token_returns_401(self):
        """DELETE /{id} sin token → 401."""
        response = client.delete("/api/v1/categorias/1")
        assert response.status_code == 401


class TestRBAC:
    """CLIENT role cannot access categorias endpoints."""

    @skip_if_no_db
    def test_list_categorias_client_role_returns_403(self):
        """CLIENT intenta listar → 403."""
        auth = get_client_token()
        response = client.get(
            "/api/v1/categorias/",
            headers={"Authorization": f"Bearer {auth['accessToken']}"},
        )
        assert response.status_code == 403

    @skip_if_no_db
    def test_get_categoria_client_role_returns_403(self):
        """CLIENT intenta obtener → 403."""
        auth = get_client_token()
        response = client.get(
            "/api/v1/categorias/1",
            headers={"Authorization": f"Bearer {auth['accessToken']}"},
        )
        assert response.status_code == 403

    @skip_if_no_db
    def test_create_categoria_client_role_returns_403(self):
        """CLIENT intenta crear → 403."""
        auth = get_client_token()
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Test"},
            headers={"Authorization": f"Bearer {auth['accessToken']}"},
        )
        assert response.status_code == 403

    @skip_if_no_db
    def test_update_categoria_client_role_returns_403(self):
        """CLIENT intenta actualizar → 403."""
        auth = get_client_token()
        response = client.put(
            "/api/v1/categorias/1",
            json={"nombre": "Updated"},
            headers={"Authorization": f"Bearer {auth['accessToken']}"},
        )
        assert response.status_code == 403

    @skip_if_no_db
    def test_delete_categoria_client_role_returns_403(self):
        """CLIENT intenta eliminar → 403."""
        auth = get_client_token()
        response = client.delete(
            "/api/v1/categorias/1",
            headers={"Authorization": f"Bearer {auth['accessToken']}"},
        )
        assert response.status_code == 403
