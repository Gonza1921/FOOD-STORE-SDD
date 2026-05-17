## Why

El proyecto está ~86% completo pero quedan huecos críticos que afectan la experiencia de compra y el dashboard de administración. Tres user stories clave no están implementadas (US-019 detalle público de producto, US-023 filtro por alérgenos, US-058 top productos) y cuatro están parciales (US-057 ventas por período, US-070 price check al checkout, US-073 rate limiting completo). Sin estos cambios, el catálogo público no permite ver detalle de productos, los clientes con alergias no pueden filtrar, y el dashboard de admin no tiene ranking de productos ni ventas por período granular.

## What Changes

- **Endpoint público de detalle de producto** (`GET /api/v1/productos/{id}/publico`) — accesible sin autenticación, devuelve producto + categorías + ingredientes con `es_alergeno`
- **Filtro de alérgenos en catálogo público** — parámetro `?excluirAlergenos=1,3,7` en `GET /api/v1/productos/publico/catalogo`
- **Price check al checkout** — comparar precios del carrito vs precios actuales en BD antes de crear pedido; notificar al cliente si hubo cambios
- **Top productos más vendidos** — endpoint `GET /api/admin/metricas/productos-top` + widget en dashboard
- **Ventas por período con granularidad** — endpoint `GET /api/admin/metricas/ventas?desde=&hasta=&granularidad=dia|semana|mes`
- **Rate limiting faltante** — registro (3/hora por IP) y creación de pedido (10/hora por usuario)
- **Refactor admin routers a UnitOfWork** — reemplazar `get_db()` directo por `UnitOfWork` en `admin/router.py` y `admin/usuarios_router.py`
- **Tests** — agregar tests para categorías, ingredientes, admin, direcciones service, y router de pedidos

## Capabilities

### New Capabilities
- `catalogo-publico-detalle`: Endpoint público de detalle de producto con categorías e ingredientes
- `admin-metricas-avanzadas`: Top productos más vendidos y ventas por período con granularidad configurable

### Modified Capabilities
- `productos`: Agregar filtro `excluirAlergenos` en catálogo público y endpoint público de detalle
- `pedido-checkout`: Agregar verificación de precios actualizados antes de crear pedido
- `api-rate-limiting`: Extender rate limiting a registro y creación de pedidos
- `pedidos`: Agregar tests de router
- `admin-dashboard`: Agregar endpoint de top productos y ventas por período

## Impact

- **Backend**: 5-6 archivos modificados, 2 nuevos endpoints
  - `backend/productos/router.py` — endpoint público detalle
  - `backend/productos/repository.py` — filtro alérgenos
  - `backend/productos/service.py` — método público
  - `backend/admin/router.py` — métricas avanzadas
  - `backend/admin/usuarios_router.py` — refactor UoW
  - `backend/core/rate_limit.py` — nuevas configs
  - `backend/pedidos/service.py` — price check
  - Varios archivos de test nuevos
- **Frontend**: 2-3 archivos modificados
  - `frontend/src/pages/PublicCatalogPage.tsx` — filtro alérgenos + enlace detalle
  - `frontend/src/pages/CheckoutPage.tsx` — price check notification
  - `frontend/src/features/admin/pages/AdminDashboardPage.tsx` — nuevos widgets
- **Especificaciones**: Se crean `specs/catalogo-publico-detalle/spec.md` y `specs/admin-metricas-avanzadas/spec.md`
