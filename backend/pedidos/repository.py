"""PedidoRepository — data access layer for Pedido CRUD

Provides:
- get_by_id: Get pedido by ID with eager-loaded items
- get_all_by_usuario: List pedidos for a specific user with pagination
- create_with_items: Create pedido with DetallePedido items in one transaction

Patterns:
- Eager loading with selectinload to avoid N+1 queries
- BaseRepository for common CRUD operations
- No soft delete (pedidos are immutable audit records)
"""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import select

from backend.core.repository import BaseRepository
from backend.models.pedido import Pedido, DetallePedido


class PedidoRepository(BaseRepository[Pedido]):
    """Repository for Pedido CRUD with eager-loaded items."""

    async def get_by_id_con_items(self, pedido_id: int) -> Optional[Pedido]:
        """Get pedido by ID with all items eagerly loaded.

        Args:
            pedido_id: Pedido ID.

        Returns:
            Pedido with items loaded, or None if not found.
        """
        statement = select(Pedido).where(Pedido.id == pedido_id)
        statement = statement.options(selectinload(Pedido.detalles))  # type: ignore[attr-defined]
        result = await self.session.execute(statement)
        return result.unique().scalar_one_or_none()

    async def get_all_by_usuario(
        self, usuario_id: int, skip: int = 0, limit: int = 20
    ) -> tuple[list[Pedido], int]:
        """Get all pedidos for a specific user with pagination.

        Args:
            usuario_id: User ID to filter by.
            skip: Number of records to skip (offset).
            limit: Maximum number of records to return.

        Returns:
            Tuple of (list of Pedido, total count of all matching records).
        """
        # Base query: filter by usuario_id
        statement = select(Pedido).where(Pedido.usuario_id == usuario_id)

        # Count total BEFORE pagination
        count_statement = (
            select(func.count()).select_from(Pedido).where(Pedido.usuario_id == usuario_id)
        )
        count_result = await self.session.execute(count_statement)
        total = count_result.scalar() or 0

        # Order by creation date (newest first)
        statement = statement.order_by(Pedido.creado_en.desc())

        # Apply pagination
        statement = statement.offset(skip).limit(limit)

        # Execute query
        result = await self.session.execute(statement)
        items = list(result.scalars().all())

        return items, total

    async def get_all_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        estado: Optional[str] = None,
    ) -> tuple[list[Pedido], int]:
        """Get all pedidos for admin with optional state filter.

        Args:
            skip: Number of records to skip.
            limit: Maximum number of records.
            estado: Optional state code to filter by.

        Returns:
            Tuple of (list of Pedido, total count).
        """
        statement = select(Pedido)

        # Optional state filter
        if estado:
            statement = statement.where(Pedido.estado_codigo == estado)

        # Count total
        count_statement = select(func.count()).select_from(Pedido)
        if estado:
            count_statement = count_statement.where(Pedido.estado_codigo == estado)
        count_result = await self.session.execute(count_statement)
        total = count_result.scalar() or 0

        # Order and paginate
        statement = statement.order_by(Pedido.creado_en.desc())
        statement = statement.offset(skip).limit(limit)

        result = await self.session.execute(statement)
        items = list(result.scalars().all())

        return items, total

    async def get_by_id(self, id: int) -> Optional[Pedido]:
        """Get pedido by ID (without eager loading).

        Args:
            id: Pedido ID.

        Returns:
            Pedido or None.
        """
        statement = select(Pedido).where(Pedido.id == id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()


class DetallePedidoRepository(BaseRepository[DetallePedido]):
    """Repository for DetallePedido (order items) CRUD."""

    async def get_by_pedido(self, pedido_id: int) -> list[DetallePedido]:
        """Get all items for a specific pedido.

        Args:
            pedido_id: Pedido ID.

        Returns:
            List of DetallePedido (may be empty).
        """
        statement = select(DetallePedido).where(DetallePedido.pedido_id == pedido_id)
        result = await self.session.execute(statement)
        return list(result.scalars().all())