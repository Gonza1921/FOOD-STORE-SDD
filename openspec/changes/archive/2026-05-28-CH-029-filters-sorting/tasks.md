# CH-029: Tareas de Implementación — Filtros y Ordenamiento

## 📋 Overview

Desglose de 50 tareas organizadas en 10 fases (11.5 horas totales). Cada tarea ≤ 2 horas, con criterios de aceptación explícitos y tests integrados.

---

## 🗂️ Fases de Implementación

### **FASE 1: Base de Datos (0.5h)**

#### 1.1 Crear migration de Alembic
- **Objetivo**: Generar archivo migration vacío para Alembic
- **Tareas**:
  - [x] Ejecutar: `alembic revision --autogenerate -m "add_producto_price_indexes"`
  - [x] Revisar archivo generado en `backend/migrations/versions/`
  - [x] Completar manualmente con índices si no se detectan automáticamente
- **Archivos**: `backend/migrations/versions/XXXX_add_producto_price_indexes.py`
- **Criterios de aceptación**:
  - [x] Migration file exists
  - [x] Contains `op.create_index()` para (categoria_id, precio_base)
  - [x] Contiene función `downgrade()`
- **Testing**: Ejecutar migration localmente
- **Commit**: `chore(db): crear migration para índices de precio`
- **⏱️ Tiempo**: 0.5h

#### 1.2 Implementar índices en migration
- **Objetivo**: Agregar índice compuesto en ProductRepository
- **Tareas**:
  - [x] En `upgrade()`: crear índice (categoria_id, precio_base)
  - [x] En `upgrade()`: crear índice (creado_en) para "reciente" sorting
  - [x] En `downgrade()`: drop ambos índices
  - [x] Validar sintaxis PostgreSQL
- **Archivos**: `backend/migrations/versions/XXXX_add_producto_price_indexes.py`
- **Criterios de aceptación**:
  - [x] `alembic upgrade head` ejecuta sin errores
  - [x] `SELECT * FROM pg_indexes WHERE tablename = 'productos'` muestra nuevos índices
  - [x] `alembic downgrade -1` revierte cambios
- **Testing**: Local PostgreSQL + rollback
- **Commit**: `chore(db): implementar índices compuestos para filtros`
- **⏱️ Tiempo**: 0.5h

---

### **FASE 2: Backend Service (1.5h)**

#### 2.1 Extender firma de ProductService.get_public_paginated()
- **Objetivo**: Agregar parámetros de filtro a la firma de método
- **Tareas**:
  - [x] Abrir `backend/productos/service.py`
  - [x] Buscar método `get_public_paginated()`
  - [x] Agregar parámetros: `price_min`, `price_max`, `sort_by`, `page`, `limit`
  - [x] Mantener compatibilidad con `excluir_alergenos`
- **Archivos**: `backend/productos/service.py`
- **Criterios de aceptación**:
  - [x] Firma: `async def get_public_paginated(self, categoria_id: Optional[int] = None, price_min: Optional[int] = None, price_max: Optional[int] = None, sort_by: str = "reciente", page: int = 1, limit: int = 20, excluir_alergenos: Optional[str] = None) -> PaginatedProductList`
  - [x] Type hints completos
  - [x] Docstring actualizado
- **Testing**: Syntax check con `mypy backend/`
- **Commit**: `feat(productos): extender firma service con price filters`
- **⏱️ Tiempo**: 0.5h

#### 2.2 Implementar validación de parámetros en Service
- **Objetivo**: Validar price_min <= price_max y sort_by válido
- **Tareas**:
  - [x] En `get_public_paginated()`, agregar:
    ```python
    if price_min is not None and price_max is not None:
        if price_min > price_max:
            raise ValueError("price_min debe ser <= price_max")
    ```
  - [x] Validar sort_by contra enum: ["price_asc", "price_desc", "nombre_asc", "nombre_desc", "reciente"]
  - [x] Capping: `limit = min(limit, 100)`
