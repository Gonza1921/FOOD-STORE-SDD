"""PagosService — business logic for MercadoPago integration

Handles:
- Creating payment preferences in MercadoPago
- Processing webhooks with idempotency
- Triggering automatic order confirmation on payment approval
"""

import os
import uuid
from typing import Optional, TYPE_CHECKING

import mercadopago

from backend.core.exceptions import ValidationError
from backend.core.unit_of_work import UnitOfWork
from backend.models.pedido import Pedido
from backend.models.pedido import Pago
from backend.pagos.repository import PagoRepository

if TYPE_CHECKING:
    from backend.pedidos.service import PedidoService


class PagosService:
    """Service for MercadoPago integration"""

    def __init__(self):
        access_token = os.getenv("MP_ACCESS_TOKEN", "")
        if not access_token:
            raise ValidationError("MP_ACCESS_TOKEN no configurado")
        self.mp_sdk = mercadopago.SDK(access_token)

    def _generar_idempotency_key(self) -> str:
        return str(uuid.uuid4())

    async def crear_preferencia(self, pedido_id: int) -> dict:
        """Create a MercadoPago payment preference for an order."""
        async with UnitOfWork() as uow:
            # Register repos
            from backend.pedidos.repository import PedidoRepository
            uow.register("pedidos", PedidoRepository, Pedido)
            uow.register("pagos", PagoRepository, Pago)

            # Get pedido
            pedido = uow.pedidos.get_by_id(pedido_id)
            if not pedido:
                raise ValidationError(f"Pedido {pedido_id} no encontrado")

            if pedido.estado_codigo != "PENDIENTE":
                raise ValidationError(
                    f"Solo pedidos en estado PENDIENTE pueden ser pagados. "
                    f"Estado actual: {pedido.estado_codigo}"
                )

            # Generate preference in MP
            preference_data = {
                "items": [{
                    "title": f"Pedido #{pedido.id}",
                    "quantity": 1,
                    "currency_id": "ARS",
                    "unit_price": float(pedido.total)
                }],
                "external_reference": str(pedido.id),
                "notification_url": os.getenv(
                    "MP_WEBHOOK_URL",
                    "https://tu-dominio.com/api/v1/pagos/webhook"
                ),
                "auto_return": "all",
            }

            result = self.mp_sdk.preference().create(preference_data)
            if result["status"] != 201:
                raise ValidationError(f"Error de MP: {result.get('response', {}).get('message', 'Unknown')}")

            preference = result["response"]

            # Save payment record
            pago = Pago(
                pedido_id=pedido_id,
                external_reference=str(pedido.id),
                idempotency_key=self._generar_idempotency_key(),
                mp_status="pending"
            )
            uow.pagos.create(pago)

            return {
                "preference_id": preference["id"],
                "init_point": preference["init_point"],
                "pedido_id": pedido_id
            }

    async def procesar_webhook(self, webhook_data: dict) -> dict:
        """Process a MercadoPago webhook notification."""
        payment_id = webhook_data.get("data", {}).get("id")
        if not payment_id:
            return {"status": "ignored", "reason": "No payment ID in webhook"}

        # Verify with MP API
        try:
            result = self.mp_sdk.payment().get(payment_id)
            if result["status"] != 200:
                return {"status": "error", "reason": "Could not verify payment"}
            payment_info = result["response"]
        except Exception as e:
            return {"status": "error", "reason": f"MP API error: {str(e)}"}

        external_ref = payment_info.get("external_reference")
        status = payment_info.get("status")
        transaction_amount = payment_info.get("transaction_amount")

        if not external_ref:
            return {"status": "ignored", "reason": "No external reference"}

        try:
            pedido_id = int(external_ref)
        except (ValueError, TypeError):
            return {"status": "ignored", "reason": f"Invalid external reference"}

        # Process in UoW
        async with UnitOfWork() as uow:
            from backend.pedidos.repository import PedidoRepository
            uow.register("pedidos", PedidoRepository, Pedido)
            uow.register("pagos", PagoRepository, Pago)

            # Check idempotency
            existing_pago = uow.pagos.get_by_mp_payment_id(payment_id)
            if existing_pago:
                return {"status": "ignored", "reason": "Payment already processed"}

            # Get pedido
            pedido = uow.pedidos.get_by_id(pedido_id)
            if not pedido:
                return {"status": "ignored", "reason": f"Pedido {pedido_id} not found"}

            # Create/update payment record
            existing_pago = uow.pagos.get_by_pedido_id(pedido_id)
            if not existing_pago:
                pago = Pago(
                    pedido_id=pedido_id,
                    external_reference=external_ref,
                    idempotency_key=self._generar_idempotency_key(),
                    mp_payment_id=payment_id,
                    mp_status=status,
                    transaction_amount=transaction_amount
                )
                uow.pagos.create(pago)
            else:
                existing_pago.mp_payment_id = payment_id
                existing_pago.mp_status = status
                if transaction_amount:
                    existing_pago.transaction_amount = transaction_amount
                uow.pagos.update(existing_pago)

            # Handle status transitions
            if status == "approved" and pedido.estado_codigo == "PENDIENTE":
                from backend.pedidos.service import PedidoService
                pedido_service = PedidoService()
                try:
                    await pedido_service.confirmar_pedido(pedido_id, uow)
                    return {
                        "status": "processed",
                        "action": "pedido_confirmado",
                        "pedido_id": pedido_id,
                        "payment_status": status
                    }
                except Exception as e:
                    return {"status": "error", "reason": f"Failed to confirm: {str(e)}"}

            elif status == "rejected":
                return {"status": "processed", "action": "pago_rechazado", "pedido_id": pedido_id, "payment_status": status}

            elif status in ["pending", "in_process"]:
                return {"status": "processed", "action": "pago_pendiente", "pedido_id": pedido_id, "payment_status": status}

            return {"status": "ignored", "reason": f"Status: {status}"}

    async def get_pago_by_pedido(self, pedido_id: int) -> Optional[Pago]:
        """Get payment record for an order"""
        async with UnitOfWork() as uow:
            uow.register("pagos", PagoRepository, Pago)
            return uow.pagos.get_by_pedido_id(pedido_id)