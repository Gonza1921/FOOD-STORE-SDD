# CH-007 — Exploración: Productos CRUD + Stock

> **Fase**: EXPLORE  
> **Fecha**: 2026-05-12  
> **Estado**: Investigación completa  

---

## 1. Contexto y Dependencias

### 1.1 ¿Qué es CH-007?

Implementar **CRUD completo de productos** con:
- ✅ Gestión de stock
- ✅ Precio (DECIMAL 10,2 — nunca float)
- ✅ Asociaciones M2M con Categorías e Ingredientes
- ✅ Soft delete
- ✅ Endpoints REST + validaciones RBAC

Roadmap: **CH-022** (Sprint 2 - Catálogo)

### 1.2 Dependencias (Todas Resueltas ✅)

| Dependencia | Status | Evidencia |
|-------------|--------|-----------|
| **CH-006 (Categorías + Ingredientes)** | ✅ Archivado | Endpoints activos, modelos probados, RBAC enforcement |
| **CH-004 (Patrones Backend)** | ✅ Completo | BaseRepository[T], UnitOfWork, require_role establecidos |
| **CH-002 (Database)** | ✅ Completo | Modelos Producto, ProductoCategoria, ProductoIngrediente migrados |
| **CH-003 (Frontend)** | ✅ Completo | FSD, TanStack Query, Zustand, Axios ready |

---

## 2. Investigación de Modelos Existentes

### 2.1 Modelo Producto

**Ubicación**: `backend/models/producto.py` (líneas 39-60)

```python
class Producto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=200, index=True)
    descripcion: Optional[str] = Field(default=None)
    precio_base: Decimal = Field(max_digits=10, decimal_places=2)  # CHECK >= 0
    stock_cantidad: int = Field(default=0, ge=0)                   # CHECK >= 0
    disponible: bool = Field(default=True)                         # Manual toggle
    categoria_id: int = Field(foreign_key="categoria.id", index=True)  # FK
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None, index=True)
```

**Estado en BD**: ✅ Existe en migración `001_initial_schema.py` (líneas 126-146)

**Constraints en BD**:
```sql
CHECK (precio_base >= 0)
CHECK (stock_cantidad >= 0)
UNIQUE INDEX ix_producto_nombre
FOREIGN KEY (categoria_id) REFERENCES categoria(id)
SOFT DELETE via deleted_at
```

### 2.2 Modelo ProductoIngrediente (M:N)

**Ubicación**: `backend/models/producto.py` (líneas 22-28)

```python
class ProductoIngrediente(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", index=True)
    es_removible: bool = Field(default=False)  # Permite customización
```

**Estado en BD**: ✅ Existe en migración (líneas 148-160)

**Índices**: FK indexadas en producto_id e ingrediente_id

### 2.3 Modelo ProductoCategoria (M:N)

**Ubicación**: `backend/models/producto.py` (líneas 31-36)

```python
class ProductoCategoria(SQLModel, table=True):
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    es_principal: bool = Field(default=False)  # Marca categoría primaria
```

**Estado en BD**: ✅ Existe en migración (líneas 162-171)

**PK**: Composite (producto_id, categoria_id) → garantiza unicidad

### 2.4 Resumen de Estructura

```
Producto (1) ←─── (M) ProductoIngrediente ←─ (1) Ingrediente
   │
   ├─ (FK) categoria_id → Categoria.id (REQUIRED)
   │
   └─ (M) ProductoCategoria (M) ← Categoría (múltiples)
```

**Nota Importante**: 
- Producto tiene **categoria_id requerida** (FK obligatoria)
- Pero también se pueden asociar **múltiples categorías** via ProductoCategoria
- ProductoCategoria.es_principal marca cuál es la categoría principal

---

## 3. Patrones Reutilizables desde CH-006

### 3.1 Estructura Modular Backend

**CH-006 Pattern**:
```
backend/categorias/
├── __init__.py
├── repository.py (extends BaseRepository[Categoria])
├── schemas.py    (Pydantic: Create, Update, Out)
├── service.py    (async methods con UoW context manager)
└── router.py     (FastAPI endpoints con require_role)
```

**Aplicar a CH-007**:
```
backend/productos/
├── __init__.py
├── repository.py (extends BaseRepository[Producto])
├── schemas.py    (Pydantic: Create, Update, Out + M2M associations)
├── service.py    (async methods con UoW + stock atomicity)
└── router.py     (FastAPI endpoints con require_role(["STOCK", "ADMIN"]))
```

### 3.2 UnitOfWork Pattern

**CH-006 Patrón Observado**:
```python
async def create(self, data: CategoriaCreate) -> CategoriaOut:
    async with UnitOfWork() as uow:
        repo = uow.register("categorias", CategoriaRepository, Categoria)
        # validaciones...
        obj = await repo.create(categoria)
    return CategoriaOut.model_validate(obj)
```

