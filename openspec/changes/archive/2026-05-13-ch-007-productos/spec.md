# CH-007 — Especificación: Productos CRUD + Gestión de Stock

> **Estado**: SPEC (Delta Spec)  
> **Fecha**: 2026-05-12  
> **Cambio**: CH-007 — CRUD completo de productos con M2M y stock  
> **Trazabilidad**: proposal.md (Qué/Por qué/Alcance), exploration.md (Riesgos)

---

## 1. Resumen Ejecutivo

**Qué se especifica**: Endpoints REST para CRUD de productos, gestión de stock con validación pessimista, asociaciones many-to-many (M2M) a categorías e ingredientes con atomicity garantizado, soft delete, y RBAC.

**Dominio**: Backend (API REST) + Frontend (Admin UI) + Database (modelos ya existen).

**Riesgos mitigados**:
- R006 (Precisión Precio): Decimal(10,2), validación >= 0, nunca float
- R007 (Stock Negativo): Validación pessimista ANTES de actualizar
- R008 (Soft Delete + M2M): Queries filtran deleted_at IS NULL
- R009 (M2M Atomicity): UoW context manager garantiza ACID
- R010 (Categoría Huérfana): Service valida categoria_id válida + no deleted
- R011 (Nombre Duplicado): Sin UNIQUE constraint (negocio permite duplicados)

---

## 2. Requirements RFC 2119

### MUST (Obligatorios)

| ID | Requerimiento | Detalles |
|----|--------------|----------|
| **R001** | Crear Producto | POST /api/v1/productos MUST aceptar `{ nombre, descripcion?, precio_base, stock_cantidad, disponible, categoria_id, categorias[]?, ingredientes[]? }` y retornar 201 ProductoOut con id, timestamps |
| **R002** | Validar Precio >= 0 | precio_base MUST ser >= 0 (validación schema + BD CHECK). Rechazar con 400 si < 0 |
| **R003** | Validar Stock >= 0 | stock_cantidad MUST ser >= 0 (validación schema + BD CHECK). Rechazar con 400 si < 0 |
| **R004** | Categoría Requerida | categoria_id MUST estar presente, MUST ser FK válida, MUST no estar deleted_at. Rechazar con 400 si no existe o falta |
| **R005** | Listar Productos | GET /api/v1/productos MUST retornar listado paginado (page, limit, total) de ProductoOut, filtrando deleted_at IS NULL por defecto |
| **R006** | Listar Admin (Incluir Eliminados) | GET /api/v1/productos?deleted=true MUST retornar productos eliminados (solo rol ADMIN). Retornar 403 si no autorizado |
| **R007** | Get Detalle | GET /api/v1/productos/{id} MUST retornar ProductoOut completo (con categorías e ingredientes loaded) o 404 si no existe/está deleted |
| **R008** | Actualizar Producto | PUT /api/v1/productos/{id} MUST permitir actualizar nombre, descripcion, precio_base, disponible, categoria_id, categorias[], ingredientes[], retornar 200 ProductoOut o 404 |
| **R009** | Soft Delete | DELETE /api/v1/productos/{id} MUST setear deleted_at = NOW() (no eliminar físicamente). Retornar 200 `{ message: "Producto eliminado" }` o 404 |
| **R010** | Stock Update Endpoint | PATCH /api/v1/productos/{id}/stock MUST aceptar `{ nuevo_stock: int }` y actualizar stock_cantidad. Validar nuevo_stock >= 0. Retornar 200 ProductoOut o 400/404 |
| **R011** | Stock No Negativo | PATCH /stock MUST rechazar con 400 si nuevo_stock < 0. Mensaje: "Stock no puede ser negativo" |
| **R012** | RBAC Mutaciones | POST/PUT/PATCH/DELETE MUST requerir `require_role(["STOCK", "ADMIN"])`. Retornar 403 Forbidden si no autorizado |
| **R013** | RBAC Get List | GET /api/v1/productos MUST requerir `require_role(["STOCK", "ADMIN"])` (solo admin ve todo). Retornar 403 si no autorizado |
| **R014** | Public Endpoint | GET /api/v1/productos/publico MUST retornar SOLO productos disponibles (disponible=true, deleted_at IS NULL, sin admin fields). NO requiere auth |
| **R015** | Public Filtering | GET /productos/publico?categoria_id=X&q=Y MUST filtrar por categoría Y buscar nombre/descripcion por query. Retornar ProductoOutPublic[] paginado |
| **R016** | M2M Categorías Replace All | PUT /productos/{id} con `categorias: [1, 3]` MUST reemplazar completamente (DELETE old, INSERT new en UoW). Retornar 200 con categorías actualizadas |
| **R017** | M2M Ingredientes Replace All | PUT /productos/{id} con `ingredientes: [{ id, es_removible }]` MUST reemplazar completamente. Retornar 200 con ingredientes actualizados |
| **R018** | M2M Atomicity | M2M changes (DELETE old + INSERT new) MUST ser atómicas (UoW context manager). Si error → rollback total. Retornar 400/500 si falla |
| **R019** | Categoría Principal | ProductoCategoria.es_principal MUST marcar una sola categoría como principal. Negocio puede verificar en frontend |
| **R020** | Ingrediente Removible | ProductoIngrediente.es_removible MUST indicar si cliente puede remover en pedido. Frontend valida |
| **R021** | Decimal Precio | Precio MUST ser Decimal(10,2) en todas las capas. JSON retorna string (ej: `"19.99"`), nunca float |
| **R022** | Validar Categoría Existe | Service MUST validar que categoria_id existe y deleted_at IS NULL antes de crear/actualizar. Rechazar con 409 si no existe |
| **R023** | Validar Ingredientes Existen | Service MUST validar que cada ingrediente_id existe y deleted_at IS NULL. Rechazar con 409 si no existe |
| **R024** | Soft Delete Queries | Repository.get_all() y queries MUST filtrar `deleted_at IS NULL` por defecto. Admin puede omitir con `?deleted=true` |
| **R025** | Timestamps | Cada Producto MUST tener creado_en, actualizado_en (UTC). DELETE → actualizado_en = NOW(). Retornar en response |
| **R026** | Response Schema | ProductoOut MUST incluir: id, nombre, descripcion, precio_base (string Decimal), stock_cantidad, disponible, categoria_id, categorias[], ingredientes[], creado_en, actualizado_en, deleted_at (si existe) |
| **R027** | Response Schema Público | ProductoOutPublic MUST incluir: id, nombre, descripcion, precio_base, categorias[], ingredientes[]. SIN: stock_cantidad, disponible, creado_en, actualizado_en, deleted_at, admin fields |
| **R028** | Error Handling | Todos los errores MUST retornar JSON con `{ detail: "mensaje", code: "error_code" }`. Códigos: INVALID_INPUT, NOT_FOUND, UNAUTHORIZED, CONFLICT, etc. |
| **R029** | Validar Nombre Requerido | nombre MUST estar presente (string), max 200 chars. Rechazar con 400 si vacío o > 200 |
| **R030** | Validar Descripción | descripcion MUST ser opcional, max 500 chars si presente. Rechazar con 400 si > 500 |

