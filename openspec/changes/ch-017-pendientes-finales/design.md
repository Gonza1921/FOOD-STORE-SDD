# Design: CH-017 Pendientes Finales

## Context

El proyecto Food Store está ~86% completado. Quedan 8 cambios pendientes que cubren 3 user stories sin implementar (US-019 detalle público, US-023 filtro alérgenos, US-058 top productos) y 4 parciales (US-057 ventas período, US-070 price check, US-073 rate limiting, tests faltantes). También incluye un refactor de admin routers a UnitOfWork.

**Estado actual por archivo relevante:**
- `backend/productos/router.py`: 7 endpoints, usa `ProductoService` + UoW internamente. Catálogo público existe (`GET /publico/catalogo`) sin filtro alérgenos.
- `backend/productos/repository.py`: `get_public_paginated()` con filtros search + categoria_id. Sin filtro alérgenos.
- `backend/admin/router.py`: Métricas básicas (totales, stock bajo, ingresos/día) usando `get_db()` directo — SIN UoW, SIN `excluirAlergenos`.
- `backend/admin/usuarios_router.py`: CRUD usuarios con `get_db()` directo — SIN UoW.
- `backend/pedidos/service.py`: `create_pedido()` con validación stock + snapshot precio. SIN price check contra carrito.
- `backend/core/rate_limit.py`: Limiter único con `get_remote_address`. SIN configs específicas.
- `frontend/src/pages/PublicCatalogPage.tsx`: Catálogo público sin filtro alérgenos ni enlace a detalle.
- `frontend/src/pages/CheckoutPage.tsx`: Checkout sin manejo de price conflict.
- `frontend/src/features/admin/pages/AdminDashboardPage.tsx`: Dashboard sin widgets de top productos ni ventas período.

**Schemas clave existentes:**
- `IngredienteRef`: `{id, nombre}` — usado en `ProductoOut`, `ProductoOutPublic` — **NO** incluye `es_alergeno`.
- `ProductoOutPublic`: `{id, nombre, descripcion, precio_base, disponible, categorias, ingredientes}` — catálogo público.
- `ProductoOut`: igual + `stock_cantidad, creado_en, actualizado_en` — admin.

## Goals / Non-Goals

**Goals:**
- Endpoint público `GET /api/v1/productos/{id}/publico` con categorías e ingredientes (incluyendo `es_alergeno`)
- Filtro `?excluirAlergenos=1,3,7` en catálogo público
- Price check en checkout → 409 Conflict si precios cambiaron
- `GET /api/v1/admin/metricas/productos-top?limite=N`
- `GET /api/v1/admin/metricas/ventas?desde=&hasta=&granularidad=`
- Rate limiting: registro (3/hora/IP) + create pedido (10/hora/usuario)
- Refactor `admin/router.py` y `admin/usuarios_router.py` a UnitOfWork
- Tests: categorías, ingredientes, admin (métricas), direcciones service, pedido router
- Feature flags implementation

**Non-Goals:**
- NO cambiar lógica de negocio de admin routers (solo transaccionalidad)
- NO agregar dependencias externas nuevas
- NO modificar endpoints existentes de auth, perfil, pagos
- NO reescribir tests existentes
- NO cambiar modelos de base de datos
- NO implementar UI de filtro alérgenos en frontend (solo infraestructura backend + hook)

## Decisions

### Decision 1: Schema de respuesta para detalle público
- **Opción A**: Extender `IngredienteRef` agregando `es_alergeno` como Optional[bool]
- **Opción B**: Crear `IngredientePublicRef` que hereda de `IngredienteRef` y agrega `es_alergeno`
- **Elegido**: **Opción B** porque no modifica contratos existentes. `ProductoOutPublic` (catálogo list) sigue siendo compacto; solo el detalle (`ProductoOutPublicDetail`) incluye `es_alergeno`. Esto evita impacto en clientes que ya consumen el catálogo list.

