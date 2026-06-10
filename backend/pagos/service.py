"""PagosService — business logic for MercadoPago integration

Handles:
- Creating payment preferences in MercadoPago with back_urls
- Processing webhooks with idempotency
- Triggering automatic order confirmation on payment approval
"""

import logging
import uuid
from typing import Optional, TYPE_CHECKING

import mercadopago
from fastapi import Request

from backend.core.config import settings
from backend.core.exceptions import ValidationError
from backend.core.unit_of_work import UnitOfWork
from backend.models.pedido import Pedido
from backend.models.pedido import Pago
from backend.pagos.repository import PagoRepository

if TYPE_CHECKING:
    from backend.pedidos.service import PedidoService

logger = logging.getLogger(__name__)


class PagosService:
    """Service for MercadoPago integration"""

    def __init__(self):
        access_token = settings.mp_access_token
        print(f"🔍 MP_ACCESS_TOKEN = '{access_token}'")  # Log temporal de diagnóstico
        if not access_token:
            raise ValidationError("MP_ACCESS_TOKEN no configurado")
        self.mp_sdk = mercadopago.SDK(access_token)

    def _generar_idempotency_key(self) -> str:
        return str(uuid.uuid4())

    async def crear_preferencia(self, pedido_id: int, usuario_id: int) -> dict:
        """Create a MercadoPago payment preference for an order.

        Validates:
        - Pedido exists
        - Pedido belongs to the authenticated user
        - Pedido is in PENDIENTE state
        - Pedido total is valid
        """
        async with UnitOfWork() as uow:
            # Register repos
            from backend.pedidos.repository import PedidoRepository
            uow.register("pedidos", PedidoRepository, Pedido)
            uow.register("pagos", PagoRepository, Pago)

            # Get pedido
            pedido = await uow.pedidos.get_by_id(pedido_id)
            if not pedido:
                raise ValidationError(f"Pedido {pedido_id} no encontrado")

            # Validate pedido belongs to authenticated user
            if pedido.usuario_id != usuario_id:
                raise ValidationError("Este pedido no te pertenece")

            if pedido.estado_codigo != "PENDIENTE":
                raise ValidationError(
                    f"Solo pedidos en estado PENDIENTE pueden ser pagados. "
                    f"Estado actual: {pedido.estado_codigo}"
                )

            # Validate total is valid
            if not pedido.total or float(pedido.total) <= 0:
                raise ValidationError("El total del pedido no es válido")

            # Frontend base URL for MP redirects
            frontend_url = settings.frontend_url.rstrip("/")

            # Build back_urls
            back_urls = {
                "success": f"{frontend_url}/pago-exitoso?pedido_id={pedido.id}",
                "failure": f"{frontend_url}/pago-fallido?pedido_id={pedido.id}",
                "pending": f"{frontend_url}/pago-pendiente?pedido_id={pedido.id}",
            }

            # ── Validación previa ─────────────────────────────────────
            for key, url in back_urls.items():
                if not url:
                    raise ValidationError(
                        f"back_urls.{key} está vacío — revisá FRONTEND_URL en .env"
                    )
                if "localhost" in url:
                    raise ValidationError(
                        f"back_urls.{key} apunta a localhost — "
                        f"MP no acepta localhost con credenciales APP_USR. "
                        f"Usá una URL pública (ngrok) en FRONTEND_URL del .env"
                    )

            # ── Logs de diagnóstico ────────────────────────────────────
            import json as _json
            print("=" * 60)
            print("🔍 DIAGNÓSTICO — Crear preferencia MP")
            print(f"  FRONTEND_URL     = {settings.frontend_url!r}")
            print(f"  MP_WEBHOOK_URL   = {settings.mp_webhook_url!r}")
            print(f"  back_urls.success = {back_urls['success']}")
            print(f"  back_urls.failure = {back_urls['failure']}")
            print(f"  back_urls.pending = {back_urls['pending']}")
            print("  PREFERENCE_DATA:")
            print(_json.dumps({
                "items": [{
                    "title": f"Pedido Food Store #{pedido.id}",
                    "quantity": 1,
                    "currency_id": "ARS",
                    "unit_price": float(pedido.total)
                }],
                "external_reference": str(pedido.id),
                "notification_url": settings.mp_webhook_url,
                "auto_return": "approved",
                "back_urls": back_urls,
            }, indent=2, ensure_ascii=False))
            print("=" * 60)

            # Generate preference in MP with back_urls for automatic redirect
            preference_data = {
                "items": [{
                    "title": f"Pedido Food Store #{pedido.id}",
                    "quantity": 1,
                    "currency_id": "ARS",
                    "unit_price": float(pedido.total)
                }],
                "external_reference": str(pedido.id),
                "notification_url": settings.mp_webhook_url,
                "auto_return": "approved",
                "back_urls": back_urls,
            }

            # ── Buscar pago existente (idempotencia / evitar duplicados) ──
            pago_existente = await uow.pagos.get_by_pedido_id(pedido_id)

            if pago_existente:
                logger.info(
                    "Pago existente encontrado para pedido_id=%s — "
                    "external_reference=%s, mp_status=%s, pago_id=%s",
                    pedido_id, pago_existente.external_reference,
                    pago_existente.mp_status, pago_existente.id,
                )
                if pago_existente.mp_status == "approved":
                    raise ValidationError(
                        f"El pedido {pedido_id} ya fue pagado. "
                        "No se puede generar una nueva preferencia."
                    )
                # Si está pendiente/rechazado, lo reutilizamos más abajo
            else:
                logger.info(
                    "No hay pago previo para pedido_id=%s — se creará uno nuevo",
                    pedido_id,
                )

            # ── Crear preferencia en MercadoPago ───────────────────────
            result = self.mp_sdk.preference().create(preference_data)
            if result["status"] != 201:
                raise ValidationError(
                    f"Error de MP: {result.get('response', {}).get('message', 'Unknown')}"
                )

            preference = result["response"]

            # ── Guardar o actualizar registro de pago ──────────────────
            if pago_existente:
                # Reutilizar: actualizar idempotency_key (la preferencia es nueva)
                pago_existente.idempotency_key = self._generar_idempotency_key()
                await uow.pagos.update(pago_existente)
                logger.info(
                    "Pago reutilizado — pedido_id=%s, pago_id=%s, "
                    "nueva idempotency_key=%s",
                    pedido_id, pago_existente.id, pago_existente.idempotency_key,
                )
            else:
                pago = Pago(
                    pedido_id=pedido_id,
                    external_reference=str(pedido.id),
                    idempotency_key=self._generar_idempotency_key(),
                    mp_status="pending",
                )
                await uow.pagos.create(pago)
                logger.info(
                    "Pago creado — pedido_id=%s, external_reference=%s, "
                    "idempotency_key=%s",
                    pedido_id, str(pedido.id), pago.idempotency_key,
                )

            return {
                "preference_id": preference["id"],
                "init_point": preference["init_point"],
                "pedido_id": pedido_id,
            }

    async def procesar_webhook(self, webhook_data: dict, request: Request) -> dict:
        """Process a MercadoPago webhook notification (IPN).

        Accepts BOTH:
        - Standard IPN notifications (no signature headers) — logged, not blocked
        - Newer signed notifications (with X-Signature + X-Request-ID) — validated
        """
        client_ip = request.client.host if request.client else "unknown"
        payment_id = webhook_data.get("data", {}).get("id")

        # ── Optional: signature validation (newer MP notification types) ──
        x_signature = request.headers.get("X-Signature")
        x_request_id = request.headers.get("X-Request-ID")

        if x_signature and x_request_id:
            try:
                raw_body = await request.body()
                is_valid = self.mp_sdk.signature().validate(
                    x_request_id=x_request_id,
                    x_signature=x_signature,
                    body=raw_body,
                )
                if not is_valid:
                    logger.warning(
                        "[MP] Invalid webhook signature from %s, payment_id: %s",
                        client_ip, payment_id,
                    )
                    return {"status": "error", "reason": "Invalid signature"}
                logger.info(
                    "[MP] Webhook signature validated from %s, payment_id: %s",
                    client_ip, payment_id,
                )
            except Exception as e:
                logger.error("[MP] Signature validation error: %s", e)
                return {"status": "error", "reason": f"Validation error: {e}"}
        else:
            # Standard IPN — no signature headers; log warning but DO NOT block
            logger.warning(
                "[MP] No signature headers (standard IPN) from %s, "
                "proceeding without validation — payment_id: %s",
                client_ip, payment_id,
            )

        # ── Must have a payment ID ──
        if not payment_id:
            logger.info("[MP] Webhook with no payment_id — body: %s", webhook_data)
            return {"status": "ignored", "reason": "No payment ID in webhook"}

        # Normalize payment_id to int (MP returns it as int in API, string in IPN)
        try:
            payment_id_int = int(payment_id)
        except (ValueError, TypeError):
            return {"status": "ignored", "reason": f"Invalid payment_id: {payment_id}"}

        # ── Verify with MP API ──
        try:
            result = self.mp_sdk.payment().get(payment_id_int)
            if result["status"] != 200:
                return {"status": "error", "reason": "Could not verify payment"}
            payment_info = result["response"]
        except Exception as e:
            logger.error("[MP] MP API error fetching payment %s: %s", payment_id_int, e)
            return {"status": "error", "reason": f"MP API error: {e}"}

        external_ref = payment_info.get("external_reference")
        status = payment_info.get("status")
        transaction_amount = payment_info.get("transaction_amount")

        if not external_ref:
            return {"status": "ignored", "reason": "No external reference"}

        try:
            pedido_id = int(external_ref)
        except (ValueError, TypeError):
            return {"status": "ignored", "reason": "Invalid external reference"}

        logger.info(
            "[MP] Processing webhook — payment_id=%s, pedido_id=%s, status=%s",
            payment_id_int, pedido_id, status,
        )

        # ── Process in UoW ──
        async with UnitOfWork() as uow:
            from backend.pedidos.repository import PedidoRepository
            uow.register("pedidos", PedidoRepository, Pedido)
            uow.register("pagos", PagoRepository, Pago)

            # Idempotency check (by mp_payment_id — int)
            existing_pago = await uow.pagos.get_by_mp_payment_id(payment_id_int)
            if existing_pago:
                logger.info(
                    "[MP] Webhook already processed, payment_id: %s", payment_id_int,
                )
                return {"status": "ignored", "reason": "Payment already processed"}

            # Get pedido
            pedido = await uow.pedidos.get_by_id(pedido_id)
            if not pedido:
                logger.warning("[MP] Pedido %s not found for payment %s", pedido_id, payment_id_int)
                return {"status": "ignored", "reason": f"Pedido {pedido_id} not found"}

            # Create / update payment record
            existing_pago = await uow.pagos.get_by_pedido_id(pedido_id)
            if not existing_pago:
                pago = Pago(
                    pedido_id=pedido_id,
                    external_reference=external_ref,
                    idempotency_key=self._generar_idempotency_key(),
                    mp_payment_id=payment_id_int,
                    mp_status=status,
                    transaction_amount=transaction_amount,
                )
                await uow.pagos.create(pago)
                logger.info("[MP] Created pago record for pedido %s", pedido_id)
            else:
                existing_pago.mp_payment_id = payment_id_int
                existing_pago.mp_status = status
                if transaction_amount:
                    existing_pago.transaction_amount = transaction_amount
                await uow.pagos.update(existing_pago)
                logger.info("[MP] Updated pago record for pedido %s", pedido_id)

            # ── Handle status transitions ──
            if status == "approved" and pedido.estado_codigo == "PENDIENTE":
                from backend.pedidos.service import PedidoService
                pedido_service = PedidoService()
                try:
                    logger.info(
                        "[MP] Processing approved payment, pedido_id: %s", pedido_id,
                    )
                    await pedido_service.confirmar_pedido_webhook(pedido_id, uow)
                    return {
                        "status": "processed",
                        "action": "pedido_confirmado",
                        "pedido_id": pedido_id,
                        "payment_status": status,
                    }
                except Exception as e:
                    logger.error("[MP] Failed to confirm pedido %s: %s", pedido_id, e)
                    return {"status": "error", "reason": f"Failed to confirm: {e}"}

            elif status == "rejected":
                logger.info("[MP] Payment rejected, pedido_id: %s", pedido_id)
                return {"status": "processed", "action": "pago_rechazado", "pedido_id": pedido_id, "payment_status": status}

            elif status in ("pending", "in_process"):
                logger.info("[MP] Payment pending, pedido_id: %s", pedido_id)
                return {"status": "processed", "action": "pago_pendiente", "pedido_id": pedido_id, "payment_status": status}

            logger.info("[MP] Unhandled status %s for pedido %s", status, pedido_id)
            return {"status": "ignored", "reason": f"Status: {status}"}

    async def get_pago_by_pedido(self, pedido_id: int, sync_with_mp: bool = True) -> Optional[Pago]:
        """Get payment record for an order, optionally syncing with MP API.

        If ``sync_with_mp`` is ``True`` (default) and the local Pago is still
        ``pending``, this method queries MP's API directly for the payment
        status and updates the local record. This acts as a fallback when the
        IPN webhook hasn't arrived yet.
        """
        async with UnitOfWork() as uow:
            uow.register("pagos", PagoRepository, Pago)

            pago = await uow.pagos.get_by_pedido_id(pedido_id)
            if not pago:
                return None

            # If already finalised locally, return as-is
            if pago.mp_status not in ("pending", "in_process") or not sync_with_mp:
                return pago

        # ── Sync with MP API outside the first UoW ──
        # We need the pedido's external_reference to search in MP.
        # Actually, pago.external_reference == str(pedido.id).
        # But we need the MP payment ID (mp_payment_id). If it's None,
        # we can try searching by external_reference.
        mp_payment_id = pago.mp_payment_id
        external_ref = pago.external_reference

        try:
            if mp_payment_id:
                # We have the MP payment ID — fetch directly
                result = self.mp_sdk.payment().get(mp_payment_id)
            else:
                # No MP payment ID yet — search by external_reference
                logger.info(
                    "[MP] No mp_payment_id for pedido %s, searching by external_ref=%s",
                    pedido_id, external_ref,
                )
                search_result = self.mp_sdk.payment().search(
                    filters={"external_reference": external_ref}
                )
                if search_result["status"] != 200:
                    logger.warning("[MP] Search failed: status=%s", search_result["status"])
                    return pago

                results = search_result.get("response", {}).get("results", [])
                if not results:
                    logger.info("[MP] No payments found for external_ref=%s", external_ref)
                    return pago

                # Take the most recent result
                payment_info = results[0]
                mp_status = payment_info.get("status")
                new_mp_payment_id = int(payment_info.get("id", 0))

                # Update Pago with the discovered mp_payment_id
                async with UnitOfWork() as uow:
                    uow.register("pagos", PagoRepository, Pago)
                    pago = await uow.pagos.get_by_pedido_id(pedido_id)
                    if pago:
                        pago.mp_payment_id = new_mp_payment_id
                        await uow.pagos.update(pago)

                # Re-fetch using the discovered ID for full details
                result = self.mp_sdk.payment().get(new_mp_payment_id)
                if result["status"] != 200:
                    return pago
                payment_info = result["response"]
                mp_status = payment_info.get("status")

            if result["status"] != 200:
                logger.warning("[MP] Sync failed for payment %s: status=%s", mp_payment_id, result["status"])
                return pago

            payment_info = result["response"]
            mp_status = payment_info.get("status")
            logger.info(
                "[MP] Sync result for pedido %s: mp_payment_id=%s, mp_status=%s",
                pedido_id, mp_payment_id, mp_status,
            )

            if mp_status == pago.mp_status:
                return pago  # No change

            # Update the Pago and optionally confirm pedido
            async with UnitOfWork() as uow:
                from backend.pedidos.repository import PedidoRepository
                uow.register("pedidos", PedidoRepository, Pedido)
                uow.register("pagos", PagoRepository, Pago)

                pago = await uow.pagos.get_by_pedido_id(pedido_id)
                if not pago:
                    return None

                pago.mp_status = mp_status
                if payment_info.get("transaction_amount"):
                    pago.transaction_amount = payment_info.get("transaction_amount")
                await uow.pagos.update(pago)

                if mp_status == "approved":
                    pedido = await uow.pedidos.get_by_id(pedido_id)
                    if pedido and pedido.estado_codigo == "PENDIENTE":
                        from backend.pedidos.service import PedidoService
                        pedido_service = PedidoService()
                        try:
                            await pedido_service.confirmar_pedido_webhook(pedido_id, uow)
                            logger.info("[MP] Pedido %s confirmed via sync", pedido_id)
                        except Exception as e:
                            logger.error("[MP] Sync confirm failed for pedido %s: %s", pedido_id, e)

                    # Re-fetch pago because confirm_pedido calls uow.session.expunge_all()
                    pago = await uow.pagos.get_by_pedido_id(pedido_id)
                return pago

        except Exception as e:
            logger.error("[MP] Sync error for pedido %s: %s", pedido_id, e)
            # Re-fetch from DB to avoid returning a detached/expired instance
            try:
                async with UnitOfWork() as uow:
                    uow.register("pagos", PagoRepository, Pago)
                    return await uow.pagos.get_by_pedido_id(pedido_id)
            except Exception as db_err:
                logger.error("[MP] DB re-fetch after sync error also failed: %s", db_err)
                return None