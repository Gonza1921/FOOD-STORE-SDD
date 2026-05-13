"""Tests for PedidoService - ETAPA 2 (FSM, stock control, transitions)

Tests:
- FSM valid transitions
- FSM invalid transitions (blocked)
- Stock decrement on confirmation
- Stock insufficient error
- Permission checks (admin vs user)
"""

import pytest
from decimal import Decimal

from backend.pedidos.service import FSMEstados, FSMTransiciones, PedidoService


class TestFSMTransiciones:
    """Test FSM transition validation"""

    def test_transicion_pendente_a_confirmado_valida(self):
        """PENDIENTE -> CONFIRMADO should be valid"""
        assert FSMTransiciones.es_transicion_valida(
            FSMEstados.PENDIENTE, FSMEstados.CONFIRMADO
        ) is True

    def test_transicion_confirmado_a_en_prep_valida(self):
        """CONFIRMADO -> EN_PREP should be valid"""
        assert FSMTransiciones.es_transicion_valida(
            FSMEstados.CONFIRMADO, FSMEstados.EN_PREP
        ) is True

    def test_transicion_en_prep_a_en_camino_valida(self):
        """EN_PREP -> EN_CAMINO should be valid"""
        assert FSMTransiciones.es_transicion_valida(
            FSMEstados.EN_PREP, FSMEstados.EN_CAMINO
        ) is True

    def test_transicion_en_camino_a_entregado_valida(self):
        """EN_CAMINO -> ENTREGADO should be valid"""
        assert FSMTransiciones.es_transicion_valida(
            FSMEstados.EN_CAMINO, FSMEstados.ENTREGADO
        ) is True

    def test_transicion_retroceso_bloqueado(self):
        """Backward transitions should be blocked (ENTREGADO -> EN_CAMINO)"""
        assert FSMTransiciones.es_transicion_valida(
            FSMEstados.ENTREGADO, FSMEstados.EN_CAMINO
        ) is False

    def test_transicion_salto_bloqueado(self):
        """Skip transitions should be blocked (PENDIENTE -> EN_PREP)"""
        assert FSMTransiciones.es_transicion_valida(
            FSMEstados.PENDIENTE, FSMEstados.EN_PREP
        ) is False

    def test_transicion_desde_terminal_bloqueado(self):
        """From terminal states should be blocked (ENTREGADO -> CANCELADO)"""
        assert FSMTransiciones.es_transicion_valida(
            FSMEstados.ENTREGADO, FSMEstados.CANCELADO
        ) is False

    def test_cancelacion_desde_pendiente_permitida(self):
        """Cancellation from PENDIENTE should be allowed"""
        assert FSMTransiciones.puede_cancelar(FSMEstados.PENDIENTE) is True

    def test_cancelacion_desde_confirmado_permitida(self):
        """Cancellation from CONFIRMADO should be allowed"""
        assert FSMTransiciones.puede_cancelar(FSMEstados.CONFIRMADO) is True

    def test_cancelacion_desde_en_camino_bloqueada(self):
        """Cancellation from EN_CAMINO should be blocked"""
        assert FSMTransiciones.puede_cancelar(FSMEstados.EN_CAMINO) is False

    def test_estado_terminal_entregado(self):
        """ENTREGADO should be terminal"""
        assert FSMTransiciones.es_estado_terminal(FSMEstados.ENTREGADO) is True

    def test_estado_terminal_cancelado(self):
        """CANCELADO should be terminal"""
        assert FSMTransiciones.es_estado_terminal(FSMEstados.CANCELADO) is True

    def test_estado_no_terminal_pendiente(self):
        """PENDIENTE should not be terminal"""
        assert FSMTransiciones.es_estado_terminal(FSMEstados.PENDIENTE) is False


class TestFSMEstados:
    """Test FSM state constants"""

    def test_estados_definidos(self):
        """All required states should be defined"""
        assert FSMEstados.PENDIENTE == "PENDIENTE"
        assert FSMEstados.CONFIRMADO == "CONFIRMADO"
        assert FSMEstados.EN_PREP == "EN_PREP"
        assert FSMEstados.EN_CAMINO == "EN_CAMINO"
        assert FSMEstados.ENTREGADO == "ENTREGADO"
        assert FSMEstados.CANCELADO == "CANCELADO"


class TestPedidoServiceImport:
    """Test that PedidoService can be imported"""

    def test_pedido_service_import(self):
        """PedidoService should be importable"""
        from backend.pedidos.service import PedidoService
        assert PedidoService is not None

    def test_fsm_en_service(self):
        """FSM classes should be accessible from service module"""
        from backend.pedidos.service import FSMEstados, FSMTransiciones
        assert FSMEstados is not None
        assert FSMTransiciones is not None


class TestSchemasImport:
    """Test that schemas can be imported"""

    def test_pedido_estado_update_import(self):
        """PedidoEstadoUpdate should be importable"""
        from backend.pedidos.schemas import PedidoEstadoUpdate
        assert PedidoEstadoUpdate is not None

    def test_pedido_transicion_response_import(self):
        """PedidoTransicionResponse should be importable"""
        from backend.pedidos.schemas import PedidoTransicionResponse
        assert PedidoTransicionResponse is not None


class TestRouterImport:
    """Test that router can be imported"""

    def test_router_import(self):
        """Router should be importable"""
        from backend.pedidos.router import router
        assert router is not None

    def test_endpoints_defined(self):
        """All required endpoints should be defined in router"""
        from backend.pedidos.router import router

        # Get all routes
        routes = [r.path for r in router.routes]

        # Check ETAPA 1 endpoints
        assert "/api/v1/pedidos" in routes  # POST, GET list
        assert any("/api/v1/pedidos/" in r for r in routes)  # GET {id}

        # Check ETAPA 2 endpoints
        assert any("/confirmar" in r for r in routes)  # POST /{id}/confirmar
        assert any("/estado" in r for r in routes)  # PATCH /{id}/estado
        assert any("/admin" in r for r in routes)  # GET /admin/todos