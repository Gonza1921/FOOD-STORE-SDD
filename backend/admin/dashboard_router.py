"""Router — Admin dashboard endpoints.

Endpoints:
- GET /api/v1/admin/dashboard/low-stock — Products below minimum stock threshold
- GET /api/v1/admin/dashboard/recent-orders — Last N orders with customer info
- GET /api/v1/admin/dashboard/recent-customers — Last N registered customers with order count
- GET /api/v1/admin/dashboard/staff-metrics — Kitchen efficiency metrics

All endpoints require **ADMIN** role.
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text

from backend.core.dependencies import require_role
from backend.core.unit_of_work import UnitOfWork

router = APIRouter(prefix="/api/v1/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/low-stock")
async def get_low_stock(
    current_user=Depends(require_role(["ADMIN"])),
) -> list[dict]:
    """Return products whose stock is below the minimum threshold.

    Severity is calculated as:
    - ``critica``: stock ≤ 50 % of minimum
    - ``media``:   stock between 51 % and 99 % of minimum
    """
    async with UnitOfWork() as uow:
        result = await uow.session.execute(
            text("""
                SELECT
                    p.id,
                    p.nombre,
                    p.stock_cantidad,
                    p.stock_minimo,
                    CASE
                        WHEN p.stock_cantidad * 1.0 / NULLIF(p.stock_minimo, 0) <= 0.5
                        THEN 'critica'
                        ELSE 'media'
                    END AS severidad,
                    CAST(
                        (p.stock_cantidad * 100.0 / NULLIF(p.stock_minimo, 0)) AS INTEGER
                    ) AS porcentaje
                FROM producto p
                WHERE p.stock_cantidad < p.stock_minimo
                  AND p.deleted_at IS NULL
                ORDER BY (p.stock_cantidad * 1.0 / NULLIF(p.stock_minimo, 0)) ASC
            """)
        )
        return [
            {
                "id": row[0],
                "nombre": row[1],
                "stock_cantidad": row[2],
                "stock_minimo": row[3],
                "severidad": row[4],
                "porcentaje": row[5],
            }
            for row in result.fetchall()
        ]


@router.get("/recent-orders")
async def get_recent_orders(
    limit: int = Query(10, ge=1, le=100, description="Number of orders to return"),
    current_user=Depends(require_role(["ADMIN"])),
) -> list[dict]:
    """Return the last *N* orders with the customer's full name."""
    async with UnitOfWork() as uow:
        result = await uow.session.execute(
            text("""
                SELECT
                    p.id,
                    u.nombre || ' ' || u.apellido AS cliente_nombre,
                    p.total,
                    p.estado_codigo,
                    p.creado_en
                FROM pedido p
                JOIN usuario u ON u.id = p.usuario_id
                ORDER BY p.creado_en DESC
                LIMIT :limit
            """),
            {"limit": limit},
        )
        return [
            {
                "id": row[0],
                "cliente_nombre": row[1],
                "total": float(row[2]),
                "estado_codigo": row[3],
                "creado_en": row[4].isoformat() if row[4] else None,
            }
            for row in result.fetchall()
        ]


@router.get("/recent-customers")
async def get_recent_customers(
    limit: int = Query(10, ge=1, le=100, description="Number of customers to return"),
    current_user=Depends(require_role(["ADMIN"])),
) -> list[dict]:
    """Return the last *N* registered customers (role = CLIENT) with their
    total order count."""
    async with UnitOfWork() as uow:
        result = await uow.session.execute(
            text("""
                SELECT
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.email,
                    u.creado_en,
                    COUNT(pe.id) AS total_ordenes
                FROM usuario u
                JOIN usuario_rol ur ON ur.usuario_id = u.id
                JOIN rol r ON r.codigo = ur.rol_codigo
                LEFT JOIN pedido pe ON pe.usuario_id = u.id
                WHERE r.codigo = 'CLIENT'
                  AND u.deleted_at IS NULL
                GROUP BY u.id, u.nombre, u.apellido, u.email, u.creado_en
                ORDER BY u.creado_en DESC
                LIMIT :limit
            """),
            {"limit": limit},
        )
        return [
            {
                "id": row[0],
                "nombre": f"{row[1]} {row[2]}",
                "email": row[3],
                "creado_en": row[4].isoformat() if row[4] else None,
                "total_ordenes": row[5],
            }
            for row in result.fetchall()
        ]


