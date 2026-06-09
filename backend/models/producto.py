"""Product model with stock management and M2M associations

Ingrediente → extracted to .ingrediente
ProductoIngrediente → extracted to .producto_ingrediente
ProductoCategoria → extracted to .producto_categoria
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Mapped
from sqlmodel import SQLModel, Field, Relationship

from .producto_categoria import ProductoCategoria
from .producto_ingrediente import ProductoIngrediente


class Producto(SQLModel, table=True):
    """Product entity with stock management and category/ingredient composition"""

    __tablename__ = "producto"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=200, index=True)
    descripcion: Optional[str] = Field(default=None)
    precio_base: Decimal = Field(max_digits=10, decimal_places=2)
    stock_cantidad: int = Field(default=0, ge=0)
    disponible: bool = Field(default=True)
    imagen_url: Optional[str] = Field(
        default=None, max_length=512, description="Cloudinary image URL"
    )

    # FK to primary category (can have multiple via M2M)
    categoria_id: int = Field(foreign_key="categoria.id", index=True)

    # M2M via link_model — returns Categoria[] / Ingrediente[] directly
    categorias: Mapped[list["Categoria"]] = Relationship(
        back_populates="productos",
        link_model=ProductoCategoria,
    )
    ingredientes: Mapped[list["Ingrediente"]] = Relationship(
        back_populates="productos",
        link_model=ProductoIngrediente,
    )

    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None, index=True)

    @property
    def precio_formateado(self) -> str:
        """Format price for display"""
        return f"${self.precio_base:.2f}"