### Decision 2: Price check — validación en el mismo endpoint o separado
- **Opción A**: Endpoint separado `POST /api/v1/pedidos/price-check` + validación duplicada en `POST /api/v1/pedidos`
- **Opción B**: Agregar `precio_carrito` a cada item del `PedidoCreate` y validar en `create_pedido()` antes de stock
- **Opción C**: Solo comparar en backend, sin enviar precio desde frontend (el backend siempre captura precio actual)
- **Elegido**: **Opción B** porque: (a) evita round-trip extra, (b) el cliente envía el precio que VIO, (c) si hay diff → 409 antes de cualquier mutación. El `precio_carrito` es el precio al que el usuario agrego al carrito; si cambio, backend rechaza con lista de diferencias.

### Decision 3: Filtro alérgenos — subquery NOT IN vs LEFT JOIN/WHERE
- **Opción A**: Subquery: `WHERE p.id NOT IN (SELECT producto_id FROM producto_ingrediente WHERE ingrediente_id IN (...))`
- **Opción B**: `LEFT JOIN` con filter: `LEFT JOIN producto_ingrediente pi ON p.id = pi.producto_id AND pi.ingrediente_id IN (...)` + `WHERE pi.id IS NULL`
- **Opción C**: Cargar todos y filtrar en Python
- **Elegido**: **Opción A** porque es más legible, performante (índices en `producto_ingrediente.ingrediente_id` y `producto_ingrediente.producto_id`) y evita posibles duplicados del LEFT JOIN. SQLAlchemy soporta `~exists()` con subquery.

### Decision 4: Top productos — filtro por estado de pedido
- **Opción A**: Incluir SOLO pedidos CONFIRMADO + ENTREGADO (refleja ventas reales)
- **Opción B**: Incluir todos los estados excepto CANCELADO
- **Opción C**: Incluir todos los estados
- **Elegido**: **Opción A** porque refleja ventas efectivamente concretadas. PENDIENTE puede cancelarse, EN_PREP/EN_CAMINO están en tránsito pero no cerrados. Esta decisión se documenta como ADR para consistencia futura.

### Decision 5: Rate limiting — key function para create pedido
- **Opción A**: Usar `get_remote_address()` (IP) para ambos, con límites diferentes
- **Opción B**: Crear key function personalizada que extrae user_id del JWT
- **Opción C**: Usar `get_remote_address` para registro, key function personalizada para create pedido
- **Elegido**: **Opción C**. Registro es pre-auth → solo IP. Create pedido requiere auth → extraemos `user_id` del token. La key function está en `core/rate_limit.py` y se aplica selectivamente.

### Decision 6: Feature flags — dónde almacenarlos
- **Opción A**: Variables de entorno en backend `.env`
- **Opción B**: Tabla `feature_flags` en PostgreSQL
- **Opción C**: Archivo JSON en backend, recargable sin reinicio
- **Elegido**: **Opción A** con constantes en `core/config.py`. Los flags de Food Store son globales y no requieren toggle por tenant. Si en el futuro se necesita toggle runtime, se migra a DB. Por ahora, `os.getenv("FEATURE_FLAG_NOMBRE", "false").lower() == "true"` es suficiente.

## API Changes

### Modificaciones a Schemas Existentes

| Schema | Archivo | Cambio |
|--------|---------|--------|
| `PedidoCreateItem` (nuevo) | `pedidos/schemas.py` | Agregar `precio_carrito: Decimal` al schema de item |
| `IngredientePublicRef` (nuevo) | `productos/schemas.py` | `{id, nombre, es_alergeno}` |
| `ProductoOutPublicDetail` (nuevo) | `productos/schemas.py` | Como `ProductoOutPublic` pero con `IngredientePublicRef[]` |
| `ProductosTopItem` (nuevo) | `admin/schemas.py` | `{id, nombre, total_vendido, precio_base}` |
| `VentasPeriodoItem` (nuevo) | `admin/schemas.py` | `{periodo, total_ventas, cantidad_pedidos}` |

### Modified Schemas
| Schema | Archivo | Cambio |
|--------|---------|--------|
| `PedidoCreate` | `pedidos/schemas.py` | Items ahora incluyen `precio_carrito: Decimal` |

