from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, text

from backend.core.dependencies import require_role
from backend.core.unit_of_work import UnitOfWork
from backend.models.pedido import Pedido
from backend.models.producto import Producto

router = APIRouter(prefix="/admin/metrics", tags=["Admin Metrics"])


@router.get("")
async def get_metrics(
    current_user = Depends(require_role(["ADMIN"])),
) -> dict:
    """
    Devuelve métricas del dashboard del admin:
    - Total de pedidos
    - Pedidos pendientes
    - Ingresos totales (pedidos en estado ENTREGADO o CONFIRMADO)
    - Productos con stock bajo (<=10)
    - Distribución de pedidos por estado
    - Ingresos por día (últimos 30 días)
    - Tendencia de pedidos (últimos 7 días)
    """
    async with UnitOfWork() as uow:
        # Calcular fechas para los últimos 30 y 7 días
        ahora = datetime.utcnow()
        fecha_30_dias = ahora - timedelta(days=30)
        fecha_7_dias = ahora - timedelta(days=7)
        fecha_60_dias = ahora - timedelta(days=60)

        # Total de pedidos
        total_pedidos = await uow.session.scalar(select(func.count(Pedido.id)))

        # Pedidos pendientes
        pendiente = await uow.session.scalar(
            select(func.count(Pedido.id)).where(Pedido.estado_codigo == "PENDIENTE")
        )

        # Ingresos totales (ENTREGADO + CONFIRMADO)
        ingresos_result = await uow.session.execute(
            select(func.sum(Pedido.total)).where(
                Pedido.estado_codigo.in_(["ENTREGADO", "CONFIRMADO"])
            )
        )
        ingresos_totales = ingresos_result.scalar() or 0

        # Productos con stock bajo (<= stock_minimo)
        stock_bajo = await uow.session.scalar(
            select(func.count(Producto.id)).where(
                Producto.stock_cantidad <= Producto.stock_minimo
            )
        )

        # Distribución por estado - use raw SQL for clarity
        estado_dist = await uow.session.execute(
            text("""
                SELECT estado_codigo, COUNT(*) as count
                FROM pedido
                GROUP BY estado_codigo
            """)
        )
        pedidos_por_estado = {row[0]: row[1] for row in estado_dist.fetchall()}

        # Ingresos por día - últimos 30 días
        ingresos_dia_result = await uow.session.execute(
            select(
                func.date(Pedido.creado_en).label("fecha"),
                func.sum(Pedido.total).label("total"),
            ).where(
                Pedido.estado_codigo.in_(["ENTREGADO", "CONFIRMADO"]),
                Pedido.creado_en >= fecha_30_dias,
            ).group_by(func.date(Pedido.creado_en)).order_by(func.date(Pedido.creado_en))
        )
        ingresos_por_dia = [
            {"fecha": str(row[0]), "total": float(row[1] or 0)}
            for row in ingresos_dia_result.fetchall()
        ]

        # Tendencia de pedidos - últimos 7 días
        tendencia_result = await uow.session.execute(
            select(
                func.date(Pedido.creado_en).label("fecha"),
                func.count(Pedido.id).label("total"),
            ).where(
                Pedido.creado_en >= fecha_7_dias,
            ).group_by(func.date(Pedido.creado_en)).order_by(func.date(Pedido.creado_en))
        )
        tendencia_pedidos = [
            {"fecha": str(row[0]), "total": row[1]}
            for row in tendencia_result.fetchall()
        ]

        # --- Enhanced metrics ---

        # Total clientes (role CLIENT via M:N)
        total_clientes_row = await uow.session.execute(
            text("""
                SELECT COUNT(DISTINCT u.id)
                FROM usuario u
                JOIN usuario_rol ur ON ur.usuario_id = u.id
                JOIN rol r ON r.codigo = ur.rol_codigo
                WHERE r.codigo = 'CLIENT'
                  AND u.deleted_at IS NULL
            """)
        )
        total_clientes = total_clientes_row.scalar() or 0

        # Ticket promedio
        ticket_promedio = (
            round(float(ingresos_totales) / total_pedidos, 2)
            if total_pedidos and total_pedidos > 0
            else 0.0
        )

        # --- Period-over-period tendencias ---

        async def _period_metrics(
            since: datetime, until: datetime,
        ) -> tuple[int, float, int, float]:
            """Return (pedidos, ingresos, clientes, ticket_promedio) for a date range."""
            # Pedidos count
            p_result = await uow.session.execute(
                text("""
                    SELECT COUNT(*) FROM pedido
                    WHERE creado_en >= :since AND creado_en < :until
                """),
                {"since": since, "until": until},
            )
            p_val = p_result.scalar() or 0

            # Ingresos sum
            i_result = await uow.session.execute(
                text("""
                    SELECT COALESCE(SUM(total), 0) FROM pedido
                    WHERE estado_codigo IN ('ENTREGADO', 'CONFIRMADO')
                      AND creado_en >= :since AND creado_en < :until
                """),
                {"since": since, "until": until},
            )
            i_val = float(i_result.scalar() or 0)

            # New clients (CLIENT role) registered in range
            c_result = await uow.session.execute(
                text("""
                    SELECT COUNT(DISTINCT u.id)
                    FROM usuario u
                    JOIN usuario_rol ur ON ur.usuario_id = u.id
                    JOIN rol r ON r.codigo = ur.rol_codigo
                    WHERE r.codigo = 'CLIENT'
                      AND u.deleted_at IS NULL
                      AND u.creado_en >= :since
                      AND u.creado_en < :until
                """),
                {"since": since, "until": until},
            )
            c_val = c_result.scalar() or 0

            # Ticket promedio
            tp_val = round(i_val / p_val, 2) if p_val > 0 else 0.0

            return p_val, i_val, c_val, tp_val

        # Current period: last 30 days
        p_cur, i_cur, c_cur, tp_cur = await _period_metrics(fecha_30_dias, ahora)
        # Previous period: 30-60 days ago
        p_prev, i_prev, c_prev, tp_prev = await _period_metrics(fecha_60_dias, fecha_30_dias)

        def pct_change(current: float, previous: float) -> float:
            if previous > 0:
                return round(((current - previous) / previous) * 100, 1)
            return 0.0 if current == 0 else 100.0

        tendencias = {
            "pedidos": {
                "valor": p_cur,
                "anterior": p_prev,
                "cambio": pct_change(p_cur, p_prev),
            },
            "ingresos": {
                "valor": i_cur,
                "anterior": i_prev,
                "cambio": pct_change(i_cur, i_prev),
            },
            "clientes": {
                "valor": c_cur,
                "anterior": c_prev,
                "cambio": pct_change(c_cur, c_prev),
            },
            "ticketPromedio": {
                "valor": tp_cur,
                "anterior": tp_prev,
                "cambio": pct_change(tp_cur, tp_prev),
            },
        }

    return {
        "totalPedidos": total_pedidos or 0,
        "pedidosPendientes": pendiente or 0,
        "ingresosTotales": float(ingresos_totales),
        "productosStockBajo": stock_bajo or 0,
        "pedidosPorEstado": pedidos_por_estado,
        "ingresosPorDia": ingresos_por_dia,
        "tendenciaPedidos": tendencia_pedidos,
        "totalClientes": total_clientes,
        "ticketPromedio": ticket_promedio,
        "tendencias": tendencias,
    }