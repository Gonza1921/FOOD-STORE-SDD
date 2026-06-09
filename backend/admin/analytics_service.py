"""AnalyticsService — full dashboard analytics for admin panel.

Provides:
- get_dashboard(periodo) — complete dashboard snapshot

Architecture: Router → Service → UnitOfWork → Query
"""

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select, text

from backend.admin.analytics_schemas import (
    CategoriaMasVendida,
    DashboardAnalyticsResponse,
    ProductoMasVendido,
    VentasPorDia,
    VentasPorMes,
)
from backend.core.unit_of_work import UnitOfWork
from backend.models.pedido import DetallePedido, Pedido
from backend.models.usuario import Usuario

STATES_SALE = ("CONFIRMADO", "ENTREGADO")
VALID_PERIODOS = {"7d", "30d", "90d", "1y"}


class AnalyticsService:

    async def get_dashboard(self, periodo: str = "30d") -> DashboardAnalyticsResponse:
        """Full dashboard analytics snapshot.

        Args:
            periodo: Window for daily metrics — "7d", "30d", "90d", "1y".

        Returns:
            DashboardAnalyticsResponse with all aggregate metrics.
        """
        if periodo not in VALID_PERIODOS:
            periodo = "30d"

        now = datetime.utcnow()

        if periodo == "7d":
            desde = now - timedelta(days=7)
        elif periodo == "90d":
            desde = now - timedelta(days=90)
        elif periodo == "1y":
            desde = now - timedelta(days=365)
        else:
            desde = now - timedelta(days=30)

        inicio_mes = datetime(now.year, now.month, 1)

        async with UnitOfWork() as uow:

            # -- Ventas totales --
            ventas_totales = (
                await uow.session.scalar(
                    select(func.coalesce(func.sum(Pedido.total), 0)).where(
                        Pedido.estado_codigo.in_(STATES_SALE)
                    )
                )
            ) or Decimal("0")

            # -- Ventas del mes actual --
            ventas_mes = (
                await uow.session.scalar(
                    select(func.coalesce(func.sum(Pedido.total), 0)).where(
                        Pedido.estado_codigo.in_(STATES_SALE),
                        Pedido.creado_en >= inicio_mes,
                    )
                )
            ) or Decimal("0")

            # -- Pedidos totales --
            pedidos_totales = (
                await uow.session.scalar(select(func.count(Pedido.id)))
            ) or 0

            # -- Pedidos pendientes --
            pedidos_pendientes = (
                await uow.session.scalar(
                    select(func.count(Pedido.id)).where(
                        Pedido.estado_codigo == "PENDIENTE"
                    )
                )
            ) or 0

            # -- Pedidos pagados (CONFIRMADO) --
            pedidos_pagados = (
                await uow.session.scalar(
                    select(func.count(Pedido.id)).where(
                        Pedido.estado_codigo == "CONFIRMADO"
                    )
                )
            ) or 0

            # -- Usuarios totales (activos) --
            usuarios_totales = (
                await uow.session.scalar(
                    select(func.count(Usuario.id)).where(Usuario.deleted_at.is_(None))
                )
            ) or 0

            # -- Productos totales (activos) --
            from backend.models.producto import Producto

            productos_totales = (
                await uow.session.scalar(
                    select(func.count(Producto.id)).where(
                        Producto.deleted_at.is_(None)
                    )
                )
            ) or 0

            # -- Ticket promedio --
            ticket_promedio = (
                await uow.session.scalar(
                    select(func.coalesce(func.avg(Pedido.total), 0)).where(
                        Pedido.estado_codigo.in_(STATES_SALE)
                    )
                )
            ) or Decimal("0")

            # -- Ventas por mes (últimos 12 meses) --
            stmt_ventas_mes = select(
                func.to_char(Pedido.creado_en, "YYYY-MM").label("mes"),
                func.coalesce(func.sum(Pedido.total), 0).label("total"),
            ).where(
                Pedido.estado_codigo.in_(STATES_SALE),
                Pedido.creado_en >= now - timedelta(days=365),
            ).group_by(text("mes")).order_by(text("mes"))

            result = await uow.session.execute(stmt_ventas_mes)
            ventas_por_mes = [
                VentasPorMes(mes=row.mes, total=Decimal(str(row.total)))
                for row in result.fetchall()
            ]

            # -- Ventas por día (período seleccionado) --
            stmt_ventas_dia = select(
                func.date(Pedido.creado_en).label("fecha"),
                func.coalesce(func.sum(Pedido.total), 0).label("total"),
            ).where(
                Pedido.estado_codigo.in_(STATES_SALE),
                Pedido.creado_en >= desde,
            ).group_by(text("fecha")).order_by(text("fecha"))

            result = await uow.session.execute(stmt_ventas_dia)
            ventas_por_dia = [
                VentasPorDia(fecha=row.fecha, total=Decimal(str(row.total)))
                for row in result.fetchall()
            ]

            # -- Productos más vendidos (TOP 10) --
            subq = select(
                DetallePedido.producto_id,
                func.sum(DetallePedido.cantidad).label("cantidad"),
            ).join(
                Pedido, DetallePedido.pedido_id == Pedido.id
            ).where(
                Pedido.estado_codigo.in_(STATES_SALE)
            ).group_by(
                DetallePedido.producto_id
            ).order_by(
                text("cantidad DESC")
            ).limit(10).subquery()

            stmt_top_productos = select(
                Producto.nombre,
                subq.c.cantidad,
            ).select_from(subq).join(
                Producto, subq.c.producto_id == Producto.id
            ).where(
                Producto.deleted_at.is_(None)
            ).order_by(subq.c.cantidad.desc())

            result = await uow.session.execute(stmt_top_productos)
            productos_mas_vendidos = [
                ProductoMasVendido(producto=row.nombre, cantidad=int(row.cantidad))
                for row in result.fetchall()
            ]

            # -- Categorías más vendidas (TOP 10) --
            from backend.models.categoria import Categoria
            from backend.models.producto_categoria import ProductoCategoria

            stmt_top_categorias = select(
                Categoria.nombre,
                func.coalesce(func.sum(DetallePedido.cantidad), 0).label("cantidad"),
            ).select_from(DetallePedido).join(
                Pedido, DetallePedido.pedido_id == Pedido.id
            ).join(
                ProductoCategoria,
                DetallePedido.producto_id == ProductoCategoria.producto_id,
            ).join(
                Categoria, ProductoCategoria.categoria_id == Categoria.id
            ).where(
                Pedido.estado_codigo.in_(STATES_SALE),
                Categoria.deleted_at.is_(None),
            ).group_by(
                Categoria.id, Categoria.nombre
            ).order_by(
                text("cantidad DESC")
            ).limit(10)

            result = await uow.session.execute(stmt_top_categorias)
            categorias_mas_vendidas = [
                CategoriaMasVendida(
                    categoria=row.nombre, cantidad=int(row.cantidad)
                )
                for row in result.fetchall()
            ]

        return DashboardAnalyticsResponse(
            ventas_totales=ventas_totales,
            ventas_mes=ventas_mes,
            pedidos_totales=pedidos_totales,
            pedidos_pendientes=pedidos_pendientes,
            pedidos_pagados=pedidos_pagados,
            usuarios_totales=usuarios_totales,
            productos_totales=productos_totales,
            ticket_promedio=ticket_promedio,
            ventas_por_mes=ventas_por_mes,
            ventas_por_dia=ventas_por_dia,
            productos_mas_vendidos=productos_mas_vendidos,
            categorias_mas_vendidas=categorias_mas_vendidas,
        )
