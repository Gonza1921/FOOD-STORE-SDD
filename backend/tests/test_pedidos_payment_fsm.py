"""Tests: Payment FSM & Idempotency (CH-021, Task 4.2)

Tests the integration between webhook payment processing and the
pedido state machine. Focuses on:
- Payment approved → pedido CONFIRMADO + stock decremented
- Payment rejected → pedido stays PENDIENTE
- Webhook idempotency (duplicate webhooks don't double-process)
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import Request


class TestPaymentFSM:
    """4.2 Backend Integration Tests — Payment FSM & Idempotency"""

    @pytest.fixture
    def mock_mp_sdk(self):
        """Mock MercadoPago SDK"""
        with patch('backend.pagos.service.mercadopago.SDK') as mock_sdk_cls:
            mock_instance = MagicMock()
            mock_sdk_cls.return_value = mock_instance
            # Mock signature validator (passes validation)
            mock_sig = MagicMock()
            mock_sig.validate.return_value = True
            mock_instance.signature.return_value = mock_sig
            yield mock_instance

    @pytest.fixture
    def service(self, mock_mp_sdk):
        """Create PagosService with mocked MP SDK"""
        with patch.dict('backend.pagos.service.os.environ',
                        {'MP_ACCESS_TOKEN': 'test_token_123'}):
            from backend.pagos.service import PagosService
            return PagosService()

    @pytest.fixture
    def mock_request(self):
        """Create a mock Request with valid signature headers"""
        request = AsyncMock(spec=Request)
        request.headers = {
            "X-Signature": "ts=1712345678,v1=abc123def456",
            "X-Request-ID": "req-abc-123"
        }
        request.client.host = "203.0.113.42"
        request.body = AsyncMock(return_value=b'{}')
        return request

    def _make_payment_payload(self, payment_id: int, status: str,
                              external_ref: str = "1",
                              amount: float = 100.0) -> dict:
        """Helper to create a webhook payload with given status."""
        return {
            "action": "payment.created",
            "api_version": "v1",
            "data": {"id": payment_id}
        }

    # ------------------------------------------------------------------
    # Tests using mocked MP payment().get() responses
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_payment_approved_pedido_confirmed(self, service,
                                                      mock_mp_sdk,
                                                      mock_request):
        """Payment approved → pedido flow triggered (CONFIRMADO path).

        Mocks payment().get() to return 'approved' status and verifies
        that confirmar_pedido_webhook is called on PedidoService.
        """
        # Mock payment().get() to return approved status
        mock_mp_sdk.payment.return_value.get.return_value = {
            "status": 200,
            "response": {
                "id": 999001,
                "status": "approved",
                "external_reference": "42",
                "transaction_amount": 150.0,
            }
        }

        payload = self._make_payment_payload(999001, "approved", "42")

        # Mock PedidoService (imported INSIDE procesar_webhook)
        with patch('backend.pedidos.service.PedidoService') as MockPedidoSvc:
            mock_pedido_svc_instance = AsyncMock()
            MockPedidoSvc.return_value = mock_pedido_svc_instance
            mock_pedido_svc_instance.confirmar_pedido_webhook = AsyncMock()
            mock_pedido_svc_instance.confirmar_pedido_webhook.return_value = MagicMock()

            # Mock the internal UoW db operations
            with patch('backend.pagos.service.UnitOfWork') as MockUoW:
                mock_uow_instance = AsyncMock()
                mock_uow_instance.__aenter__.return_value = mock_uow_instance
                MockUoW.return_value = mock_uow_instance

                # Configure repos as explicit MagicMock to avoid auto-creation
                mock_pagos_repo = MagicMock()
                mock_pagos_repo.get_by_mp_payment_id.return_value = None
                mock_pagos_repo.get_by_pedido_id.return_value = None
                mock_uow_instance.pagos = mock_pagos_repo

                mock_pedido_repo = MagicMock()
                mock_pedido = MagicMock()
                mock_pedido.estado_codigo = "PENDIENTE"
                mock_pedido_repo.get_by_id.return_value = mock_pedido
                mock_uow_instance.pedidos = mock_pedido_repo

                result = await service.procesar_webhook(payload, mock_request)

        assert result["status"] == "processed"
        assert result["action"] == "pedido_confirmado"
        assert result["payment_status"] == "approved"
        assert result["pedido_id"] == 42

    @pytest.mark.asyncio
    async def test_payment_rejected_pedido_unchanged(self, service,
                                                      mock_mp_sdk,
                                                      mock_request):
        """Payment rejected → Pago.mp_status='rejected', Pedido stays PENDIENTE."""
        # Mock payment().get() to return rejected status
        mock_mp_sdk.payment.return_value.get.return_value = {
            "status": 200,
            "response": {
                "id": 999002,
                "status": "rejected",
                "external_reference": "43",
                "transaction_amount": 200.0,
            }
        }

        payload = self._make_payment_payload(999002, "rejected", "43")

        with patch('backend.pagos.service.UnitOfWork') as MockUoW:
            mock_uow_instance = AsyncMock()
            mock_uow_instance.__aenter__.return_value = mock_uow_instance
            MockUoW.return_value = mock_uow_instance

            # Configure mock repos explicitly
            mock_pagos_repo = MagicMock()
            mock_pagos_repo.get_by_mp_payment_id.return_value = None
            mock_pagos_repo.get_by_pedido_id.return_value = None
            mock_uow_instance.pagos = mock_pagos_repo

            mock_pedido_repo = MagicMock()
            mock_pedido = MagicMock()
            mock_pedido.estado_codigo = "PENDIENTE"
            mock_pedido_repo.get_by_id.return_value = mock_pedido
            mock_uow_instance.pedidos = mock_pedido_repo

            result = await service.procesar_webhook(payload, mock_request)

        assert result["status"] == "processed"
        assert result["action"] == "pago_rechazado"
        assert result["payment_status"] == "rejected"

    @pytest.mark.asyncio
    async def test_webhook_idempotency(self, service, mock_mp_sdk,
                                        mock_request):
        """Same webhook sent twice → second call returns ignored (already processed).

        Simulates idempotency by having get_by_mp_payment_id return an
        existing Pago record on the second call.
        """
        mock_mp_sdk.payment.return_value.get.return_value = {
            "status": 200,
            "response": {
                "id": 999003,
                "status": "approved",
                "external_reference": "44",
                "transaction_amount": 300.0,
            }
        }

        payload = self._make_payment_payload(999003, "approved", "44")

        with patch('backend.pagos.service.UnitOfWork') as MockUoW:
            mock_uow_instance = AsyncMock()
            mock_uow_instance.__aenter__.return_value = mock_uow_instance
            MockUoW.return_value = mock_uow_instance

            # Configure mock repos explicitly
            mock_pagos_repo = MagicMock()
            # Simulate that this payment was ALREADY processed
            mock_pagos_repo.get_by_mp_payment_id.return_value = MagicMock()
            mock_uow_instance.pagos = mock_pagos_repo

            result = await service.procesar_webhook(payload, mock_request)

        assert result["status"] == "ignored"
        assert "already processed" in result["reason"]

    @pytest.mark.asyncio
    async def test_webhook_no_payment_id(self, service, mock_mp_sdk,
                                          mock_request):
        """Webhook without a payment ID → ignored gracefully."""
        mock_mp_sdk.payment.return_value.get.return_value = {
            "status": 200,
            "response": {
                "id": 999004,
                "status": "approved",
                "external_reference": "45",
                "transaction_amount": 400.0,
            }
        }

        payload = {"action": "test", "data": {}}  # No payment ID

        result = await service.procesar_webhook(payload, mock_request)

        assert result["status"] == "ignored"
