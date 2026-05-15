"""Tests for PagosService"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException

from backend.pagos.service import PagosService
from backend.pagos.schemas import CrearPreferenciaRequest


class TestPagosService:
    """Test suite for PagosService"""

    @pytest.fixture
    def mock_mp_sdk(self):
        """Mock MercadoPago SDK"""
        with patch('backend.pagos.service.mercadopago.SDK') as mock_sdk:
            mock_instance = MagicMock()
            mock_sdk.return_value = mock_instance
            yield mock_instance

    @pytest.fixture
    def service(self, mock_mp_sdk):
        """Create PagosService with mocked MP"""
        with patch.dict('backend.pagos.service.os.environ', {'MP_ACCESS_TOKEN': 'test_token'}):
            return PagosService()

    def test_service_initialization(self):
        """Test service initializes correctly"""
        with patch.dict('backend.pagos.service.os.environ', {'MP_ACCESS_TOKEN': 'test_token'}):
            service = PagosService()
            assert service.mp_sdk is not None

    def test_service_initialization_missing_token(self):
        """Test service raises error without MP_ACCESS_TOKEN"""
        with patch.dict('backend.pagos.service.os.environ', {}, clear=True):
            with pytest.raises(Exception) as exc_info:
                PagosService()
            assert "MP_ACCESS_TOKEN" in str(exc_info.value)

    def test_generar_idempotency_key(self):
        """Test idempotency key generation"""
        with patch.dict('backend.pagos.service.os.environ', {'MP_ACCESS_TOKEN': 'test_token'}):
            service = PagosService()
            key1 = service._generar_idempotency_key()
            key2 = service._generar_idempotency_key()

            # Keys should be unique
            assert key1 != key2
            # Keys should be valid UUIDs
            assert len(key1) == 36


class TestPagosSchemas:
    """Test suite for Pagos schemas"""

    def test_crear_preferencia_request(self):
        """Test CrearPreferenciaRequest schema"""
        request = CrearPreferenciaRequest(pedido_id=1)
        assert request.pedido_id == 1
        assert request.payment_method_token is None

    def test_crear_preferencia_request_with_token(self):
        """Test CrearPreferenciaRequest with payment token"""
        request = CrearPreferenciaRequest(pedido_id=1, payment_method_token="tok_123")
        assert request.pedido_id == 1
        assert request.payment_method_token == "tok_123"

    def test_crear_preferencia_response(self):
        """Test CrearPreferenciaResponse schema"""
        from backend.pagos.schemas import CrearPreferenciaResponse
        response = CrearPreferenciaResponse(
            preference_id="pref_123",
            init_point="https://mercadopago.com/checkout/123",
            pedido_id=1
        )
        assert response.preference_id == "pref_123"
        assert response.init_point == "https://mercadopago.com/checkout/123"
        assert response.pedido_id == 1