### New Endpoints

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/productos/{producto_id}/publico` | ❌ No auth | Detalle público de producto con categorías + ingredientes + `es_alergeno` |
| GET | `/api/v1/admin/metricas/productos-top` | ✅ ADMIN | Top N productos más vendidos (SUM cantidad DetallePedido) |
| GET | `/api/v1/admin/metricas/ventas` | ✅ ADMIN | Ventas agrupadas por período con granularidad configurable |

### Modified Endpoints

| Método | Path | Cambio |
|--------|------|--------|
| GET | `/api/v1/productos/publico/catalogo` | Nuevo query param `excluirAlergenos: Optional[str]` (CSV de IDs) |
| POST | `/api/v1/pedidos` | Items ahora requieren `precio_carrito`; responde 409 si hay diferencias |
| POST | `/api/v1/auth/register` | Rate limit: 3/hour/IP |
| POST | `/api/v1/pedidos` (mismo) | Rate limit: 10/hour/user (custom key) |

### Price Check — 409 Response Contract

```json
HTTP 409 Conflict
Content-Type: application/problem+json

{
  "type": "https://foodstore.internal/errors/price-conflict",
  "title": "Precios actualizados",
  "status": 409,
  "detail": "Uno o más productos cambiaron de precio",
  "productos": [
    {
      "id": 1,
      "nombre": "Pizza Margherita",
      "precio_carrito": 1200.00,
      "precio_actual": 1350.00
    }
  ]
}
```

## Feature Flags

Agregar en `backend/core/config.py`:

```python
# Feature flags
FF_CATALOGO_DETALLE_PUBLICO: bool = os.getenv("FF_CATALOGO_DETALLE_PUBLICO", "true").lower() == "true"
FF_FILTRO_ALERGENOS: bool = os.getenv("FF_FILTRO_ALERGENOS", "true").lower() == "true"
FF_PRICE_CHECK: bool = os.getenv("FF_PRICE_CHECK", "true").lower() == "true"
FF_ADMIN_METRICAS_AVANZADAS: bool = os.getenv("FF_ADMIN_METRICAS_AVANZADAS", "true").lower() == "true"
FF_RATE_LIMIT_REGISTRO: bool = os.getenv("FF_RATE_LIMIT_REGISTRO", "true").lower() == "true"
FF_RATE_LIMIT_PEDIDOS: bool = os.getenv("FF_RATE_LIMIT_PEDIDOS", "true").lower() == "true"
```

Cada endpoint/modificación se envuelve en un early return / conditional check para poder desactivar sin deploy.

## Data Model

No se requieren cambios en modelos SQLModel existentes.

## Frontend Changes

### PublicCatalogPage.tsx
- **Filtro alérgenos**: Agregar sección de checkboxes con lista de ingredientes (alérgenos) debajo del search. Multi-select que genera `excluirAlergenos` param.
- **Enlace a detalle**: Cada card de producto debe linkear a `/productos/{id}` (nueva ruta).
- **Nuevo hook**: `usePublicProductoDetail(id)` para la página de detalle.

### CheckoutPage.tsx
- **Price conflict modal/toast**: Si `createPedido` responde 409, mostrar notificación con lista de productos que cambiaron de precio.
- **Opciones**: Botón "Actualizar carrito" (actualiza precios desde respuesta 409) y "Volver al catálogo".
- **Schema cambio**: `PedidoCreate.items[].precio_carrito` debe enviarse desde `useCartStore`.

### AdminDashboardPage.tsx
- **Top productos widget**: Nuevo componente `<TopProductosTable>` debajo de tendencia. Consume `useAdminTopProductos(limite=10)`.
- **Ventas período widget**: Nuevo componente `<VentasPeriodoChart>` con selector de granularidad (día/semana/mes) y date range picker. Consume `useAdminVentasPeriodo({desde, hasta, granularidad})`.

### Nuevas Rutas Frontend
- `/productos/:id` → `ProductoDetailPage` (nuevo)

## Implementation Plan

### 1. Feature Flags (`backend/core/config.py`)
- Agregar constantes FF_* con defaults `true`
- Archivo: `backend/core/config.py`

### 2. Schemas nuevos/modificados
- `backend/productos/schemas.py`: `IngredientePublicRef`, `ProductoOutPublicDetail`
- `backend/admin/schemas.py` (nuevo): `TopProductoResponse`, `VentasPeriodoResponse`
- `backend/pedidos/schemas.py`: modificar `PedidoCreateItem` o similar para incluir `precio_carrito`

### 3. Endpoint detalle público
- `backend/productos/repository.py`: nuevo método `get_public_by_id(producto_id)` — same as `get_con_asociaciones` pero sin check admin
- `backend/productos/service.py`: nuevo método `get_public_by_id(producto_id)`
- `backend/productos/router.py`: nuevo endpoint `GET /{producto_id}/publico`

### 4. Filtro alérgenos
- `backend/productos/repository.py`: modificar `get_public_paginated()` — agregar parámetro `excluir_alergenos: Optional[list[int]]`
- Query: `where(~exists(select(ProductoIngrediente).where(ProductoIngrediente.producto_id == Producto.id, ProductoIngrediente.ingrediente_id.in_(ids))).correlate(Producto))`
- `backend/productos/service.py`: pasar parámetro
- `backend/productos/router.py`: agregar `excluir_alergenos: Optional[str] = Query(None)` + parseo a `list[int]`

### 5. Price check
- `backend/pedidos/schemas.py`: agregar `precio_carrito: Decimal` a item schema
- `backend/pedidos/service.py`: en `create_pedido()`, después de validar producto existe, comparar `producto.precio_base` vs `item.precio_carrito`. Si diff → raise `PriceConflictError` con lista.
- `backend/pedidos/router.py` o `backend/core/exceptions.py`: crear `PriceConflictError` (puede reusar `ConflictError` con detail estructurado). Handler devuelve 409 con lista.
- Frontend `CheckoutPage.tsx`: modificar `handleCheckout` para capturar 409, mostrar modal con `priceDifferences`.

### 6. Top productos
- `backend/admin/metrics_service.py` (nuevo): `get_top_productos(limite=10)`
- Query:
  ```python
  select(
      Producto.id,
      Producto.nombre,
      func.coalesce(func.sum(DetallePedido.cantidad), 0).label("total_vendido"),
      Producto.precio_base,
  ).join(DetallePedido, Producto.id == DetallePedido.producto_id
  ).join(Pedido, DetallePedido.pedido_id == Pedido.id
  ).where(
      Pedido.estado_codigo.in_([EstadoPedido.CONFIRMADO, EstadoPedido.ENTREGADO])
  ).group_by(Producto.id
  ).order_by(func.sum(DetallePedido.cantidad).desc()
  ).limit(limite)
  ```
- `backend/admin/router.py`: usar UnitOfWork, delegar a service. O extraer a `backend/admin/metrics_router.py`.
- **Recomendación**: crear `backend/admin/metrics_router.py` separado para no mezclar con métricas existentes.

### 7. Ventas por período
- `backend/admin/metrics_service.py`: `get_ventas_periodo(desde, hasta, granularidad)`
- Granularidad: `"day"` → `func.date_trunc("day", Pedido.creado_en)`, `"week"` → `func.date_trunc("week", ...)`, `"month"` → `func.date_trunc("month", ...)`
- Query:
  ```python
  select(
      func.date_trunc(granularidad, Pedido.creado_en).label("periodo"),
      func.sum(Pedido.total).label("total_ventas"),
      func.count(Pedido.id).label("cantidad_pedidos"),
  ).where(
      Pedido.creado_en >= desde,
      Pedido.creado_en < hasta + timedelta(days=1),
      Pedido.estado_codigo.in_([EstadoPedido.CONFIRMADO, EstadoPedido.ENTREGADO]),
  ).group_by(func.date_trunc(granularidad, Pedido.creado_en)
  ).order_by(func.date_trunc(granularidad, Pedido.creado_en))
  ```
- `backend/admin/metrics_router.py`: nuevo endpoint
- `backend/admin/schemas.py`: `VentasPeriodoResponse` y `TopProductoResponse`

### 8. Rate limiting
- `backend/core/rate_limit.py`:
  ```python
  from slowapi.util import get_remote_address
  from backend.core.security import decode_access_token

  limiter_register = Limiter(key_func=get_remote_address)
  limiter_pedidos = Limiter(key_func=get_user_id_or_ip)
  ```
- `backend/auth/router.py`: decorar `register` con `@limiter_register.limit("3/hour")`
- `backend/pedidos/router.py`: decorar `create_pedido` con `@limiter_pedidos.limit("10/hour")`

### 9. Refactor admin routers a UnitOfWork
- `backend/admin/router.py`: reemplazar `async with get_db() as db:` → `async with UnitOfWork() as uow:`. Mover queries inline usando `uow.session.execute(...)`.
- `backend/admin/usuarios_router.py`: mismo patrón. Crear `UsuarioAdminService` si la lógica lo justifica, o mantener queries inline.
- **Importante**: No cambiar lógica de negocio. Solo envolver en UoW para consistencia transaccional.

### 10. Tests

| Archivo | Coverage |
|---------|----------|
| `tests/test_categorias_service.py` | CRUD + soft delete + paginación |
| `tests/test_categorias_router.py` | Endpoints HTTP (con test client) |
| `tests/test_ingredientes_service.py` | CRUD + es_alergeno + soft delete |
| `tests/test_ingredientes_router.py` | Endpoints HTTP |
| `tests/test_admin_router.py` | Métricas existentes + nuevas (top productos, ventas período) |
| `tests/test_direcciones_service.py` | CRUD + validación pertenencia usuario |
| `tests/test_pedido_router.py` | Creación, price conflict 409, rate limiting |

## Archivos Afectados

### Backend — Modificados
| Archivo | Cambio |
|---------|--------|
| `backend/core/config.py` | Feature flags |
| `backend/core/rate_limit.py` | Nuevos limiters + key functions |
| `backend/productos/schemas.py` | `IngredientePublicRef`, `ProductoOutPublicDetail` |
| `backend/productos/repository.py` | `get_public_by_id()`, `get_public_paginated()` filtro alérgenos |
| `backend/productos/service.py` | `get_public_by_id()`, pasar filtro alérgenos |
| `backend/productos/router.py` | Nuevo endpoint `/publico`, query param `excluirAlergenos` |
| `backend/pedidos/schemas.py` | `precio_carrito` en item |
| `backend/pedidos/service.py` | Price check en `create_pedido()` |
| `backend/pedidos/router.py` | Rate limit decorator |
| `backend/admin/router.py` | Refactor a UoW |
| `backend/admin/usuarios_router.py` | Refactor a UoW |

### Backend — Nuevos
| Archivo | Propósito |
|---------|-----------|
| `backend/admin/schemas.py` | Schemas para top productos y ventas período |
| `backend/admin/metrics_router.py` | Endpoints de métricas avanzadas (extraído de admin/router.py) |
| `backend/admin/metrics_service.py` | Lógica de top productos y ventas período |

### Frontend — Modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/PublicCatalogPage.tsx` | UI filtro alérgenos, link a detalle |
| `frontend/src/pages/CheckoutPage.tsx` | Manejo de 409 price conflict, enviar `precio_carrito` |
| `frontend/src/features/admin/pages/AdminDashboardPage.tsx` | Widgets top productos + ventas período |
| `frontend/src/features/cart/store.ts` | Almacenar `precioCarrito` en cada item |