### SHOULD (Recomendado)

| ID | Requerimiento | Detalles |
|----|--------------|----------|
| **R031** | Paginación Defaults | GET endpoints SHOULD tener defaults: `page=0, limit=20`. Validar limit <= 100 |
| **R032** | Índices para Performance | BD SHOULD tener índices en: producto.nombre (search), producto.categoria_id (FK), producto.deleted_at (soft delete filter) |
| **R033** | Test Coverage | Backend SHOULD alcanzar >= 80% cobertura en repository, service, schemas. Frontend SHOULD alcanzar >= 70% en hooks/componentes |
| **R034** | Logging | Service SHOULD loguear acciones: create, update, delete con usuario_id y timestamp |

### MAY (Opcional, Futuro)

| ID | Requerimiento | Detalles |
|----|--------------|----------|
| **R035** | Hard Delete Admin | Future: Puede agregarse endpoint ADMIN-only DELETE /productos/{id}?hard=true para eliminar físicamente |
| **R036** | Historial Precios | Future: ProductoPrecioHistorico para auditar cambios de precio |
| **R037** | Lock Pesimista Stock | Future: Si concurrencia alta (CH-009 Reservas), considerar lock pesimista en stock updates |

---

## 3. Reglas de Negocio

### Producto

- **nombre**: String, max 200 chars, requerido, puede haber duplicados (no UNIQUE)
- **descripcion**: String opcional, max 500 chars
- **precio_base**: Decimal(10,2), MUST >= 0, MUST > 0 en create (no gratis)
- **stock_cantidad**: INTEGER, MUST >= 0, inicial puede ser 0
- **disponible**: BOOL, toggle manual (true = se vende, false = no se vende)
- **categoria_id**: INT FK (obligatoria), debe ser válida y no deleted_at

