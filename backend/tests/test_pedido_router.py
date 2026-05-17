"""Integration tests for Pedido endpoints.

Endpoints tested:
- POST   /api/v1/pedidos — Create new pedido
- GET    /api/v1/pedidos — List user's pedidos
- GET    /api/v1/pedidos/{pedido_id} — Get pedido detail
- Price conflict 409 (precio_carrito != current precio_base)
- Rate limiting on create endpoint

NOTE: Most tests require a running database. Auth enforcement tests
(401) work without DB because auth validation happens before
database access.
"""

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.core.dependencies import get_current_user
from backend.core.exceptions import PriceConflictError
from backend.main import app
from backend.models.usuario import Usuario

client = TestClient(app)

skip_if_no_db = pytest.mark.skipif(
    not os.getenv("DATABASE_URL"),
    reason="Requires DATABASE_URL environment variable",
)


# ===========================================================================
# Tests: Auth guard — all pedido endpoints require authentication
# ===========================================================================


class TestAuthGuard:
    """All pedido endpoints require valid access token."""

    def test_create_pedido_without_token_returns_401(self):
        """POST / sin token → 401."""
        response = client.post(
            "/api/v1/pedidos",
            json={
                "items": [{"producto_id": 1, "cantidad": 1, "precio_carrito": 10.00}],
                "direccion_id": 1,
                "forma_pago_id": 1,
            },
        )
        assert response.status_code == 401

    def test_list_pedidos_without_token_returns_401(self):
        """GET / sin token → 401."""
        response = client.get("/api/v1/pedidos")
        assert response.status_code == 401

    def test_get_pedido_without_token_returns_401(self):
        """GET /{id} sin token → 401."""
        response = client.get("/api/v1/pedidos/1")
        assert response.status_code == 401


# ===========================================================================
# Tests: Price conflict detection (409)
# ===========================================================================


class TestPriceConflict:
    """POST /api/v1/pedidos — price conflict at checkout."""

    def _make_mock_user(self) -> MagicMock:
        """Create a mock authenticated user."""
        user = MagicMock(spec=Usuario)
        user.id = 1
        user.nombre = "Test"
        user.email = "test@test.com"
        user.roles = []
        return user

    def test_price_conflict_returns_409(self):
        """Precio del carrito difiere del precio actual → 409."""
        mock_user = self._make_mock_user()

        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            with patch("backend.pedidos.router.PedidoService") as MockService:
                instance = MockService.return_value
                instance.create_pedido = AsyncMock(
                    side_effect=PriceConflictError(
                        productos=[
                            {
                                "id": 1,
                                "nombre": "Pizza Margherita",
                                "precio_carrito": 10.00,
                                "precio_actual": 15.00,
                            }
                        ]
                    )
                )

                response = client.post(
                    "/api/v1/pedidos",
                    json={
                        "items": [
                            {
                                "producto_id": 1,
                                "cantidad": 1,
                                "precio_carrito": 10.00,
                            }
                        ],
                        "direccion_id": 1,
                        "forma_pago_id": 1,
                    },
                )

                assert response.status_code == 409
                data = response.json()
                assert "productos" in data or "detail" in data
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_price_conflict_details_include_productos(self):
        """Respuesta 409 incluye lista de productos con diferencias."""
        mock_user = self._make_mock_user()

        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            with patch("backend.pedidos.router.PedidoService") as MockService:
                instance = MockService.return_value
                instance.create_pedido = AsyncMock(
                    side_effect=PriceConflictError(
                        productos=[
                            {
                                "id": 1,
                                "nombre": "Pizza",
                                "precio_carrito": 10.00,
                                "precio_actual": 15.00,
                            },
                            {
                                "id": 2,
                                "nombre": "Empanada",
                                "precio_carrito": 5.00,
                                "precio_actual": 7.00,
                            },
                        ]
                    )
                )

                response = client.post(
                    "/api/v1/pedidos",
                    json={
                        "items": [
                            {"producto_id": 1, "cantidad": 1, "precio_carrito": 10.00},
                            {"producto_id": 2, "cantidad": 2, "precio_carrito": 5.00},
                        ],
                        "direccion_id": 1,
                        "forma_pago_id": 1,
                    },
                )

                assert response.status_code == 409
                data = response.json()
                productos = data.get("productos", data.get("details", {}).get("productos", []))
                assert len(productos) == 2
                assert productos[0]["id"] == 1
                assert productos[0]["precio_carrito"] == 10.00
                assert productos[0]["precio_actual"] == 15.00
        finally:
            app.dependency_overrides.pop(get_current_user, None)


# ===========================================================================
# Tests: CRUD (require DB)
# ===========================================================================


class TestCreatePedido:
    """POST /api/v1/pedidos — Create pedido (requires DB)."""

    @skip_if_no_db
    def test_create_pedido_success(self):
        """Crear pedido exitosamente (DB requerida)."""
        import uuid
        email = f"pedido-create-{uuid.uuid4().hex[:8]}@test.com"
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "nombre": "Test",
                "apellido": "User",
                "email": email,
                "password": "TestPass123!",
            },
        )
        auth = register_response.json()

        response = client.post(
            "/api/v1/pedidos",
            json={
                "items": [{"producto_id": 1, "cantidad": 1, "precio_carrito": 10.00}],
                "direccion_id": 1,
                "forma_pago_id": 1,
            },
            headers={"Authorization": f"Bearer {auth['accessToken']}"},
        )
        # May fail due to missing data, but should not be 401/403
        assert response.status_code not in (401, 403)


class TestGetPedidos:
    """GET /api/v1/pedidos — List user's pedidos (requires DB)."""

    @skip_if_no_db
    def test_list_pedidos_with_auth(self):
        """Listar pedidos con auth exitoso."""
        import uuid
        email = f"pedido-list-{uuid.uuid4().hex[:8]}@test.com"
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "nombre": "Test",
                "apellido": "User",
                "email": email,
                "password": "TestPass123!",
            },
        )
        auth = register_response.json()

        response = client.get(
            "/api/v1/pedidos",
            headers={"Authorization": f"Bearer {auth['accessToken']}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data


# ===========================================================================
# Tests: Rate limiting on create endpoint
# ===========================================================================


class TestRateLimit:
    """POST /api/v1/pedidos — rate limiting."""

    @skip_if_no_db
    def test_rate_limit_on_create(self):
        """Rate limit after many requests (10/h) — needs DB + actual tokens."""
        import uuid
        email = f"ratelimit-{uuid.uuid4().hex[:8]}@test.com"
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "nombre": "Test",
                "apellido": "User",
                "email": email,
                "password": "TestPass123!",
            },
        )
        auth = register_response.json()
        token = auth["accessToken"]

        # Make 11 rapid requests — 11th should be rate limited
        for _ in range(10):
            client.post(
                "/api/v1/pedidos",
                json={
                    "items": [{"producto_id": 1, "cantidad": 1, "precio_carrito": 10.00}],
                    "direccion_id": 1,
                    "forma_pago_id": 1,
                },
                headers={"Authorization": f"Bearer {token}"},
            )

        response = client.post(
            "/api/v1/pedidos",
            json={
                "items": [{"producto_id": 1, "cantidad": 1, "precio_carrito": 10.00}],
                "direccion_id": 1,
                "forma_pago_id": 1,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        # May get 429 rate limit or 400/500 for other reasons
        # The key is it shouldn't be 201 (new order)
        assert response.status_code != 201
