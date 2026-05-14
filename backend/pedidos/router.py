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

from fastapi import APIRouter, Depends, Query, Path, Body, status

from backend.core.dependencies import get_current_user, require_role
from backend.models.usuario import Usuario
from .schemas import (
    PedidoCreate,
    PedidoResponse,
    PedidoListResponse,
    PedidoEstadoUpdate,
    PedidoTransicionResponse,
    PedidoSummary,
)
from .service import PedidoService


# ============================================================================
# Router Setup
# ============================================================================

router = APIRouter(prefix="/api/v1/pedidos", tags=["Pedidos"])


# ============================================================================
# TASK 2.4: POST /api/v1/pedidos — Create new pedido
# ============================================================================


@router.post(
    "",
    response_model=PedidoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo pedido",
)
async def create_pedido(
    pedido_data: PedidoCreate,
    current_user: Usuario = Depends(get_current_user),
) -> PedidoResponse:
    """Crear nuevo pedido con items.

    Requiere autenticación JWT.
    El total se calcula automáticamente según los precios de los productos.
    """
    service = PedidoService()

    # Prepare items for service
    items = [
        {"producto_id": item.producto_id, "cantidad": item.cantidad}
        for item in pedido_data.items
    ]

    # Create pedido (atomic via UnitOfWork)
    pedido = await service.create_pedido(
        usuario_id=current_user.id,
        items=items,
    )

    # Build response with items
    return PedidoResponse(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        estado=pedido.estado_codigo,  # type: ignore[arg-type]
        total=pedido.total,
        items=[
            {
                "id": detalle.id,
                "producto_id": detalle.producto_id,
                "cantidad": detalle.cantidad,
                "precio_unitario": detalle.precio_snapshot,
                "subtotal": detalle.precio_snapshot * detalle.cantidad,
            }
            for detalle in getattr(pedido, "detalles", [])
        ],
        creado_en=pedido.creado_en,  # type: ignore[arg-type]
        actualizado_en=pedido.actualizado_en,  # type: ignore[arg-type]
    )


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

    # Build response items
    pedido_items = []
    for pedido in items:
        pedido_items.append(
            PedidoResponse(
                id=pedido.id,
                usuario_id=pedido.usuario_id,
                estado=pedido.estado_codigo,  # type: ignore[arg-type]
                total=pedido.total,
                items=[],  # No items loaded in list view for performance
                creado_en=pedido.creado_en,  # type: ignore[arg-type]
                actualizado_en=pedido.actualizado_en,  # type: ignore[arg-type]
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

    # Get items
    detalles = getattr(pedido, "detalles", [])

    return PedidoResponse(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        estado=pedido.estado_codigo,  # type: ignore[arg-type]
        total=pedido.total,
        items=[
            {
                "id": detalle.id,
                "producto_id": detalle.producto_id,
                "cantidad": detalle.cantidad,
                "precio_unitario": detalle.precio_snapshot,
                "subtotal": detalle.precio_snapshot * detalle.cantidad,
            }
            for detalle in detalles
        ],
        creado_en=pedido.creado_en,  # type: ignore[arg-type]
        actualizado_en=pedido.actualizado_en,  # type: ignore[arg-type]
    )


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

    detalles = getattr(pedido, "detalles", [])

    return PedidoResponse(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        estado=pedido.estado_codigo,  # type: ignore[arg-type]
        total=pedido.total,
        items=[
            {
                "id": detalle.id,
                "producto_id": detalle.producto_id,
                "cantidad": detalle.cantidad,
                "precio_unitario": detalle.precio_snapshot,
                "subtotal": detalle.precio_snapshot * detalle.cantidad,
            }
            for detalle in detalles
        ],
        creado_en=pedido.creado_en,  # type: ignore[arg-type]
        actualizado_en=pedido.actualizado_en,  # type: ignore[arg-type]
    )


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

    detalles = getattr(pedido, "detalles", [])

    return PedidoResponse(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        estado=pedido.estado_codigo,  # type: ignore[arg-type]
        total=pedido.total,
        items=[
            {
                "id": detalle.id,
                "producto_id": detalle.producto_id,
                "cantidad": detalle.cantidad,
                "precio_unitario": detalle.precio_snapshot,
                "subtotal": detalle.precio_snapshot * detalle.cantidad,
            }
            for detalle in detalles
        ],
        creado_en=pedido.creado_en,  # type: ignore[arg-type]
        actualizado_en=pedido.actualizado_en,  # type: ignore[arg-type]
    )


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
            )
        )

    return PedidoListResponse(
        items=pedido_items,
        total=total,
        skip=skip,
        limit=limit,
    )


__all__ = ["router"]