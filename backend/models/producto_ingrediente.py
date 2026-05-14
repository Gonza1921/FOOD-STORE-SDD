"""M2N relationship table: Product ↔ Ingredient"""

from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .producto import Producto


class ProductoIngrediente(SQLModel, table=True):
    """M:N relationship between Productos and Ingredientes"""

    __tablename__ = "productoingrediente"

    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", index=True)
    es_removible: bool = Field(default=False)  # Allows customization

    # Relationship back to Producto
    producto: Optional["Producto"] = Relationship(back_populates="ingredientes")
