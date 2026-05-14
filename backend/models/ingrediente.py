"""Ingredient model for product composition and allergen tracking"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy.orm import Mapped
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .producto import Producto

from .producto_ingrediente import ProductoIngrediente  # noqa: E402 — needed at runtime for link_model


class Ingrediente(SQLModel, table=True):
    """Food ingredients for product composition and nutritional tracking"""

    __tablename__ = "ingrediente"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, max_length=100, index=True)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    es_alergeno: bool = Field(default=False)
    disponible: bool = Field(default=True)

    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None, index=True)

    # M2M via link_model — returns Producto[] directly
    productos: Mapped[list["Producto"]] = Relationship(
        back_populates="ingredientes",
        link_model=ProductoIngrediente,
    )