### M2M Associations

- **ProductoCategoria** (producto ↔ múltiples categorías):
  - `es_principal`: BOOL, marca categoría principal (negocio elige una)
  - **Replace All strategy**: Actualización reemplaza completamente, no merge

- **ProductoIngrediente** (producto ↔ múltiples ingredientes):
  - `es_removible`: BOOL, permite customización en pedido (remover ingrediente)
  - **Replace All strategy**: Igual que categorías

### Soft Delete

- **deleted_at**: TIMESTAMP optional, NULL = activo, NOT NULL = eliminado
- Queries **por defecto filtran** `deleted_at IS NULL`
- **Admin** puede ver eliminados con `?deleted=true`
- **GET /publico** siempre NO incluye eliminados

### Stock Management

- **Validación pessimista**: Backend valida `nuevo_stock >= 0` ANTES de actualizar
- **BD CHECK** como defensa secundaria: `CHECK (stock_cantidad >= 0)`
- **PATCH** solo para actualizar stock (no PUT)
- Valor es **absoluto** (no delta): `{ nuevo_stock: 95 }` → stock pasa a 95

---

## 4. Escenarios GIVEN/WHEN/THEN

### Sección A: CRUD Básico Backend

#### Scenario A1: Crear Producto Válido

- GIVEN el usuario tiene rol STOCK
- WHEN hace POST /api/v1/productos con `{ nombre: "Pizza Margherita", precio_base: 19.99, stock_cantidad: 50, disponible: true, categoria_id: 1, categorias: [1], ingredientes: [2, 3] }`
- THEN retorna 201 ProductoOut con id, timestamps, categorias, ingredientes poblados
- AND BD registra Producto, ProductoCategoria, ProductoIngrediente (atómicamente)

#### Scenario A2: Crear Producto — Precio Negativo

- GIVEN usuario STOCK envía precio_base = -10
- WHEN POST /api/v1/productos
- THEN retorna 400 `{ detail: "precio_base debe ser >= 0" }`
- AND BD no crea producto

#### Scenario A3: Crear Producto — Stock Negativo

- GIVEN usuario STOCK envía stock_cantidad = -5
- WHEN POST /api/v1/productos
- THEN retorna 400 `{ detail: "stock_cantidad debe ser >= 0" }`
- AND BD no crea producto

#### Scenario A4: Crear Producto — Sin Categoría

- GIVEN usuario STOCK NO envía categoria_id
- WHEN POST /api/v1/productos
- THEN retorna 400 `{ detail: "categoria_id requerido" }`
- AND BD no crea producto

#### Scenario A5: Crear Producto — Categoría No Existe

- GIVEN usuario STOCK envía categoria_id = 999 (no existe)
- WHEN POST /api/v1/productos
- THEN retorna 409 `{ detail: "Categoría no existe o está eliminada" }`
- AND BD no crea producto

#### Scenario A6: Listar Productos

- GIVEN BD tiene 25 productos (20 activos, 5 deleted_at IS NOT NULL)
- WHEN GET /api/v1/productos?page=0&limit=20 (usuario STOCK)
- THEN retorna 200 con `{ items: [20 activos], total: 20, page: 0, limit: 20 }`
- AND incluye SOLO productos con deleted_at IS NULL

#### Scenario A7: Listar Productos — Admin Ve Eliminados

- GIVEN usuario ADMIN hace GET /api/v1/productos?deleted=true
- AND BD tiene 5 productos con deleted_at IS NOT NULL
- WHEN GET /api/v1/productos?deleted=true
- THEN retorna 200 con items que incluyen los 5 deleted (total: 25)

#### Scenario A8: Get Detalle Producto

- GIVEN BD tiene Producto.id=1 con categorias[1, 2], ingredientes[3, 4]
- WHEN GET /api/v1/productos/1 (usuario STOCK)
- THEN retorna 200 ProductoOut con categorias e ingredientes loaded (no lazy)

#### Scenario A9: Get Detalle — Producto No Existe

- GIVEN GET /api/v1/productos/999
- WHEN usuario STOCK hace request
- THEN retorna 404 `{ detail: "Producto no encontrado" }`

#### Scenario A10: Actualizar Producto — Campos Múltiples

