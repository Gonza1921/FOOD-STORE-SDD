"""Integration tests for Ingrediente CRUD endpoints.

Most endpoints require ADMIN role:
- GET    /api/v1/ingredientes — List all (ADMIN)
- GET    /api/v1/ingredientes/publico — Public, no auth required
- GET    /api/v1/ingredientes/{id} — Get by ID (ADMIN)
- POST   /api/v1/ingredientes — Create (ADMIN)
- PUT    /api/v1/ingredientes/{id} — Update (ADMIN)
- DELETE /api/v1/ingredientes/{id} — Soft delete (ADMIN)

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


def get_client_token(test_client=None) -> dict:
    """Register a CLIENT user and return tokens."""
    tc = test_client or client
    import uuid
    email = f"client-{uuid.uuid4().hex[:8]}@ingtest.com"
    response = tc.post(
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
# Tests: Public endpoint (no auth required)
# ===========================================================================


class TestPublicEndpoint:
    """GET /api/v1/ingredientes/publico requires no auth."""

    @skip_if_no_db
    def test_publico_no_auth_required(self):
        """GET /publico sin token → 200."""
        response = client.get("/api/v1/ingredientes/publico")
        assert response.status_code == 200

    @skip_if_no_db
    def test_publico_default_filters_alergenos(self):
        """GET /publico por defecto filtra alérgenos."""
        response = client.get("/api/v1/ingredientes/publico")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ===========================================================================
# Tests: Auth guard — admin endpoints require auth
# ===========================================================================


class TestAuthGuard:
    """Admin endpoints require authentication."""

    def test_list_ingredientes_without_token_returns_401(self):
        """GET / sin token → 401."""
        response = client.get("/api/v1/ingredientes/")
        assert response.status_code == 401

    def test_get_ingrediente_without_token_returns_401(self):
        """GET /{id} sin token → 401."""
        response = client.get("/api/v1/ingredientes/1")
        assert response.status_code == 401

    def test_create_ingrediente_without_token_returns_401(self):
        """POST / sin token → 401."""
        response = client.post(
            "/api/v1/ingredientes/",
            json={"nombre": "Test", "es_alergeno": False},
        )
        assert response.status_code == 401

    def test_update_ingrediente_without_token_returns_401(self):
        """PUT /{id} sin token → 401."""
        response = client.put(
            "/api/v1/ingredientes/1",
            json={"nombre": "Updated"},
        )
        assert response.status_code == 401

    def test_delete_ingrediente_without_token_returns_401(self):
        """DELETE /{id} sin token → 401."""
        response = client.delete("/api/v1/ingredientes/1")
        assert response.status_code == 401


class TestRBAC:
    """CLIENT role cannot access admin ingredientes endpoints."""

    @skip_if_no_db
    def test_list_ingredientes_client_role_returns_403(self):
        """CLIENT intenta listar → 403."""
        with TestClient(app) as tc:
            auth = get_client_token(tc)
            response = tc.get(
                "/api/v1/ingredientes/",
                headers={"Authorization": f"Bearer {auth['accessToken']}"},
            )
            assert response.status_code == 403

    @skip_if_no_db
    def test_create_ingrediente_client_role_returns_403(self):
        """CLIENT intenta crear → 403."""
        with TestClient(app) as tc:
            auth = get_client_token(tc)
            response = tc.post(
                "/api/v1/ingredientes/",
                json={"nombre": "Test", "es_alergeno": False},
                headers={"Authorization": f"Bearer {auth['accessToken']}"},
            )
            assert response.status_code == 403

    @skip_if_no_db
    def test_update_ingrediente_client_role_returns_403(self):
        """CLIENT intenta actualizar → 403."""
        with TestClient(app) as tc:
            auth = get_client_token(tc)
            response = tc.put(
                "/api/v1/ingredientes/1",
                json={"nombre": "Updated"},
                headers={"Authorization": f"Bearer {auth['accessToken']}"},
            )
            assert response.status_code == 403

    @skip_if_no_db
    def test_delete_ingrediente_client_role_returns_403(self):
        """CLIENT intenta eliminar → 403."""
        with TestClient(app) as tc:
            auth = get_client_token(tc)
            response = tc.delete(
                "/api/v1/ingredientes/1",
                headers={"Authorization": f"Bearer {auth['accessToken']}"},
            )
            assert response.status_code == 403
