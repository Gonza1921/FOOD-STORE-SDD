# Tasks: CH-017 Pendientes Finales

## 1. Setup — Feature Flags y Schemas

- [x] 1.1 Agregar feature flags FF_* en `backend/core/config.py` (FF_CATALOGO_DETALLE_PUBLICO, FF_FILTRO_ALERGENOS, FF_PRICE_CHECK, FF_ADMIN_METRICAS_AVANZADAS, FF_RATE_LIMIT_REGISTRO, FF_RATE_LIMIT_PEDIDOS)
- [x] 1.2 Crear `backend/productos/schemas.py` — `IngredientePublicRef` (id, nombre, es_alergeno) y `ProductoOutPublicDetail` (hereda de ProductoOutPublic con IngredientePublicRef[])
- [x] 1.3 Crear `backend/admin/schemas.py` — `TopProductoItem` (id, nombre, total_vendido, precio_base) y `VentasPeriodoItem` (periodo, total_ventas, cantidad_pedidos)
- [x] 1.4 Modificar `backend/pedidos/schemas.py` — agregar `precio_carrito: Decimal` al schema de item del PedidoCreate

## 2. Backend — Detalle Público de Producto (US-019)

- [x] 2.1 Agregar `get_public_by_id(producto_id: int)` en `backend/productos/repository.py` — query que obtiene producto + categorías + ingredientes con es_alergeno (bajo feature flag)
- [x] 2.2 Agregar `get_public_by_id(producto_id: int)` en `backend/productos/service.py` — validar que producto existe y no está eliminado; 404 si no
- [x] 2.3 Agregar endpoint `GET /api/v1/productos/{producto_id}/publico` en `backend/productos/router.py` — sin autenticación, bajo feature flag, responde con `ProductoOutPublicDetail`
- [x] 3.1 Modificar `get_public_paginated()` en `backend/productos/repository.py` — agregar parámetro `excluir_alergenos: Optional[list[int]]` con subquery NOT EXISTS
- [x] 3.2 Modificar `backend/productos/service.py` — pasar parámetro `excluir_alergenos` desde router a repository
- [x] 3.3 Modificar `GET /api/v1/productos/publico/catalogo` en `backend/productos/router.py` — agregar query param `excluir_alergenos: Optional[str] = Query(None)` con parseo CSV a `list[int]`, bajo feature flag

## 4. Backend — Price Check en Checkout (US-070)

- [x] 4.1 Crear `PriceConflictError` en `backend/core/exceptions.py` o reutilizar `ConflictError` con estructura para lista de productos con diferencias de precio
- [x] 4.2 Modificar `create_pedido()` en `backend/pedidos/service.py` — después de validar que producto existe, comparar `item.precio_carrito` vs `producto.precio_base`. Si hay diferencias, raise `PriceConflictError` con detalle de productos (bajo feature flag)
- [x] 4.3 Agregar handler para `PriceConflictError` que devuelva 409 Conflict con lista de productos según contrato del design
- [x] 4.4 Decorar `POST /api/v1/pedidos` con rate limit 10/hour/user

## 5. Backend — Métricas Avanzadas de Admin (US-057, US-058)

- [x] 5.1 Crear `backend/admin/metrics_service.py` con `get_top_productos(limite: int = 10)` — SUM cantidad DetallePedido agrupado por producto, solo pedidos CONFIRMADO + ENTREGADO
- [x] 5.2 Agregar en `metrics_service.py` — `get_ventas_periodo(desde: date, hasta: date, granularidad: str)` con DATE_TRUNC y whitelist de granularidades
- [x] 5.3 Crear `backend/admin/metrics_router.py` — endpoints `GET /api/v1/admin/metricas/productos-top` y `GET /api/v1/admin/metricas/ventas` con UnitOfWork, bajo feature flag
- [x] 5.4 Registrar `metrics_router` en `backend/main.py` o en `admin/router.py` como sub-router

