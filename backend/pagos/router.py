"""Pagos router — API endpoints for MercadoPago integration"""

import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import PlainTextResponse

from backend.core.dependencies import get_current_user
from backend.models.usuario import Usuario
from .schemas import (
    CrearPreferenciaRequest,
    CrearPreferenciaResponse,
    PagoResponse,
)
from .service import PagosService

logger = logging.getLogger(__name__)

# IMPORTANT: Order matters in FastAPI!
# Static routes MUST come BEFORE dynamic routes
# Otherwise FastAPI will try to match /crear-preferencia as {pedido_id}

router = APIRouter(prefix="/api/v1/pagos", tags=["pagos"])


# ============================================================================
# STATIC ROUTES - MUST BE FIRST
# ============================================================================

@router.post(
    "/crear-preferencia",
    response_model=CrearPreferenciaResponse,
    summary="Create payment preference",
    description="Creates a MercadoPago preference for a pending order"
)
async def crear_preferencia(
    data: CrearPreferenciaRequest,
    current_user: Usuario = Depends(get_current_user),
) -> CrearPreferenciaResponse:
    """Create a payment preference in MercadoPago."""
    service = PagosService()

    try:
        result = await service.crear_preferencia(
            pedido_id=data.pedido_id,
            usuario_id=current_user.id
        )

        return CrearPreferenciaResponse(
            preference_id=result["preference_id"],
            init_point=result["init_point"],
            pedido_id=result["pedido_id"]
        )

    except Exception as e:
        logger.error(f"Error creating preference: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/webhook",
    summary="Webhook verification"
)
async def webhook_verification(request: Request):
    """MercadoPago sends GET to verify webhook URL.

    When configured in the MP dashboard, MP sends a GET request with
    a ``challenge`` query parameter. The endpoint MUST echo it back
    to confirm the URL is valid.
    """
    challenge = request.query_params.get("challenge") or \
                request.query_params.get("data.challenge")

    if challenge:
        logger.info(f"MP webhook challenge received: {challenge}")
        return {"challenge": challenge}

    # Simple health check when no challenge is present
    return {"status": "ok", "message": "Webhook endpoint configured"}


@router.post(
    "/webhook",
    summary="MercadoPago webhook"
)
async def webhook(request: Request) -> PlainTextResponse:
    """MercadoPago IPN webhook endpoint (public, no auth)."""
    try:
        service = PagosService()
        body = await request.json()
        logger.info(f"MercadoPago webhook received: {body}")

        result = await service.procesar_webhook(body, request)
        logger.info(f"Webhook processed: {result}")

        return PlainTextResponse(content="OK", status_code=200)

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        # Always return 200 to MercadoPago to prevent retry storms
        return PlainTextResponse(content="OK", status_code=200)


# ============================================================================
# DYNAMIC ROUTES - MUST BE LAST
# ============================================================================

@router.get(
    "/{pedido_id}",
    response_model=PagoResponse,
    summary="Get payment status",
    description="Get the payment record for an order"
)
async def get_pago(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
) -> PagoResponse:
    """Get payment information for a specific order."""
    service = PagosService()

    pago = await service.get_pago_by_pedido(pedido_id)

    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    return PagoResponse(
        id=pago.id,
        pedido_id=pago.pedido_id,
        mp_payment_id=pago.mp_payment_id,
        mp_status=pago.mp_status,
        external_reference=pago.external_reference,
        idempotency_key=pago.idempotency_key,
        creado_en=pago.creado_en,
        actualizado_en=pago.actualizado_en
    )