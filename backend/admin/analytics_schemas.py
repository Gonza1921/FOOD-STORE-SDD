"""Pydantic schemas for Admin Analytics Dashboard"""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class VentasPorMes(BaseModel):
    """Sales aggregated by month"""

    mes: str = Field(..., description="Month label (YYYY-MM)")
    total: Decimal = Field(..., decimal_places=2, description="Total sales amount")


class VentasPorDia(BaseModel):
    """Sales aggregated by day"""

    fecha: date = Field(..., description="Date")
    total: Decimal = Field(..., decimal_places=2, description="Total sales amount")


class ProductoMasVendido(BaseModel):
    """Top-selling product ranking item"""

    producto: str = Field(..., description="Product name")
    cantidad: int = Field(..., ge=0, description="Total quantity sold")


class CategoriaMasVendida(BaseModel):
    """Top-selling category ranking item"""

    categoria: str = Field(..., description="Category name")
    cantidad: int = Field(..., ge=0, description="Total quantity sold")


class DashboardAnalyticsResponse(BaseModel):
    """Full dashboard analytics response"""

    ventas_totales: Decimal = Field(..., decimal_places=2)
    ventas_mes: Decimal = Field(..., decimal_places=2)
    pedidos_totales: int = Field(..., ge=0)
    pedidos_pendientes: int = Field(..., ge=0)
    pedidos_pagados: int = Field(..., ge=0)
    usuarios_totales: int = Field(..., ge=0)
    productos_totales: int = Field(..., ge=0)
    ticket_promedio: Decimal = Field(..., decimal_places=2)
    ventas_por_mes: list[VentasPorMes]
    ventas_por_dia: list[VentasPorDia]
    productos_mas_vendidos: list[ProductoMasVendido]
    categorias_mas_vendidas: list[CategoriaMasVendida]
