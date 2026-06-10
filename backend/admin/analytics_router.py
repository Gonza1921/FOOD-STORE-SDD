"""Router — Admin analytics dashboard endpoint.

Endpoints:
- GET /api/v1/admin/analytics/dashboard — Full dashboard analytics

Requires ADMIN role.
"""

from fastapi import APIRouter, Depends, Query

from backend.admin.analytics_schemas import DashboardAnalyticsResponse
from backend.admin.analytics_service import AnalyticsService
from backend.core.dependencies import require_role

router = APIRouter(prefix="/api/v1/admin/analytics", tags=["Admin Analytics"])


@router.get(
    "/dashboard",
    response_model=DashboardAnalyticsResponse,
    summary="Dashboard completo de analytics",
)
async def get_dashboard_analytics(
    periodo: str = Query("30d", description="Período: 7d, 30d, 90d, 1y"),
    current_user=Depends(require_role(["ADMIN"])),
) -> DashboardAnalyticsResponse:
    """Obtener métricas completas del dashboard.

    Incluye cards superiores, ventas por período, productos más vendidos
    y categorías más vendidas.
    Requiere rol: ADMIN.
    """
    if periodo not in ("7d", "30d", "90d", "1y"):
        periodo = "30d"

    service = AnalyticsService()
    return await service.get_dashboard(periodo=periodo)
