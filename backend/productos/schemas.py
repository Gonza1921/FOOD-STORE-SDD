"""Pydantic schemas for Producto CRUD — validation and response serialization"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ============================================================================
# Reference Models (for M2M relationships)
# ============================================================================

class CategoriaRef(BaseModel):
    """Reference to a Categoria (for M2M relationships)"""

    id: int
    nombre: str


class IngredienteRef(BaseModel):
    """Reference to an Ingrediente (for M2M relationships)"""

    id: int
    nombre: str


# ============================================================================
# Task 4.1: ProductoCreate Schema
# ============================================================================

class ProductoCreate(BaseModel):
    """Request schema for POST /api/v1/productos"""

    nombre: str = Field(..., min_length=1, max_length=200, description="Product name")
    descripcion: Optional[str] = Field(
        default=None, max_length=1000, description="Product description"
    )
    precio_base: Decimal = Field(
        ..., gt=0, decimal_places=2, description="Price in ARS, always > 0"
    )
    stock_cantidad: int = Field(default=0, ge=0, description="Initial stock >= 0")
    disponible: bool = Field(default=True, description="Is product available for sale?")
    categoria_id: int = Field(..., gt=0, description="Category ID (must exist)")
    categorias: Optional[list[int]] = Field(
        default_factory=list, description="Additional category IDs"
    )
    ingredientes: Optional[list[int]] = Field(
        default_factory=list, description="Ingredient IDs"
    )

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, v: str) -> str:
        """Validate that nombre is not empty or only spaces"""
        if not v or not v.strip():
            raise ValueError("Nombre no puede estar vacío")
        return v.strip()

    @field_validator("precio_base")
    @classmethod
    def precio_valido(cls, v: Decimal) -> Decimal:
        """Validate that precio_base > 0"""
        if v <= 0:
            raise ValueError("Precio debe ser mayor a 0")
        return v

    @field_validator("stock_cantidad")
    @classmethod
    def stock_valido(cls, v: int) -> int:
        """Validate that stock_cantidad >= 0"""
        if v < 0:
            raise ValueError("Stock no puede ser negativo")
        return v

    @field_validator("categorias", "ingredientes")
    @classmethod
    def lista_ids_validas(cls, v: Optional[list[int]]) -> list[int]:
        """Validate that lists are arrays of positive integers"""
        if v is None:
            return []
        for item_id in v:
            if not isinstance(item_id, int) or item_id <= 0:
                raise ValueError("IDs deben ser integers positivos")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Pizza Margherita",
                "descripcion": "Pizza clásica con queso y tomate",
                "precio_base": "19.99",
                "stock_cantidad": 50,
                "disponible": True,
                "categoria_id": 1,
                "categorias": [1, 2],
                "ingredientes": [10, 11, 12],
            }
        }


# ============================================================================
# Task 4.2: ProductoUpdate Schema
# ============================================================================

class ProductoUpdate(BaseModel):
    """Request schema for PUT /api/v1/productos/{id}"""

    nombre: Optional[str] = Field(default=None, min_length=1, max_length=200)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio_base: Optional[Decimal] = Field(default=None, gt=0, decimal_places=2)
    disponible: Optional[bool] = Field(default=None)
    categorias: Optional[list[int]] = Field(
        default=None, description="Replace all categorias"
    )
    ingredientes: Optional[list[int]] = Field(
        default=None, description="Replace all ingredientes"
    )

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, v: Optional[str]) -> Optional[str]:
        """If nombre is provided, it cannot be empty"""
        if v is not None and not v.strip():
            raise ValueError("Nombre no puede estar vacío")
        return v.strip() if v else None

    @field_validator("precio_base")
    @classmethod
    def precio_valido(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        """If precio_base is provided, it must be > 0"""
        if v is not None and v <= 0:
            raise ValueError("Precio debe ser mayor a 0")
        return v

    @field_validator("categorias", "ingredientes")
    @classmethod
    def lista_ids_validas(cls, v: Optional[list[int]]) -> Optional[list[int]]:
        """If list is provided, validate IDs"""
        if v is None:
            return None
        for item_id in v:
            if not isinstance(item_id, int) or item_id <= 0:
                raise ValueError("IDs deben ser integers positivos")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Pizza Margherita Premium",
                "descripcion": "Pizza clásica con ingredientes premium",
                "precio_base": "24.99",
                "disponible": True,
                "categorias": [1, 2],
                "ingredientes": [10, 11, 12, 15],
            }
        }


# ============================================================================
# Task 4.3: ProductoOut Schema (Admin Response)
# ============================================================================

class ProductoOut(BaseModel):
    """Response schema for GET /api/v1/productos/{id} (admin)"""

    id: int
    nombre: str
    descripcion: Optional[str]
    precio_base: Decimal = Field(..., decimal_places=2)
    stock_cantidad: int
    disponible: bool
    categorias: list[CategoriaRef] = Field(default_factory=list)
    ingredientes: list[IngredienteRef] = Field(default_factory=list)
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True  # For SQLModel → Pydantic conversion


# ============================================================================
# Task 4.4: ProductoOutList Schema (Paginated)
# ============================================================================

class ProductoOutList(BaseModel):
    """Response schema for GET /api/v1/productos (paginated list)"""

    items: list[ProductoOut]
    total: int = Field(..., ge=0, description="Total records without pagination")
    skip: int = Field(..., ge=0, description="Offset used")
    limit: int = Field(..., gt=0, description="Limit used")

    @property
    def page(self) -> int:
        """Calculate page number (1-indexed)"""
        return (self.skip // self.limit) + 1 if self.limit > 0 else 1

    @property
    def total_pages(self) -> int:
        """Calculate total pages"""
        return (self.total + self.limit - 1) // self.limit if self.limit > 0 else 1


# ============================================================================
# Task 4.5: ProductoOutPublic Schema (Public Catalog)
# ============================================================================

class ProductoOutPublic(BaseModel):
    """Response schema for GET /api/v1/productos/publico/catalogo (no auth)"""

    id: int
    nombre: str
    descripcion: Optional[str]
    precio_base: Decimal = Field(..., decimal_places=2)
    disponible: bool
    categorias: list[CategoriaRef] = Field(default_factory=list)
    ingredientes: list[IngredienteRef] = Field(default_factory=list)

    # EXCLUDE: stock_cantidad, timestamps, admin-only fields

    class Config:
        from_attributes = True


class ProductoOutPublicList(BaseModel):
    """Response schema for GET /api/v1/productos/publico/catalogo (paginated list)"""

    items: list[ProductoOutPublic]
    total: int
    skip: int
    limit: int

    @property
    def page(self) -> int:
        """Calculate page number (1-indexed)"""
        return (self.skip // self.limit) + 1 if self.limit > 0 else 1

    @property
    def total_pages(self) -> int:
        """Calculate total pages"""
        return (self.total + self.limit - 1) // self.limit if self.limit > 0 else 1