@router.get("/staff-metrics")
async def get_staff_metrics(
    periodo: str = Query(
        "7d",
        description="Analysis period (e.g. ``7d``, ``30d``, ``24h``)",
    ),
    current_user=Depends(require_role(["ADMIN"])),
) -> dict:
    """Return kitchen / staff efficiency metrics for the given period.

    Metrics:
    - **tiempo_promedio_preparacion**: average minutes from order creation to delivery.
    - **ordenes_completadas_hoy**: count of ``ENTREGADO`` orders placed today.
    - **horas_pico**: top 4 hours (0-23) with the most orders in the period.
    - **tendencia**: percentage change in completed orders vs. the previous period.
    """
    # Parse period string → timedelta
    now = datetime.utcnow()
    if periodo.endswith("d"):
        delta = timedelta(days=int(periodo[:-1]))
    elif periodo.endswith("h"):
        delta = timedelta(hours=int(periodo[:-1]))
    else:
        delta = timedelta(days=7)

    start = now - delta
    prev_start = start - delta

    async with UnitOfWork() as uow:
        # 1) Average preparation time (minutes) for orders delivered in period
        tiempo_row = await uow.session.execute(
            text("""
                SELECT COALESCE(
                    AVG(
                        EXTRACT(EPOCH FROM (p.entregado_en - p.creado_en)) / 60.0
                    ), 0
                ) AS promedio_minutos
                FROM pedido p
                WHERE p.estado_codigo = 'ENTREGADO'
                  AND p.entregado_en IS NOT NULL
                  AND p.creado_en IS NOT NULL
                  AND p.creado_en >= :start
            """),
            {"start": start},
        )
        tiempo_promedio = tiempo_row.scalar() or 0

        # 2) Orders completed today
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        hoy_row = await uow.session.execute(
            text("""
                SELECT COUNT(*)
                FROM pedido p
                WHERE p.estado_codigo = 'ENTREGADO'
                  AND p.entregado_en >= :today_start
            """),
            {"today_start": today_start},
        )
        ordenes_hoy = hoy_row.scalar() or 0

        # 3) Peak hours — top 4 hours by order count
        horas_row = await uow.session.execute(
            text("""
                SELECT EXTRACT(HOUR FROM p.creado_en) AS hora, COUNT(*) AS total
                FROM pedido p
                WHERE p.creado_en >= :start
                GROUP BY EXTRACT(HOUR FROM p.creado_en)
                ORDER BY total DESC
                LIMIT 4
            """),
            {"start": start},
        )
        horas_pico = sorted(int(row[0]) for row in horas_row.fetchall())

        # 4) Trend — % change vs previous period
        current_row = await uow.session.execute(
            text("""
                SELECT COUNT(*) FROM pedido
                WHERE estado_codigo = 'ENTREGADO'
                  AND creado_en >= :start
            """),
            {"start": start},
        )
        current_count = current_row.scalar() or 0

        prev_row = await uow.session.execute(
            text("""
                SELECT COUNT(*) FROM pedido
                WHERE estado_codigo = 'ENTREGADO'
                  AND creado_en >= :prev_start
                  AND creado_en < :start
            """),
            {"prev_start": prev_start, "start": start},
        )
        previous_count = prev_row.scalar() or 0

        if previous_count > 0:
            tendencia = round(
                ((current_count - previous_count) / previous_count) * 100, 1
            )
        else:
            tendencia = 0.0 if current_count == 0 else 100.0

    return {
        "tiempo_promedio_preparacion": round(float(tiempo_promedio), 1),
        "ordenes_completadas_hoy": ordenes_hoy,
        "horas_pico": horas_pico,
        "tendencia": tendencia,
    }
