"""Data models module - All SQLModel entities for Alembic"""

# Import all models to register them with SQLModel.metadata
from backend.models.usuario import Usuario, Rol, UsuarioRol, RefreshToken
from backend.models.direccion import DireccionEntrega
from backend.models.categoria import Categoria
from backend.models.producto import Producto, Ingrediente, ProductoIngrediente, ProductoCategoria
from backend.models.pedido import (
    Pedido, DetallePedido, HistorialEstadoPedido,
    EstadoPedido, FormaPago, Pago
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