- GIVEN Producto.id=1 tiene nombre="Pizza", precio=19.99, categorias=[1]
- WHEN PUT /api/v1/productos/1 con `{ nombre: "Pizza Premium", precio_base: 24.99, categorias: [1, 2] }`
- THEN retorna 200 ProductoOut con nombre="Pizza Premium", precio=24.99, categorias=[1, 2]
- AND ProductoCategoria se reemplaza (Delete old, Insert new)

#### Scenario A11: Soft Delete Producto

- GIVEN Producto.id=1 existe con deleted_at=NULL
- WHEN DELETE /api/v1/productos/1 (usuario STOCK)
- THEN retorna 200 `{ message: "Producto eliminado" }`
- AND BD: Producto.deleted_at = NOW() (no se elimina)
- AND GET /api/v1/productos NO incluye producto (deleted_at IS NULL filter)

#### Scenario A12: Get Producto Eliminado

- GIVEN Producto.id=1 tiene deleted_at != NULL
- WHEN GET /api/v1/productos/1 (usuario STOCK, sin ?deleted=true)
- THEN retorna 404 (filtro soft delete)

---

### Sección B: Gestión de Stock

#### Scenario B1: Actualizar Stock Exitoso

- GIVEN Producto.id=1 tiene stock_cantidad=50
- WHEN PATCH /api/v1/productos/1/stock con `{ nuevo_stock: 45 }`
- THEN retorna 200 ProductoOut con stock_cantidad=45
- AND BD: actualizado_en = NOW()

#### Scenario B2: Stock Update a Cero (Válido)

- GIVEN Producto stock=10
- WHEN PATCH /api/v1/productos/1/stock con `{ nuevo_stock: 0 }`
- THEN retorna 200 con stock_cantidad=0
- AND producto aún está disponible (disponible flag no cambia)

#### Scenario B3: Stock Update Negativo (Rechazado)

- GIVEN usuario STOCK intenta PATCH /stock con nuevo_stock=-5
- WHEN PATCH /api/v1/productos/1/stock
- THEN retorna 400 `{ detail: "Stock no puede ser negativo" }`
- AND BD stock no cambia

#### Scenario B4: Stock Update — Validación Pessimista

- GIVEN BD tiene Producto con stock=10
- WHEN PATCH /api/v1/productos/1/stock con nuevo_stock=15
- THEN validación pasa en service ANTES de actualizar BD
- AND retorna 200 con stock=15

---

### Sección C: M2M Associations — Replace All

#### Scenario C1: Crear Producto con Múltiples Categorías

- GIVEN usuario STOCK envía `{ categorias: [1, 2, 3], ...otros_campos }`
- WHEN POST /api/v1/productos
- THEN retorna 201 ProductoOut
- AND ProductoCategoria tiene 3 registros (1, 2, 3)
- AND transacción es atómica (UoW)

#### Scenario C2: Marcar Categoría Principal

- GIVEN usuario envía `{ categorias: [{ id: 1, es_principal: true }, { id: 2, es_principal: false }] }`
- WHEN PUT /api/v1/productos/1
- THEN retorna 200 con ProductoCategoria.1.es_principal=true, .2.es_principal=false
- AND BD refleja flags correctamente

#### Scenario C3: Actualizar Categorías — Replace All

- GIVEN Producto.id=1 tiene categorias=[1, 2, 3]
- AND nuevas son [2, 3, 4]
- WHEN PUT /api/v1/productos/1 con `{ categorias: [2, 3, 4] }`
- THEN DELETE FROM producto_categoria WHERE producto_id=1 (limpia todas)
- AND INSERT nuevas (2, 3, 4)
- AND respuesta retorna categorias=[2, 3, 4]
- AND operación es atómica (UoW)

#### Scenario C4: Crear Producto con Ingredientes

- GIVEN usuario envía `{ ingredientes: [{ id: 5, es_removible: true }, { id: 6, es_removible: false }] }`
- WHEN POST /api/v1/productos
- THEN retorna 201 con ProductoIngrediente.5.es_removible=true, .6.es_removible=false

#### Scenario C5: Actualizar Ingredientes — Replace All

- GIVEN Producto.id=1 tiene ingredientes=[5, 6, 7]
- AND nuevos son [6, 7, 8]
- WHEN PUT /api/v1/productos/1 con `{ ingredientes: [6, 7, 8] }`
- THEN DELETE old, INSERT new (atómicamente)
- AND respuesta tiene ingredientes=[6, 7, 8]

