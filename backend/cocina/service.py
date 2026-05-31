"""CocinaService — business logic for the Kitchen Display System (KDS).

Provides:
- ``get_pedidos_cocina()``: Fetch active kitchen orders (CONFIRMADO, EN_PREP)
  ordered by time-in-state (oldest first), with items and client info.
- ``toggle_disponibilidad()``: Toggle product availability (PATCH endpoint).
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import select

from backend.core.unit_of_work import UnitOfWork
from backend.models.pedido import (
    DetallePedido,
    HistorialEstadoPedido,
    Pedido,
)
from backend.models.producto import Producto
from backend.models.usuario import Usuario
from backend.pedidos.repository import PedidoRepository
from backend.productos.repository import ProductoRepository


class CocinaService:
    """Service for KDS-related queries and operations."""

    async def get_pedidos_cocina(self) -> list[dict]:
        """Get all active kitchen orders with items and time-in-state.

        Returns:
            List of dicts with pedido data, items, tiempo_en_estado,
            and cliente_nombre. Ordered by oldest first in current state.
        """
        async with UnitOfWork() as uow:
            repo = uow.register("pedidos", PedidoRepository, Pedido)

            # Fetch pedidos in CONFIRMADO or EN_PREP with items
            statement = (
                select(Pedido)
                .where(Pedido.estado_codigo.in_(["CONFIRMADO", "EN_PREP"]))
                .options(selectinload(Pedido.detalles))
                .order_by(Pedido.creado_en.asc())
            )
            result = await uow.session.execute(statement)
            pedidos = list(result.unique().scalars().all())

            # Build response with time-in-state and client name
            response = []
            for pedido in pedidos:
                estado_actual = pedido.estado_codigo  # type: ignore[arg-type]

                # Calculate time-in-state from historial
                tiempo_en_estado = await self._calcular_tiempo_en_estado(
                    uow, pedido.id, estado_actual  # type: ignore[arg-type]
                )

                # Get client name
                cliente_nombre = await self._obtener_cliente_nombre(
                    uow, pedido.usuario_id
                )

                response.append({
                    "id": pedido.id,
                    "estado_codigo": estado_actual,
                    "subtotal": float(pedido.subtotal) if pedido.subtotal else 0,
                    "total": float(pedido.total) if pedido.total else 0,
                    "notas": getattr(pedido, "notas", None),
                    "creado_en": pedido.creado_en.isoformat()
                    if pedido.creado_en
                    else None,
                    "items": [
                        {
                            "producto_id": d.producto_id,
                            "nombre_snapshot": d.nombre_snapshot,
                            "cantidad": d.cantidad,
                            "precio_snapshot": float(d.precio_snapshot),
                            "ingredientes_excluidos": d.ingredientes_excluidos,
                        }
                        for d in (getattr(pedido, "detalles", []) or [])
                    ],
                    "tiempo_en_estado": tiempo_en_estado,
                    "cliente_nombre": cliente_nombre,
                })

            return response

    async def _calcular_tiempo_en_estado(
        self,
        uow: UnitOfWork,
        pedido_id: int,
        estado_actual: str,
    ) -> int:
        """Calculate seconds since the pedido entered its current state.

        Uses the latest ``HistorialEstadoPedido`` entry where
        ``estado_nuevo == estado_actual``.

        Args:
            uow: Active UnitOfWork.
            pedido_id: Pedido ID.
            estado_actual: Current state code.

        Returns:
            Seconds (int) since entering this state. Returns 0 if history
            record not found (should not happen in normal operation).
        """
        stmt = (
            select(HistorialEstadoPedido.created_at)
            .where(
                HistorialEstadoPedido.pedido_id == pedido_id,
                HistorialEstadoPedido.estado_nuevo == estado_actual,
            )
            .order_by(HistorialEstadoPedido.created_at.desc())
            .limit(1)
        )
        result = await uow.session.execute(stmt)
        row = result.scalar_one_or_none()

        if row is None:
            return 0

        now = datetime.now(timezone.utc)
        # created_at is timezone-naive (UTC) from the DB
        if row.tzinfo is None:
            entry_time = row.replace(tzinfo=timezone.utc)
        else:
            entry_time = row

        delta = now - entry_time
        return int(delta.total_seconds())

    async def _obtener_cliente_nombre(
        self,
        uow: UnitOfWork,
        usuario_id: int,
    ) -> str:
        """Get the full name of a user by ID.

        Args:
            uow: Active UnitOfWork.
            usuario_id: User ID.

        Returns:
            ``"Nombre Apellido"`` or ``"Usuario #{id}"`` if not found.
        """
        stmt = select(Usuario).where(Usuario.id == usuario_id)
        result = await uow.session.execute(stmt)
        user = result.scalar_one_or_none()

        if user is None:
            return f"Usuario #{usuario_id}"

        parts = []
        if user.nombre:
            parts.append(user.nombre)
        if user.apellido:
            parts.append(user.apellido)
        return " ".join(parts) if parts else f"Usuario #{usuario_id}"

    async def toggle_disponibilidad(
        self, producto_id: int, disponible: bool
    ) -> Producto:
        """Toggle the availability of a product.

        Uses ``ProductoRepository.update()`` which internally checks that the
        product exists and is **not** soft-deleted. If the product was
        soft-deleted or does not exist, ``NotFoundError`` is raised.

        Args:
            producto_id: ID of the product to update.
            disponible: New availability state.

        Returns:
            The updated ``Producto`` instance.

        Raises:
            NotFoundError: Product does not exist or was soft-deleted.
        """
        async with UnitOfWork() as uow:
            repo = uow.register("productos", ProductoRepository, Producto)
            producto = await repo.update(producto_id, {"disponible": disponible})
            return producto
