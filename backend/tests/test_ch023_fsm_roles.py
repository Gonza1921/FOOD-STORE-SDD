"""Tests for CH-023: FSM autorización granular + WebSocket events.

Tests:
- ``TRANSICIONES_POR_ROL`` constant sanity
- ``_validar_rol_transicion()`` for each role
- ``_determinar_tipo_evento_cocina()`` mappings
- ``_publicar_evento_cocina()`` (mocked broadcast)
- WebSocketManager unit tests
- Auth guard for cocina REST endpoint
- FSM granular authorization in PATCH estado endpoint
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from starlette.websockets import WebSocket

from backend.main import app

# ===========================================================================
# Test data
# ===========================================================================

TRANSICIONES_POR_ROL = {
    ("PENDIENTE", "CONFIRMADO"): set(),
    ("PENDIENTE", "CANCELADO"): {"CLIENT", "PEDIDOS", "ADMIN"},
    ("CONFIRMADO", "EN_PREP"):  {"COCINA", "PEDIDOS", "ADMIN"},
    ("CONFIRMADO", "CANCELADO"): {"PEDIDOS", "ADMIN"},
    ("EN_PREP", "EN_CAMINO"):   {"COCINA", "PEDIDOS", "ADMIN"},
    ("EN_PREP", "CANCELADO"):   {"ADMIN"},
    ("EN_CAMINO", "ENTREGADO"): {"PEDIDOS", "ADMIN"},
}

MAPA_EVENTOS_COCINA = {
    ("PENDIENTE", "CONFIRMADO"): "PEDIDO_CONFIRMADO",
    ("CONFIRMADO", "EN_PREP"):   "PEDIDO_EN_PREPARACION",
    ("EN_PREP", "EN_CAMINO"):    "PEDIDO_EN_CAMINO",
}


# ===========================================================================
# Tests for FSM state constants (baseline check)
# ===========================================================================


class TestFSMEstadosCH023:
    """Re-verify FSM states used in role mapping exist."""

    def test_estados_en_transiciones_por_rol_existen(self):
        """All states referenced in TRANSICIONES_POR_ROL should be valid FSM states."""
        from backend.pedidos.service import FSMEstados
        estados_validos = {
            FSMEstados.PENDIENTE,
            FSMEstados.CONFIRMADO,
            FSMEstados.EN_PREP,
            FSMEstados.EN_CAMINO,
            FSMEstados.ENTREGADO,
            FSMEstados.CANCELADO,
        }
        for (desde, hasta) in TRANSICIONES_POR_ROL:
            assert desde in estados_validos, f"Estado origen '{desde}' no es válido en FSM"
            assert hasta in estados_validos, f"Estado destino '{hasta}' no es válido en FSM"


# ===========================================================================
# Tests for _validar_rol_transicion
# ===========================================================================


class TestValidarRolTransicion:
    """Unit tests for the static method _validar_rol_transicion."""

    @pytest.fixture
    def service(self):
        from backend.pedidos.service import PedidoService
        return PedidoService

    # --- SYSTEM-ONLY transitions ---
    def test_system_only_transition_blocked_for_users(self, service):
        """PENDIENTE->CONFIRMADO is system-only, no role should pass."""
        assert service._validar_rol_transicion(
            "PENDIENTE", "CONFIRMADO", {"ADMIN"}
        ) is False

    def test_system_only_transition_blocked_for_cocina(self, service):
        """Even COCINA should not confirm."""
        assert service._validar_rol_transicion(
            "PENDIENTE", "CONFIRMADO", {"COCINA"}
        ) is False

    def test_system_only_transition_blocked_for_pedidos(self, service):
        """Even PEDIDOS should not confirm (webhook only)."""
        assert service._validar_rol_transicion(
            "PENDIENTE", "CONFIRMADO", {"PEDIDOS"}
        ) is False

    # --- COCINA allowed transitions ---
    def test_cocina_puede_en_prep(self, service):
        """COCINA can do CONFIRMADO->EN_PREP."""
        assert service._validar_rol_transicion(
            "CONFIRMADO", "EN_PREP", {"COCINA"}
        ) is True

    def test_cocina_puede_en_camino(self, service):
        """COCINA can do EN_PREP->EN_CAMINO."""
        assert service._validar_rol_transicion(
            "EN_PREP", "EN_CAMINO", {"COCINA"}
        ) is True

    # --- COCINA forbidden transitions ---
    def test_cocina_no_puede_entregar(self, service):
        """COCINA cannot do EN_CAMINO->ENTREGADO."""
        assert service._validar_rol_transicion(
            "EN_CAMINO", "ENTREGADO", {"COCINA"}
        ) is False

    def test_cocina_no_puede_cancelar_confirmado(self, service):
        """COCINA cannot cancel CONFIRMADO."""
        assert service._validar_rol_transicion(
            "CONFIRMADO", "CANCELADO", {"COCINA"}
        ) is False

    def test_cocina_no_puede_cancelar_en_prep(self, service):
        """COCINA cannot cancel EN_PREP (only ADMIN)."""
        assert service._validar_rol_transicion(
            "EN_PREP", "CANCELADO", {"COCINA"}
        ) is False

    # --- ADMIN allowed transitions ---
    def test_admin_puede_en_prep(self, service):
        """ADMIN can do CONFIRMADO->EN_PREP."""
        assert service._validar_rol_transicion(
            "CONFIRMADO", "EN_PREP", {"ADMIN"}
        ) is True

    def test_admin_puede_cancelar(self, service):
        """ADMIN can cancel any state."""
        assert service._validar_rol_transicion(
            "EN_PREP", "CANCELADO", {"ADMIN"}
        ) is True
        assert service._validar_rol_transicion(
            "CONFIRMADO", "CANCELADO", {"ADMIN"}
        ) is True

    def test_admin_puede_entregar(self, service):
        """ADMIN can deliver."""
        assert service._validar_rol_transicion(
            "EN_CAMINO", "ENTREGADO", {"ADMIN"}
        ) is True

    # --- PEDIDOS allowed transitions ---
    def test_pedidos_puede_cancelar(self, service):
        """PEDIDOS can cancel from CONFIRMADO."""
        assert service._validar_rol_transicion(
            "CONFIRMADO", "CANCELADO", {"PEDIDOS"}
        ) is True

    def test_pedidos_puede_en_prep(self, service):
        """PEDIDOS can do CONFIRMADO->EN_PREP."""
        assert service._validar_rol_transicion(
            "CONFIRMADO", "EN_PREP", {"PEDIDOS"}
        ) is True

    def test_pedidos_puede_entregar(self, service):
        """PEDIDOS can deliver."""
        assert service._validar_rol_transicion(
            "EN_CAMINO", "ENTREGADO", {"PEDIDOS"}
        ) is True

    # --- CLIENT allowed transitions ---
    def test_client_puede_cancelar_propio(self, service):
        """CLIENT can cancel PENDIENTE."""
        assert service._validar_rol_transicion(
            "PENDIENTE", "CANCELADO", {"CLIENT"}
        ) is True

    def test_client_no_puede_en_prep(self, service):
        """CLIENT cannot change to EN_PREP."""
        assert service._validar_rol_transicion(
            "CONFIRMADO", "EN_PREP", {"CLIENT"}
        ) is False

    # --- Edge cases ---
    def test_multiple_roles_one_allowed(self, service):
        """User with CLIENT+COCINA should be allowed COCINA transitions."""
        assert service._validar_rol_transicion(
            "CONFIRMADO", "EN_PREP", {"CLIENT", "COCINA"}
        ) is True

    def test_unknown_transition_returns_false(self, service):
        """Transition not in the map should return False."""
        assert service._validar_rol_transicion(
            "ENTREGADO", "EN_CAMINO", {"ADMIN"}
        ) is False

    def test_empty_roles_returns_false(self, service):
        """User with no roles should not be allowed."""
        assert service._validar_rol_transicion(
            "CONFIRMADO", "EN_PREP", set()
        ) is False


# ===========================================================================
# Tests for _determinar_tipo_evento_cocina
# ===========================================================================


class TestDeterminarTipoEventoCocina:
    """Unit tests for the static method _determinar_tipo_evento_cocina."""

    @pytest.fixture
    def service(self):
        from backend.pedidos.service import PedidoService
        return PedidoService

    def test_confirmado_event(self, service):
        """PENDIENTE->CONFIRMADO → PEDIDO_CONFIRMADO."""
        assert service._determinar_tipo_evento_cocina(
            "PENDIENTE", "CONFIRMADO"
        ) == "PEDIDO_CONFIRMADO"

    def test_en_prep_event(self, service):
        """CONFIRMADO->EN_PREP → PEDIDO_EN_PREPARACION."""
        assert service._determinar_tipo_evento_cocina(
            "CONFIRMADO", "EN_PREP"
        ) == "PEDIDO_EN_PREPARACION"

    def test_en_camino_event(self, service):
        """EN_PREP->EN_CAMINO → PEDIDO_EN_CAMINO."""
        assert service._determinar_tipo_evento_cocina(
            "EN_PREP", "EN_CAMINO"
        ) == "PEDIDO_EN_CAMINO"

    def test_cancelado_desde_confirmado(self, service):
        """CONFIRMADO->CANCELADO → PEDIDO_CANCELADO."""
        assert service._determinar_tipo_evento_cocina(
            "CONFIRMADO", "CANCELADO"
        ) == "PEDIDO_CANCELADO"

    def test_cancelado_desde_en_prep(self, service):
        """EN_PREP->CANCELADO → PEDIDO_CANCELADO."""
        assert service._determinar_tipo_evento_cocina(
            "EN_PREP", "CANCELADO"
        ) == "PEDIDO_CANCELADO"

    def test_cancelado_desde_pendiente_no_event(self, service):
        """PENDIENTE->CANCELADO → None (not KDS-relevant)."""
        assert service._determinar_tipo_evento_cocina(
            "PENDIENTE", "CANCELADO"
        ) is None

    def test_entregado_no_event(self, service):
        """EN_CAMINO->ENTREGADO → None (not KDS-relevant)."""
        assert service._determinar_tipo_evento_cocina(
            "EN_CAMINO", "ENTREGADO"
        ) is None

    def test_unknown_transition_no_event(self, service):
        """ENTREGADO->CANCELADO → None (not a valid FSM transition)."""
        assert service._determinar_tipo_evento_cocina(
            "ENTREGADO", "CANCELADO"
        ) is None


# ===========================================================================
# Tests for _publicar_evento_cocina (mocked broadcast)
# ===========================================================================


class TestPublicarEventoCocina:
    """Test that _publicar_evento_cocina calls broadcast_event correctly."""

    @pytest.fixture
    def service(self):
        from backend.pedidos.service import PedidoService
        return PedidoService()

    @patch("backend.pedidos.service.websocket_manager")
    async def test_publica_evento_confirmado(self, mock_ws, service):
        """KDS transition should call broadcast_event with correct type."""
        await service._publicar_evento_cocina(
            desde="PENDIENTE",
            hasta="CONFIRMADO",
            pedido_id=42,
        )
        mock_ws.broadcast_event.assert_called_once()
        call_args = mock_ws.broadcast_event.call_args
        assert call_args.kwargs["event_type"] == "PEDIDO_CONFIRMADO"
        assert call_args.kwargs["payload"]["pedido_id"] == 42

    @patch("backend.pedidos.service.websocket_manager")
    async def test_publica_evento_en_prep(self, mock_ws, service):
        """CONFIRMADO->EN_PREP publishes PEDIDO_EN_PREPARACION."""
        await service._publicar_evento_cocina(
            desde="CONFIRMADO",
            hasta="EN_PREP",
            pedido_id=7,
        )
        mock_ws.broadcast_event.assert_called_once_with(
            event_type="PEDIDO_EN_PREPARACION",
            payload={"pedido_id": 7, "estado_anterior": "CONFIRMADO", "estado_nuevo": "EN_PREP"},
        )

    @patch("backend.pedidos.service.websocket_manager")
    async def test_publica_evento_cancelado(self, mock_ws, service):
        """CONFIRMADO->CANCELADO publishes PEDIDO_CANCELADO."""
        await service._publicar_evento_cocina(
            desde="CONFIRMADO",
            hasta="CANCELADO",
            pedido_id=5,
        )
        mock_ws.broadcast_event.assert_called_once_with(
            event_type="PEDIDO_CANCELADO",
            payload={"pedido_id": 5, "estado_anterior": "CONFIRMADO", "estado_nuevo": "CANCELADO"},
        )

    @patch("backend.pedidos.service.websocket_manager")
    async def test_transicion_no_kds_no_publica(self, mock_ws, service):
        """Non-KDS transition (ENTREGADO) should NOT call broadcast_event."""
        await service._publicar_evento_cocina(
            desde="EN_CAMINO",
            hasta="ENTREGADO",
            pedido_id=1,
        )
        mock_ws.broadcast_event.assert_not_called()

    @patch("backend.pedidos.service.websocket_manager")
    async def test_publica_evento_no_rompe_en_error(self, mock_ws, service):
        """If broadcast fails, _publicar_evento_cocina should NOT raise."""
        mock_ws.broadcast_event.side_effect = RuntimeError("Connection lost")

        # Should not raise
        await service._publicar_evento_cocina(
            desde="CONFIRMADO",
            hasta="EN_PREP",
            pedido_id=3,
        )
        # Verify it was called (caught the exception)
        mock_ws.broadcast_event.assert_called_once()


# ===========================================================================
# Tests for WebSocketManager unit tests
# ===========================================================================


class TestWebSocketManager:
    """Unit tests for WebSocketManager."""

    @pytest.fixture
    def manager(self):
        from backend.core.websocket_manager import WebSocketManager
        return WebSocketManager()

    @pytest.fixture
    def mock_ws(self):
        ws = MagicMock(spec=WebSocket)
        ws.send_text = AsyncMock()
        return ws

    async def test_connect_increases_count(self, manager, mock_ws):
        """After connect, active_connections should be 1."""
        assert manager.active_connections == 0
        await manager.connect(mock_ws)
        assert manager.active_connections == 1

    async def test_disconnect_decreases_count(self, manager, mock_ws):
        """After connect + disconnect, active_connections should be 0."""
        await manager.connect(mock_ws)
        await manager.disconnect(mock_ws)
        assert manager.active_connections == 0

    async def test_disconnect_unknown_safe(self, manager, mock_ws):
        """Disconnecting an unknown websocket should not raise."""
        await manager.disconnect(mock_ws)
        assert manager.active_connections == 0

    async def test_broadcast_event_sends_to_all(self, manager):
        """broadcast_event should send to all connected clients."""
        ws1 = MagicMock(spec=WebSocket)
        ws1.send_text = AsyncMock()
        ws2 = MagicMock(spec=WebSocket)
        ws2.send_text = AsyncMock()

        await manager.connect(ws1)
        await manager.connect(ws2)

        await manager.broadcast_event(
            event_type="PEDIDO_CONFIRMADO",
            payload={"pedido_id": 1},
        )

        ws1.send_text.assert_called_once()
        ws2.send_text.assert_called_once()
        # Verify the message includes the event type
        sent_msg = ws1.send_text.call_args[0][0]
        assert "PEDIDO_CONFIRMADO" in sent_msg
        assert "pedido_id" in sent_msg

    async def test_broadcast_stale_client_removed(self, manager):
        """If a client fails during broadcast, it should be removed."""
        ws_ok = MagicMock(spec=WebSocket)
        ws_ok.send_text = AsyncMock()
        ws_bad = MagicMock(spec=WebSocket)
        ws_bad.send_text = AsyncMock(side_effect=RuntimeError("Disconnected"))

        await manager.connect(ws_ok)
        await manager.connect(ws_bad)
        assert manager.active_connections == 2

        await manager.broadcast_event(
            event_type="PEDIDO_EN_PREPARACION",
            payload={"pedido_id": 2},
        )

        # Bad client should be removed, good client should remain
        assert manager.active_connections == 1
        ws_ok.send_text.assert_called_once()

    async def test_broadcast_with_no_clients(self, manager):
        """Broadcasting with no clients should not raise."""
        await manager.broadcast_event(
            event_type="PEDIDO_CONFIRMADO",
            payload={"pedido_id": 1},
        )
        # No assertion needed — just verify no exception

    async def test_broadcast_event_includes_timestamp(self, manager):
        """broadcast_event should include a timestamp in the payload."""
        ws = MagicMock(spec=WebSocket)
        ws.send_text = AsyncMock()
        await manager.connect(ws)

        await manager.broadcast_event(
            event_type="PEDIDO_CANCELADO",
            payload={"pedido_id": 1},
        )

        sent = ws.send_text.call_args[0][0]
        import json
        data = json.loads(sent)
        assert "timestamp" in data["payload"]
        assert data["tipo"] == "PEDIDO_CANCELADO"
        assert data["payload"]["pedido_id"] == 1


# ===========================================================================
# Tests for COCINA Router — Auth guard
# ===========================================================================


class TestCocinaRouterAuthGuard:
    """GET /api/v1/cocina/pedidos requires authentication."""

    client = TestClient(app)

    def test_listar_pedidos_sin_token_401(self):
        """GET /cocina/pedidos sin token → 401."""
        response = self.client.get("/api/v1/cocina/pedidos")
        assert response.status_code == 401

    def test_listar_pedidos_con_token_invalido_401(self):
        """GET /cocina/pedidos con token inválido → 401."""
        response = self.client.get(
            "/api/v1/cocina/pedidos",
            headers={"Authorization": "Bearer token-falso"},
        )
        assert response.status_code == 401


# ===========================================================================
# Tests for FSM granular authorization in PATCH estado endpoint
# ===========================================================================


class TestFSMGranularAuth:
    """PATCH /api/v1/pedidos/{id}/estado with role-based authorization.

    These tests mock the current_user dependency and verify the 403
    is returned when the user's role is not authorized for the
    transition.
    """

    client = TestClient(app)

    def _make_cocina_user(self):
        """Create a mock user with COCINA role."""
        from backend.models.usuario import Usuario
        from unittest.mock import MagicMock
        user = MagicMock(spec=Usuario)
        user.id = 2
        user.nombre = "Chef"
        user.email = "cocina@test.com"
        # Mock the roles relationship to return a Role with codigo="COCINA"
        role_mock = MagicMock()
        role_mock.codigo = "COCINA"
        user.roles = [role_mock]
        return user

    def _make_admin_user(self):
        """Create a mock user with ADMIN role."""
        from backend.models.usuario import Usuario
        from unittest.mock import MagicMock
        user = MagicMock(spec=Usuario)
        user.id = 1
        user.nombre = "Admin"
        user.email = "admin@test.com"
        role_mock = MagicMock()
        role_mock.codigo = "ADMIN"
        user.roles = [role_mock]
        return user

    def _make_pedido_mock(self, estado_codigo: str) -> MagicMock:
        """Create a mocked Pedido instance suitable for _build_pedido_response."""
        from datetime import datetime
        pedido = MagicMock()
        pedido.id = 1
        pedido.usuario_id = 1
        pedido.estado_codigo = estado_codigo
        pedido.total = 100.0
        pedido.costo_envio = 500
        pedido.creado_en = datetime(2026, 1, 1, 10, 0, 0)
        pedido.actualizado_en = datetime(2026, 1, 1, 10, 30, 0)
        pedido.detalles = []
        pedido.direccion_snapshot = None
        return pedido

    def test_cocina_puede_transicionar_a_en_prep(self):
        """
        COCINA role should be able to transition CONFIRMADO->EN_PREP.
        Mock the service to succeed and verify 200.
        """
        from backend.core.dependencies import get_current_user

        mock_user = self._make_cocina_user()
        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            with patch("backend.pedidos.router.PedidoService") as MockService:
                instance = MockService.return_value
                instance.transicionar_estado = AsyncMock()
                instance.transicionar_estado.return_value = self._make_pedido_mock("EN_PREP")

                response = self.client.patch(
                    "/api/v1/pedidos/1/estado",
                    json={"estado": "EN_PREP"},
                )

                # Should be allowed → 200
                assert response.status_code == 200
                data = response.json()
                assert data["estado"] == "EN_PREP"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_cocina_no_puede_entregar(self):
        """
        COCINA role should NOT be able to transition EN_CAMINO->ENTREGADO.
        The service raises 403, and the endpoint should return 403.
        """
        from backend.core.dependencies import get_current_user

        mock_user = self._make_cocina_user()
        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            with patch("backend.pedidos.router.PedidoService") as MockService:
                instance = MockService.return_value
                instance.transicionar_estado = AsyncMock(
                    side_effect=HTTPException(
                        status_code=403,
                        detail="Rol no autorizado",
                    )
                )

                response = self.client.patch(
                    "/api/v1/pedidos/1/estado",
                    json={"estado": "ENTREGADO"},
                )

                assert response.status_code == 403
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_admin_puede_entregar(self):
        """
        ADMIN role should be able to transition EN_CAMINO->ENTREGADO.
        """
        from backend.core.dependencies import get_current_user

        mock_user = self._make_admin_user()
        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            with patch("backend.pedidos.router.PedidoService") as MockService:
                instance = MockService.return_value
                instance.transicionar_estado = AsyncMock()
                instance.transicionar_estado.return_value = self._make_pedido_mock("ENTREGADO")

                response = self.client.patch(
                    "/api/v1/pedidos/1/estado",
                    json={"estado": "ENTREGADO"},
                )

                assert response.status_code == 200
                data = response.json()
                assert data["estado"] == "ENTREGADO"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_cocina_no_puede_confirmar(self):
        """
        COCINA role should NOT be able to request CONFIRMADO
        (PENDIENTE->CONFIRMADO is system-only via webhook).

        The PATCH /estado endpoint delegates to transicionar_estado,
        which calls _validar_rol_transicion and returns 403 when
        the role is not authorized.
        """
        from backend.core.dependencies import get_current_user

        mock_user = self._make_cocina_user()
        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            with patch("backend.pedidos.router.PedidoService") as MockService:
                instance = MockService.return_value
                instance.transicionar_estado = AsyncMock(
                    side_effect=HTTPException(
                        status_code=403,
                        detail="Rol no autorizado para la transición "
                               "'PENDIENTE' → 'CONFIRMADO'",
                    )
                )

                response = self.client.patch(
                    "/api/v1/pedidos/1/estado",
                    json={"estado": "CONFIRMADO"},
                )

                assert response.status_code == 403
        finally:
            app.dependency_overrides.pop(get_current_user, None)
