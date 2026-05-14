# Design: CH-007 — Productos CRUD + Gestión de Stock

## Technical Approach

Implementar CRUD de Productos siguiendo **arquitectura por capas unidireccional** (Router → Service → UoW → Repository → Model), heredando patrones probados en CH-006. La capa Service orquesta transacciones ACID via UnitOfWork context manager para garantizar atomicity en operaciones M2M. Stock validation es **pessimistic** (validar ANTES de actualizar). Soft delete filtrado en Repository base.

**Frontend**: Feature-Sliced Design con TanStack Query (server state) + Zustand (client state), componentes Tailwind.

---

## Architecture Decisions

| Decisión | Opción | Alternativa Rechazada | Rationale |
|----------|--------|----------------------|-----------|
| **M2M Strategy** | Replace All (DELETE old + INSERT new) | Merge (add/remove deltas) | Simple, predecible, sin edge cases; cliente envía lista completa |
| **Stock Validation** | Pessimistic (server valida `>= 0` ANTES de UPDATE) | Optimistic (cliente asume éxito) | Stock es crítico; prevenir oversell |
| **Stock Endpoint** | PATCH `/productos/{id}/stock` | PUT `/productos/{id}` | Stock merece lógica específica; permite rate limiting futuro |
| **UoW Scope** | ALL operaciones CRUD | Solo create | Garantiza ACID en M2M; atomic soft delete |
| **Soft Delete Filter** | Default en Repository base | Manual en cada query | Consistency; evitar queries olvidadas |
| **Precio Type** | Decimal(10,2) JSON → string | Float o int | Precisión exacta; nunca "0.1 + 0.2 = 0.3000001" |
| **Eager Load Relations** | selectinload(categorias, ingredientes) | Lazy load | Evita N+1 queries; 1 query en lugar de 21 |

---

## Data Flow

### Request: POST /api/v1/productos

```
Client (ProductForm)
  ↓
Axios POST { nombre, precio_base, categorias[], ingredientes[] }
  ↓
Router: @require_role(["STOCK", "ADMIN"])
  ├─ Pydantic parsing + auto-validation
  ├─ Delegado a Service.crear_producto()
  ↓
Service
  ├─ Validar categoria_id existe (no deleted)
  ├─ Validar categorias[] IDs válidos
  ├─ Validar ingredientes[] IDs válidos
  ├─ UoW context manager (ACID transaction)
  │  ├─ CREATE Producto
  │  ├─ CREATE ProductoCategoria (Replace All)
  │  ├─ CREATE ProductoIngrediente (Replace All)
  │  └─ Auto-commit si OK, auto-rollback si error
  ↓
Response: 201 ProductoOut (con categorias, ingredientes loaded)
```

### Request: PATCH /api/v1/productos/{id}/stock

```
Service.actualizar_stock(producto_id, nuevo_stock)
  ├─ VALIDACIÓN PESSIMISTA: if nuevo_stock < 0 → raise 400
  ├─ UoW
  │  ├─ GET Producto con lock (SELECT FOR UPDATE optional)
  │  ├─ SET stock_cantidad = nuevo_stock
  │  ├─ SET actualizado_en = NOW()
  │  └─ UPDATE → BD CHECK (stock >= 0) defensa secundaria
  ↓
Response: 200 ProductoOut (stock actualizado)
```

---

## File Changes

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `backend/productos/__init__.py` | Create | Nuevo módulo feature |
| `backend/productos/repository.py` | Create | ProductoRepository extends BaseRepository[Producto]; ProductoCategoriaRepository; ProductoIngredienteRepository; M2M methods |
| `backend/productos/schemas.py` | Create | ProductoCreate, ProductoUpdate, ProductoOut, ProductoOutPublic; Pydantic validators (precio >= 0, stock >= 0, nombre required) |
| `backend/productos/service.py` | Create | ProductoService CRUD + stock atomicity + M2M Replace All; todas ops dentro UoW |
| `backend/productos/router.py` | Create | 7 endpoints: POST, GET /, GET /{id}, PUT, PATCH /stock, DELETE, GET /publico; @require_role(["STOCK", "ADMIN"]) en mutaciones |
| `backend/main.py` | Modify | app.include_router(productos_router, prefix="/api/v1", tags=["Productos"]) |
| `frontend/src/features/products/` | Create | Toda carpeta: hooks/, components/, pages/, api/, stores/ |
| `frontend/src/app/Router.tsx` | Modify | Agregar ruta `/admin/productos` → ProductsAdminPage |

