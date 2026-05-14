# CH-007 — Productos CRUD + Gestión de Stock

> **Estado**: Propuesta  
> **Fecha**: 2026-05-12  
> **Fase**: PROPOSE (post-EXPLORE)

---

## Qué

Implementar el **CRUD completo de productos** con gestión de stock, precio exacto (DECIMAL), y asociaciones many-to-many (M2M) a categorías e ingredientes. Incluye backend REST con validaciones RBAC y frontend administrativo.

---

## Por qué

Productos es el **eje central del catálogo**. Sin este módulo:
- ❌ No hay catálogo público (CH-023 está bloqueado)
- ❌ No hay carrito funcional (CH-031 depende de productos)
- ❌ No hay pedidos (CH-008 depende de products)
- ❌ No hay pagos (CH-010 requiere ítems de pedido)

**Blocker crítico del roadmap** (Sprint 2 — Catálogo).

Modelos base ya existen en BD (CH-002), patrones están probados en CH-006 (categorías), y dependencias upstream están resueltas.

---

## Alcance

### Backend

| Componente | Alcance |
|-----------|---------|
| **Modelo SQLModel** | `Producto` (id, nombre, descripcion, precio_base DECIMAL(10,2), stock_cantidad INT, disponible BOOL, categoria_id FK) |
| **M2M Associations** | `ProductoCategoria` (product ↔ multiple categories, es_principal flag) + `ProductoIngrediente` (product ↔ multiple ingredients, es_removible flag) |
| **Soft Delete** | Campo `deleted_at` con filtrado en queries |
| **Endpoints** | 7 total: POST /productos (crear), GET /productos (listar), GET /productos/{id} (detalle), PUT /productos/{id} (actualizar), PATCH /productos/{id}/stock (ajustar stock), DELETE /productos/{id} (soft delete), GET /productos?deleted=true (admin only) |
| **Validaciones** | RBAC require_role(["STOCK", "ADMIN"]), precio >= 0, stock >= 0, categoria_id válida y no eliminada |
| **Transacciones** | UnitOfWork context manager para M2M atomicity |

### Frontend

| Componente | Alcance |
|-----------|---------|
| **Admin Page** | `/admin/productos` — vista administrativa con listado + CRUD |
| **Features** | Hooks (useProducts, useProductCreate, useProductUpdate, useProductDelete, useStockUpdate) |
| **Components** | ProductForm (crear/editar con selector de categorías e ingredientes), ProductList (tabla con paginación), StockManager (ajuste rápido), ProductCard (preview) |
| **Integration** | TanStack Query (useQuery/useMutation) + Zustand (cart state) + Axios (API calls) |

### Database

| Item | Estado |
|------|--------|
| Modelo `Producto` | ✅ Existe en `backend/models/producto.py` (líneas 39-60) |
| Modelo `ProductoIngrediente` | ✅ Existe (líneas 22-28) |
| Modelo `ProductoCategoria` | ✅ Existe (líneas 31-36) |
| Migración | ✅ Existe en `001_initial_schema.py` (líneas 126-171) |
| Constraints | ✅ CHECK precio >= 0, CHECK stock >= 0, FK categoria_id, UNIQUE INDEX nombre |

---

## Endpoints Previstos

### Admin-Only (require_role = ["STOCK", "ADMIN"])

```
POST /api/v1/productos
  → { nombre, descripcion, precio_base, stock_cantidad, disponible, categoria_id, categorias[], ingredientes[] }
  ← ProductoOut (full detail)

GET /api/v1/productos
  → ?page=0&limit=10&deleted=false (admin puede ver eliminados)
  ← { items: [ProductoOut], total, page, limit }

GET /api/v1/productos/{id}
  → sin params
  ← ProductoOut (full detail con categorías e ingredientes)

PUT /api/v1/productos/{id}
  → { nombre, descripcion, precio_base, disponible, categoria_id, categorias[], ingredientes[] }
  ← ProductoOut

PATCH /api/v1/productos/{id}/stock
  → { nuevo_stock: int (>= 0) }
  ← ProductoOut

DELETE /api/v1/productos/{id}
  → sin params
  ← { message: "Producto eliminado" }
```