### Frontend — Nuevos
| Archivo | Propósito |
|---------|-----------|
| `frontend/src/pages/ProductoDetailPage.tsx` | Página de detalle público de producto |
| `frontend/src/features/admin/components/TopProductosTable.tsx` | Tabla de top productos |
| `frontend/src/features/admin/components/VentasPeriodoChart.tsx` | Chart de ventas por período |
| `frontend/src/features/admin/hooks/useAdminTopProductos.ts` | Hook para consumir top productos |
| `frontend/src/features/admin/hooks/useAdminVentasPeriodo.ts` | Hook para consumir ventas período |
| `frontend/src/features/products/hooks/usePublicProductoDetail.ts` | Hook para detalle público |

## Risks / Trade-offs

| Risk | Probabilidad | Mitigación |
|------|:------------:|:-----------:|
| Price check 409 rompe flujo checkout existente | Alta | Feature flag `FF_PRICE_CHECK`. Frontend debe manejar 409 explícitamente. Si hay clientes que dependen del comportamiento actual, desactivar flag. |
| Filtro alérgenos con subquery NOT IN
 + muchos IDs puede ser lento | Baja | Máximo de IDs en query (~20 alérgenos típicos). Índice en `producto_ingrediente.ingrediente_id`. Si es necesario, cachear resultados. |
