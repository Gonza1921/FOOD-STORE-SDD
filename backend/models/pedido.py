"""Order management models with FSM, snapshots, and audit trail"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.usuario import Usuario
    from backend.models.direccion import DireccionEntrega
    from backend.models.producto import Producto


class FormaPago(SQLModel, table=True):
    """Payment method catalog - fixed values"""
    
    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: str = Field(max_length=200)
    habilitado: bool = Field(default=True)
    
    # Relationships
    pagos: List["Pago"] = Relationship(back_populates="forma_pago")


class EstadoPedido(SQLModel, table=True):
    """Order state catalog - FSM states"""
    
    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: str = Field(max_length=200)
    orden: int  # Visual order: 1-6
    es_terminal: bool = Field(default=False)  # No outgoing transitions if true
    
    # Relationships
    pedidos: List["Pedido"] = Relationship(back_populates="estado")
    historiales: List["HistorialEstadoPedido"] = Relationship(back_populates="estado_nuevo_rel")


class Pedido(SQLModel, table=True):
    """Order entity - central domain with snapshots and immutable totals"""
    
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
    
    # Relationships
    usuario: Optional["Usuario"] = Relationship(back_populates="pedidos")
    estado: Optional[EstadoPedido] = Relationship(back_populates="pedidos")
    direccion: Optional["DireccionEntrega"] = Relationship(back_populates="pedidos")
    forma_pago: Optional[FormaPago] = Relationship(back_populates="pagos")
    detalles: List["DetallePedido"] = Relationship(
        back_populates="pedido",
        cascade_delete=True
    )
    historial: List["HistorialEstadoPedido"] = Relationship(
        back_populates="pedido",
        cascade_delete=True
    )
    pago: Optional["Pago"] = Relationship(back_populates="pedido")
    
    @property
    def total_con_envio(self) -> Decimal:
        """Total including shipping"""
        return self.total + self.costo_envio


class DetallePedido(SQLModel, table=True):
    """Order detail with product snapshots - immutable"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", index=True)
    producto_id: int = Field(foreign_key="producto.id")  # Historical reference
    cantidad: int = Field(ge=1)
    
    # Snapshots - immutable (captured at order creation time)
    nombre_snapshot: str = Field(max_length=200)
    precio_snapshot: Decimal = Field(max_digits=10, decimal_places=2)
    
    # Customization (IDs of removable ingredients)
    personalizacion: Optional[List[int]] = None  # PostgreSQL INTEGER[]
    
    # Relationships
    pedido: Optional[Pedido] = Relationship(back_populates="detalles")
    producto: Optional["Producto"] = Relationship(back_populates="detalles_pedido")
    
    def subtotal(self) -> Decimal:
        """Line total = precio_snapshot * cantidad"""
        return self.precio_snapshot * self.cantidad


class HistorialEstadoPedido(SQLModel, table=True):
    """Order state transition history - append-only audit trail"""
    
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
    
    # Relationships
    pedido: Optional[Pedido] = Relationship(back_populates="historial")
    estado_nuevo_rel: Optional[EstadoPedido] = Relationship(back_populates="historiales")
    usuario: Optional["Usuario"] = Relationship()  # Read-only reference


class Pago(SQLModel, table=True):
    """Payment entity - MercadoPago integration"""
    
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
    
    # Relationships
    pedido: Optional[Pedido] = Relationship(back_populates="pago")
    forma_pago: Optional[FormaPago] = Relationship(back_populates="pagos")