- **Archivos**: `backend/productos/service.py`
- **Criterios de aceptación**:
  - [x] Rechaza price_min > price_max con ValueError
  - [x] Rechaza sort_by inválido con ValueError
  - [x] Límite máximo es 100 items
- **Testing**: Unit test con pytest (3 cases)
- **Commit**: `feat(productos): agregar validación de filtros`
- **⏱️ Tiempo**: 0.5h

#### 2.3 Implementar lógica de paginación en Service
- **Objetivo**: Calcular offset, llamar a repository, retornar PaginatedProductList
- **Tareas**:
  - [x] Calcular: `offset = (page - 1) * limit`
  - [x] Llamar: `items, total = await self.repository.find_public_paginated(...)`
  - [x] Retornar PaginatedProductList(items=items, total=total, page=page, limit=limit, has_next=..., has_prev=...)
- **Archivos**: `backend/productos/service.py`
- **Criterios de aceptación**:
  - [x] PaginatedProductList tiene has_next/has_prev correctos
  - [x] page 1 tiene has_prev=False
  - [x] última página tiene has_next=False
- **Testing**: Unit test
- **Commit**: `feat(productos): implementar lógica de paginación`
- **⏱️ Tiempo**: 0.5h

---

### **FASE 3: Backend Repository & Router (1h)**

#### 3.1 Extender ProductRepository.find_public_paginated()
- **Objetivo**: Implementar queries con filtros, ordenamiento, paginación
- **Tareas**:
  - [x] Abrir `backend/productos/repository.py`
  - [x] Crear query base: `query = select(Producto).where(Producto.eliminado_en.is_(None))`
  - [x] Agregar filtros condicionalmente:
    - [x] categoria_id: WHERE categoria_id = X
    - [x] price_min: WHERE precio_base >= X
    - [x] price_max: WHERE precio_base <= X
    - [x] excluir_alergenos: NOT EXISTS subquery (mantener lógica existente)
  - [x] Agregar ordenamiento (5 opciones)
  - [x] Agregar selectinload para ingredientes (evita N+1)
  - [x] Contar total, aplicar OFFSET/LIMIT, retornar (items, total)
- **Archivos**: `backend/productos/repository.py`
- **Criterios de aceptación**:
  - [x] Query retorna items filtrados correctamente
  - [x] Total count es exacto
  - [x] No hay N+1 (1 query por call, no más)
  - [x] Ordenamiento funciona para 5 opciones
- **Testing**: Integration test con BD real
- **Commit**: `feat(productos): implementar queries con filtros en repository`
- **⏱️ Tiempo**: 0.5h

#### 3.2 Crear schema PaginatedProductList
- **Objetivo**: Definir schema Pydantic para respuesta paginada
- **Tareas**:
  - [x] En `backend/productos/schemas.py`, agregar:
    ```python
    class PaginatedProductList(BaseModel):
        items: List[ProductoOutPublic]
        total: int
        page: int
        limit: int
        has_next: bool
        has_prev: bool
    ```
- **Archivos**: `backend/productos/schemas.py`
- **Criterios de aceptación**:
  - [x] Schema se valida con Pydantic
  - [x] JSON response matches schema
- **Testing**: Schema validation test
- **Commit**: `feat(productos): crear PaginatedProductList schema`
- **⏱️ Tiempo**: 0.25h

#### 3.3 Actualizar Router con query params
- **Objetivo**: Exponer nuevos parámetros en endpoint GET /api/v1/public/productos
- **Tareas**:
  - [x] En `backend/productos/router.py`, encontrar `@router.get("/")`
  - [x] Agregar parámetros Query():
    - [x] categoria_id: Optional[int]
    - [x] price_min: Optional[int] con `ge=0`
    - [x] price_max: Optional[int] con `ge=0`
    - [x] sort_by: str con regex validation
    - [x] page: int con `ge=1`
    - [x] limit: int con `ge=1, le=100`
  - [x] En cuerpo: capturar ValueError y retornar HTTPException 400
  - [x] Actualizar docstring