#### Scenario C6: Validar Ingredientes Existen

- GIVEN usuario envía ingrediente_id=999 (no existe)
- WHEN PUT /api/v1/productos/1
- THEN retorna 409 `{ detail: "Ingrediente no existe o está eliminado" }`
- AND M2M no se actualiza

#### Scenario C7: M2M Error a Mitad de Transacción

- GIVEN UoW comienza DELETE ProductoCategoria
- AND falla INSERT new categoria (BD error)
- WHEN transacción falla
- THEN rollback automático (DELETE no se ejecutó)
- AND retorna 400/500 error
- AND BD está en estado consistente

---

### Sección D: RBAC

#### Scenario D1: Crear Producto — Sin Rol STOCK

- GIVEN usuario es CLIENT (no STOCK ni ADMIN)
- WHEN POST /api/v1/productos
- THEN retorna 403 Forbidden `{ detail: "Insufficient permissions" }`
- AND BD no cambia

#### Scenario D2: Get Admin List — Sin Rol

- GIVEN usuario es PUBLIC (sin auth)
- WHEN GET /api/v1/productos
- THEN retorna 403 Forbidden
- AND no acceso a lista completa

#### Scenario D3: Delete Producto — ADMIN OK

- GIVEN usuario es ADMIN (tiene STOCK implícito)
- WHEN DELETE /api/v1/productos/1
- THEN retorna 200 (autorizado)

---

### Sección E: Public Endpoint

#### Scenario E1: Get Catálogo Público

- GIVEN BD tiene 50 productos (30 disponibles + 20 no disponibles o deleted)
- WHEN GET /api/v1/productos/publico (sin auth)
- THEN retorna 200 ProductoOutPublic[]
- AND incluye SOLO 30 productos (disponible=true, deleted_at IS NULL)
- AND NO incluye admin fields (stock, creado_en, actualizado_en, deleted_at)

#### Scenario E2: Catálogo Público — Sin Admin Fields

- GIVEN GET /api/v1/productos/publico/1
- WHEN cliente accede
- THEN respuesta tiene: id, nombre, descripcion, precio_base, categorias, ingredientes
- AND NO tiene: stock_cantidad, disponible flag, creado_en, actualizado_en, deleted_at

#### Scenario E3: Filtrar por Categoría

- GIVEN GET /api/v1/productos/publico?categoria_id=1
- WHEN cliente especifica categoría
- THEN retorna SOLO productos en ProductoCategoria.categoria_id=1 (disponibles)

#### Scenario E4: Búsqueda por Query

- GIVEN GET /api/v1/productos/publico?q=pizza
- WHEN cliente busca "pizza"
- THEN retorna productos donde nombre ILIKE '%pizza%' OR descripcion ILIKE '%pizza%'
- AND filtrados a disponibles

---

### Sección F: Validación de Campos

#### Scenario F1: Nombre Vacío

- GIVEN usuario envía nombre=""
- WHEN POST /api/v1/productos
- THEN retorna 400 `{ detail: "nombre es requerido" }`

#### Scenario F2: Nombre Demasiado Largo

- GIVEN nombre tiene 201 caracteres (max es 200)
- WHEN POST /api/v1/productos
- THEN retorna 400 `{ detail: "nombre max 200 caracteres" }`

#### Scenario F3: Descripción Demasiado Larga

- GIVEN descripcion tiene 501 caracteres (max es 500)
- WHEN POST /api/v1/productos
- THEN retorna 400 `{ detail: "descripcion max 500 caracteres" }`

#### Scenario F4: Precio Decimal Exacto

- GIVEN precio_base = 19.99 (Decimal con 2 decimales)
- WHEN POST /api/v1/productos
- THEN BD almacena como Decimal(19, 99)
- AND respuesta JSON: `"precio_base": "19.99"` (string, no float)

---

### Sección G: Frontend Admin Page

#### Scenario G1: Admin Page Carga Listado

- GIVEN usuario ADMIN accede a `/admin/productos`
- WHEN página carga
- THEN useProducts hook hace GET /api/v1/productos
- AND lista muestra 20 productos paginados con nombre, precio, stock, acciones

#### Scenario G2: Crear Producto desde Admin UI

- GIVEN form ProductForm está visible
- WHEN usuario completa campos + selecciona categorías + hace submit
- THEN useProductCreate mutation hace POST /api/v1/productos
- AND TanStack Query invalida cache (`productos` queryKey)
- AND lista se refresca automáticamente

