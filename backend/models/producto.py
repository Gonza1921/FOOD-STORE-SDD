"""Product catalog models with ingredients and categorization"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.categoria import Categoria


class Ingrediente(SQLModel, table=True):
    """Food ingredients for products and allergen tracking"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, max_length=100, index=True)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    es_alergeno: bool = Field(default=False)
    
    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    productos: List["Producto"] = Relationship(
        back_populates="ingredientes",
        link_model="ProductoIngrediente"
    )


class ProductoIngrediente(SQLModel, table=True):
    """M:N relationship: Products and Ingredients"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", index=True)
    es_removible: bool = Field(default=False)  # Allows customization


class ProductoCategoria(SQLModel, table=True):
    """M:N relationship: Products and Categories"""
    
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    es_principal: bool = Field(default=False)


class Producto(SQLModel, table=True):
    """Product entity with stock management and ingredient composition"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=200, index=True)
    descripcion: Optional[str] = Field(default=None)
    precio_base: Decimal = Field(max_digits=10, decimal_places=2)  # CHECK >= 0
    stock_cantidad: int = Field(default=0, ge=0)  # CHECK >= 0
    disponible: bool = Field(default=True)  # Manual toggle independent of stock
    
    # FK to primary category (can have multiple via ProductoCategoria)
    categoria_id: int = Field(foreign_key="categoria.id", index=True)
    
    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None, index=True)
    
    # Relationships
    categoria: Optional["Categoria"] = Relationship(back_populates="productos")
    ingredientes: List[Ingrediente] = Relationship(
        back_populates="productos",
        link_model=ProductoIngrediente
    )
    categorias_adicionales: List["Categoria"] = Relationship(
        back_populates="productos",
        link_model=ProductoCategoria
    )
    detalles_pedido: List["DetallePedido"] = Relationship(back_populates="producto")
    
    def is_deleted(self) -> bool:
        """Check if product is soft deleted"""
        return self.deleted_at is not None
    
    @property
    def precio_formateado(self) -> str:
        """Format price for display"""
        return f"${self.precio_base:.2f}"