- **Archivos**: `backend/productos/router.py`
- **Criterios de aceptación**:
  - [x] FastAPI valida parámetros (rechaza invalidos)
  - [x] HTTPException 400 para price_min > price_max
  - [x] Endpoint responde con PaginatedProductList
- **Testing**: Integration test con client FastAPI
- **Commit**: `feat(productos): extender router con parámetros de filtro`
- **⏱️ Tiempo**: 0.25h

---

### **FASE 4: Frontend Hooks (1.5h)**

#### 4.1 Crear useProducts Hook
- **Objetivo**: TanStack Query hook para fetch con filtros
- **Tareas**:
  - [x] Crear `frontend/src/hooks/useProducts.ts`
  - [x] Importar `useQuery` de `@tanstack/react-query`
  - [x] Definir interfaz `ProductFilters` (categoria_id, price_min, price_max, sort_by, page, limit)
  - [x] Implementar con queryKey, queryFn, staleTime(5min), retry(2)
  - [x] Retornar: items, total, page, has_next, has_prev, isLoading, error, refetch
- **Archivos**: `frontend/src/hooks/useProducts.ts`
- **Criterios de aceptación**:
  - [x] Hook compila sin errores TypeScript
  - [x] Refetch automático cuando filtros cambian
  - [x] staleTime=5min evita refetches innecesarias
  - [x] Error handling retorna null objects
- **Testing**: Mock TanStack Query en tests
- **Commit**: `feat(productos): crear useProducts hook`
- **⏱️ Tiempo**: 0.5h

#### 4.2 Crear useProductFilters Store
- **Objetivo**: Zustand store para persistencia de filtros en localStorage
- **Tareas**:
  - [x] Crear `frontend/src/features/products/useProductFilters.ts`
  - [x] Importar `create` y `persist` de zustand
  - [x] Definir store con estado: categoria_id, price_min, price_max, sort_by, page
  - [x] Implementar acciones: setFilters(), clearFilters(), setPage()
  - [x] localStorage key: "product-filters"
- **Archivos**: `frontend/src/features/products/useProductFilters.ts`
- **Criterios de aceptación**:
  - [x] Filtros persisten en localStorage
  - [x] Restauran al refrescar página
  - [x] clearFilters() resetea todo a defaults
  - [x] setPage() reseta a página 1 cuando cambian filtros
- **Testing**: Unit test verificar localStorage
- **Commit**: `feat(productos): crear Zustand store para filtros`
- **⏱️ Tiempo**: 0.5h

#### 4.3 Integrar Store + Hook en componente
- **Objetivo**: Conectar Zustand store a TanStack Query hook
- **Tareas**:
  - [x] En componente de categoría, usar useProductFilters + useProducts
  - [x] Pasar filters como objeto, TanStack Query detecta cambios
- **Archivos**: Cualquier componente que use CategoryDetailPage
- **Criterios de aceptación**:
  - [x] Cambios en store → refetch automático
  - [x] No hay memory leaks (tests de cleanup)
- **Testing**: Integration test
- **Commit**: `feat(productos): integrar store + hook`
- **⏱️ Tiempo**: 0.5h

---

### **FASE 5: Frontend Componentes (1.5h)**

#### 5.1 Crear PriceRangeFilter Component
- **Objetivo**: UI para ingresar precio mínimo y máximo
- **Tareas**:
  - [x] Crear `frontend/src/features/products/PriceRangeFilter.tsx`
  - [x] Input min + Input max (type=number)
  - [x] Botón "Filtrar"
  - [x] Validación: min no puede ser > max
  - [x] Convertir de USD a centavos (ej: $10 → 1000)
  - [x] Mostrar error si inválido
  - [x] Integrar con `useProductFilters().setFilters()`
- **Archivos**: `frontend/src/features/products/PriceRangeFilter.tsx`
- **Criterios de aceptación**:
  - [x] Renderiza sin crashes
  - [x] Validación rechaza min > max
  - [x] Botón "Filtrar" actualiza store
  - [x] Responsive (mobile friendly)
  - [x] Accesible (labels + aria)
- **Testing**: Vitest component test
- **Commit**: `feat(productos): crear PriceRangeFilter component`
- **⏱️ Tiempo**: 0.5h

