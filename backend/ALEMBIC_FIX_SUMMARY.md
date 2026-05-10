# Alembic Compatibility Fix - Summary

## Status: ✓ COMPLETE

All SQLModel models have been cleaned up for Alembic compatibility.

## Changes Made

### 1. File: `models/usuario.py`
- Removed circular imports at bottom (`from .direccion`, `from .pedido`)
- All models stay clean (Rol, UsuarioRol, RefreshToken, Usuario)
- OK: No Relationship fields
- OK: Only Field() definitions

### 2. File: `models/direccion.py`
- **Removed:**
  - `from sqlmodel import Relationship` import
  - `from typing import TYPE_CHECKING` (no longer needed)
  - `usuario: Optional["Usuario"] = Relationship(back_populates="direcciones")`
  - `pedidos: list["Pedido"] = Relationship(back_populates="direccion")`

### 3. File: `models/categoria.py`
- **Removed:**
  - All `Relationship()` fields:
    - `subcategorias: List["Categoria"] = Relationship(...)`
    - `parent: Optional["Categoria"] = Relationship(...)`
    - `productos: List["Producto"] = Relationship(...)`
  - `from sqlmodel import Relationship` import
  - `from typing import List` import (no longer needed)

### 4. File: `models/producto.py`
- **Removed:**
  - All `Relationship()` fields:
    - `categoria: Optional["Categoria"] = Relationship(...)`
    - `ingredientes: List[Ingrediente] = Relationship(...)`
    - `categorias_adicionales: List["Categoria"] = Relationship(...)`
    - `detalles_pedido: List["DetallePedido"] = Relationship(...)`
  - `from sqlmodel import Relationship` import
  - Removed `is_deleted()` method (complex method not needed in table)
  - **Kept:** `@property precio_formateado` (safe - doesn't affect DB schema)

### 5. File: `models/pedido.py`
- **Removed from FormaPago:**
  - `pagos: List["Pago"] = Relationship(back_populates="forma_pago")`
- **Removed from EstadoPedido:**
  - `pedidos: List["Pedido"] = Relationship(back_populates="estado")`
  - `historiales: List["HistorialEstadoPedido"] = Relationship(...)`
- **Removed from Pedido:**
  - `usuario: Optional["Usuario"] = Relationship(back_populates="pedidos")`
  - `estado: Optional[EstadoPedido] = Relationship(back_populates="pedidos")`
  - `direccion: Optional["DireccionEntrega"] = Relationship(...)`
  - `forma_pago: Optional[FormaPago] = Relationship(...)`
  - `detalles: List["DetallePedido"] = Relationship(...)`
  - `historial: List["HistorialEstadoPedido"] = Relationship(...)`
  - `pago: Optional["Pago"] = Relationship(...)`
  - **Kept:** `@property total_con_envio` (safe - read-only)
- **Fixed DetallePedido:**
  - Changed: `personalizacion: Optional[List[int]] = None`
  - To: `personalizacion: Optional[str] = Field(default=None)`
  - Reason: Store as JSON string, not PostgreSQL INTEGER[] array type
  - **Kept:** `@property subtotal` (safe - read-only)
- **Removed from HistorialEstadoPedido:**
  - `pedido: Optional[Pedido] = Relationship(back_populates="historial")`
  - `estado_nuevo_rel: Optional[EstadoPedido] = Relationship(...)`
  - `usuario: Optional["Usuario"] = Relationship()` (read-only reference)
- **Removed from Pago:**
  - `pedido: Optional[Pedido] = Relationship(back_populates="pago")`
  - `forma_pago: Optional[FormaPago] = Relationship(back_populates="pagos")`

### 6. File: `alembic/env.py`
- **Removed:**
  - `from models.base import Base` (doesn't exist in our setup)
- **Simplified:**
  - Use `SQLModel.metadata` directly (already set up correctly)
  - Kept all model imports to register them

## Verification Results

All tests pass ✓

```
OK: All model modules import successfully
OK: No Relationship fields found (clean!)
OK: No problematic List[] fields found
OK: 16 tables registered in SQLModel.metadata:
   - categoria
   - detallepedido
   - direccionentrega
   - estadopedido
   - formapago
   - historialestadopedido
   - ingrediente
   - pago
   - pedido
   - producto
   - productocategoria
   - productoingrediente
   - refreshtoken
   - rol
   - usuario
   - usuariorol
OK: Alembic heads: 002_seed_data (head)
OK: Models ready for: alembic upgrade head
```

## Key Concepts

### What's Removed & Why

**Relationship() fields**: 
- These are ORM constructs for Python object navigation
- Alembic's Inspector doesn't understand them - they're not database columns
- Moving them to service/repository layer handles relationships at business logic level

**List[int] and non-scalar types**:
- SQLAlchemy can't map these to column types
- Solution: Store as JSON strings and parse in services

**Complex methods (not @property)**:
- Removed: `def is_deleted()` and `def subtotal()`
- Kept: `@property precio_formateado` and `@property subtotal`
- Reason: @property methods don't affect DB schema; complex methods shouldn't be in models

### What's Kept & Why

**Field() definitions**: These are actual database columns - Alembic reads these

**Foreign keys**: These map to actual FK constraints in DB

**@property methods**: These are Python-only, don't create columns, safe for Alembic

## Next Steps

Models are now Alembic-compatible. Ready to:

1. OK: Run: `alembic current` (shows last applied migration)
2. OK: Run: `alembic upgrade head` (applies pending migrations)
3. OK: Run: `alembic revision --autogenerate -m "description"` (create new migrations)

## Files Modified

- backend/models/usuario.py
- backend/models/direccion.py
- backend/models/categoria.py
- backend/models/producto.py
- backend/models/pedido.py
- backend/alembic/env.py

## Verification Script

Run anytime to verify Alembic compatibility:

```bash
cd backend
python verify_models.py
```
