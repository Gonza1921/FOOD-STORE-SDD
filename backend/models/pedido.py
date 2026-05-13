"""Order management models with FSM, snapshots, and audit trail"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlmodel import SQLModel, Field


class FormaPago(SQLModel, table=True):
    """Payment method catalog - fixed values"""
    
    __table_args__ = {"extend_existing": True}
    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: str = Field(max_length=200)
    habilitado: bool = Field(default=True)


class EstadoPedido(SQLModel, table=True):
    """Order state catalog - FSM states"""
    
    __table_args__ = {"extend_existing": True}
    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: str = Field(max_length=200)
    orden: int  # Visual order: 1-6
    es_terminal: bool = Field(default=False)  # No outgoing transitions if true


class Pedido(SQLModel, table=True):
    """Order entity - central domain with snapshots and immutable totals"""
    
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    estado_codigo: str = Field(foreign_key="estado_pedido.codigo", index=True)
    
    # Snapshots - immutable at creation
    total: Decimal = Field(max_digits=10, decimal_places=2)
    costo_envio: Decimal = Field(max_digits=10, decimal_places=2, default=Decimal("50.00"))
    
    # Payment method
    forma_pago_codigo: str = Field(foreign_key="forma_pago.codigo")
    
    # Delivery address (can be null for pickup)
    direccion_id: Optional[int] = Field(default=None, foreign_key="direccion_entrega.id")
    
    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def total_con_envio(self) -> Decimal:
        """Total including shipping"""
        return self.total + self.costo_envio


class DetallePedido(SQLModel, table=True):
    """Order detail with product snapshots - immutable"""
    
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", index=True)
    producto_id: int = Field(foreign_key="producto.id")  # Historical reference
    cantidad: int = Field(ge=1)
    
    # Snapshots - immutable (captured at order creation time)
    nombre_snapshot: str = Field(max_length=200)
    precio_snapshot: Decimal = Field(max_digits=10, decimal_places=2)
    
    # Customization (IDs of removable ingredients stored as JSON string)
    personalizacion: Optional[str] = Field(default=None)  # JSON: ["id1", "id2"]
    
    @property
    def subtotal(self) -> Decimal:
        """Line total = precio_snapshot * cantidad"""
        return self.precio_snapshot * self.cantidad


class HistorialEstadoPedido(SQLModel, table=True):
    """Order state transition history - append-only audit trail"""
    
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", index=True)
    
    # FSM transition
    estado_desde: Optional[str] = Field(
        default=None,
        foreign_key="estado_pedido.codigo",
        max_length=20
    )  # NULL = initial creation
    estado_nuevo: str = Field(foreign_key="estado_pedido.codigo", max_length=20)
    
    # Reason (mandatory if cancellation)
    motivo: Optional[str] = Field(default=None, max_length=500)
    usuario_id: int = Field(foreign_key="usuario.id")
    
    # Append-only - never updated
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class Pago(SQLModel, table=True):
    """Payment entity - MercadoPago integration"""
    
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", unique=True, index=True)
    
    # MercadoPago IDs
    mp_payment_id: Optional[int] = Field(default=None, unique=True)
    mp_status: str = Field(max_length=30)  # pending, approved, rejected
    external_reference: str = Field(unique=True, max_length=100)  # Pedido UUID
    idempotency_key: str = Field(unique=True, max_length=100)  # Generated UUID
    
    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
