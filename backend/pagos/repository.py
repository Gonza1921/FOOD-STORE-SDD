"""Pagos repository — Data access layer for payment operations"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from backend.core.repository import BaseRepository
from backend.models.pedido import Pago


class PagoRepository(BaseRepository[Pago]):
    """Repository for payment data operations.

    Follows the project-wide pattern: extends BaseRepository[T],
    accepts (session, model_class) in __init__, and uses async/await.
    """

    def __init__(self, session: AsyncSession, model_class: type[Pago]):
        super().__init__(session, model_class)

    async def get_by_pedido_id(self, pedido_id: int) -> Optional[Pago]:
        """Get payment by order ID.

        NOTE: pedido_id is NOT the primary key — it's a unique FK field.
        Must use select() instead of session.get().
        """
        statement = select(Pago).where(Pago.pedido_id == pedido_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_by_external_reference(self, external_ref: str) -> Optional[Pago]:
        """Get payment by external reference (Pedido UUID)"""
        statement = select(Pago).where(Pago.external_reference == external_ref)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_by_idempotency_key(self, key: str) -> Optional[Pago]:
        """Get payment by idempotency key to prevent duplicates"""
        statement = select(Pago).where(Pago.idempotency_key == key)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_by_mp_payment_id(self, mp_id: int) -> Optional[Pago]:
        """Get payment by MercadoPago payment ID"""
        statement = select(Pago).where(Pago.mp_payment_id == mp_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    # -------- CRUD overrides with instance-based helpers ----------

    # BaseRepository.create(obj) is inherited — does add + flush + refresh.
    # No need to override unless payment-specific logic is added.

    async def update(self, pago: Pago) -> Pago:
        """Update an existing payment instance (instance-based helper).

        Unlike BaseRepository.update(id, data) which takes a PK + dict,
        this variant accepts a pre-modified model instance for callers
        that mutate the object in-place before saving.
        """
        self.session.add(pago)
        await self.session.flush()
        return pago