"""Tests: Webhook signature validation (CH-021, Task 4.1)

Tests the webhook signature validation logic in PagosService.procesar_webhook().
Uses mocked MP SDK so no real MercadoPago credentials are needed.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import Request
from fastapi.testclient import TestClient


class TestWebhookSignatureValidation:
    """4.1 Backend Unit Tests — Webhook Signature Validation"""

    @pytest.fixture
    def mock_mp_sdk(self):
        """Mock MercadoPago SDK with signature validation"""
        with patch('backend.pagos.service.mercadopago.SDK') as mock_sdk_cls:
            mock_instance = MagicMock()
            mock_sdk_cls.return_value = mock_instance
            # Mock signature validator
            mock_sig = MagicMock()
            mock_instance.signature.return_value = mock_sig
            yield mock_instance, mock_sig

    @pytest.fixture
    def service(self, mock_mp_sdk):
        """Create PagosService with mocked MP SDK"""
        with patch.dict('backend.pagos.service.os.environ',
                        {'MP_ACCESS_TOKEN': 'test_token_123'}):
            from backend.pagos.service import PagosService
            return PagosService()

    @pytest.fixture
    def valid_webhook_payload(self):
        """Sample valid webhook payload"""
        return {
            "action": "payment.created",
            "api_version": "v1",
            "data": {"id": 123456789}
        }

    @pytest.fixture
    def mock_request_with_signature(self):
        """Create a mock Request with valid signature headers"""
        request = AsyncMock(spec=Request)
        request.headers = {
            "X-Signature": "ts=1712345678,v1=abc123def456",
            "X-Request-ID": "req-abc-123"
        }
        request.client.host = "203.0.113.42"
        request.body = AsyncMock(return_value=b'{"action":"payment.created"}')
        return request

    @pytest.mark.asyncio
    async def test_webhook_valid_signature(self, service, mock_mp_sdk,
                                            valid_webhook_payload,
                                            mock_request_with_signature):
        """Valid signature → webhook proceeds to payment verification.

        Mocks validate() to return True and mocks UoW to avoid DB.
        """
        mock_instance, mock_sig = mock_mp_sdk
        mock_sig.validate.return_value = True

        # Mock payment().get() to return a valid response
        mock_payment = MagicMock()
        mock_instance.payment.return_value = mock_payment
        mock_payment.get.return_value = {
            "status": 200,
            "response": {
                "id": 123456789,
                "status": "approved",
                "external_reference": "1",
                "transaction_amount": 100.0,
            }
        }

        # Mock PedidoService (called inside procesar_webhook for approved payments)
        with patch('backend.pedidos.service.PedidoService') as MockPedidoSvc:
            mock_pedido_svc = AsyncMock()
            MockPedidoSvc.return_value = mock_pedido_svc
            mock_pedido_svc.confirmar_pedido_webhook = AsyncMock()
            mock_pedido_svc.confirmar_pedido_webhook.return_value = MagicMock()

            # Mock UnitOfWork to avoid real DB
            with patch('backend.pagos.service.UnitOfWork') as MockUoW:
                mock_uow_instance = AsyncMock()
                mock_uow_instance.__aenter__.return_value = mock_uow_instance
                MockUoW.return_value = mock_uow_instance

                # Configure mock attributes properly
                mock_pagos_repo = MagicMock()
                mock_pagos_repo.get_by_mp_payment_id.return_value = None
                mock_pagos_repo.get_by_pedido_id.return_value = None
                mock_uow_instance.pagos = mock_pagos_repo

                mock_pedido_repo = MagicMock()
                mock_pedido = MagicMock()
                mock_pedido.estado_codigo = "PENDIENTE"
                mock_pedido_repo.get_by_id.return_value = mock_pedido
                mock_uow_instance.pedidos = mock_pedido_repo

                result = await service.procesar_webhook(
                    valid_webhook_payload,
                    mock_request_with_signature
                )

        # Should proceed past signature check
        assert result["status"] != "error"
        assert "signature" not in result.get("reason", "").lower()
        assert result["action"] == "pedido_confirmado"

    @pytest.mark.asyncio
    async def test_webhook_invalid_signature(self, service, mock_mp_sdk,
                                              valid_webhook_payload,
                                              mock_request_with_signature):
        """Invalid signature → returns error, no DB changes."""
        mock_instance, mock_sig = mock_mp_sdk
        mock_sig.validate.return_value = False

        result = await service.procesar_webhook(
            valid_webhook_payload,
            mock_request_with_signature
        )

        assert result["status"] == "error"
        assert result["reason"] == "Invalid signature"

    @pytest.mark.asyncio
    async def test_webhook_missing_signature_header(self, service,
                                                     valid_webhook_payload):
        """Missing X-Signature header → returns error."""
        request = AsyncMock(spec=Request)
        request.headers = {}  # No signature headers
        request.client.host = "203.0.113.42"

        result = await service.procesar_webhook(
            valid_webhook_payload,
            request
        )

        assert result["status"] == "error"
        assert "Missing signature headers" in result["reason"]

    @pytest.mark.asyncio
    async def test_webhook_logs_source_ip(self, service, mock_mp_sdk,
                                           valid_webhook_payload,
                                           mock_request_with_signature, caplog):
        """Verify log includes source IP in [MP] prefix."""
        import logging
        caplog.set_level(logging.INFO)

        mock_instance, mock_sig = mock_mp_sdk
        mock_sig.validate.return_value = False  # Will trigger warning log

        await service.procesar_webhook(
            valid_webhook_payload,
            mock_request_with_signature
        )

        # Check that log contains [MP] and the source IP
        assert any("[MP]" in record.message and "203.0.113.42" in record.message
                   for record in caplog.records), (
            "Expected log with [MP] prefix and source IP 203.0.113.42"
        )