## 6. Backend — Rate Limiting Completo (US-073)

- [x] 6.1 Agregar en `backend/core/rate_limit.py` — `limiter_register` con key function `get_remote_address` y `limiter_pedidos` con key function personalizada que extrae `user_id` del JWT
- [x] 6.2 Decorar `POST /api/v1/auth/register` con `@limiter_register.limit("3/hour")`

## 7. Backend — Refactor Admin Routers a UnitOfWork

- [x] 7.1 Refactorizar `backend/admin/router.py` — reemplazar `async with get_db() as db:` por `async with UnitOfWork() as uow:` en todos los endpoints de métricas existentes
- [x] 7.2 Refactorizar `backend/admin/usuarios_router.py` — reemplazar `async with get_db() as db:` por `async with UnitOfWork() as uow:` en todos los endpoints CRUD de usuarios

## 8. Backend — Tests

- [ ] 8.1 Crear `backend/tests/test_categorias_service.py` — CRUD + soft delete + paginación
- [ ] 8.2 Crear `backend/tests/test_categorias_router.py` — endpoints HTTP con test client
- [ ] 8.3 Crear `backend/tests/test_ingredientes_service.py` — CRUD + es_alergeno + soft delete
- [ ] 8.4 Crear `backend/tests/test_ingredientes_router.py` — endpoints HTTP
- [ ] 8.5 Crear `backend/tests/test_admin_router.py` — métricas existentes + nuevas (top productos, ventas período)
- [ ] 8.6 Crear `backend/tests/test_direcciones_service.py` — CRUD + validación pertenencia usuario
- [ ] 8.7 Crear `backend/tests/test_pedido_router.py` — creación, price conflict 409, rate limiting

## 9. Frontend — Catálogo Público y Detalle

- [x] 9.1 Modificar `frontend/src/pages/PublicCatalogPage.tsx` — agregar sección de checkboxes con lista de ingredientes alérgenos debajo del search que genera `excluirAlergenos` param
- [x] 9.2 Agregar enlace a detalle de producto en cada card del catálogo (`/productos/{id}`)
- [x] 9.3 Crear `frontend/src/features/products/hooks/usePublicProductoDetail.ts` — hook TanStack Query para consumir `GET /api/v1/productos/{id}/publico`
- [x] 9.4 Crear `frontend/src/pages/ProductoDetailPage.tsx` — página de detalle público con nombre, descripción, precio, imagen, ingredientes y es_alergeno
- [x] 9.5 Agregar ruta `/productos/:id` → `ProductoDetailPage` en el router

## 10. Frontend — Price Check en Checkout

- [x] 10.1 Modificar `frontend/src/features/cart/store.ts` — almacenar `precioCarrito` en cada item del carrito (precio al momento de agregar)
- [x] 10.2 Modificar `frontend/src/pages/CheckoutPage.tsx` — enviar `precio_carrito` en cada item al crear pedido
- [x] 10.3 Agregar manejo de 409 Conflict en CheckoutPage — mostrar modal con lista de productos que cambiaron de precio y opciones "Actualizar carrito" / "Volver al catálogo"

## 11. Frontend — Dashboard Widgets Admin

- [x] 11.1 Crear `frontend/src/features/admin/hooks/useAdminTopProductos.ts` — hook TanStack Query para top productos
- [x] 11.2 Crear `frontend/src/features/admin/hooks/useAdminVentasPeriodo.ts` — hook TanStack Query para ventas por período con parámetros desde/hasta/granularidad
- [x] 11.3 Crear `frontend/src/features/admin/components/TopProductosTable.tsx` — tabla con ranking de productos más vendidos
- [x] 11.4 Crear `frontend/src/features/admin/components/VentasPeriodoChart.tsx` — gráfico de ventas con selector de granularidad (día/semana/mes) y date range picker
- [x] 11.5 Integrar widgets en `frontend/src/features/admin/pages/AdminDashboardPage.tsx`
