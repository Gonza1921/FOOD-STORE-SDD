# Tareas: CH-029 Filtros y Ordenamiento de Productos

## Fase 1: Preparación y Índices de Base de Datos

- [ ] 1.1 Crear migration Alembic para índice compuesto `(categoria_id, precio_base)` en tabla `producto`
- [ ] 1.2 Crear migration Alembic para índice de fecha `creado_en DESC` en tabla `producto`
- [ ] 1.3 Validar sintaxis SQL para PostgreSQL (conversión DECIMAL en filtro de precio)
- [ ] 1.4 Documentar procedimiento de rollback en archivo migration
- [ ] 1.5 Verificar aplicación de migrations contra base de datos de desarrollo

**Archivos afectados:**
- `backend/migrations/alembic/versions/{timestamp}_add_producto_indexes.py`

**Criterio de éxito:** Ambos índices creados y verificables en `\d+ producto` en psql.

---

## Fase 2: Backend - Extensión de Service y Repository

- [ ] 2.1 Extender firma de `ProductoService.get_public_paginated()` con parámetros `precio_min`, `precio_max`, `sort_by`
- [ ] 2.2 Agregar validación de parámetros en service: `precio_min <= precio_max`, enum `sort_by` válido
- [ ] 2.3 Implementar lógica de filtro de precio en `ProductoRepository.get_public_paginated()` con WHERE dinámico
- [ ] 2.4 Implementar lógica de ordenamiento dinámico según `sort_by` (5 casos: price_asc, price_desc, nombre_asc, nombre_desc, reciente)
- [ ] 2.5 Agregar selectinload para evitar N+1 (eager-load ingredientes y categorías)
- [ ] 2.6 Verificar compatibilidad con filtro de alergenos existente (AND lógico, no se reemplazan)

**Archivos afectados:**
- `backend/productos/service.py` — agregar parámetros a `get_public_paginated()`
- `backend/productos/repository.py` — implementar filtros y ordenamiento en query builder

**Criterio de éxito:** Método retorna `tuple[list[Producto], int]` con paginación correcta y filtros aplicados.

---

## Fase 3: Backend - Schemas y Router

- [ ] 3.1 Crear schema Pydantic `PaginatedProductList` con campos: `items`, `total`, `page`, `limit`, `has_next`, `has_prev`
- [ ] 3.2 Extender endpoint `GET /api/v1/productos/publico/catalogo` con parámetros query: `precio_min`, `precio_max`, `sort_by`
- [ ] 3.3 Agregar validaciones en router: `precio_min > precio_max` → 400, `sort_by` invalid → 400 con regex
- [ ] 3.4 Implementar lógica de cálculo de paginación: `page = (skip // limit) + 1`, `has_next = (skip + limit) < total`
- [ ] 3.5 Convertir respuesta a `PaginatedProductList` antes de retornar al cliente
- [ ] 3.6 Actualizar docstring del endpoint con ejemplos de query params

**Archivos afectados:**
- `backend/productos/schemas.py` — crear schema `PaginatedProductList`
- `backend/productos/router.py` — modificar handler `/publico/catalogo`

**Criterio de éxito:** Endpoint retorna 200 con estructura exacta, 400 con validaciones fallidas.

---

## Fase 4: Frontend - Hooks y State Management

- [ ] 4.1 Crear hook `useProducts.ts` con TanStack Query: queryKey incluye filtros como dependencies
- [ ] 4.2 Implementar queryFn que convierte USD a centavos antes de enviar al backend
- [ ] 4.3 Configurar staleTime (5 minutos) y gcTime (10 minutos)
- [ ] 4.4 Crear Zustand store `useProductFilters.ts` con estado: `priceMin`, `priceMax`, `sortBy`, `page`
- [ ] 4.5 Implementar acciones: `setPriceRange()`, `setSortBy()`, `setPage()`, `clearFilters()`, `hydrate()`
- [ ] 4.6 Implementar `useFiltersHydration()` hook para localStorage persistence (read on mount, write on state change)

**Archivos afectados:**
- `frontend/src/features/products/hooks/useProducts.ts` — crear
- `frontend/src/features/products/hooks/useProductFilters.ts` — crear

**Criterio de éxito:** Zustand state persiste en localStorage, TanStack Query deduplicaba requests idénticos.

---

## Fase 5: Frontend - Componentes de Filtro

