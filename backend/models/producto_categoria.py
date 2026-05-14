"""M2N relationship table: Product ↔ Category"""

from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .producto import Producto
    from .categoria import Categoria


class ProductoCategoria(SQLModel, table=True):
    """M:N relationship between Productos and Categorias"""

    __tablename__ = "productocategoria"

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    es_principal: bool = Field(default=False)

    # Relationships
    producto: Optional["Producto"] = Relationship(back_populates="categorias")
    categoria: Optional["Categoria"] = Relationship(back_populates="productos")
