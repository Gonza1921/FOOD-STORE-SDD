"""Pagos repository — Data access layer for payment operations"""

from typing import Optional
from sqlmodel import Session, select
from backend.models.pedido import Pago


class PagoRepository:
    """Repository for payment data operations"""

    def __init__(self, session: Session):
        self.session = session

    def get_by_pedido_id(self, pedido_id: int) -> Optional[Pago]:
        """Get payment by order ID"""
        return self.session.get(Pago, pedido_id)

    def get_by_external_reference(self, external_ref: str) -> Optional[Pago]:
        """Get payment by external reference (Pedido UUID)"""
        return self.session.exec(
            select(Pago).where(Pago.external_reference == external_ref)
        ).first()

    def get_by_idempotency_key(self, key: str) -> Optional[Pago]:
        """Get payment by idempotency key to prevent duplicates"""
        return self.session.exec(
            select(Pago).where(Pago.idempotency_key == key)
        ).first()

    def get_by_mp_payment_id(self, mp_id: int) -> Optional[Pago]:
        """Get payment by MercadoPago payment ID"""
        return self.session.exec(
            select(Pago).where(Pago.mp_payment_id == mp_id)
        ).first()

    def create(self, pago: Pago) -> Pago:
        """Create a new payment record"""
        self.session.add(pago)
        self.session.flush()
        return pago

    def update(self, pago: Pago) -> Pago:
        """Update an existing payment"""
        self.session.add(pago)
        self.session.flush()
        return pago

    def delete(self, pago: Pago) -> None:
        """Soft delete a payment (not typically used)"""
        self.session.delete(pago)
        self.session.flush()