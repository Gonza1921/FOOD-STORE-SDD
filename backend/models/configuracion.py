"""System configuration key-value store — editable by ADMIN from dashboard"""

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Configuracion(SQLModel, table=True):
    """System configuration key-value pair — editable by ADMIN"""

    __tablename__ = "configuracion"
    __table_args__ = {"extend_existing": True}

    clave: str = Field(primary_key=True, max_length=100, description="Configuration key")
    valor: str = Field(default="", max_length=500, description="Configuration value")
    descripcion: Optional[str] = Field(default=None, max_length=500, description="Human-readable description")
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