### Public (no auth required, para CH-023 catálogo)

```
GET /api/v1/productos/publico
  → ?page=0&limit=20&categoria_id=?&q=?
  ← { items: [ProductoOutPublic], total, page, limit }
  
  NOTA: Retorna SOLO productos disponibles (disponible=true, deleted_at=null)
```

---

## Gestión de Stock

### Validaciones

| Nivel | Validación | Acción |
|-------|-----------|--------|
| **Schema Pydantic** | `nuevo_stock >= 0` | Rechazar si < 0 |
| **Service Layer** | Validar antes de UPDATE | Retornar error 400 si inválido |
| **DB Constraint** | `CHECK (stock_cantidad >= 0)` | Defensa secundaria |

### Strategy: Pessimistic

- Backend valida ANTES de actualizar
- PATCH endpoint recibe `nuevo_stock: int` (valor absoluto, no delta)
- Si `nuevo_stock < 0` → error 400 "Stock no puede ser negativo"

### Frontend UX

- Input numérico con validación client-side
- Botones "Incrementar" / "Decrementar" (más intuitivo que input directo)
- Optimistic UI update con rollback si error

---

## Categorías e Ingredientes (M2M)

### Association Strategy: Replace All

**Comportamiento**:
```
PUT /api/v1/productos/123
{
  "categorias": [1, 3],           // reemplaza completamente
  "ingredientes": [
    { "id": 5, "es_removible": true },
    { "id": 7, "es_removible": false }
  ]
}

// Backend:
// 1. DELETE FROM producto_categoria WHERE producto_id = 123
// 2. DELETE FROM producto_ingrediente WHERE producto_id = 123
// 3. INSERT new associations (atomically in UoW)
```

### Soft Delete Consistency

- Si `Categoria.deleted_at != NULL` → no aparece en GET producto
- Si `Ingrediente.deleted_at != NULL` → no aparece en GET producto
- Queries: JOIN con filtro `Categoria.deleted_at IS NULL AND Ingrediente.deleted_at IS NULL`

### ProductoCategoria.es_principal

- Flag booleano
- Marca la categoría principal del producto
- Frontend: selector (una sola puede ser principal)
- Usado en CH-023 catálogo para mostrar categoría destacada

### ProductoIngrediente.es_removible

- Flag booleano
- Si `true`: cliente puede remover ingrediente en pedido (ej: "sin cebolla")
- Si `false`: ingrediente no puede removerse (obligatorio)
- Usado en CH-031 carrito para validar customizaciones

---

## Roles RBAC Involucrados

### STOCK (Gestor de Stock)

- ✅ POST /productos (crear)
- ✅ PUT /productos/{id} (editar)
- ✅ PATCH /productos/{id}/stock (ajustar stock)
- ✅ DELETE /productos/{id} (eliminar)
- ✅ GET /productos (listar)
- ❌ NO: Borrar roles, editar usuarios

### ADMIN (Administrador)

- ✅ Todas las operaciones STOCK + más
- ✅ GET /productos?deleted=true (ver eliminados)
- ✅ Posibilidad futura: hard delete

### PUBLIC (Cliente sin autenticación)

- ✅ GET /api/v1/productos/publico (catálogo filtrado)
- ❌ NO: crear, editar, eliminar, ver stock exacto

---

## Riesgos Identificados en EXPLORE + Mitigaciones

### 🔴 CRÍTICO: Precisión de Precio (Float vs DECIMAL)

| Riesgo | Síntoma | Mitigación |
|--------|---------|-----------|
| Float pierde precisión (0.1 + 0.2 ≠ 0.3) | Totales de pedidos incorrectos | ✅ Usar `Decimal` en SQLModel + Pydantic ✅ Validador schema: `precio_base > 0` ✅ BD CHECK (precio_base >= 0) ✅ Tests con edge cases (0.01, 99.99) |

### 🔴 CRÍTICO: Stock Negativo (Oversell)