- [ ] 5.1 Crear componente `PriceRangeFilter.tsx` con dos inputs numéricos (min/max)
- [ ] 5.2 Validar que `minPrice <= maxPrice` antes de habilitare botón "Filtrar"
- [ ] 5.3 Mostrar error inline: "El mínimo no puede ser mayor al máximo"
- [ ] 5.4 Crear componente `SortDropdown.tsx` con 5 opciones (reciente, price_asc, price_desc, nombre_asc, nombre_desc)
- [ ] 5.5 Mapear labels en español a valores backend
- [ ] 5.6 Aplicar estilos Tailwind responsive: desktop (col-span-3) y mobile (full-width accordion)

**Archivos afectados:**
- `frontend/src/features/products/components/PriceRangeFilter.tsx` — crear
- `frontend/src/features/products/components/SortDropdown.tsx` — crear

**Criterio de éxito:** Componentes renderizan sin errores, validaciones trabajan offline.

---

## Fase 6: Frontend - Integración en ProductCatalog

- [ ] 6.1 Crear o actualizar componente `ProductCatalog.tsx` integrando todos los hooks
- [ ] 6.2 Renderizar `PriceRangeFilter` y `SortDropdown` en sidebar
- [ ] 6.3 Conectar cambios de filtro a Zustand store (triggers re-fetch automático)
- [ ] 6.4 Mostrar spinner "Cargando..." mientras `useProducts` fetcha (isLoading)
- [ ] 6.5 Mostrar mensaje "No hay productos que coincidan" cuando `items.length === 0`
- [ ] 6.6 Implementar paginación: botones "Anterior/Siguiente" con disabled cuando `!has_prev` o `!has_next`
- [ ] 6.7 Mostrar contador: "Página X de Y" calculado dinámicamente
- [ ] 6.8 Agregar botón "Limpiar filtros" que llama `clearFilters()` y resetea UI

**Archivos afectados:**
- `frontend/src/pages/ProductCatalog.tsx` — crear o modificar (integración completa)

**Criterio de éxito:** Filtros aplican sin recarga, paginación mantiene filtros, localStorage persiste.

---

## Fase 7: Testing Backend

- [ ] 7.1 Escribir test unitario: `test_filter_price_min_max()` valida que solo items en rango se retornan
- [ ] 7.2 Escribir test unitario: `test_sort_by_price_asc()` valida ordenamiento ascendente
- [ ] 7.3 Escribir test unitario: `test_sort_by_reciente()` valida ordenamiento por fecha descendente
- [ ] 7.4 Escribir test unitario: `test_precio_min_mayor_max_devuelve_400()` valida rechazo de rangos inválidos
- [ ] 7.5 Escribir test unitario: `test_sort_by_invalido_devuelve_400()` valida enum validation
- [ ] 7.6 Escribir test integración: `test_filtro_precio_con_alergenos_combinados()` valida AND lógico
- [ ] 7.7 Escribir test integración: `test_paginacion_mantiene_filtros()` valida que página 2 heredda filtros página 1

**Archivos afectados:**
- `backend/productos/tests/test_repositories.py` — agregar tests
- `backend/productos/tests/test_routers.py` — agregar tests

**Criterio de éxito:** Todos los tests pasen (pytest -v, cobertura >85%).

---

## Fase 8: Testing Frontend

- [ ] 8.1 Escribir test: `useProducts` hook debería retornar items cuando fetch exitoso (Vitest + msw)
- [ ] 8.2 Escribir test: `useProductFilters` store debería persistir en localStorage
- [ ] 8.3 Escribir test: `PriceRangeFilter` debería deshabilitar botón cuando min > max
- [ ] 8.4 Escribir test: `SortDropdown` debería renderizar todas 5 opciones
- [ ] 8.5 Escribir test: `ProductCatalog` debería mostrar "No hay productos" cuando array vacío

**Archivos afectados:**
- `frontend/src/features/products/__tests__/useProducts.test.ts` — crear
- `frontend/src/features/products/__tests__/useProductFilters.test.ts` — crear
- `frontend/src/features/products/components/__tests__/PriceRangeFilter.test.tsx` — crear

**Criterio de éxito:** Todos los tests pasen (pnpm test, cobertura >75%).

---

## Fase 9: Pruebas E2E (Playwright)

- [ ] 9.1 Escribir E2E: Navegar a ProductCatalog, aplicar filtro precio, verificar resultados filtrados
- [ ] 9.2 Escribir E2E: Cambiar ordenamiento, verificar que productos se re-renderizen (sin recarga)
- [ ] 9.3 Escribir E2E: Aplicar filtro, recargar página, verificar localStorage restaura filtros
- [ ] 9.4 Escribir E2E: Cambiar página con filtros aplicados, verificar "Anterior" habilitado en página 2
- [ ] 9.5 Escribir E2E: Hacer clic "Limpiar filtros", verificar inputs vacíos y todos los productos mostrados