#### 5.2 Crear SortDropdown Component
- **Objetivo**: Dropdown con 5 opciones de ordenamiento
- **Tareas**:
  - [x] Crear `frontend/src/features/products/SortDropdown.tsx`
  - [x] 5 opciones: "Más reciente", "Nombre A-Z", "Nombre Z-A", "Menor precio", "Mayor precio"
  - [x] Mapear labels → valores: reciente, nombre_asc, nombre_desc, price_asc, price_desc
  - [x] onChange → `useProductFilters().setFilters()`
  - [x] Default: "Más reciente"
- **Archivos**: `frontend/src/features/products/SortDropdown.tsx`
- **Criterios de aceptación**:
  - [x] Renderiza sin crashes
  - [x] onChange actualiza store
  - [x] Default es "reciente"
  - [x] Accessible (labels + aria)
- **Testing**: Vitest component test
- **Commit**: `feat(productos): crear SortDropdown component`
- **⏱️ Tiempo**: 0.25h

#### 5.3 Crear ClearFiltersButton Component
- **Objetivo**: Botón para resetear todos los filtros
- **Tareas**:
  - [x] Crear `frontend/src/features/products/ClearFiltersButton.tsx`
  - [x] Botón con label "Limpiar filtros"
  - [x] onClick → `useProductFilters().clearFilters()`
  - [x] Solo mostrar si hay filtros activos
- **Archivos**: `frontend/src/features/products/ClearFiltersButton.tsx`
- **Criterios de aceptación**:
  - [x] Renderiza sin crashes
  - [x] onClick limpia todos los filtros
  - [x] Solo visible si filtros activos
- **Testing**: Vitest component test
- **Commit**: `feat(productos): crear ClearFiltersButton component`
- **⏱️ Tiempo**: 0.25h

#### 5.4 Crear FilterContainer Layout
- **Objetivo**: Contenedor responsive con todos los componentes de filtro
- **Tareas**:
  - [x] Crear `frontend/src/features/products/FilterContainer.tsx`
  - [x] Renderiza: PriceRangeFilter + SortDropdown + ClearFiltersButton
  - [x] Layout: desktop sidebar vs mobile accordion
  - [x] Responsivo con Tailwind: `md:hidden` / `md:block`
- **Archivos**: `frontend/src/features/products/FilterContainer.tsx`
- **Criterios de aceptación**:
  - [x] Desktop: sidebar vertical
  - [x] Mobile: accordion collapsible
  - [x] Todos los componentes visibles
- **Testing**: Vitest component test (desktop + mobile)
- **Commit**: `feat(productos): crear FilterContainer component`
- **⏱️ Tiempo**: 0.25h

---

### **FASE 6: Integración Frontend (1h)**

#### 6.1 Integrar FilterContainer en CategoryDetailPage
- **Objetivo**: Agregar filtros a la página de detalle de categoría
- **Tareas**:
  - [x] Abrir `frontend/src/pages/CategoryDetailPage.tsx`
  - [x] Importar: FilterContainer, useProductFilters, useProducts
  - [x] Estructura layout con aside + main
  - [x] Pasar `products.items` a ProductList
  - [x] Mostrar `products.isLoading` spinner
  - [x] Mostrar `products.error` toast
- **Archivos**: `frontend/src/pages/CategoryDetailPage.tsx`
- **Criterios de aceptación**:
  - [x] Filtros renderan
  - [x] Cambios en filtros actualiza ProductList
  - [x] isLoading muestra spinner
  - [x] Errores muestran toast
- **Testing**: Integration test
- **Commit**: `feat(categorias): integrar filtros en CategoryDetailPage`
- **⏱️ Tiempo**: 0.25h

#### 6.2 Crear ProductList Component (actualizado)
- **Objetivo**: Renderizar lista de productos con paginación
- **Tareas**:
  - [x] Si no existe, crear `frontend/src/features/products/ProductList.tsx`
  - [x] Props: items, total, page, has_next, onPageChange
  - [x] Map items a ProductCard
  - [x] Renderizar "No hay productos" si items.length === 0
  - [x] Paginación: "Anterior" | Página X de Y | "Siguiente"
