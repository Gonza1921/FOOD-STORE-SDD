"""Integration tests for CH-023: REST endpoint (requires DB).

Tests:
- ``GET /api/v1/cocina/pedidos`` with cocina token → 200
- ``GET /api/v1/cocina/pedidos`` with CLIENT token → 403

.. important::

   ``TestClient`` must be used as a **context manager** so all HTTP requests
   share the same ``anyio`` portal (and event loop). Without it, each request
   creates a new event loop, and asyncpg connections from the previous loop
   become unreusable.

   Both scenarios run inside a **single** context manager because even with
   the pattern, creating a new ``TestClient`` after a previous one closed
   leaves stale asyncpg connections in the pool.
"""

import uuid

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import async_engine

skip_if_no_db = pytest.mark.skipif(
    not __import__("os").getenv("DATABASE_URL"),
    reason="Requires DATABASE_URL environment variable",
)


def _dispose_pool():
    """Safely clear stale connections from the async engine's pool.

    ``TestClient`` tests that ran before us (e.g. WebSocket tests) leave
    asyncpg connections in the pool tied to their (now-closed) event loop.
    ``async_engine.sync_engine.dispose()`` synchronously clears the pool
    without requiring an active event loop.
    """
    if async_engine is not None:
        try:
            async_engine.sync_engine.dispose()
        except Exception:
            pass  # best-effort cleanup


class TestCocinaRestEndpoint:
    """Integration tests for GET /api/v1/cocina/pedidos (require DB)."""

    @skip_if_no_db
    def test_cocina_pedidos_list_pedidos(self):
        """GET /cocina/pedidos: cocina → 200, CLIENT → 403."""
        _dispose_pool()
        with TestClient(app) as client:
            # --- Scenario 1: cocina user → 200 ---
            resp = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "cocina@foodstore.com",
                    "password": "cocina123",
                },
            )
            assert resp.status_code == 200, f"Login failed: {resp.text}"
            token = resp.json()["accessToken"]

            resp = client.get(
                "/api/v1/cocina/pedidos",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert isinstance(data, list)

            # --- Scenario 2: CLIENT user → 403 ---
            email = f"cliente-cocina-{uuid.uuid4().hex[:8]}@test.com"
            reg = client.post(
                "/api/v1/auth/register",
                json={
                    "nombre": "Test",
                    "apellido": "User",
                    "email": email,
                    "password": "TestPass123!",
                },
            )
            assert reg.status_code == 201, f"Register failed: {reg.text}"
            token = reg.json()["accessToken"]

            resp = client.get(
                "/api/v1/cocina/pedidos",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 403
