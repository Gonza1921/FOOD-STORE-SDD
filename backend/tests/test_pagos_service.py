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


class TestWebhookSignatureValidation:
    """Test suite for webhook signature validation"""

    @pytest.fixture
    def mock_request(self):
        """Create mock FastAPI Request with headers and body"""
        request = MagicMock()
        request.client.host = "192.168.1.1"
        return request

    @pytest.fixture
    def webhook_payload(self):
        """Sample webhook payload from MercadoPago"""
        return {
            "data": {
                "id": "payment_123"
            },
            "action": "payment.created"
        }

    def test_webhook_valid_signature(self, mock_request, webhook_payload):
        """Test webhook with valid signature passes through signature validation"""
        # Setup
        import asyncio
        from unittest.mock import AsyncMock, patch
        
        with patch.dict('backend.pagos.service.os.environ', {'MP_ACCESS_TOKEN': 'test_token'}):
            with patch('backend.pagos.service.mercadopago.SDK') as mock_sdk_class:
                with patch('backend.pagos.service.UnitOfWork') as mock_uow_class:
                    mock_sdk = MagicMock()
                    mock_sdk_class.return_value = mock_sdk
                    
                    # Mock signature validation to return True
                    mock_sdk.signature().validate.return_value = True
                    
                    # Mock UnitOfWork context manager
                    mock_uow = MagicMock()
                    mock_uow_class.return_value.__aenter__.return_value = mock_uow
                    mock_uow_class.return_value.__aexit__.return_value = None
                    
                    service = PagosService()
                    mock_request.headers = {
                        "X-Signature": "valid_signature",
                        "X-Request-ID": "req_id_123"
                    }
                    # Mock body() as async function
                    mock_request.body = AsyncMock(return_value=b'{"data": {"id": "payment_123"}}')
                    
                    # Execute
                    result = asyncio.run(service.procesar_webhook(webhook_payload, mock_request))
                    
                    # Verify signature validation was called
                    mock_sdk.signature().validate.assert_called_once()

    def test_webhook_invalid_signature(self, mock_request, webhook_payload):
        """Test webhook with invalid signature returns error"""
        # Setup
        import asyncio
        from unittest.mock import AsyncMock
        
        with patch.dict('backend.pagos.service.os.environ', {'MP_ACCESS_TOKEN': 'test_token'}):
            with patch('backend.pagos.service.mercadopago.SDK') as mock_sdk_class:
                mock_sdk = MagicMock()
                mock_sdk_class.return_value = mock_sdk
                
                # Mock signature validation to return False
                mock_sdk.signature().validate.return_value = False
                
                service = PagosService()
                mock_request.headers = {
                    "X-Signature": "invalid_signature",
                    "X-Request-ID": "req_id_123"
                }
                mock_request.body = AsyncMock(return_value=b'{"data": {"id": "payment_123"}}')
                
                # Execute
                result = asyncio.run(service.procesar_webhook(webhook_payload, mock_request))
                
                # Verify error response
                assert result["status"] == "error"
                assert result["reason"] == "Invalid signature"

    def test_webhook_missing_signature_header(self, mock_request, webhook_payload):
        """Test webhook without X-Signature header returns error"""
        # Setup
        import asyncio
        
        with patch.dict('backend.pagos.service.os.environ', {'MP_ACCESS_TOKEN': 'test_token'}):
            with patch('backend.pagos.service.mercadopago.SDK') as mock_sdk_class:
                mock_sdk = MagicMock()
                mock_sdk_class.return_value = mock_sdk
                
                service = PagosService()
                mock_request.headers = {
                    # Missing X-Signature
                    "X-Request-ID": "req_id_123"
                }
                
                # Execute
                result = asyncio.run(service.procesar_webhook(webhook_payload, mock_request))
                
                # Verify error response
                assert result["status"] == "error"
                assert result["reason"] == "Missing signature headers"

    def test_webhook_missing_request_id_header(self, mock_request, webhook_payload):
        """Test webhook without X-Request-ID header returns error"""
        # Setup
        import asyncio
        
        with patch.dict('backend.pagos.service.os.environ', {'MP_ACCESS_TOKEN': 'test_token'}):
            with patch('backend.pagos.service.mercadopago.SDK') as mock_sdk_class:
                mock_sdk = MagicMock()
                mock_sdk_class.return_value = mock_sdk
                
                service = PagosService()
                mock_request.headers = {
                    "X-Signature": "some_signature"
                    # Missing X-Request-ID
                }
                
                # Execute
                result = asyncio.run(service.procesar_webhook(webhook_payload, mock_request))
                
                # Verify error response
                assert result["status"] == "error"
                assert result["reason"] == "Missing signature headers"

    def test_webhook_logs_source_ip(self, mock_request, webhook_payload, caplog):
        """Test webhook logs include source IP"""
        # Setup
        import asyncio
        import logging
        from unittest.mock import AsyncMock
        
        with patch.dict('backend.pagos.service.os.environ', {'MP_ACCESS_TOKEN': 'test_token'}):
            with patch('backend.pagos.service.mercadopago.SDK') as mock_sdk_class:
                mock_sdk = MagicMock()
                mock_sdk_class.return_value = mock_sdk
                
                # Mock invalid signature to trigger warning log
                mock_sdk.signature().validate.return_value = False
                
                service = PagosService()
                mock_request.headers = {
                    "X-Signature": "invalid",
                    "X-Request-ID": "req_id_123"
                }
                mock_request.body = AsyncMock(return_value=b'{"data": {"id": "payment_123"}}')
                mock_request.client.host = "203.0.113.45"
                
                # Execute
                with caplog.at_level(logging.WARNING):
                    result = asyncio.run(service.procesar_webhook(webhook_payload, mock_request))
                
                # Verify log includes [MP] prefix and source IP
                assert any("[MP]" in record.message for record in caplog.records)
                assert any("203.0.113.45" in record.message for record in caplog.records)