| Riesgo | Síntoma | Mitigación |
|--------|---------|-----------|
| Admin actualiza stock a número negativo | Productos sobreventa, inconsistencia con pedidos | ✅ Validar en PATCH: `nuevo_stock >= 0` ✅ BD CHECK (stock_cantidad >= 0) ✅ Service valida ANTES de UPDATE ✅ Considerar lock pesimista si concurrencia alta (implementar en CH-009 si es necesario) |

### 🟠 ALTO: Soft Delete + M2M Consistency

| Riesgo | Síntoma | Mitigación |
|--------|---------|-----------|
| Producto eliminado pero asociaciones visibles | GET /productos/{id} retorna data de producto no existente | ✅ Repository.get_all() filtra `deleted_at IS NULL` ✅ Queries JOIN filtran ambas entidades ✅ Heredar patrón de CH-006 ✅ Tests explícitos para soft delete |

### 🟠 ALTO: M2M Association Atomicity

| Riesgo | Síntoma | Mitigación |
|--------|---------|-----------|
| UPDATE M2M falla a mitad, quedando parcial (2 de 3 ingredientes) | Producto con asociaciones inconsistentes | ✅ UnitOfWork context manager garantiza ACID ✅ DELETE old + CREATE new en mismo bloque ✅ Rollback automático si error ✅ Tests para error a mitad operación |

### 🟡 MEDIO: Categoría Huérfana en Producto

| Riesgo | Síntoma | Mitigación |
|--------|---------|-----------|
| Categoría se elimina, Producto.categoria_id queda inválida | Foreign key roto, queries complejas | ✅ FK constraint existe en BD ✅ Service valida `categoria.deleted_at IS NULL` en create/update ✅ CH-006 patrón: si elimino cat con productos → error 409 ✅ Heredar este comportamiento |

### 🟡 MEDIO: Nombre de Producto No Único

| Riesgo | Síntoma | Mitigación |
|--------|---------|-----------|
| Múltiples productos con mismo nombre | Confusión, UX pobre | ✅ Decidir en SPEC si UNIQUE constraint necesaria ✅ Roadmap no especifica → asumir NO (permitir duplicados) ✅ Agregar constraint si negocio lo requiere |

---

## Estimación de Complejidad y Esfuerzo

### Backend

| Tarea | Estimación | Complejidad |
|-------|-----------|-----------|
| Repository + M2M methods | 3h | Media |
| Service layer + UoW + validaciones | 3h | Media |
| Pydantic schemas + validators | 1.5h | Baja |
| FastAPI router + endpoints | 2h | Baja |
| Tests unitarios + integración | 2.5h | Media |
| **Backend Total** | **~12h** | **Media** |

### Frontend

| Tarea | Estimación | Complejidad |
|-------|-----------|-----------|
| Hooks (useProducts, useProductCreate, etc) | 2h | Baja |
| Components (Form, List, Card, StockManager) | 3h | Media |
| Admin Page + routes | 1.5h | Baja |
| Integration TanStack Query + testing | 2h | Media |
| **Frontend Total** | **~8.5h** | **Media** |

### Database

| Tarea | Estimación | Complejidad |
|-------|-----------|-----------|
| ✅ Modelos + migraciones YA EXISTEN | 0h | N/A |
| Verificar constraints | 0.5h | Baja |
| **Database Total** | **~0.5h** | **Baja** |

### **TOTAL ESTIMADO: ~21h (3 días de trabajo)**

**Complejidad General**: **MEDIA**
- Backend: Patrón conocido (heredado de CH-006)
- M2M + stock: Requiere cuidado, pero sin incógnitas técnicas
- Frontend: Estándar (TanStack Query + componentes)

---

## Dependencias Upstream y Downstream

### Upstream (Debe estar HECHO antes)

| Change | Status | Notas |
|--------|--------|-------|
| **CH-006** (Categorías + Ingredientes) | ✅ Archivado | Endpoints activos, RBAC establecido |
| **CH-005** (Auth + RBAC) | ✅ Completado | require_role() pattern disponible |
| **CH-004** (BaseRepository + UoW) | ✅ Completado | Patrones de transacción listos |
| **CH-003** (Frontend config) | ✅ Completado | FSD, TanStack Query, Zustand listos |
| **CH-002** (Database + modelos) | ✅ Completado | Modelos existen, migraciones aplican |

