"""Pydantic schemas for the Kitchen Display System (KDS) API.

Schemas defined:
- ItemCocinaSchema: Individual order item displayed in the KDS.
- PedidoCocinaResponse: Order summary for the KDS board.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ItemCocinaSchema(BaseModel):
    """Schema for a single order item in the KDS view."""

    producto_id: int = Field(..., description="Product ID for availability toggle")
    nombre_snapshot: str = Field(..., description="Product name at order time")
    cantidad: int = Field(..., ge=1, description="Quantity ordered")
    precio_snapshot: Decimal = Field(..., decimal_places=2, description="Unit price at order time")
    ingredientes_excluidos: Optional[str] = Field(
        default=None,
        description="JSON string of excluded ingredient IDs",
    )

    class Config:
        from_attributes = True


class PedidoCocinaResponse(BaseModel):
    """Schema for a pedido displayed on the KDS board."""

    id: int
    estado_codigo: str = Field(..., description="CONFIRMADO or EN_PREP")
    subtotal: Decimal = Field(..., decimal_places=2)
    total: Decimal = Field(..., decimal_places=2)
    notas: Optional[str] = Field(default=None, description="Client notes")
    creado_en: datetime
    items: list[ItemCocinaSchema] = Field(default_factory=list)
    tiempo_en_estado: int = Field(..., ge=0, description="Seconds in current state")
    cliente_nombre: str = Field(..., description="Full name of the client")

    class Config:
        from_attributes = True


class PatchDisponibilidadRequest(BaseModel):
    """Request body for toggling product availability.

    Attributes:
        disponible: New availability state for the product.
    """

    disponible: bool = Field(
        ...,
        description="Nuevo estado de disponibilidad del producto",
    )


class DisponibilidadResponse(BaseModel):
    """Response schema for product availability status.

    Attributes:
        id: Product ID.
        nombre: Product name.
        disponible: Current availability state.
    """

    id: int
    nombre: str
    disponible: bool

    class Config:
        from_attributes = True
