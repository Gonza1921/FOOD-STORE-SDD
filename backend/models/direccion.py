"""Delivery address models"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.usuario import Usuario


class DireccionEntrega(SQLModel, table=True):
    """User delivery addresses with soft validation of es_principal"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    
    alias: Optional[str] = Field(default=None, max_length=50)  # 'Casa', 'Trabajo'
    linea1: str = Field(max_length=200)  # Street, number
    linea2: Optional[str] = Field(default=None, max_length=200)  # Floor, apt
    ciudad: str = Field(max_length=50)
    provincia: str = Field(max_length=50)
    codigo_postal: str = Field(max_length=10)
    
    es_principal: bool = Field(default=False)
    
    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    usuario: Optional["Usuario"] = Relationship(back_populates="direcciones")
    pedidos: list["Pedido"] = Relationship(back_populates="direccion")