| Rate limit en create_pedido puede afectar usuarios legítimos en hora pico | Media | Límite de 10/hora es generoso para un ecommerce de alimentos. Monitorear y ajustar. Feature flag para desactivar. |
| Refactor admin routers puede introducir bugs si cambia lógica sin querer | Baja | Coverage de tests existentes + nuevos. Refactor puramente mecánico: `get_db()` → `UnitOfWork()`, no tocar lógica. |
| Feature flags en env vars requieren reinicio para cambiar | Baja | Aceptable para fase actual. Si se necesita toggle runtime en producción, migrar a tabla DB. |
| `Granularidad` con valores no estándar puede generar SQL injection | Baja | Validar contra whitelist `["day", "week", "month"]`. NO pasar directo a `date_trunc`. Usar mapping: `{"day": func.date_trunc("day", ...)}` |

## Dependencies

| Dependencia | Por qué |
|-------------|---------|
| slowapi (ya instalado) | Rate limiting |
| SQLAlchemy `func.date_trunc` | Ventas por período (PostgreSQL native) |
| Frontend: react-router-dom | Nueva ruta `/productos/:id` |

## Migration Plan

No se requieren migraciones de base de datos. Todos los cambios son aditivos (nuevos endpoints, nuevos filtros en queries existentes).

