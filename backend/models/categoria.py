"""Product category models with recursive hierarchy support"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .producto_categoria import ProductoCategoria


class Categoria(SQLModel, table=True):
    """Product categories with hierarchical structure (self-referencing)"""

    __tablename__ = "categoria"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, index=True)
    descripcion: Optional[str] = Field(default=None, max_length=200)

    # Self-referencing for hierarchy
    parent_id: Optional[int] = Field(default=None, foreign_key="categoria.id")

    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None, index=True)

    # Relationships
    productos: list["ProductoCategoria"] = Relationship(back_populates="categoria")