#### Scenario G3: Stock Manager Actualiza

- GIVEN usuario hace clic "Decrementar Stock" (botón -1)
- WHEN useStockUpdate mutation hace PATCH /api/v1/productos/{id}/stock
- THEN optimistic UI update (stock baja inmediatamente)
- AND si error → rollback (UI vuelve al valor anterior)

#### Scenario G4: Validación Stock No Negativo

- GIVEN usuario intenta stock=0 → -1 (click decrementar)
- WHEN validación client-side
- THEN botón disabled o input rechaza

#### Scenario G5: Selector Categorías Multiple

- GIVEN ProductForm tiene multi-select de categorías
- WHEN usuario elige [1, 2, 3] + marca una como principal
- THEN form valida que SOLO una sea principal
- AND PUT /productos envía `{ categorias: [{ id, es_principal }] }`

---

## 5. Reglas Técnicas de Implementación

### Arquitectura Backend (Router → Service → UoW → Repository → Model)

- **Router** (`productos/router.py`): Endpoints HTTP, RBAC, request/response validation
- **Service** (`productos/service.py`): Lógica de negocio, validaciones complejas, UoW orchestration
- **UnitOfWork** (`core/uow.py`): Context manager para transacciones ACID, multi-entidad
- **Repository** (`productos/repository.py`): CRUD, queries con soft delete filter, M2M methods
- **Model** (`models/producto.py`): Entidades SQLModel (YA EXISTEN)

**Nunca saltear capas**: Router no llama directamente Repository.

### UnitOfWork Pattern M2M

```python
async with UnitOfWork(db_session) as uow:
    # M2M Replace All
    uow.repo.delete_categorias(producto_id)  # DELETE old
    for cat_id in categorias:
        uow.repo.add_categoria(producto_id, cat_id)  # INSERT new
    # Si error aquí → rollback automático
```

### Soft Delete Filtering

- **Default**: Queries SIEMPRE filtran `WHERE deleted_at IS NULL`
- **Admin Override**: Parámetro `?deleted=true` en GET
- **Public**: NUNCA incluye deleted, incluso con override

```python
query = select(Producto).where(Producto.deleted_at == None)  # Default
if include_deleted:
    query = select(Producto)  # Admin
```

### Decimal para Precio

- **SQLModel**: `Decimal = Field(max_digits=10, decimal_places=2)`
- **Pydantic**: `Decimal` (auto-serializa a string en JSON)
- **Validator**: `@validator('precio_base') lambda v: assert v >= 0`
- **Never**: `float`, `round()`, operaciones lossy

### RBAC Requirement

- `@router.post(..., dependencies=[Depends(require_role(["STOCK", "ADMIN"]))])`
- Retorna 403 si usuario no tiene rol
- Mensajes de error: No exponer detalles (genérico: "Insufficient permissions")

---

## 6. Criterios de Aceptación Verificables

### Backend

| Criterio | Verificación | Status |
|----------|--------------|--------|
| 7 endpoints implementados | POST, GET all, GET {id}, PUT, PATCH /stock, DELETE, GET /publico → todos activos | ⬜ |
| RBAC en mutaciones | POST/PUT/PATCH/DELETE retornan 403 sin rol STOCK/ADMIN | ⬜ |
| Stock >= 0 validado | PATCH /stock rechaza negativo con 400 | ⬜ |
| Precio Decimal | Stored as Decimal(10,2), retorna JSON string | ⬜ |
| Soft delete filtrado | GET /productos NO incluye deleted_at IS NOT NULL | ⬜ |
| M2M Replace All | PUT con categorias nuevas reemplaza completamente | ⬜ |
| M2M Atomicity | Error a mitad de transacción → rollback completo | ⬜ |
| Categoría Validada | Service valida categoria_id existe y no deleted | ⬜ |
| Pydantic Validators | precio >= 0, stock >= 0, nombre required, descripcion max 500 | ⬜ |
| Tests >= 80% | Repository, Service, Schemas cubiertos | ⬜ |
| Linting OK | pylint, mypy, black sin warnings | ⬜ |

### Frontend