**Archivos afectados:**
- `frontend/e2e/tests/product-filters.e2e.ts` — crear

**Criterio de éxito:** Todos los E2E tests pasen (pnpm test:e2e).

---

## Fase 10: Verificación de Performance y Pulido

- [ ] 10.1 Verificar query latencia con índices: `EXPLAIN ANALYZE` en Postgres muestra index usage
- [ ] 10.2 Validar que queries completadas en <500ms (95th percentile)
- [ ] 10.3 Verificar que TanStack Query deduplicada requests idénticos en ventana de 5 minutos
- [ ] 10.4 Revisar console.log o warnings en frontend (sin errores)
- [ ] 10.5 Verificar accesibilidad: labels de inputs, aria-labels en botones, keyboard navigation
- [ ] 10.6 Verificar responsive design: desktop (3 cols sidebar), tablet (2 cols), mobile (stack vertical)
- [ ] 10.7 Actualizar documentación: README en `backend/README.md` con ejemplos de filtro
- [ ] 10.8 Documentar schema `PaginatedProductList` en docstring del router

**Archivos afectados:**
- `backend/README.md` — agregar ejemplos
- Docstrings en `backend/productos/router.py`

**Criterio de éxito:** Queries <500ms, sin console errors, accessible en todos los dispositivos.

---

## Resumen de Fases

| Fase | Tareas | Enfoque | Tiempo Est. |
|------|--------|---------|------------|
| 1 | 1.1–1.5 | Infrastructure (DB indexes) | 0.5h |
| 2 | 2.1–2.6 | Core logic (service + repository) | 1.5h |
| 3 | 3.1–3.6 | API contracts (schemas + router) | 1h |
| 4 | 4.1–4.6 | State management (hooks + store) | 1.5h |
| 5 | 5.1–5.6 | UI components (filtros) | 1.5h |
| 6 | 6.1–6.8 | Integration (ProductCatalog) | 1h |
| 7 | 7.1–7.7 | Backend tests | 1.5h |
| 8 | 8.1–8.5 | Frontend tests | 1.5h |
| 9 | 9.1–9.5 | E2E tests (Playwright) | 1h |
| 10 | 10.1–10.8 | Performance + polish | 1.5h |
| **TOTAL** | 50 tasks | Full-stack | **11.5h** |

---

## Orden de Implementación Recomendado

**Día 1: Backend Foundation**
- Fase 1 (DB) → Fase 2 (Service + Repo) → Fase 3 (Schemas + Router)
- Razón: Backend debe estar listo antes de que frontend lo consuma

**Día 2: Frontend Implementation**
- Fase 4 (Hooks) → Fase 5 (Components) → Fase 6 (Integration)
- Razón: Hooks y componentes reutilizables primero, luego integración

**Día 3: Testing & Polish**
- Fase 7 (Backend tests) → Fase 8 (Frontend tests) → Fase 9 (E2E)
- Fase 10 (Performance)
- Razón: Tests validan spec, performance es verificación final

---

## Dependencias Externas

- ✅ **CH-028**: Debe estar merged (CategoryDetailPage existe)
- ✅ **Ch-027**: Navbar search integration (compatible pero no requerida)
- ✅ **PostgreSQL 15+**: Índices compuestos soportados
- ✅ **TanStack Query v4+**: Ya en `package.json` frontend
- ✅ **Zustand v4+**: Ya en `package.json` frontend
- ✅ **Pytest + Vitest**: Ya configurados en proyecto

---

## Criterios de "Listo"

- ✅ Todas las tareas marcadas como completadas
- ✅ Todos los tests pasen (backend + frontend + e2e)
- ✅ Funcionalidad implementada vs specs: 100% requisitos MUST cumplidos
- ✅ No hay console errors o warnings en browser
- ✅ Performance: queries <500ms, localStorage <50KB
- ✅ Accesibilidad: WCAG 2.1 AA (keyboard nav, labels, contrast)
- ✅ Documentación actualizada (README, docstrings)
- ✅ Commit messages convencionales: `feat(productos):`, `test(productos):`, etc.

---

**Nota:** Cada tarea debe ser completable en máximo 2 horas. Si una tarea se extiende más, dividirla en subtareas.