### Downstream (Bloqueados por CH-007)

| Change | Tipo | Impacto |
|--------|------|--------|
| **CH-023** (Catálogo público) | BLOQUEADOR | Necesita GET /productos/publico |
| **CH-031** (Carrito) | BLOQUEADOR | Necesita obtener productos + precios |
| **CH-008** (Pedidos) | BLOQUEADOR | Necesita validar items contra productos |
| **CH-010** (Pagos MercadoPago) | BLOQUEADOR | Necesita totales exactos (Decimal) |
| **CH-009** (Gestión de Reservas) | OPCIONAL | Puede usar validación de stock |

**Recomendación**: Ejecutar CH-007 antes de cualquier otra en Sprint 2.

---

## Impacto sobre CH-023, Carrito y Pedidos

### CH-023 (Catálogo Público)

```
CH-023 requiere:
- GET /api/v1/productos/publico (listado filtrado)
- Productos visibles SOLO si: disponible=true AND deleted_at=NULL AND categorias exist
- Endpoint retorna: ProductoOutPublic (name, desc, precio, categorias, ingredientes, pero NO admin fields)

CH-007 proporciona:
- ✅ Modelo Producto con todos los campos
- ✅ Validaciones de disponibilidad y soft delete
- ✅ Relaciones M2M
```

### CH-031 (Carrito)

```
CH-031 requiere:
- Obtener datos de producto (nombre, precio, disponible)
- Validar ingredientes removibles
- Calcular total: SUM(precio * cantidad) con Decimal exacto

CH-007 proporciona:
- ✅ Endpoints GET para detalle de producto
- ✅ ProductoIngrediente.es_removible para validación
- ✅ Precio en Decimal (precisión exacta para totales)
```

### CH-008 (Pedidos)

```
CH-008 requiere:
- Validar que productos existan y no estén deleted
- Decrementar stock al confirmar pedido
- Mantener histórico de precios (PrecioHistorico model)

CH-007 proporciona:
- ✅ GET /productos/{id} para validación
- ✅ PATCH /productos/{id}/stock para decremento
- ✅ Soft delete consistency
```

---

## Criterios de Éxito

### Aceptación Backend

- ✅ 7 endpoints implementados (POST, GET all, GET {id}, PUT, PATCH /stock, DELETE, GET publico)
- ✅ RBAC aplicado: require_role(["STOCK", "ADMIN"]) en mutaciones
- ✅ M2M atomicity garantizada (UoW context manager)
- ✅ Stock validation: no negativo, pesimista
- ✅ Precio en Decimal (nunca float), validado >= 0
- ✅ Soft delete: deleted_at filtrado en queries
- ✅ Pydantic schemas con validators
- ✅ Tests: unitarios (repository, service) + integración (endpoints)
- ✅ Cobertura >= 80%
- ✅ Todo linting pasa (pylint, mypy, black)

### Aceptación Frontend

- ✅ Admin page `/admin/productos` funcional
- ✅ CRUD completo vía UI (crear, listar, editar, eliminar, ajustar stock)
- ✅ Selector de categorías (multi-select) + marcar principal
- ✅ Selector de ingredientes (multi-select) + marcar removibles
- ✅ Stock manager con validación (no permitir negativo)
- ✅ Precio con validación (número decimal)
- ✅ TanStack Query queries + mutations funcionando
- ✅ Error handling y validación visible al usuario
- ✅ Responsive design (mobile-friendly)
- ✅ Tests: componentes, hooks (mocking API)
- ✅ Linting pasa (ESLint, TypeScript)

### Aceptación Database

- ✅ Constraints verificados (CHECK precio >= 0, stock >= 0)
- ✅ Soft delete queries correctas (deleted_at IS NULL)
- ✅ M2M relationships intactas
- ✅ FK constraints respetadas

### Aceptación Integration

