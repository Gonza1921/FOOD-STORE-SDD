"""Pydantic schemas for Admin advanced metrics"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class TopProductoItem(BaseModel):
    """Response schema for top-selling product in ranking"""

    id: int
    nombre: str
    total_vendido: int = Field(..., ge=0, description="Total quantity sold")
    precio_base: Decimal = Field(..., decimal_places=2)

    class Config:
        from_attributes = True


class VentasPeriodoItem(BaseModel):
    """Response schema for sales aggregated by period"""

    periodo: date = Field(..., description="Period start date")
    total_ventas: Decimal = Field(..., decimal_places=2, description="Total sales amount")
    cantidad_pedidos: int = Field(..., ge=0, description="Number of orders in period")

    class Config:
        from_attributes = True


class TopProductosResponse(BaseModel):
    """Response schema for GET /api/v1/admin/metricas/productos-top"""

    items: list[TopProductoItem]
    total: int = Field(..., ge=0, description="Total distinct products sold")


class VentasPeriodoResponse(BaseModel):
    """Response schema for GET /api/v1/admin/metricas/ventas"""

    items: list[VentasPeriodoItem]
    total_ventas: Decimal = Field(..., decimal_places=2, description="Grand total sales")
    desde: date = Field(..., description="Start date of the period")
    hasta: date = Field(..., description="End date of the period")
    granularidad: str = Field(..., description="Granularity used (day/week/month)")
