"""MetricsService — advanced admin metrics for dashboard widgets.

Provides:
- get_top_productos(limite) — top N best-selling products
- get_ventas_periodo(desde, hasta, granularidad) — sales aggregation by period

Architecture: Router → Service → UnitOfWork → Query
Matches admin/metrics router pattern.
"""

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy import select, func, text

from backend.admin.schemas import TopProductoItem, TopProductosResponse, VentasPeriodoItem, VentasPeriodoResponse
from backend.core.config import settings
from backend.core.unit_of_work import UnitOfWork
from backend.models.pedido import Pedido, DetallePedido


VALID_GRANULARITIES = {"day", "week", "month"}


class MetricsService:

    async def get_top_productos(self, limite: int = 10) -> TopProductosResponse:
        """Get top N best-selling products by total quantity sold.

        Only considers pedidos in CONFIRMADO or ENTREGADO state.
        """
        async with UnitOfWork() as uow:
            # SUM cantidad from DetallePedido grouped by producto_id
            # Only include pedidos that are CONFIRMADO or ENTREGADO
            STATES_SALE = ("CONFIRMADO", "ENTREGADO")

            subq = (
                select(
                    DetallePedido.producto_id,
                    func.sum(DetallePedido.cantidad).label("total_vendido"),
                )
                .join(Pedido, DetallePedido.pedido_id == Pedido.id)
                .where(
                    Pedido.estado_codigo.in_(STATES_SALE)
                )
                .group_by(DetallePedido.producto_id)
                .order_by(text("total_vendido DESC"))
                .limit(limite)
                .subquery()
            )

            # Join with Producto to get nombre and precio_base
            from backend.models.producto import Producto

            stmt = (
                select(
                    Producto.id,
                    Producto.nombre,
                    Producto.precio_base,
                    subq.c.total_vendido,
                )
                .select_from(subq)
                .join(Producto, subq.c.producto_id == Producto.id)
                .where(Producto.deleted_at.is_(None))
                .order_by(subq.c.total_vendido.desc())
            )

            result = await uow.session.execute(stmt)
            rows = result.fetchall()

            items = [
                TopProductoItem(
                    id=row.id,
                    nombre=row.nombre,
                    total_vendido=int(row.total_vendido),
                    precio_base=row.precio_base,
                )
                for row in rows
            ]

            total_distinct = len(items)

            return TopProductosResponse(items=items, total=total_distinct)

    async def get_ventas_periodo(
        self,
        desde: date,
        hasta: date,
        granularidad: str = "day",
    ) -> VentasPeriodoResponse:
        """Get sales aggregated by period with specified granularity.

        Args:
            desde: Start date (inclusive).
            hasta: End date (inclusive).
            granularidad: One of 'day', 'week', 'month'.

        Returns:
            VentasPeriodoResponse with aggregated sales data.
        """
        if granularidad not in VALID_GRANULARITIES:
            raise ValueError(
                f"Granularidad '{granularidad}' no válida. "
                f"Debe ser una de: {', '.join(sorted(VALID_GRANULARITIES))}"
            )

        if hasta < desde:
            raise ValueError("'hasta' debe ser posterior o igual a 'desde'")

        # Map granularidad to PostgreSQL DATE_TRUNC argument
        trunc_arg = {"day": "day", "week": "week", "month": "month"}[granularidad]

        async with UnitOfWork() as uow:
            # Aggregate sales by truncated period
            # Only CONFIRMADO and ENTREGADO states count as sales
            STATES_SALE = ("CONFIRMADO", "ENTREGADO")

            stmt = (
                select(
                    func.date_trunc(trunc_arg, Pedido.creado_en).label("periodo"),
                    func.sum(Pedido.total).label("total_ventas"),
                    func.count(Pedido.id).label("cantidad_pedidos"),
                )
                .where(
                    Pedido.estado_codigo.in_(STATES_SALE),
                    func.date(Pedido.creado_en) >= desde,
                    func.date(Pedido.creado_en) <= hasta,
                )
                .group_by(text("periodo"))
                .order_by(text("periodo ASC"))
            )

            result = await uow.session.execute(stmt)
            rows = result.fetchall()

            items = []
            total_ventas = Decimal("0")

            for row in rows:
                periodo_date: datetime = row.periodo
                total_ventas_periodo = Decimal(str(row.total_ventas or 0))
                cantidad = int(row.cantidad_pedidos or 0)

                items.append(
                    VentasPeriodoItem(
                        periodo=periodo_date.date(),
                        total_ventas=total_ventas_periodo,
                        cantidad_pedidos=cantidad,
                    )
                )
                total_ventas += total_ventas_periodo

            return VentasPeriodoResponse(
                items=items,
                total_ventas=total_ventas,
                desde=desde,
                hasta=hasta,
                granularidad=granularidad,
            )
