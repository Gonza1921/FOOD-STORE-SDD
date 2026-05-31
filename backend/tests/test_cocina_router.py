"""Integration tests for Cocina endpoints.

Phase 5.2:
- PATCH /api/v1/cocina/productos/{id}/disponibilidad
  — Rol COCINA/ADMIN → 200
  — Sin rol → 403
  — Producto inexistente → 404
  — Body inválido → 422

Uses FastAPI TestClient with dependency overrides for auth and service
mocking (no database required). The service layer is patched so we only
test the HTTP contract (routing, auth, validation, error mapping).
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.core.dependencies import get_current_user
from backend.core.exceptions import NotFoundError
from backend.main import app


# ===========================================================================
# Helpers
# ===========================================================================


def _mock_user(rol: str = "COCINA") -> MagicMock:
    """Create a mock Usuario with the specified role code."""
    user = MagicMock()
    user.id = 1
    user.nombre = "Test"
    user.apellido = "User"
    role = MagicMock()
    role.codigo = rol
    user.roles = [role]
    return user


# ===========================================================================
# Phase 5.2: PATCH /api/v1/cocina/productos/{id}/disponibilidad
# ===========================================================================


class TestToggleDisponibilidadEndpoint:
    """PATCH /api/v1/cocina/productos/{id}/disponibilidad — auth + validation."""

    def setup_method(self) -> None:
        self._overrides: dict = {}

    def teardown_method(self) -> None:
        # Restore original dependencies
        app.dependency_overrides.clear()

    def _set_auth(self, rol: str) -> None:
        """Override FastAPI's get_current_user dependency."""
        self._overrides[get_current_user] = lambda: _mock_user(rol)
        app.dependency_overrides.update(self._overrides)

    # ------------------------------------------------------------------
    # SUCCESS: 200
    # ------------------------------------------------------------------

    @patch("backend.cocina.router.CocinaService")
    def test_cocina_role_returns_200(self, mock_service_class: MagicMock) -> None:
        """Rol COCINA → PATCH exitoso (200)."""
        self._set_auth("COCINA")
        mock_producto = MagicMock(id=1, nombre="Pizza Margherita", disponible=False)
        mock_service_class.return_value.toggle_disponibilidad = AsyncMock(
            return_value=mock_producto
        )

        with TestClient(app) as client:
            response = client.patch(
                "/api/v1/cocina/productos/1/disponibilidad",
                json={"disponible": False},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["nombre"] == "Pizza Margherita"
        assert data["disponible"] is False

    @patch("backend.cocina.router.CocinaService")
    def test_admin_role_returns_200(self, mock_service_class: MagicMock) -> None:
        """Rol ADMIN → PATCH exitoso (200)."""
        self._set_auth("ADMIN")
        mock_producto = MagicMock(id=2, nombre="Faina", disponible=True)
        mock_service_class.return_value.toggle_disponibilidad = AsyncMock(
            return_value=mock_producto
        )

        with TestClient(app) as client:
            response = client.patch(
                "/api/v1/cocina/productos/2/disponibilidad",
                json={"disponible": True},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 2
        assert data["disponible"] is True

    # ------------------------------------------------------------------
    # FORBIDDEN: 403
    # ------------------------------------------------------------------

    def test_client_role_returns_403(self) -> None:
        """Sin rol COCINA/ADMIN → 403 Forbidden."""
        self._set_auth("CLIENT")

        with TestClient(app) as client:
            response = client.patch(
                "/api/v1/cocina/productos/1/disponibilidad",
                json={"disponible": False},
            )

        assert response.status_code == 403
        assert "insufficient" in response.text.lower() or "forbidden" in response.text.lower()

    def test_no_role_returns_403(self) -> None:
        """Usuario sin roles asignados → 403 Forbidden."""
        # Mock a user with an empty roles list
        user = _mock_user()
        user.roles = []
        app.dependency_overrides[get_current_user] = lambda: user

        try:
            with TestClient(app) as client:
                response = client.patch(
                    "/api/v1/cocina/productos/1/disponibilidad",
                    json={"disponible": False},
                )

            assert response.status_code == 403
        finally:
            app.dependency_overrides.clear()

    # ------------------------------------------------------------------
    # NOT FOUND: 404
    # ------------------------------------------------------------------

    @patch("backend.cocina.router.CocinaService")
    def test_product_not_found_returns_404(self, mock_service_class: MagicMock) -> None:
        """Producto inexistente → 404 Not Found."""
        self._set_auth("COCINA")
        mock_service_class.return_value.toggle_disponibilidad = AsyncMock(
            side_effect=NotFoundError("Producto no encontrado")
        )

        with TestClient(app) as client:
            response = client.patch(
                "/api/v1/cocina/productos/999/disponibilidad",
                json={"disponible": False},
            )

        assert response.status_code == 404
        assert "Producto no encontrado" in response.text

    # ------------------------------------------------------------------
    # UNPROCESSABLE: 422
    # ------------------------------------------------------------------

    def test_missing_disponible_field_returns_422(self) -> None:
        """Body sin campo 'disponible' → 422 Unprocessable Entity."""
        self._set_auth("COCINA")

        with TestClient(app) as client:
            response = client.patch(
                "/api/v1/cocina/productos/1/disponibilidad",
                json={},  # missing 'disponible'
            )

        assert response.status_code == 422
        errors = response.json().get("detail", [])
        assert any("disponible" in str(e.get("loc", "")) for e in errors)

    def test_invalid_disponible_type_returns_422(self) -> None:
        """Body con tipo inválido para 'disponible' → 422."""
        self._set_auth("COCINA")

        with TestClient(app) as client:
            response = client.patch(
                "/api/v1/cocina/productos/1/disponibilidad",
                json={"disponible": "not-a-boolean"},
            )

        assert response.status_code == 422
