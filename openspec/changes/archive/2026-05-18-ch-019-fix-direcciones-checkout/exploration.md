# CH-019: Root Cause Analysis — Direcciones & Checkout

## Timeline de los Bugs

```
Bug 1: __tablename__ ausente
  └── ch-009 (direcciones) creó el modelo sin __tablename__
  └── SQLModel infirió "direccionentrega" como table name
  └── Alembic creó "direccion_entrega" (snake_case correcto)
  └── Gap: nadie verificó el name inference de SQLModel
  └── Resultado: TODAS las consultas → 500 UndefinedTableError

Bug 2: timezone en soft_delete
  └── ch-004 (backend-patterns) creó Repository.soft_delete
  └── Usó datetime.now(timezone.utc) → offset-aware
  └── Columnas deleted_at son TIMESTAMP WITHOUT TIME ZONE
  └── asyncpg rechaza offset-aware en columna naive
  └── Resultado: DELETE → DataError

Bug 3: Ruta /mis-direcciones/nueva
  └── ch-013 (cart-ui) / ch-014 (perfil) agregó link en CheckoutPage
  └── Router.tsx nunca recibió la ruta
  └── Resultado: click → 404 page
```

## Lecciones Aprendidas

### SQLModel: `__tablename__` es OBLIGATORIO
La inferencia automática de SQLModel falla con nombres compuestos:
```python
# MAL: SQLModel genera "direccionentrega"
class DireccionEntrega(SQLModel, table=True):
    ...

# BIEN: explícito
class DireccionEntrega(SQLModel, table=True):
    __tablename__ = "direccion_entrega"
```

### Timestamps: Consistentes con el tipo de columna
- `TIMESTAMP WITHOUT TIME ZONE` → `datetime.utcnow()` (naive)
- `TIMESTAMP WITH TIME ZONE` → `datetime.now(timezone.utc)` (aware)
- No mezclar. Ser explícito desde el diseño de la migración.

### Links en UI + Rutas en Router
Cada vez que se agrega un link a una ruta en el frontend, verificar que la ruta exista en el Router. Esto debería ser parte del code review.
