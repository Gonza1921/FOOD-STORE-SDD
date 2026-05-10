"""Health check router"""

from datetime import datetime

from fastapi import APIRouter

from core.database import check_database_health
from models.base import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Check application and database health status",
)
def health_check() -> HealthResponse:
    """
    Health check endpoint.

    Returns:
        HealthResponse with application and database status
    """
    db_health = check_database_health()

    status = "ok" if db_health else "degraded"

    return HealthResponse(
        status=status,
        timestamp=datetime.utcnow(),
        database=db_health,
    )