## Sequence: Price Check Flow

```
Frontend                         Backend
   │                                │
   ├── POST /api/v1/pedidos ──────► │
   │    {items: [{producto_id,      │
   │     cantidad,                  │
   │     precio_carrito}, ...]}     │
   │                                ├── Validar producto existe, disponible
   │                                ├── Comparar precio_carrito vs precio_base
   │                                ├── Si diff > 0: return 409 Conflict
   │◄───────────────────────────────┤    con lista de productos con diff
   │                                │
   ├── Mostrar modal al usuario ──► │
   │   "Estos productos cambiaron   │
   │    de precio"                  │
   │   [Actualizar] [Cancelar]      │
   │                                │
   ├── POST (con precio_actual) ──► │
   │                                ├── Validar stock (existente)
   │                                ├── Crear pedido + snapshots
   │◄───────────────────────────────┤
   │   201 Created                  │
```

## Sequence: Allergen Filter

```
Frontend                         Backend
   │                                │
   ├── GET /publico/catalogo? ────► │
   │ excluirAlergenos=1,3,7        │
   │                                ├── Parse CSV → list[int]
   │                                ├── Subquery NOT EXISTS
   │                                │   WHERE ingrediente_id IN (1,3,7)
   │                                ├── Devolver productos filtrados
   │◄───────────────────────────────┤
```

## ADR-002: Top productos solo incluye CONFIRMADO + ENTREGADO

**Contexto**: Definir qué pedidos cuentan como "vendidos" para el ranking.

**Decisión**: Solo pedidos en estado CONFIRMADO o ENTREGADO.

**Rationale**:
- PENDIENTE puede cancelarse → contaría productos que nunca se vendieron
- EN_PREP y EN_CAMINO están en proceso pero no cerrados
- CONFIRMADO ya descontó stock (venta efectiva)
- ENTREGADO es venta completada

**Consecuencias**:
- Consistente con métrica de ingresos existente (también filtra CONFIRMADO + ENTREGADO)
- Pedidos recién creados no aparecen hasta ser confirmados
