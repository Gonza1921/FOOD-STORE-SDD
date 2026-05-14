"""M2N relationship table: Product ↔ Category

Used as link_model for SQLAlchemy M2M between Producto and Categoria.
No Relationship fields needed — acts as pure association table.
"""

from typing import Optional

from sqlmodel import SQLModel, Field


class ProductoCategoria(SQLModel, table=True):
    """M:N relationship between Productos and Categorias"""

    __tablename__ = "productocategoria"
    __table_args__ = {"extend_existing": True}

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    es_principal: bool = Field(default=False)
