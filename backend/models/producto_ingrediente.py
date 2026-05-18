"""M2N relationship table: Product ↔ Ingredient

Used as link_model for SQLAlchemy M2M between Producto and Ingrediente.
No Relationship fields needed — acts as pure association table.
"""

from typing import Optional

from sqlmodel import SQLModel, Field


class ProductoIngrediente(SQLModel, table=True):
    """M:N relationship between Productos and Ingredientes"""

    __tablename__ = "producto_ingrediente"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", index=True)
    es_removible: bool = Field(default=False)  # Allows customization