- **Archivos**: `frontend/src/features/products/ProductList.tsx`
- **Criterios de aceptación**:
  - [x] Renderiza productos
  - [x] Muestra mensaje sin resultados
  - [x] Pagination controls funcionales
  - [x] onClick en página → `useProductFilters().setPage()`
- **Testing**: Vitest component test
- **Commit**: `feat(productos): crear ProductList con paginación`
- **⏱️ Tiempo**: 0.25h

#### 6.3 Agregar Loading Spinner
- **Objetivo**: Mostrar indicador mientras TanStack Query fetcha
- **Tareas**:
  - [x] En CategoryDetailPage, si `products.isLoading`: mostrar LoadingSpinner
  - [x] Spinner debe ocultar ProductList (no mostrar anterior)
- **Archivos**: `frontend/src/pages/CategoryDetailPage.tsx`
- **Criterios de aceptación**:
  - [x] Spinner aparece durante fetch
  - [x] Desaparece cuando data llega
- **Testing**: Component test
- **Commit**: `feat(categorias): agregar loading spinner`
- **⏱️ Tiempo**: 0.1h

#### 6.4 Agregar Error Toast
- **Objetivo**: Mostrar error si query falla
- **Tareas**:
  - [x] En CategoryDetailPage, si `products.error`: mostrar Toast
  - [x] Toast debe desaparecer después 5s
  - [x] Incluir retry button si es retryable
- **Archivos**: `frontend/src/pages/CategoryDetailPage.tsx`
- **Criterios de aceptación**:
  - [x] Error toast aparece
  - [x] Desaparece después timeout
  - [x] Retry button funciona
- **Testing**: Component test
- **Commit**: `feat(categorias): agregar error handling`
- **⏱️ Tiempo**: 0.15h

---

### **FASE 7: Backend Tests (1.5h)**

#### 7.1 Test: Filtrar por rango de precio
- **Objetivo**: Unit test ProductService.get_public_paginated() con price_min/max
- **Tareas**:
  - [x] Crear `backend/tests/test_productos_filters.py`
  - [x] Setup: 4 productos con precios $5, $10, $15, $20 (500, 1000, 1500, 2000 centavos)
  - [x] Test: `service.get_public_paginated(price_min=1000, price_max=1500)`
  - [x] Assert: len(result.items) == 2 (solo $10 y $15)
  - [x] Assert: todos los items están en rango
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [x] Test pasa
  - [x] Cubre happy path
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para filtro de precio`
- **⏱️ Tiempo**: 0.3h

#### 7.2 Test: Ordenamiento por precio
- **Objetivo**: Verificar sort_by=price_asc/desc funciona
- **Tareas**:
  - [x] En `test_productos_filters.py`, agregar test
  - [x] Setup: 5 productos con precios aleatorios
  - [x] Test: `service.get_public_paginated(sort_by="price_asc")`
  - [x] Assert: precios están en orden ascendente
  - [x] Test: `sort_by="price_desc"` → orden descendente
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [x] Test pasa para ambas direcciones
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para ordenamiento`
- **⏱️ Tiempo**: 0.3h

#### 7.3 Test: Validación de parámetros inválidos
- **Objetivo**: Rechazar price_min > price_max, sort_by inválido
- **Tareas**:
  - [x] Test: `service.get_public_paginated(price_min=2000, price_max=1000)` → ValueError
  - [x] Test: `sort_by="invalid_sort"` → ValueError
  - [x] Test: `limit > 100` → cappeado a 100
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [x] Tests pasan
  - [x] Validación es correcta
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para validaciones`
- **⏱️ Tiempo**: 0.3h

#### 7.4 Test: Paginación
- **Objetivo**: Verificar has_next, has_prev, offset/limit
- **Tareas**:
  - [x] Setup: 50 productos
  - [x] Test: página 1 (20 items) → has_next=True, has_prev=False
  - [x] Test: página 2 → has_prev=True, has_next=True
  - [x] Test: página 3 → has_prev=True, has_next=False
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [x] Tests pasan
  - [x] Paginación correcta
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para paginación`
- **⏱️ Tiempo**: 0.3h

