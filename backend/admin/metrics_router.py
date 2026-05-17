"""Router — Advanced admin metrics endpoints.

Endpoints:
- GET /api/v1/admin/metricas/productos-top — Top N best-selling products
- GET /api/v1/admin/metricas/ventas — Sales aggregation by period

Requires ADMIN role. Under feature flag ff_admin_metricas_avanzadas.
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.admin.schemas import TopProductosResponse, VentasPeriodoResponse
from backend.admin.metrics_service import MetricsService
from backend.core.config import settings
from backend.core.dependencies import require_role

router = APIRouter(prefix="/api/v1/admin/metricas", tags=["Admin Metrics Avanzadas"])


@router.get(
    "/productos-top",
    response_model=TopProductosResponse,
    summary="Top productos más vendidos",
)
async def get_top_productos(
    limite: int = Query(10, ge=1, le=50, description="Cantidad máxima de productos (max 50)"),
    current_user=Depends(require_role(["ADMIN"])),
) -> TopProductosResponse:
    """Obtener los N productos más vendidos.

    Solo considera pedidos en estado CONFIRMADO o ENTREGADO.
    Requiere rol: ADMIN.
    """
    if not settings.ff_admin_metricas_avanzadas:
        raise HTTPException(status_code=404, detail="Endpoint no disponible")

    service = MetricsService()
    return await service.get_top_productos(limite=limite)


@router.get(
    "/ventas",
    response_model=VentasPeriodoResponse,
    summary="Ventas por período",
)
async def get_ventas_periodo(
    desde: date = Query(..., description="Fecha de inicio (ISO, ej: 2026-01-01)"),
    hasta: date = Query(..., description="Fecha de fin (ISO, ej: 2026-12-31)"),
    granularidad: str = Query("day", description="Agrupación: day, week, month"),
    current_user=Depends(require_role(["ADMIN"])),
) -> VentasPeriodoResponse:
    """Obtener ventas agregadas por período.

    Solo considera pedidos en estado CONFIRMADO o ENTREGADO.
    Requiere rol: ADMIN.
    """
    if not settings.ff_admin_metricas_avanzadas:
        raise HTTPException(status_code=404, detail="Endpoint no disponible")

    if granularidad not in ("day", "week", "month"):
        raise HTTPException(
            status_code=422,
            detail=f"Granularidad '{granularidad}' no válida. Debe ser: day, week, month",
        )

    if hasta < desde:
        raise HTTPException(
            status_code=422,
            detail="'hasta' debe ser posterior o igual a 'desde'",
        )

    service = MetricsService()

    try:
        return await service.get_ventas_periodo(
            desde=desde,
            hasta=hasta,
            granularidad=granularidad,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