---

## Interfaces / Contracts

### Backend: Pydantic Schemas

```python
class ProductoCreate(BaseModel):
    nombre: str = Field(..., max_length=200)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    precio_base: Decimal = Field(..., decimal_places=2)  # >= 0
    stock_cantidad: int = Field(..., ge=0)
    disponible: bool = Field(default=True)
    categoria_id: int
    categorias: Optional[list[int]] = None
    ingredientes: Optional[list[IngredienteAssoc]] = None

class ProductoOut(ProductoCreate):
    id: int
    categoria_id: int
    categorias: list[CategoriaAssoc]  # {id, nombre, es_principal}
    ingredientes: list[IngredienteAssoc]  # {id, nombre, es_removible}
    creado_en: datetime
    actualizado_en: datetime
    deleted_at: Optional[datetime] = None

class ProductoOutPublic(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    precio_base: str  # "19.99" — Decimal → JSON string
    categorias: list[CategoriaAssoc]
    ingredientes: list[IngredienteAssoc]
    # SIN: stock, disponible, timestamps, deleted_at
```

### API Endpoints

| Endpoint | RBAC | Input | Output | Validations |
|----------|------|-------|--------|------------|
| POST /api/v1/productos | STOCK/ADMIN | ProductoCreate | 201 ProductoOut | Validar categoría, ingredientes; Decimal >= 0; stock >= 0 |
| GET /api/v1/productos | STOCK/ADMIN | ?page=0&limit=20&deleted=false | 200 {items, total, page, limit} | Filtrar deleted_at IS NULL por defecto |
| GET /api/v1/productos/{id} | STOCK/ADMIN | — | 200 ProductoOut | 404 si no existe o deleted |
| PUT /api/v1/productos/{id} | STOCK/ADMIN | ProductoUpdate | 200 ProductoOut | M2M Replace All (DELETE old, INSERT new atomically) |
| PATCH /api/v1/productos/{id}/stock | STOCK/ADMIN | {nuevo_stock: int} | 200 ProductoOut | Validar nuevo_stock >= 0 (400 si < 0) |
| DELETE /api/v1/productos/{id} | STOCK/ADMIN | — | 200 {message} | SET deleted_at = NOW() (soft delete) |
| GET /api/v1/productos/publico | PUBLIC | ?page=0&limit=20&categoria_id=?&q=? | 200 {items: ProductoOutPublic[]} | SOLO disponible=true, deleted_at IS NULL |

---

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| **Unit** | Repository CRUD + M2M queries | Mock DB session; test soft delete filter; test eager load |
| **Unit** | Service validations | Test pessimistic stock validation; categoría válida; Decimal precision |
| **Unit** | Pydantic validators | Test precio >= 0; stock >= 0; nombre max 200 |
| **Integration** | Endpoints + RBAC | Test 7 endpoints; 403 sin STOCK/ADMIN; 400/409 validaciones |
| **Integration** | M2M atomicity | Test UoW rollback; error a mitad de transacción |
| **Integration** | Soft delete | Test GET filtra deleted; admin ?deleted=true override |
| **E2E** | Admin CRUD flow | Test ProductForm → ProductList; stock manager; full cycle |

---

## Migration / Rollout

No migration required. Modelos, migraciones, constraints YA EXISTEN en BD (CH-002). Solo implementar: Repository, Service, Router.

---

## Open Questions

- [ ] ¿Nombre de producto debe ser UNIQUE? (Roadmap no especifica; asumir NO)
- [ ] ¿Lock pesimista en stock si concurrencia alta? (Future CH-009)

---

**Status**: ✅ 100% LISTO PARA TASKS — Arquitectura clara, flujos completos, sin ambigüedades.