**Aplicar a CH-007**:
- Usar UoW para todas las operaciones CRUD
- Garantizar atomicity en stock updates (PATCH /stock)
- Manejar M2M associations dentro de la transacción

### 3.3 Repository Extensiones Necesarias

**CH-006 Métodos Base**:
- `get_all()` — lista no eliminados
- `get_by_id()` — por PK
- `create()` — crear entidad
- `update()` — actualizar campos
- `delete()` — soft delete (set deleted_at)

**Métodos Adicionales para CH-007** (no heredados):
- `find_by_categoria()` — productos de una categoría
- `find_by_ingrediente()` — productos con ingrediente
- `add_categoria()` — asociar a ProductoCategoria
- `add_ingrediente()` — asociar a ProductoIngrediente
- `get_con_asociaciones()` — retornar con categorías e ingredientes loaded

### 3.4 RBAC y Roles

**CH-006 Pattern**:
```python
@router.post(
    "/",
    response_model=CategoriaOut,
    dependencies=[Depends(require_role(["ADMIN"]))],
)
```

**CH-007 Aplicación**:
- `POST /productos` → `require_role(["STOCK", "ADMIN"])`
- `PUT /productos/{id}` → `require_role(["STOCK", "ADMIN"])`
- `PATCH /productos/{id}/stock` → `require_role(["STOCK", "ADMIN"])`
- `DELETE /productos/{id}` → `require_role(["STOCK", "ADMIN"])`
- `GET /productos` → `require_role(["STOCK", "ADMIN"])` (admin only)

---

## 4. Riesgos Técnicos Identificados

### 4.1 🔴 Riesgo CRÍTICO: Precisión de Precio (Float vs DECIMAL)

**Riesgo**:
```python
# ❌ INCORRECTO — Float puede perder precisión en operaciones
precio: float = 19.99
total = precio * cantidad  # Puede resultar en 19.989999...

# ✅ CORRECTO — DECIMAL mantiene precisión
precio: Decimal = Decimal("19.99")
```

**En CH-007**:
- Modelo: `precio_base: Decimal = Field(max_digits=10, decimal_places=2)` ✅
- Migración BD: `sa.Numeric(precision=10, scale=2)` ✅
- **Acción**: Validar en schema que sea Decimal, no float
- **Impacto**: CRÍTICO — errores de cálculo en pedidos
- **Mitigación**: 
  - ✅ BD CHECK (precio_base >= 0)
  - ✅ Pydantic validator: `precio_base > 0`
  - ✅ Nunca usar float en cálculos

### 4.2 🔴 Riesgo CRÍTICO: Stock Negativo (Oversell)

**Riesgo**:
```python
# Escenario: Stock inicial = 5
# Cliente 1 compra 4 → stock = 1
# Cliente 2 compra 2 → stock = -1 ❌ OVERSELL

# PATCH /productos/{id}/stock
# { "nuevo_stock": 2 }  # Puede ser cualquier número
```

**En CH-007**:
- Modelo: `stock_cantidad: int = Field(default=0, ge=0)` ✅
- Migración BD: `sa.CheckConstraint('stock_cantidad >= 0')` ✅
- **Acción**: Validar endpoint PATCH que decremento no sea mayor que stock
- **Impacto**: CRÍTICO — oversell, productos no disponibles
- **Mitigación**:
  - ✅ BD CHECK (stock_cantidad >= 0)
  - ✅ Endpoint PATCH: validar `nuevo_stock >= 0`
  - ✅ En pedidos: validar stock antes de crear item (CH-008+)
  - ✅ Considerar lock pesimista si hay concurrencia alta

### 4.3 🟠 Riesgo ALTO: Soft Delete + M2M Consistency

**Riesgo**:
```python
# Escenario: Producto eliminado (soft delete)
# Pero ProductoCategoria y ProductoIngrediente aún existen
# ¿Qué retorna GET /productos/{id}?

DELETE /api/v1/productos/123  # soft delete (deleted_at = NOW())
GET /api/v1/productos/123     # ¿404 o 200 con deleted_at?
GET /api/v1/productos         # ¿Incluir eliminados?
```

**En CH-007**:
- Necesidad: queries deben filtrar `deleted_at IS NULL` por defecto
- **Acción**: 
  - Repository.get_all() → filtrar deleted_at
  - Endpoint GET / → NO incluir eliminados
  - Admin podría tener GET /productos?incluir_eliminados=true
- **Impacto**: ALTO — datos inconsistentes
- **Mitigación**:
  - ✅ BaseRepository ya maneja soft delete
  - ✅ Heredar patrón de CH-006 (categorías)
  - ✅ Tests explícitos para soft delete queries

