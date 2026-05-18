"""Router — HTTP endpoints for Pedido CRUD (ETAPA 1 + ETAPA 2)

Tasks implemented:
- POST   /api/v1/pedidos              (ETAPA 1) — Create new pedido
- GET    /api/v1/pedidos              (ETAPA 1) — List user's pedidos (paginated)
- GET    /api/v1/pedidos/{pedido_id}  (ETAPA 1) — Get pedido detail
- PATCH  /api/v1/pedidos/{id}/estado  (ETAPA 2) — Transition state (admin)
- POST   /api/v1/pedidos/{id}/confirmar (ETAPA 2) — Confirm & decrement stock (admin)
- GET    /api/v1/pedidos/admin/todos  (ETAPA 2) — List all pedidos (admin)

All endpoints use:
- UnitOfWork for atomic transactions
- PedidoService for business logic
- JWT auth via get_current_user (require login)
- RBAC via require_role for admin endpoints
- Pydantic models for validation and serialization
- APIError subclasses for error handling

Architecture: Router → Service (no DI, no session param)
Matches patterns used in: auth, categorias, ingredientes, productos
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Path, Body, Request, status

from backend.core.dependencies import get_current_user, require_role
from backend.core.rate_limit import limiter_pedidos
from backend.models.usuario import Usuario
from .schemas import (
    PedidoCreate,
    PedidoResponse,
    PedidoListResponse,
    PedidoEstadoUpdate,
    PedidoTransicionResponse,
    PedidoSummary,
    PedidoCancelRequest,
    HistorialEstadoResponse,
    HistorialListResponse,
)
from .service import PedidoService


# ============================================================================
# Router Setup
# ============================================================================

router = APIRouter(prefix="/api/v1/pedidos", tags=["Pedidos"])


def _build_pedido_response(pedido) -> dict:
    """Build PedidoResponse-compatible dict from a Pedido model instance."""
    detalles = getattr(pedido, "detalles", [])
    return {
        "id": pedido.id,
        "usuario_id": pedido.usuario_id,
        "estado": pedido.estado_codigo,
        "total": pedido.total,
        "costo_envio": pedido.costo_envio or getattr(pedido, "costo_envio", 500),
        "items": [
            {
                "id": d.id,
                "producto_id": d.producto_id,
                "cantidad": d.cantidad,
                "precio_unitario": d.precio_snapshot,
                "subtotal": d.precio_snapshot * d.cantidad,
                "nombre_snapshot": d.nombre_snapshot,
            }
            for d in detalles
        ],
        "creado_en": pedido.creado_en,
        "actualizado_en": pedido.actualizado_en,
        "direccion_snapshot": getattr(pedido, "direccion_snapshot", None),
    }


# ============================================================================
# TASK 2.4: POST /api/v1/pedidos — Create new pedido
# ============================================================================


@router.post(
    "",
    response_model=PedidoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo pedido",
)
@limiter_pedidos.limit("10/hour")
async def create_pedido(
    request: Request,
    pedido_data: PedidoCreate,
    current_user: Usuario = Depends(get_current_user),
) -> PedidoResponse:
    """Crear nuevo pedido con items.

    Requiere autenticación JWT.
    El total se calcula automáticamente según los precios de los productos.
    Incluye dirección de entrega y forma de pago.
    """
    service = PedidoService()

    # Prepare items for service
    items = [
        {
            "producto_id": item.producto_id,
            "cantidad": item.cantidad,
            "precio_carrito": item.precio_carrito,
            "ingredientes_excluidos": item.ingredientes_excluidos,
        }
        for item in pedido_data.items
    ]

    # Create pedido (atomic via UnitOfWork)
    # Service returns a dict (serialized inside UoW to avoid MissingGreenlet)
    pedido_dict = await service.create_pedido(
        usuario_id=current_user.id,
        items=items,
        direccion_id=pedido_data.direccion_id,
        forma_pago_id=pedido_data.forma_pago_id,
    )

    # Build response with items - service already serialized
    return PedidoResponse(**pedido_dict)


# ============================================================================
# TASK 2.5: GET /api/v1/pedidos — List user's pedidos (paginated)
# ============================================================================


@router.get(
    "",
    response_model=PedidoListResponse,
    summary="Listar pedidos del usuario (paginado)",
)
async def get_pedidos(
    skip: int = Query(0, ge=0, description="Offset para paginación"),
    limit: int = Query(
        20, gt=0, le=1000, description="Limit para paginación (max 1000)"
    ),
    current_user: Usuario = Depends(get_current_user),
) -> PedidoListResponse:
    """Listar todos los pedidos del usuario autenticado con paginación.

    Requiere autenticación JWT.
    """
    service = PedidoService()
    items, total = await service.list_pedidos(
        usuario_id=current_user.id,
        skip=skip,
        limit=limit,
    )

    # Build response items (no items loaded in list view for performance)
    pedido_items = []
    for pedido in items:
        pedido_items.append(
            PedidoResponse(
                id=pedido.id,
                usuario_id=pedido.usuario_id,
                estado=pedido.estado_codigo,  # type: ignore[arg-type]
                total=pedido.total,
                items=[],
                creado_en=pedido.creado_en,  # type: ignore[arg-type]
                actualizado_en=pedido.actualizado_en,  # type: ignore[arg-type]
                costo_envio=getattr(pedido, "costo_envio", 500),
                direccion_snapshot=getattr(pedido, "direccion_snapshot", None),
            )
        )

    return PedidoListResponse(
        items=pedido_items,
        total=total,
        skip=skip,
        limit=limit,
    )


# ============================================================================
# TASK 2.6: GET /api/v1/pedidos/{pedido_id} — Get pedido detail
# ============================================================================


@router.get(
    "/{pedido_id}",
    response_model=PedidoResponse,
    summary="Obtener detalle de pedido",
)
async def get_pedido(
    pedido_id: int = Path(..., gt=0, description="ID del pedido"),
    current_user: Usuario = Depends(get_current_user),
) -> PedidoResponse:
    """Obtener detalles completos de un pedido específico.

    Requiere autenticación JWT.
    Solo el propietario puede ver el detalle.
    """
    service = PedidoService()
    pedido = await service.get_pedido(
        pedido_id=pedido_id,
        usuario_id=current_user.id,
    )

    return PedidoResponse(**_build_pedido_response(pedido))


# ============================================================================
# ETAPA 2: Admin Endpoints (State Transitions, Stock Control)
# ============================================================================

# NOTE: Define BEFORE /{pedido_id} to avoid route capture


@router.post(
    "/{pedido_id}/confirmar",
    response_model=PedidoResponse,
    summary="Confirmar pedido y descontar stock",
)
async def confirmar_pedido(
    pedido_id: int = Path(..., gt=0, description="ID del pedido"),
    current_user: Usuario = Depends(require_role(["ADMIN", "PEDIDOS"])),
) -> PedidoResponse:
    """Confirmar un pedido (PENDIENTE -> CONFIRMADO).

    Esta transición:
    - Valida stock disponible
    - Decrementa el stock de cada producto
    - Registra la transición en historial

    Requiere rol: ADMIN o PEDIDOS
    """
    service = PedidoService()

    # Confirm pedido (with stock decrement) - es_admin=True since require_role validated
    pedido = await service.confirmar_pedido(
        pedido_id=pedido_id,
        usuario_id=current_user.id,
        es_admin=True,
    )

    return PedidoResponse(**_build_pedido_response(pedido))


@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoResponse,
    summary="Cambiar estado del pedido (admin)",
)
async def update_estado_pedido(
    pedido_id: int = Path(..., gt=0, description="ID del pedido"),
    estado_data: PedidoEstadoUpdate = Body(...),
    current_user: Usuario = Depends(require_role(["ADMIN", "PEDIDOS"])),
) -> PedidoResponse:
    """Cambiar el estado de un pedido.

    Validaciones:
    - Solo admins pueden cambiar estados
    - Debe seguir las reglas FSM (transiciones válidas)
    - No se puede modificar desde estados terminales

    Requiere rol: ADMIN o PEDIDOS
    """
    service = PedidoService()

    # Transition state
    pedido = await service.transicionar_estado(
        pedido_id=pedido_id,
        nuevo_estado=estado_data.estado,
        usuario_id=current_user.id,
        es_admin=True,
    )

    return PedidoResponse(**_build_pedido_response(pedido))


@router.get(
    "/admin/todos",
    response_model=PedidoListResponse,
    summary="Listar todos los pedidos (admin)",
)
async def get_todos_pedidos_admin(
    skip: int = Query(0, ge=0, description="Offset para paginación"),
    limit: int = Query(20, gt=0, le=1000, description="Limit para paginación"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> PedidoListResponse:
    """Listar todos los pedidos del sistema (solo admin).

    Incluye filtros opcionales por estado.

    Requiere rol: ADMIN
    """
    service = PedidoService()
    items, total = await service.list_all_pedidos(
        skip=skip,
        limit=limit,
        estado=estado,
    )

    pedido_items = []
    for pedido in items:
        pedido_items.append(
            PedidoResponse(
                id=pedido.id,
                usuario_id=pedido.usuario_id,
                estado=pedido.estado_codigo,  # type: ignore[arg-type]
                total=pedido.total,
                items=[],
                creado_en=pedido.creado_en,  # type: ignore[arg-type]
                actualizado_en=pedido.actualizado_en,  # type: ignore[arg-type]
                costo_envio=getattr(pedido, "costo_envio", 500),
                direccion_snapshot=getattr(pedido, "direccion_snapshot", None),
            )
        )

    return PedidoListResponse(
        items=pedido_items,
        total=total,
        skip=skip,
        limit=limit,
    )


# ============================================================================
# PATCH /pedidos/{pedido_id}/cancelar — Cancel a pedido
# ============================================================================


@router.patch(
    "/{pedido_id}/cancelar",
    response_model=PedidoResponse,
    summary="Cancelar un pedido",
)
async def cancelar_pedido(
    pedido_id: int = Path(..., gt=0, description="ID del pedido"),
    cancel_data: PedidoCancelRequest = Body(...),
    current_user: Usuario = Depends(get_current_user),
) -> PedidoResponse:
    """Cancelar un pedido.

    Validaciones:
    - Cliente puede cancelar sus propios pedidos en estado PENDIENTE
    - Admin puede cancelar pedidos en estados PENDIENTE, CONFIRMADO, EN_PREP
    - No se puede cancelar desde estados terminales (ENTREGADO, CANCELADO)
    - La observación es obligatoria
    - Si el pedido estaba CONFIRMADO o EN_PREP, se restaura el stock

    Requiere autenticación JWT.
    """
    from backend.core.dependencies import require_role

    # Check if user is admin
    es_admin = any(
        rol in ["ADMIN", "PEDIDOS"]
        for rol in getattr(current_user, "roles", [])
    )

    # If admin, validate role
    if es_admin:
        # Re-validate with require_role for admin endpoints
        admin_user = await require_role(["ADMIN", "PEDIDOS"])(current_user)
        es_admin = True
        current_user = admin_user
    else:
        # Regular user - verify ownership happens in service
        es_admin = False

    service = PedidoService()

    # Cancel pedido
    pedido = await service.cancelar_pedido(
        pedido_id=pedido_id,
        observacion=cancel_data.observacion,
        usuario_id=current_user.id,
        es_admin=es_admin,
    )

    return PedidoResponse(**_build_pedido_response(pedido))


# ============================================================================
# GET /pedidos/{pedido_id}/historial — Get state transition history
# ============================================================================


@router.get(
    "/{pedido_id}/historial",
    response_model=HistorialListResponse,
    summary="Obtener historial de estados del pedido",
)
async def get_pedido_historial(
    pedido_id: int = Path(..., gt=0, description="ID del pedido"),
    current_user: Usuario = Depends(get_current_user),
) -> HistorialListResponse:
    """Obtener el historial de cambios de estado de un pedido.

    Muestra todos los cambios de estado en orden cronológico.

    El usuario puede ver el historial de sus propios pedidos.
    Los admins pueden ver el historial de cualquier pedido.

    Requiere autenticación JWT.
    """
    from backend.core.dependencies import require_role

    # Check if user is admin
    es_admin = any(
        rol in ["ADMIN", "PEDIDOS"]
        for rol in getattr(current_user, "roles", [])
    )

    # If admin, validate role
    if es_admin:
        admin_user = await require_role(["ADMIN", "PEDIDOS"])(current_user)
        es_admin = True
        current_user = admin_user

    service = PedidoService()

    # Get history
    historial = await service.obtener_historial(
        pedido_id=pedido_id,
        usuario_id=current_user.id,
        es_admin=es_admin,
    )

    return HistorialListResponse(
        items=[
            HistorialEstadoResponse(
                id=h.id,
                pedido_id=h.pedido_id,
                estado_desde=h.estado_desde,
                estado_nuevo=h.estado_nuevo,
                motivo=h.motivo,
                usuario_id=h.usuario_id,
                created_at=h.created_at,  # type: ignore[arg-type]
            )
            for h in historial
        ],
        total=len(historial),
    )


__all__ = ["router"]