"""Delivery address models with soft delete and ownership"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class DireccionEntrega(SQLModel, table=True):
    """User delivery addresses with ownership validation and soft delete"""

    __tablename__ = "direccion_entrega"
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)

    alias: Optional[str] = Field(default=None, max_length=50)  # 'Casa', 'Trabajo'
    linea1: str = Field(max_length=200)  # Street, number
    linea2: Optional[str] = Field(default=None, max_length=200)  # Floor, apt
    ciudad: str = Field(max_length=50)
    provincia: str = Field(max_length=50)
    codigo_postal: str = Field(max_length=10)
    referencia: Optional[str] = Field(default=None, max_length=200)  # Nearby landmark

    es_principal: bool = Field(default=False)

    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None, index=True)