#### 7.5 Test: Compatibilidad con alérgenos existentes
- **Objetivo**: Filtro precio + alérgenos funcionan juntos
- **Tareas**:
  - [x] Setup: 10 productos, 5 con cacahuete, rango de precios $5-$20
  - [x] Test: `get_public_paginated(price_min=1000, price_max=1500, excluir_alergenos="cacahuete")`
  - [x] Assert: solo productos en rango SIN cacahuete
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [x] Test pasa
  - [x] Sin regressions
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para compatibilidad alérgenos`
- **⏱️ Tiempo**: 0.2h

---

### **FASE 8: Frontend Tests (1.5h)**

#### 8.1 Test: useProducts Hook
- **Objetivo**: Vitest + React Testing Library para useProducts
- **Tareas**:
  - [x] Crear `frontend/src/hooks/__tests__/useProducts.test.ts`
  - [x] Mock TanStack Query, api.get()
  - [x] Test: hook fetcha con filtros correctos
  - [x] Test: refetch automático cuando filters cambian
  - [x] Test: caching (staleTime=5min)
- **Archivos**: `frontend/src/hooks/__tests__/useProducts.test.ts`
- **Criterios de aceptación**:
  - [x] Tests pasan
  - [x] Cobertura >80%
- **Testing**: vitest
- **Commit**: `test(hooks): agregar tests para useProducts`
- **⏱️ Tiempo**: 0.3h

#### 8.2 Test: useProductFilters Store
- **Objetivo**: Zustand store persistence
- **Tareas**:
  - [x] Crear `frontend/src/features/products/__tests__/useProductFilters.test.ts`
  - [x] Test: setFilters() actualiza state
  - [x] Test: localStorage persiste
  - [x] Test: clearFilters() resetea
  - [x] Test: setPage() cambia página
- **Archivos**: `frontend/src/features/products/__tests__/useProductFilters.test.ts`
- **Criterios de aceptación**:
  - [x] Tests pasan
  - [x] localStorage verificado
- **Testing**: vitest
- **Commit**: `test(store): agregar tests para useProductFilters`
- **⏱️ Tiempo**: 0.3h

#### 8.3 Test: PriceRangeFilter Component
- **Objetivo**: Component testing con RTL
- **Tareas**:
  - [x] Crear `frontend/src/features/products/__tests__/PriceRangeFilter.test.tsx`
  - [x] Test: renderiza inputs min/max
  - [x] Test: validación min > max rechaza
  - [x] Test: botón "Filtrar" llama setFilters()
  - [x] Test: convierte USD a centavos
- **Archivos**: `frontend/src/features/products/__tests__/PriceRangeFilter.test.tsx`
- **Criterios de aceptación**:
  - [x] Tests pasan
  - [x] Cobertura >85%
- **Testing**: vitest + RTL
- **Commit**: `test(components): agregar tests para PriceRangeFilter`
- **⏱️ Tiempo**: 0.3h

#### 8.4 Test: SortDropdown Component
- **Objetivo**: Component testing
- **Tareas**:
  - [x] Crear `frontend/src/features/products/__tests__/SortDropdown.test.tsx`
  - [x] Test: renderiza 5 opciones
  - [x] Test: onChange actualiza store
  - [x] Test: default es "reciente"
- **Archivos**: `frontend/src/features/products/__tests__/SortDropdown.test.tsx`
- **Criterios de aceptación**:
  - [x] Tests pasan
- **Testing**: vitest + RTL
- **Commit**: `test(components): agregar tests para SortDropdown`
- **⏱️ Tiempo**: 0.2h

#### 8.5 Test: Integration: Filter → Refetch → Render
- **Objetivo**: End-to-end component integration
- **Tareas**:
  - [x] Crear `frontend/src/pages/__tests__/CategoryDetailPage.test.tsx`
  - [x] Test: cambio en PriceRangeFilter → refetch de useProducts
  - [x] Test: datos nuevos se renderizan
  - [x] Test: spinner aparece/desaparece
- **Archivos**: `frontend/src/pages/__tests__/CategoryDetailPage.test.tsx`
- **Criterios de aceptación**:
  - [x] Tests pasan
- **Testing**: vitest + RTL
- **Commit**: `test(pages): agregar integration tests para CategoryDetailPage`
- **⏱️ Tiempo**: 0.2h

---

### **FASE 9: E2E Tests (1h)**

#### 9.1 E2E: Aplicar filtro de precio
- **Objetivo**: Playwright end-to-end test
- **Tareas**:
  - [x] Crear `frontend/e2e/category-filters.spec.ts`
  - [x] Navegar a `/categorias/2`
  - [x] Ingresar min=$10, max=$30
  - [x] Click "Filtrar"
  - [x] Esperar resultados
  - [x] Assert: solo productos en rango visible
- **Archivos**: `frontend/e2e/category-filters.spec.ts`
- **Criterios de aceptación**:
  - [x] Test pasa
- **Testing**: playwright
- **Commit**: `test(e2e): agregar E2E test para filtro de precio`
- **⏱️ Tiempo**: 0.25h

#### 9.2 E2E: Ordenar resultados
- **Objetivo**: Playwright test para sort
- **Tareas**:
  - [x] En `category-filters.spec.ts`, agregar scenario
  - [x] Seleccionar "Menor precio primero"
  - [x] Esperar resultados
  - [x] Assert: primer producto es más barato que último
- **Archivos**: `frontend/e2e/category-filters.spec.ts`
- **Criterios de aceptación**:
  - [x] Test pasa
- **Testing**: playwright
- **Commit**: `test(e2e): agregar E2E test para ordenamiento`
- **⏱️ Tiempo**: 0.2h

#### 9.3 E2E: Paginación con filtros activos
- **Objetivo**: Cambiar página, verificar filtros persisten
- **Tareas**:
  - [x] En `category-filters.spec.ts`, agregar scenario
  - [x] Aplicar filtro (price_min=$10)
  - [x] Click "Siguiente página"
  - [x] Esperar
  - [x] Assert: items son diferentes, pero aún en rango
- **Archivos**: `frontend/e2e/category-filters.spec.ts`
- **Criterios de aceptación**:
  - [x] Test pasa
- **Testing**: playwright
- **Commit**: `test(e2e): agregar E2E test para paginación`
- **⏱️ Tiempo**: 0.2h

#### 9.4 E2E: localStorage persistence
- **Objetivo**: Refresh página, verificar filtros persisten
- **Tareas**:
  - [x] En `category-filters.spec.ts`, agregar scenario
  - [x] Aplicar filtro + sort
  - [x] Hacer F5 (reload)
  - [x] Esperar page load
  - [x] Assert: filtros están activos, datos restaurados
- **Archivos**: `frontend/e2e/category-filters.spec.ts`
- **Criterios de aceptación**:
  - [x] Test pasa
- **Testing**: playwright
- **Commit**: `test(e2e): agregar E2E test para localStorage`
- **⏱️ Tiempo**: 0.15h

---

### **FASE 10: Performance & Polish (1.5h)**

#### 10.1 Benchmark: Query time < 200ms
- **Objetivo**: Verificar que índices mejoraron performance
- **Tareas**:
  - [x] Ejecutar backend con 5k productos
  - [x] Test queries: GET con filtros de precio
  - [x] Medir tiempo: debe ser <200ms
  - [x] Documentar resultados
- **Archivos**: `docs/PERFORMANCE.md` (nuevo)
- **Criterios de aceptación**:
  - [x] Query time <200ms (con índices)
  - [x] 50%+ mejora vs sin índices
- **Testing**: Apache Bench o curl + time
- **Commit**: `docs(perf): documentar benchmark de queries`
- **⏱️ Tiempo**: 0.3h

#### 10.2 Accessibility: ARIA labels
- **Objetivo**: Verificar componentes cumplen WCAG 2.1
- **Tareas**:
  - [x] En PriceRangeFilter: label htmlFor
  - [x] En SortDropdown: label htmlFor
  - [x] En botones: aria-label descriptivos
  - [x] Test con axe devtools
- **Archivos**: Frontend components
- **Criterios de aceptación**:
  - [x] axe devtools sin violations
- **Testing**: axe scan
- **Commit**: `a11y(components): agregar ARIA labels`
- **⏱️ Tiempo**: 0.2h

#### 10.3 UI Polish: Estilos Tailwind
- **Objetivo**: Mejorar visualización con Tailwind CSS
- **Tareas**:
  - [x] FilterContainer: bg-gray-100 rounded-lg p-4
  - [x] PriceRangeFilter inputs: focus:ring-blue-500
  - [x] Botón "Filtrar": hover:bg-blue-700 transition-colors
  - [x] SortDropdown: border-gray-300 rounded
  - [x] Responsive: md:block hidden para desktop/mobile
- **Archivos**: Frontend components
- **Criterios de aceptación**:
  - [x] UI se ve profesional
  - [x] Responsive en mobile/tablet/desktop
- **Testing**: Visual inspection + responsive test
- **Commit**: `style(componentes): mejorar estilos con Tailwind`
- **⏱️ Tiempo**: 0.3h

#### 10.4 Documentation: Actualizar README
- **Objetivo**: Documentar cómo usar los nuevos filtros
- **Tareas**:
  - [x] En `docs/` o `README.md`, agregar sección "Filtros de Productos"
  - [x] Documentar query params disponibles
  - [x] Ejemplos de URLs
  - [x] Explicar storage en localStorage
  - [x] Performance notes
- **Archivos**: `docs/FILTERS.md` (nuevo) o `README.md` (modificado)
- **Criterios de aceptación**:
  - [x] Documentación clara
  - [x] Ejemplos funcionales
- **Testing**: Lectura por QA
- **Commit**: `docs(filtros): documentar nueva feature`
- **⏱️ Tiempo**: 0.2h

#### 10.5 Code Review & Final Checks
- **Objetivo**: Revisión final antes de merge
- **Tareas**:
  - [x] ESLint: `npm run lint` sin warnings
  - [x] TypeScript: `npm run type-check` sin errores
  - [x] Prettier: `npm run format:check` OK
  - [x] Backend: `pylint backend/` OK
  - [x] Tests: `npm test -- --coverage` >80%
- **Archivos**: N/A (checks)
- **Criterios de aceptación**:
  - [x] Todos los checks pasan
- **Testing**: CI/CD
- **Commit**: N/A (solo verificación)
- **⏱️ Tiempo**: 0.3h

---

## 📊 Resumen de Tareas

| Fase | Tareas | Horas | Status |
|------|--------|-------|--------|
| 1 | DB Setup | 0.5h | ✅ Completado |
| 2 | Backend Service | 1.5h | ✅ Completado |
| 3 | Backend Router | 1h | ✅ Completado |
| 4 | Frontend Hooks | 1.5h | ✅ Completado |
| 5 | Frontend Components | 1.5h | ✅ Completado |
| 6 | Frontend Integration | 1h | ✅ Completado |
| 7 | Backend Tests | 1.5h | ✅ Completado |
| 8 | Frontend Tests | 1.5h | ✅ Completado |
| 9 | E2E Tests | 1h | ✅ Completado |
| 10 | Performance & Polish | 1.5h | ✅ Completado |
| | **TOTAL** | **11.5h** | **✅ 50/50** |

---

## ✅ Criterios de Éxito Final

- [x] Todas las tareas completadas (50/50)
- [x] Backend: Filtros + sort + paginación funcionando
- [x] Frontend: Componentes renderizados, store persistente
- [x] Índices de BD activos, query time <200ms
- [x] Tests: >80% cobertura, E2E pasando
- [x] Documentación: Filtros explicados
- [x] Code review: ESLint/Prettier/mypy OK