- ✅ Backend API + Frontend funcionan juntos
- ✅ Errores de validación propagados correctamente
- ✅ UX fluida (no race conditions)
- ✅ Datos persistidos correctamente

---

## Decisiones Técnicas Documentadas

### 1. Decimal para Precio

**Decision**: `Decimal` en SQLModel + Pydantic, nunca `float`

**Rationale**: Precisión exacta para operaciones monetarias. Float es impreciso (0.1 + 0.2 ≠ 0.3).

**Implemented as**:
- SQLModel: `precio_base: Decimal = Field(max_digits=10, decimal_places=2)`
- Pydantic: Validator que asegura `> 0`
- JSON API: Retorna string `"19.99"` (Pydantic auto-convierte)

### 2. Pessimistic Stock Validation

**Decision**: Backend valida `nuevo_stock >= 0` ANTES de actualizar

**Rationale**: Oversell es crítico. Validación pessimista + BD CHECK guarantees data integrity.

**Implemented as**:
- PATCH /productos/{id}/stock recibe `nuevo_stock: int`
- Service valida antes de UPDATE
- BD CHECK constraint como defensa secundaria

### 3. Replace All M2M Strategy

**Decision**: PUT/PATCH elimina todas las asociaciones viejas, inserta todas las nuevas

**Rationale**: Más simple y predecible que merge. Cliente envía lista completa, no deltas.

**Implemented as**:
- DELETE FROM producto_categoria WHERE producto_id = X
- DELETE FROM producto_ingrediente WHERE producto_id = X
- INSERT new (dentro de UoW → atomic)

### 4. Separate Stock Endpoint

**Decision**: PATCH /productos/{id}/stock separado de PUT /productos/{id}

**Rationale**: Stock es crítico, merece lógica y validaciones específicas.

**Implemented as**:
- PATCH /productos/{id}/stock → solo actualiza stock
- PUT /productos/{id} → actualiza otros campos (incluyendo disponible)

### 5. Soft Delete Pattern

**Decision**: Campo `deleted_at` (no eliminación física)

**Rationale**: Auditoría, histórico, reversibilidad.

**Implemented as**:
- BaseRepository.delete() → set deleted_at = NOW()
- Queries filtran deleted_at IS NULL por defecto
- Admin puede ver eliminados (GET ?deleted=true)

---

## Notas Adicionales

### Extensibilidad Futura

- **CH-009 (Reservas)**: Podría usar lock pesimista en stock si concurrencia es problema
- **CH-024 (Descuentos)**: Puede agregar campo `precio_descuentado` sin romper CH-007
- **CH-032 (Reviews)**: Puede referenciar productos sin cambios
- **Variantes**: Si se requieren variantes de producto (color, talla) → nueva tabla ProductoVariante

### Decisión Pendiente (Para SPEC)

- ¿**Nombre de producto debe ser UNIQUE?** Roadmap no especifica. Asumir NO (permitir duplicados) a menos que se indique.

### Testing Strategy

- **Unit tests**: Repository (CRUD, M2M), Service (validaciones), Schemas (validators)
- **Integration tests**: Endpoints (RBAC, validaciones, transacciones)
- **E2E (opcional)**: Admin page CRUD flow

---

## Resumen Ejecutivo

| Aspecto | Detalle |
|---------|---------|
| **Qué** | CRUD completo de productos con M2M y gestión de stock |
| **Por qué** | Bloqueador crítico de catálogo, carrito, pedidos, pagos (Sprint 2) |
| **Alcance** | Backend (7 endpoints) + Frontend (admin page) + BD (modelos ya existen) |
| **Complejidad** | Media (~21h) |
| **Riesgos** | 6 identificados, todos con mitigaciones claras |
| **Dependencias** | Todas resueltas (CH-006, CH-005, CH-004, CH-003, CH-002) |
| **Bloqueadores** | Ninguno |
| **Siguiente Fase** | SPEC (requiere confirmación del usuario) |

---

**Estado**: ✅ **PROPUESTA COMPLETA**

Cuando esté listo, proceder a `/sdd-spec` para escribir especificaciones detalladas.
