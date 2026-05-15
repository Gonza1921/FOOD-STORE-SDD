"""Pydantic schemas for Pedido CRUD — validation and response serialization

Schemas defined:
- PedidoItemCreate: Request item for creating a pedido
- PedidoItemResponse: Response item with calculated subtotal
- PedidoCreate: Request for creating a pedido
- PedidoResponse: Full response with items
- PedidoListResponse: Paginated list of pedidos

Validation rules:
- items must not be empty
- cantidad must be >= 1
- producto_id must be valid
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ============================================================================
# Enum for Order States (for reference, stored as FK in DB)
# ============================================================================


class EstadoPedidoEnum(str):
    """Order state enum values matching database FK"""

    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    PREPARANDO = "preparando"
    ENVIADO = "enviado"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


# ============================================================================
# Task 2.1: PedidoItemCreate Schema
# ============================================================================


class PedidoItemCreate(BaseModel):
    """Request schema for item in POST /pedidos"""

    producto_id: int = Field(..., gt=0, description="Product ID (must exist)")
    cantidad: int = Field(..., ge=1, description="Quantity, must be >= 1")

    @field_validator("cantidad")
    @classmethod
    def cantidad_positiva(cls, v: int) -> int:
        """Validate cantidad >= 1"""
        if v < 1:
            raise ValueError("La cantidad debe ser al menos 1")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "producto_id": 1,
                "cantidad": 2,
            }
        }


# ============================================================================
# Task 2.2: PedidoItemResponse Schema
# ============================================================================


class PedidoItemResponse(BaseModel):
    """Response schema for pedido item with calculated subtotal"""

    id: int
    producto_id: int
    cantidad: int
    precio_unitario: Decimal = Field(..., decimal_places=2)
    subtotal: Decimal = Field(..., decimal_places=2)

    class Config:
        from_attributes = True


# ============================================================================
# Task 2.3: PedidoCreate Schema
# ============================================================================


class PedidoCreate(BaseModel):
    """Request schema for POST /pedidos"""

    items: list[PedidoItemCreate] = Field(
        ..., min_length=1, description="At least one item is required"
    )

    @field_validator("items")
    @classmethod
    def items_no_vacios(cls, v: list[PedidoItemCreate]) -> list[PedidoItemCreate]:
        """Validate items list is not empty"""
        if not v:
            raise ValueError("El pedido debe tener al menos un artículo")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {"producto_id": 1, "cantidad": 2},
                    {"producto_id": 3, "cantidad": 1},
                ]
            }
        }


# ============================================================================
# Task 2.4: PedidoResponse Schema
# ============================================================================


class PedidoResponse(BaseModel):
    """Response schema for single pedido with items"""

    id: int
    usuario_id: int
    estado: str
    total: Decimal = Field(..., decimal_places=2)
    items: list[PedidoItemResponse] = Field(default_factory=list)
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Task 2.5: PedidoListResponse Schema
# ============================================================================


class PedidoListResponse(BaseModel):
    """Response schema for GET /pedidos (list of user's pedidos)"""

    items: list[PedidoResponse]
    total: int = Field(..., ge=0, description="Total records without pagination")
    skip: int = Field(..., ge=0, description="Offset used")
    limit: int = Field(..., gt=0, description="Limit used")

    @property
    def page(self) -> int:
        """Calculate page number (1-indexed)"""
        return (self.skip // self.limit) + 1 if self.limit > 0 else 1

    @property
    def total_pages(self) -> int:
        """Calculate total pages"""
        return (self.total + self.limit - 1) // self.limit if self.limit > 0 else 1


# ============================================================================
# Summary Pedido (for list views without items)
# ============================================================================


class PedidoSummary(BaseModel):
    """Summary schema for pedido in list views"""

    id: int
    usuario_id: int
    estado: str
    total: Decimal = Field(..., decimal_places=2)
    creado_en: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Estado Transition Schema (ETAPA 2)
# ============================================================================


class PedidoEstadoUpdate(BaseModel):
    """Request schema for PATCH /pedidos/{id}/estado"""

    estado: str = Field(
        ...,
        description="New state code. Valid values: PENDIENTE, CONFIRMADO, EN_PREP, "
        "EN_CAMINO, ENTREGADO, CANCELADO"
    )

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v: str) -> str:
        """Validate estado is a valid FSM state code."""
        estados_validos = ["PENDIENTE", "CONFIRMADO", "EN_PREP", "EN_CAMINO", "ENTREGADO", "CANCELADO"]
        if v not in estados_validos:
            raise ValueError(f"Estado inválido. Valores permitidos: {estados_validos}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "estado": "CONFIRMADO",
            }
        }


class PedidoTransicionResponse(BaseModel):
    """Response schema for successful state transition"""

    id: int
    usuario_id: int
    estado_anterior: str
    estado_nuevo: str
    total: Decimal = Field(..., decimal_places=2)
    items: list[PedidoItemResponse] = Field(default_factory=list)
    mensaje: str

    class Config:
        from_attributes = True


# ============================================================================
# Admin-only schemas
# ============================================================================


class PedidoAdminResponse(PedidoResponse):
    """Extended response for admin with additional fields"""

    costo_envio: Decimal = Field(..., decimal_places=2)
    forma_pago_codigo: str
    direccion_id: Optional[int] = None

    class Config:
        from_attributes = True


class PedidoAdminListResponse(BaseModel):
    """Response schema for GET /pedidos/admin (all pedidos)"""

    items: list[PedidoSummary]
    total: int = Field(..., ge=0)
    skip: int = Field(..., ge=0)
    limit: int = Field(..., gt=0)


# ============================================================================
# Cancel Schema
# ============================================================================


class PedidoCancelRequest(BaseModel):
    """Request schema for PATCH /pedidos/{id}/cancelar"""

    observacion: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Reason for cancellation (mandatory)"
    )

    @field_validator("observacion")
    @classmethod
    def observacion_no_vacia(cls, v: str) -> str:
        """Validate observation is not empty or whitespace only."""
        if not v or not v.strip():
            raise ValueError("La observación no puede estar vacía")
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "observacion": "El cliente solicitó la cancelación por falta de disponibilidad",
            }
        }


# ============================================================================
# History / Audit Trail Schemas
# ============================================================================


class HistorialEstadoResponse(BaseModel):
    """Response schema for historial state transitions"""

    id: int
    pedido_id: int
    estado_desde: Optional[str]
    estado_nuevo: str
    motivo: Optional[str]
    usuario_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class HistorialListResponse(BaseModel):
    """Response schema for GET /pedidos/{id}/historial"""

    items: list[HistorialEstadoResponse]
    total: int = Field(..., ge=0, description="Total records")