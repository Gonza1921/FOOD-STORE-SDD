"""Pagos schemas — Pydantic models for API validation"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PagoCreate(BaseModel):
    """Schema for creating a payment record (internal use)"""
    pedido_id: int
    external_reference: str
    idempotency_key: str
    mp_payment_id: Optional[int] = None
    mp_status: str = "pending"


class PagoUpdate(BaseModel):
    """Schema for updating payment status"""
    mp_payment_id: Optional[int] = None
    mp_status: Optional[str] = None


class PagoResponse(BaseModel):
    """Schema for payment response"""
    id: int
    pedido_id: int
    mp_payment_id: Optional[int] = None
    mp_status: str
    external_reference: str
    idempotency_key: str
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class CrearPreferenciaRequest(BaseModel):
    """Request to create a MercadoPago preference"""
    pedido_id: int
    payment_method_token: Optional[str] = None  # Token from MP SDK (not card data)


class CrearPreferenciaResponse(BaseModel):
    """Response with MP preference data"""
    preference_id: str
    init_point: str  # URL to redirect for payment
    pedido_id: int


class WebhookNotification(BaseModel):
    """Schema for MercadoPago webhook notification"""
    action: str
    api_version: str
    data: dict


class PaymentCallback(BaseModel):
    """Schema for payment data from MP webhook"""
    id: int
    status: str  # approved, rejected, pending, in_process
    status_detail: Optional[str]
    external_reference: str
    transaction_amount: float
    date_approved: Optional[datetime] = None