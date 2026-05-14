"""Ingredient model for product composition and allergen tracking"""

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Ingrediente(SQLModel, table=True):
    """Food ingredients for product composition and nutritional tracking"""

    __tablename__ = "ingrediente"  # Explicit table name for FK references

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, max_length=100, index=True)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    es_alergeno: bool = Field(default=False)
    disponible: bool = Field(default=True)

    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None, index=True)
