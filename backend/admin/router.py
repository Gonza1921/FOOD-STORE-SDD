from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, text

from backend.core.dependencies import require_role
from backend.core.unit_of_work import UnitOfWork
from backend.models.pedido import Pedido, EstadoPedido
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
        fecha_30_dias = datetime.utcnow() - timedelta(days=30)
        fecha_7_dias = datetime.utcnow() - timedelta(days=7)

        # Total de pedidos
        total_pedidos = await uow.session.scalar(select(func.count(Pedido.id)))

        # Pedidos pendientes
        pendiente = await uow.session.scalar(
            select(func.count(Pedido.id)).where(Pedido.estado == EstadoPedido.PENDIENTE)
        )

        # Ingresos totales (ENTREGADO + CONFIRMADO)
        ingresos_result = await uow.session.execute(
            select(func.sum(Pedido.total)).where(
                Pedido.estado.in_([EstadoPedido.ENTREGADO, EstadoPedido.CONFIRMADO])
            )
        )
        ingresos_totales = ingresos_result.scalar() or 0

        # Productos con stock bajo (<=10)
        stock_bajo = await uow.session.scalar(
            select(func.count(Producto.id)).where(Producto.stock_cantidad <= 10)
        )

        # Distribución por estado
        estado_dist = await uow.session.execute(
            select(Pedido.estado, func.count(Pedido.id)).group_by(Pedido.estado)
        )
        pedidos_por_estado = {row[0].value: row[1] for row in estado_dist.fetchall()}

        # Ingresos por día - últimos 30 días
        ingresos_dia_result = await uow.session.execute(
            select(
                func.date(Pedido.creado_en).label("fecha"),
                func.sum(Pedido.total).label("total"),
            ).where(
                Pedido.estado.in_([EstadoPedido.ENTREGADO, EstadoPedido.CONFIRMADO]),
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

    return {
        "totalPedidos": total_pedidos or 0,
        "pedidosPendientes": pendiente or 0,
        "ingresosTotales": float(ingresos_totales),
        "productosStockBajo": stock_bajo or 0,
        "pedidosPorEstado": pedidos_por_estado,
        "ingresosPorDia": ingresos_por_dia,
        "tendenciaPedidos": tendencia_pedidos,
    }