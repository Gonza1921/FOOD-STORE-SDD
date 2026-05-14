"""Data models module — All SQLModel entities for Alembic"""

# Import all models to register them with SQLModel.metadata
from .usuario import Usuario, Rol, UsuarioRol, RefreshToken
from .direccion import DireccionEntrega
from .categoria import Categoria
from .producto import Producto
from .ingrediente import Ingrediente
from .producto_ingrediente import ProductoIngrediente
from .producto_categoria import ProductoCategoria
from .pedido import (
    Pedido,
    DetallePedido,
    HistorialEstadoPedido,
    EstadoPedido,
    FormaPago,
    Pago,
)

__all__ = [
    # User & Auth
    "Usuario",
    "Rol",
    "UsuarioRol",
    "RefreshToken",
    # Addresses
    "DireccionEntrega",
    # Catalog
    "Categoria",
    "Producto",
    "Ingrediente",
    "ProductoIngrediente",
    "ProductoCategoria",
    # Orders
    "Pedido",
    "DetallePedido",
    "HistorialEstadoPedido",
    "EstadoPedido",
    "FormaPago",
    "Pago",
]
