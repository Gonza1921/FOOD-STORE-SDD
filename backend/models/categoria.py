"""Product category models with recursive hierarchy support"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Categoria(SQLModel, table=True):
    """Product categories with hierarchical structure (self-referencing)"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, index=True)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    
    # Self-referencing for hierarchy
    parent_id: Optional[int] = Field(default=None, foreign_key="categoria.id")
    
    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None, index=True)