| Criterio | Verificación | Status |
|----------|--------------|--------|
| Admin page `/admin/productos` | Ruta existe, componente renderiza | ⬜ |
| CRUD funcional | Crear, listar, editar, eliminar desde UI | ⬜ |
| TanStack Query integrada | useQuery/useMutation funcionan, cache invalida | ⬜ |
| Stock validación client | Input rechaza negativo o botón disabled | ⬜ |
| Precio validación | Input acepta decimales, valida >= 0 | ⬜ |
| M2M selectors | Multi-select categorías e ingredientes | ⬜ |
| Responsive | Funciona en mobile (md:, lg: prefixes) | ⬜ |
| Tests >= 70% | Hooks y componentes críticos cubiertos | ⬜ |
| Linting OK | ESLint, TypeScript compiler sin errores | ⬜ |

### Database

| Criterio | Verificación | Status |
|----------|--------------|--------|
| Constraints CHECK | precio_base >= 0, stock_cantidad >= 0 aplicados | ⬜ |
| FK constraints | categoria_id → categoria.id enforced | ⬜ |
| Soft delete queries | deleted_at IS NULL filter automático | ⬜ |
| M2M relationships | ProductoCategoria, ProductoIngrediente intactos | ⬜ |

---

## 7. Trazabilidad a Propuesta y Exploración

### Riesgos de Propuesta → Mitigados en Spec

| Riesgo | Proposal | Exploration | Spec Mitigation |
|--------|----------|-------------|-----------------|
| Precisión Precio (Float) | R006 § "Validaciones" | 4.1 CRÍTICO | R021 Decimal(10,2), R002 >= 0, Validators |
| Stock Negativo | R007 § "Stock Management" | 4.2 CRÍTICO | R010 R011 PATCH validación pessimista |
| Soft Delete + M2M | R008 § "Soft Delete" | 4.3 ALTO | R024 Queries filter, Test scenarios F5-F7 |
| M2M Atomicity | R009 § "M2M Associations" | 4.4 ALTO | R018 UoW context, Scenario C7 |
| Categoría Huérfana | R010 § "Validaciones" | 4.5 MEDIO | R022 Service valida, R004 requerida |
| Nombre Duplicado | R011 § "Decisión Pendiente" | 4.6 MEDIO | Permitido (sin UNIQUE constraint) |

### Endpoints de Proposal → Spec Requirements

| Endpoint | Proposal | Spec |
|----------|----------|------|
| POST /productos | § "Admin-Only" | R001 MUST create |
| GET /productos | § "Admin-Only" | R005 MUST list, R006 admin deleted |
| GET /productos/{id} | § "Admin-Only" | R007 MUST detail |
| PUT /productos/{id} | § "Admin-Only" | R008 MUST update, R016-R017 M2M |
| PATCH /stock | § "Admin-Only" | R010-R011 MUST pessimistic validation |
| DELETE /productos/{id} | § "Admin-Only" | R009 MUST soft delete |
| GET /productos/publico | § "Public" | R014-R015 MUST public, no auth |

---

## 8. Definición de Éxito: Readiness para DESIGN

### Cobertura

- ✅ 30+ requirements RFC 2119 (MUST/SHOULD/MAY)
- ✅ 20 scenarios GIVEN/WHEN/THEN (CRUD, stock, M2M, RBAC, frontend, validation)
- ✅ Todas reglas de negocio explícitas
- ✅ Criterios verificables (status codes, estados BD, UI behavior)

### No Ambigüedades

- ✅ Qué retornan endpoints (status codes, schemas)
- ✅ Cuándo validan (client-side, server-side)
- ✅ Cómo funcionan M2M (Replace All, no merge)
- ✅ Cómo se comporta soft delete (queries, admin override)

### Trazabilidad 100%

- ✅ Cada requirement → proposal § + exploration § + risk mitigated
- ✅ Cada scenario → backend/frontend/BD aspect cubierto
- ✅ Riesgos identificados → mitigaciones claras

---

## 9. Próximo Paso: DESIGN

**Readiness**: ✅ **100% — LISTO PARA DESIGN**

DESIGN debe cubrir:
1. **Diagrama de capas**: Router → Service → UoW → Repository → Model
2. **Queries M2M**: DELETE old + INSERT new en transacción
3. **Soft delete**: Cómo implementar filter `deleted_at IS NULL` en Repository base
4. **Frontend componentes**: ProductForm, ProductList, StockManager, composición
5. **Validaciones**: Dónde (client vs server), cómo (Pydantic validators, React hooks)

---

**Estado**: ✅ **ESPECIFICACIÓN COMPLETA**

Cuando esté listo, proceder a `/sdd-design` para arquitectura técnica.