### 4.4 🟠 Riesgo ALTO: M2M Association Atomicity

**Riesgo**:
```python
# PATCH /productos/{id}/ingredientes
# { "ingrediente_ids": [1, 2, 3] }

# Si se produce error a mitad de la operación:
# - Se crea ProductoIngrediente.1
# - Se crea ProductoIngrediente.2
# - ERROR: ProductoIngrediente.3 falla
# Resultado: Producto con 2 ingredientes, no 3 ❌ Inconsistencia
```

**En CH-007**:
- Necesidad: operación M2M debe ser **todo o nada**
- **Acción**: 
  - Usar UnitOfWork context manager
  - DELETE old associations
  - CREATE new associations
  - Si error → auto rollback
- **Impacto**: ALTO — asociaciones parciales
- **Mitigación**:
  - ✅ UoW con transacciones ACID garantiza atomicity
  - ✅ DELETE all old, CREATE all new en un bloque try/except
  - ✅ Tests para error a mitad de operación

### 4.5 🟡 Riesgo MEDIO: Categoría Huérfana en Producto

**Riesgo**:
```python
# Escenario: Producto.categoria_id = 5 (obligatorio)
# Pero Categoría.5 se elimina (soft delete)
# Ahora Producto apunta a categoría eliminada ❌

DELETE /api/v1/categorias/5  # soft delete
GET /api/v1/productos/123    # categoria_id=5, pero categoría no existe
```

**En CH-007**:
- Necesidad: asegurar que categoria_id siempre sea válida
- **Acción**:
  - Cuando se create Producto: validar que categoria_id existe y NO deleted
  - Cuando se update Producto: validar lo mismo
  - Considerar: ¿Qué hacer si se elimina una categoría con productos?
- **Impacto**: MEDIO — referencia rota, queries complejas
- **Mitigación**:
  - ✅ FK constraint en BD (existe)
  - ✅ Validar en service: `categoria.deleted_at IS NULL`
  - ✅ En CH-006 (categorías): si se elimina cat con productos → error 409
  - ℹ️ Heredar este comportamiento

### 4.6 🟡 Riesgo MEDIO: Nombre de Producto No Único

**Riesgo**:
```python
# Modelo: nombre: str = Field(max_length=200, index=True)
# Sin UNIQUE constraint
# Resultado: Múltiples productos con mismo nombre
# ¿Es un problema? Dependería del negocio

# Si es requerido: UNIQUE (nombre)
# Si es opcional: Sin constraint
```

**En CH-007**:
- Decisión: ¿Nombres deben ser únicos?
- Roadmap: No especifica
- **Acción**: Definir en spec/proposal
- **Impacto**: BAJO — depende de negocio
- **Mitigación**: Agregar UNIQUE constraint si es necesario en migración

---

## 5. Investigación del Frontend

### 5.1 Estado de TanStack Query

**CH-003 Setup**: ✅ TanStack Query configurado en `frontend/src/app`

```typescript
// Patrón esperado
const useProducts = () => {
  return useQuery({
    queryKey: ['productos'],
    queryFn: () => axiosClient.get('/api/v1/productos'),
  });
};
```

**Para CH-007**: Reutilizar exactamente este patrón

### 5.2 FSD Structure

**Ubicación esperada**:
```
frontend/src/features/products/
├── hooks/
│   ├── useProducts.ts
│   ├── useProductCreate.ts
│   ├── useProductUpdate.ts
│   └── useProductDelete.ts
├── components/
│   ├── ProductForm.tsx
│   ├── ProductList.tsx
│   ├── ProductCard.tsx
│   └── StockManager.tsx
├── pages/
│   └── ProductsAdminPage.tsx
└── index.ts
```

**Patrones observados en CH-003 y CH-006**:
- ✅ Hooks con TanStack Query
- ✅ Componentes con Tailwind (no CSS separado)
- ✅ Pages ensamblan todo
- ✅ Barrel exports en index.ts
- ✅ Tipos en frontend/src/entities/

---

## 6. Decisiones Clave Identificadas

### 6.1 Gestión de Stock — ¿Optimistic Update o Pessimistic?

**Opción 1: Optimistic** (Frontend actualiza inmediatamente)
```typescript
// Frontend: asume que el update va a funcionar
setStock(newStock);
// Backend: intenta actualizar
PATCH /productos/{id}/stock
```
Ventaja: UX rápida | Desventaja: Race condition si falla

**Opción 2: Pessimistic** (Backend valida antes)
```typescript
// Frontend: envía request y espera
PATCH /productos/{id}/stock
// Backend: valida stock >= 0, luego actualiza
```
Ventaja: Seguro | Desventaja: UX más lenta

**Recomendación**: Pessimistic para stock (crítico) + optimistic UI update con rollback

### 6.2 M2M Association Strategy — ¿Replace All o Merge?

**Escenario**:
```
Producto actual: [Ingrediente 1, 2, 3]
Request: { ingrediente_ids: [2, 3, 4] }
```

**Opción 1: Replace All**
```sql
DELETE FROM producto_ingrediente WHERE producto_id = X;
INSERT INTO producto_ingrediente (producto_id, ingrediente_id) VALUES (X, 2), (X, 3), (X, 4);
```
Resultado: [2, 3, 4] ← Limpio, predecible

**Opción 2: Merge** (add/remove diferencial)
```sql
-- Remover: 1
DELETE FROM producto_ingrediente WHERE producto_id = X AND ingrediente_id = 1;
-- Agregar: 4
INSERT INTO producto_ingrediente (producto_id, ingrediente_id) VALUES (X, 4);
```
Resultado: [2, 3, 4] ← Complejo, menos predictible

**Recomendación**: Replace All (más simple, predecible, sin edge cases)

### 6.3 Endpoint de Stock — ¿PATCH o POST?

**Opción 1: PATCH** (partial update)
```
PATCH /api/v1/productos/{id}/stock
{ "cantidad": -5 }  → decrementar 5
```

**Opción 2: POST** (action)
```
POST /api/v1/productos/{id}/ajustar-stock
{ "operacion": "decrementar", "cantidad": 5 }
```

**Opción 3: PUT** (full update)
```
PUT /api/v1/productos/{id}
{ "stock_cantidad": 95 }  → set a 95
```

**Recomendación**: 
- **PATCH /productos/{id}/stock** → para decrementar/incrementar
- **PUT /productos/{id}** → para actualizar cualquier campo (incluyendo stock)

---

## 7. Checklist de Implementación Preview

### Backend
- [ ] `backend/productos/__init__.py`
- [ ] `backend/productos/repository.py` (+ M2M methods)
- [ ] `backend/productos/schemas.py` (Pydantic validators)
- [ ] `backend/productos/service.py` (CRUD + M2M + stock atomicity)
- [ ] `backend/productos/router.py` (7 endpoints + RBAC)
- [ ] Registrar router en `backend/main.py`

### Frontend
- [ ] `frontend/src/features/products/` (toda la carpeta)
- [ ] Actualizar `frontend/src/shared/api/endpoints.ts`
- [ ] Actualizar `frontend/src/app/Router.tsx` (ruta /admin/productos)
- [ ] Actualizar exports en `frontend/src/features/index.ts` y `frontend/src/pages/index.ts`

### Database
- [ ] ✅ Modelos ya existen (Producto, ProductoCategoria, ProductoIngrediente)
- [ ] ✅ Migraciones ya aplican (001_initial_schema.py)
- [ ] Verificar constraints (CHECK precio >= 0, CHECK stock >= 0)

---

## 8. Conclusiones Principales

### ✅ Hallazgos Positivos

1. **Modelos ya existen en BD** → No hay migraciones necesarias
2. **Patrones claros en CH-006** → Fácil de reutilizar
3. **Constraints de BD presentes** → precio_base >= 0, stock_cantidad >= 0
4. **RBAC establecido** → require_role() + roles STOCK/ADMIN disponibles
5. **Soft delete pattern probado** → heredar de BaseRepository

### ⚠️ Riesgos a Mitigar

1. **Precisión de Precio** → Usar Decimal, validar en schema
2. **Stock Negativo** → Validar en PATCH /stock que no sea negativo
3. **Soft Delete + M2M** → Filtrar deleted_at en queries
4. **M2M Atomicity** → UoW context manager garantiza ACID
5. **Categoría Huérfana** → Validar categoria_id en create/update

### 🎯 Recomendaciones

1. Aplicar patrón Feature-First (backend/productos/) + FSD (frontend/features/products/)
2. Usar UnitOfWork para ALL operaciones (no solo create)
3. Stock updates con PATCH (not PUT)
4. M2M: Replace All strategy (no merge)
5. Heredar RBAC de CH-006 (require_role para STOCK/ADMIN)

---

## 9. Readiness para Proposal

**Estado**: ✅ **LISTO PARA PROPOSAL**

- ✅ Modelos investigados
- ✅ Patrones identificados
- ✅ Riesgos documentados
- ✅ Estructura modular clara
- ✅ Decisiones técnicas claras
- ✅ No hay bloqueadores

**Próximo Paso**: Crear `proposal.md` con:
- Qué: CRUD completo
- Por qué: Desbloqueador de catálogo público (CH-023) y carrito (CH-031)
- Alcance: Backend + Frontend
- Complejidad: Media (5h estimadas)
- Riesgos: Con mitigaciones claras
