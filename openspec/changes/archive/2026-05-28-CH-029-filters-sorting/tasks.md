# CH-029: Tareas de Implementación — Filtros y Ordenamiento

## 📋 Overview

Desglose de 50 tareas organizadas en 10 fases (11.5 horas totales). Cada tarea ≤ 2 horas, con criterios de aceptación explícitos y tests integrados.

---

## 🗂️ Fases de Implementación

### **FASE 1: Base de Datos (0.5h)**

#### 1.1 Crear migration de Alembic
- **Objetivo**: Generar archivo migration vacío para Alembic
- **Tareas**:
  - [ ] Ejecutar: `alembic revision --autogenerate -m "add_producto_price_indexes"`
  - [ ] Revisar archivo generado en `backend/migrations/versions/`
  - [ ] Completar manualmente con índices si no se detectan automáticamente
- **Archivos**: `backend/migrations/versions/XXXX_add_producto_price_indexes.py`
- **Criterios de aceptación**:
  - [ ] Migration file exists
  - [ ] Contains `op.create_index()` para (categoria_id, precio_base)
  - [ ] Contiene función `downgrade()`
- **Testing**: Ejecutar migration localmente
- **Commit**: `chore(db): crear migration para índices de precio`
- **⏱️ Tiempo**: 0.5h

#### 1.2 Implementar índices en migration
- **Objetivo**: Agregar índice compuesto en ProductRepository
- **Tareas**:
  - [ ] En `upgrade()`: crear índice (categoria_id, precio_base)
  - [ ] En `upgrade()`: crear índice (creado_en) para "reciente" sorting
  - [ ] En `downgrade()`: drop ambos índices
  - [ ] Validar sintaxis PostgreSQL
- **Archivos**: `backend/migrations/versions/XXXX_add_producto_price_indexes.py`
- **Criterios de aceptación**:
  - [ ] `alembic upgrade head` ejecuta sin errores
  - [ ] `SELECT * FROM pg_indexes WHERE tablename = 'productos'` muestra nuevos índices
  - [ ] `alembic downgrade -1` revierte cambios
- **Testing**: Local PostgreSQL + rollback
- **Commit**: `chore(db): implementar índices compuestos para filtros`
- **⏱️ Tiempo**: 0.5h

---

### **FASE 2: Backend Service (1.5h)**

#### 2.1 Extender firma de ProductService.get_public_paginated()
- **Objetivo**: Agregar parámetros de filtro a la firma de método
- **Tareas**:
  - [ ] Abrir `backend/productos/service.py`
  - [ ] Buscar método `get_public_paginated()`
  - [ ] Agregar parámetros: `price_min`, `price_max`, `sort_by`, `page`, `limit`
  - [ ] Mantener compatibilidad con `excluir_alergenos`
- **Archivos**: `backend/productos/service.py`
- **Criterios de aceptación**:
  - [ ] Firma: `async def get_public_paginated(self, categoria_id: Optional[int] = None, price_min: Optional[int] = None, price_max: Optional[int] = None, sort_by: str = "reciente", page: int = 1, limit: int = 20, excluir_alergenos: Optional[str] = None) -> PaginatedProductList`
  - [ ] Type hints completos
  - [ ] Docstring actualizado
- **Testing**: Syntax check con `mypy backend/`
- **Commit**: `feat(productos): extender firma service con price filters`
- **⏱️ Tiempo**: 0.5h

#### 2.2 Implementar validación de parámetros en Service
- **Objetivo**: Validar price_min <= price_max y sort_by válido
- **Tareas**:
  - [ ] En `get_public_paginated()`, agregar:
    ```python
    if price_min is not None and price_max is not None:
        if price_min > price_max:
            raise ValueError("price_min debe ser <= price_max")
    ```
  - [ ] Validar sort_by contra enum: ["price_asc", "price_desc", "nombre_asc", "nombre_desc", "reciente"]
  - [ ] Capping: `limit = min(limit, 100)`
- **Archivos**: `backend/productos/service.py`
- **Criterios de aceptación**:
  - [ ] Rechaza price_min > price_max con ValueError
  - [ ] Rechaza sort_by inválido con ValueError
  - [ ] Límite máximo es 100 items
- **Testing**: Unit test con pytest (3 cases)
- **Commit**: `feat(productos): agregar validación de filtros`
- **⏱️ Tiempo**: 0.5h

#### 2.3 Implementar lógica de paginación en Service
- **Objetivo**: Calcular offset, llamar a repository, retornar PaginatedProductList
- **Tareas**:
  - [ ] Calcular: `offset = (page - 1) * limit`
  - [ ] Llamar: `items, total = await self.repository.find_public_paginated(...)`
  - [ ] Retornar PaginatedProductList(items=items, total=total, page=page, limit=limit, has_next=..., has_prev=...)
- **Archivos**: `backend/productos/service.py`
- **Criterios de aceptación**:
  - [ ] PaginatedProductList tiene has_next/has_prev correctos
  - [ ] page 1 tiene has_prev=False
  - [ ] última página tiene has_next=False
- **Testing**: Unit test
- **Commit**: `feat(productos): implementar lógica de paginación`
- **⏱️ Tiempo**: 0.5h

---

### **FASE 3: Backend Repository & Router (1h)**

#### 3.1 Extender ProductRepository.find_public_paginated()
- **Objetivo**: Implementar queries con filtros, ordenamiento, paginación
- **Tareas**:
  - [ ] Abrir `backend/productos/repository.py`
  - [ ] Crear query base: `query = select(Producto).where(Producto.eliminado_en.is_(None))`
  - [ ] Agregar filtros condicionalmente:
    - [ ] categoria_id: WHERE categoria_id = X
    - [ ] price_min: WHERE precio_base >= X
    - [ ] price_max: WHERE precio_base <= X
    - [ ] excluir_alergenos: NOT EXISTS subquery (mantener lógica existente)
  - [ ] Agregar ordenamiento (5 opciones)
  - [ ] Agregar selectinload para ingredientes (evita N+1)
  - [ ] Contar total, aplicar OFFSET/LIMIT, retornar (items, total)
- **Archivos**: `backend/productos/repository.py`
- **Criterios de aceptación**:
  - [ ] Query retorna items filtrados correctamente
  - [ ] Total count es exacto
  - [ ] No hay N+1 (1 query por call, no más)
  - [ ] Ordenamiento funciona para 5 opciones
- **Testing**: Integration test con BD real
- **Commit**: `feat(productos): implementar queries con filtros en repository`
- **⏱️ Tiempo**: 0.5h

#### 3.2 Crear schema PaginatedProductList
- **Objetivo**: Definir schema Pydantic para respuesta paginada
- **Tareas**:
  - [ ] En `backend/productos/schemas.py`, agregar:
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
  - [ ] Schema se valida con Pydantic
  - [ ] JSON response matches schema
- **Testing**: Schema validation test
- **Commit**: `feat(productos): crear PaginatedProductList schema`
- **⏱️ Tiempo**: 0.25h

#### 3.3 Actualizar Router con query params
- **Objetivo**: Exponer nuevos parámetros en endpoint GET /api/v1/public/productos
- **Tareas**:
  - [ ] En `backend/productos/router.py`, encontrar `@router.get("/")`
  - [ ] Agregar parámetros Query():
    - [ ] categoria_id: Optional[int]
    - [ ] price_min: Optional[int] con `ge=0`
    - [ ] price_max: Optional[int] con `ge=0`
    - [ ] sort_by: str con regex validation
    - [ ] page: int con `ge=1`
    - [ ] limit: int con `ge=1, le=100`
  - [ ] En cuerpo: capturar ValueError y retornar HTTPException 400
  - [ ] Actualizar docstring
- **Archivos**: `backend/productos/router.py`
- **Criterios de aceptación**:
  - [ ] FastAPI valida parámetros (rechaza invalidos)
  - [ ] HTTPException 400 para price_min > price_max
  - [ ] Endpoint responde con PaginatedProductList
- **Testing**: Integration test con client FastAPI
- **Commit**: `feat(productos): extender router con parámetros de filtro`
- **⏱️ Tiempo**: 0.25h

---

### **FASE 4: Frontend Hooks (1.5h)**

#### 4.1 Crear useProducts Hook
- **Objetivo**: TanStack Query hook para fetch con filtros
- **Tareas**:
  - [ ] Crear `frontend/src/hooks/useProducts.ts`
  - [ ] Importar `useQuery` de `@tanstack/react-query`
  - [ ] Definir interfaz `ProductFilters` (categoria_id, price_min, price_max, sort_by, page, limit)
  - [ ] Implementar:
    ```typescript
    export function useProducts(filters: ProductFilters) {
      const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["productos", filters],
        queryFn: async () => {
          const response = await api.get("/api/v1/public/productos", { params: filters });
          return response.data;
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
      });
      return { items: data?.items || [], total: data?.total || 0, ... };
    }
    ```
  - [ ] Retornar: items, total, page, has_next, has_prev, isLoading, error, refetch
- **Archivos**: `frontend/src/hooks/useProducts.ts`
- **Criterios de aceptación**:
  - [ ] Hook compila sin errores TypeScript
  - [ ] Refetch automático cuando filtros cambian
  - [ ] staleTime=5min evita refetches innecesarias
  - [ ] Error handling retorna null objects
- **Testing**: Mock TanStack Query en tests
- **Commit**: `feat(productos): crear useProducts hook`
- **⏱️ Tiempo**: 0.5h

#### 4.2 Crear useProductFilters Store
- **Objetivo**: Zustand store para persistencia de filtros en localStorage
- **Tareas**:
  - [ ] Crear `frontend/src/features/products/useProductFilters.ts`
  - [ ] Importar `create` y `persist` de zustand
  - [ ] Definir store:
    ```typescript
    export const useProductFilters = create<ProductFiltersState>()(
      persist(
        (set) => ({
          categoria_id: undefined,
          price_min: undefined,
          price_max: undefined,
          sort_by: "reciente",
          page: 1,
          setFilters: (filters) => set(...),
          clearFilters: () => set(...),
          setPage: (page) => set({ page }),
        }),
        { name: "product-filters" }
      )
    );
    ```
  - [ ] localStorage key: "product-filters"
- **Archivos**: `frontend/src/features/products/useProductFilters.ts`
- **Criterios de aceptación**:
  - [ ] Filtros persisten en localStorage
  - [ ] Restauran al refrescar página
  - [ ] clearFilters() resetea todo a defaults
  - [ ] setPage() reseta a página 1 cuando cambian filtros
- **Testing**: Unit test verificar localStorage
- **Commit**: `feat(productos): crear Zustand store para filtros`
- **⏱️ Tiempo**: 0.5h

#### 4.3 Integrar Store + Hook en componente
- **Objetivo**: Conectar Zustand store a TanStack Query hook
- **Tareas**:
  - [ ] En componente de categoría, usar:
    ```typescript
    const filters = useProductFilters();
    const products = useProducts(filters);
    ```
  - [ ] Pasar filters como objeto, TanStack Query detecta cambios
- **Archivos**: Cualquier componente que use CategoryDetailPage
- **Criterios de aceptación**:
  - [ ] Cambios en store → refetch automático
  - [ ] No hay memory leaks (tests de cleanup)
- **Testing**: Integration test
- **Commit**: `feat(productos): integrar store + hook`
- **⏱️ Tiempo**: 0.5h

---

### **FASE 5: Frontend Componentes (1.5h)**

#### 5.1 Crear PriceRangeFilter Component
- **Objetivo**: UI para ingresar precio mínimo y máximo
- **Tareas**:
  - [ ] Crear `frontend/src/features/products/PriceRangeFilter.tsx`
  - [ ] Input min + Input max (type=number)
  - [ ] Botón "Filtrar"
  - [ ] Validación: min no puede ser > max
  - [ ] Convertir de USD a centavos (e.g., $10 → 1000)
  - [ ] Mostrar error si inválido
  - [ ] Integrar con `useProductFilters().setFilters()`
- **Archivos**: `frontend/src/features/products/PriceRangeFilter.tsx`
- **Criterios de aceptación**:
  - [ ] Renderiza sin crashes
  - [ ] Validación rechaza min > max
  - [ ] Botón "Filtrar" actualiza store
  - [ ] Responsive (mobile friendly)
  - [ ] Accesible (labels + aria)
- **Testing**: Vitest component test
- **Commit**: `feat(productos): crear PriceRangeFilter component`
- **⏱️ Tiempo**: 0.5h

#### 5.2 Crear SortDropdown Component
- **Objetivo**: Dropdown con 5 opciones de ordenamiento
- **Tareas**:
  - [ ] Crear `frontend/src/features/products/SortDropdown.tsx`
  - [ ] 5 opciones: "Más reciente", "Nombre A-Z", "Nombre Z-A", "Menor precio", "Mayor precio"
  - [ ] Mapear labels → valores: reciente, nombre_asc, nombre_desc, price_asc, price_desc
  - [ ] onChange → `useProductFilters().setFilters()`
  - [ ] Default: "Más reciente"
- **Archivos**: `frontend/src/features/products/SortDropdown.tsx`
- **Criterios de aceptación**:
  - [ ] Renderiza sin crashes
  - [ ] onChange actualiza store
  - [ ] Default es "reciente"
  - [ ] Accessible (labels + aria)
- **Testing**: Vitest component test
- **Commit**: `feat(productos): crear SortDropdown component`
- **⏱️ Tiempo**: 0.25h

#### 5.3 Crear ClearFiltersButton Component
- **Objetivo**: Botón para resetear todos los filtros
- **Tareas**:
  - [ ] Crear `frontend/src/features/products/ClearFiltersButton.tsx`
  - [ ] Botón con label "Limpiar filtros"
  - [ ] onClick → `useProductFilters().clearFilters()`
  - [ ] Solo mostrar si hay filtros activos
- **Archivos**: `frontend/src/features/products/ClearFiltersButton.tsx`
- **Criterios de aceptación**:
  - [ ] Renderiza sin crashes
  - [ ] onClick limpia todos los filtros
  - [ ] Solo visible si filtros activos
- **Testing**: Vitest component test
- **Commit**: `feat(productos): crear ClearFiltersButton component`
- **⏱️ Tiempo**: 0.25h

#### 5.4 Crear FilterContainer Layout
- **Objetivo**: Contenedor responsive con todos los componentes de filtro
- **Tareas**:
  - [ ] Crear `frontend/src/features/products/FilterContainer.tsx`
  - [ ] Renderiza: PriceRangeFilter + SortDropdown + ClearFiltersButton
  - [ ] Layout: desktop sidebar vs mobile accordion
  - [ ] Responsivo con Tailwind: `md:hidden` / `md:block`
- **Archivos**: `frontend/src/features/products/FilterContainer.tsx`
- **Criterios de aceptación**:
  - [ ] Desktop: sidebar vertical
  - [ ] Mobile: accordion collapsible
  - [ ] Todos los componentes visibles
- **Testing**: Vitest component test (desktop + mobile)
- **Commit**: `feat(productos): crear FilterContainer component`
- **⏱️ Tiempo**: 0.25h

---

### **FASE 6: Integración Frontend (1h)**

#### 6.1 Integrar FilterContainer en CategoryDetailPage
- **Objetivo**: Agregar filtros a la página de detalle de categoría
- **Tareas**:
  - [ ] Abrir `frontend/src/pages/CategoryDetailPage.tsx`
  - [ ] Importar: FilterContainer, useProductFilters, useProducts
  - [ ] Estructura layout:
    ```tsx
    <div className="flex gap-6">
      <aside className="w-64"><FilterContainer /></aside>
      <main><ProductList items={products} /></main>
    </div>
    ```
  - [ ] Pasar `products.items` a ProductList
  - [ ] Mostrar `products.isLoading` spinner
  - [ ] Mostrar `products.error` toast
- **Archivos**: `frontend/src/pages/CategoryDetailPage.tsx`
- **Criterios de aceptación**:
  - [ ] Filtros renderan
  - [ ] Cambios en filtros actualiza ProductList
  - [ ] isLoading muestra spinner
  - [ ] Errores muestran toast
- **Testing**: Integration test
- **Commit**: `feat(categorias): integrar filtros en CategoryDetailPage`
- **⏱️ Tiempo**: 0.25h

#### 6.2 Crear ProductList Component (actualizado)
- **Objetivo**: Renderizar lista de productos con paginación
- **Tareas**:
  - [ ] Si no existe, crear `frontend/src/features/products/ProductList.tsx`
  - [ ] Props: items: ProductoOutPublic[], total: number, page: number, has_next: bool, onPageChange: (page) => void
  - [ ] Map items a ProductCard
  - [ ] Renderizar "No hay productos" si items.length === 0
  - [ ] Paginación: "Anterior" | Página X de Y | "Siguiente"
- **Archivos**: `frontend/src/features/products/ProductList.tsx`
- **Criterios de aceptación**:
  - [ ] Renderiza productos
  - [ ] Muestra mensaje sin resultados
  - [ ] Pagination controls funcionales
  - [ ] onClick en página → `useProductFilters().setPage()`
- **Testing**: Vitest component test
- **Commit**: `feat(productos): crear ProductList con paginación`
- **⏱️ Tiempo**: 0.25h

#### 6.3 Agregar Loading Spinner
- **Objetivo**: Mostrar indicador mientras TanStack Query fetcha
- **Tareas**:
  - [ ] En CategoryDetailPage, si `products.isLoading`:
    ```tsx
    {products.isLoading && <LoadingSpinner />}
    ```
  - [ ] Spinner debe ocultar ProductList (no mostrar anterior)
- **Archivos**: `frontend/src/pages/CategoryDetailPage.tsx`
- **Criterios de aceptación**:
  - [ ] Spinner aparece durante fetch
  - [ ] Desaparece cuando data llega
- **Testing**: Component test
- **Commit**: `feat(categorias): agregar loading spinner`
- **⏱️ Tiempo**: 0.1h

#### 6.4 Agregar Error Toast
- **Objetivo**: Mostrar error si query falla
- **Tareas**:
  - [ ] En CategoryDetailPage, si `products.error`:
    ```tsx
    {products.error && <Toast message={products.error.message} type="error" />}
    ```
  - [ ] Toast debe desaparecer después 5s
  - [ ] Incluir retry button si es retryable
- **Archivos**: `frontend/src/pages/CategoryDetailPage.tsx`
- **Criterios de aceptación**:
  - [ ] Error toast aparece
  - [ ] Desaparece después timeout
  - [ ] Retry button funciona
- **Testing**: Component test
- **Commit**: `feat(categorias): agregar error handling`
- **⏱️ Tiempo**: 0.15h

---

### **FASE 7: Backend Tests (1.5h)**

#### 7.1 Test: Filtrar por rango de precio
- **Objetivo**: Unit test ProductService.get_public_paginated() con price_min/max
- **Tareas**:
  - [ ] Crear `backend/tests/test_productos_filters.py`
  - [ ] Setup: 4 productos con precios $5, $10, $15, $20 (500, 1000, 1500, 2000 centavos)
  - [ ] Test: `service.get_public_paginated(price_min=1000, price_max=1500)`
  - [ ] Assert: len(result.items) == 2 (solo $10 y $15)
  - [ ] Assert: todos los items están en rango
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [ ] Test pasa
  - [ ] Cubre happy path
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para filtro de precio`
- **⏱️ Tiempo**: 0.3h

#### 7.2 Test: Ordenamiento por precio
- **Objetivo**: Verificar sort_by=price_asc/desc funciona
- **Tareas**:
  - [ ] En `test_productos_filters.py`, agregar test
  - [ ] Setup: 5 productos con precios aleatorios
  - [ ] Test: `service.get_public_paginated(sort_by="price_asc")`
  - [ ] Assert: precios están en orden ascendente
  - [ ] Test: `sort_by="price_desc"` → orden descendente
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [ ] Test pasa para ambas direcciones
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para ordenamiento`
- **⏱️ Tiempo**: 0.3h

#### 7.3 Test: Validación de parámetros inválidos
- **Objetivo**: Rechazar price_min > price_max, sort_by inválido
- **Tareas**:
  - [ ] Test: `service.get_public_paginated(price_min=2000, price_max=1000)` → ValueError
  - [ ] Test: `sort_by="invalid_sort"` → ValueError
  - [ ] Test: `limit > 100` → cappeado a 100
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [ ] Tests pasan
  - [ ] Validación es correcta
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para validaciones`
- **⏱️ Tiempo**: 0.3h

#### 7.4 Test: Paginación
- **Objetivo**: Verificar has_next, has_prev, offset/limit
- **Tareas**:
  - [ ] Setup: 50 productos
  - [ ] Test: página 1 (20 items) → has_next=True, has_prev=False
  - [ ] Test: página 2 → has_prev=True, has_next=True
  - [ ] Test: página 3 → has_prev=True, has_next=False
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [ ] Tests pasan
  - [ ] Paginación correcta
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para paginación`
- **⏱️ Tiempo**: 0.3h

#### 7.5 Test: Compatibilidad con alérgenos existentes
- **Objetivo**: Filtro precio + alérgenos funcionan juntos
- **Tareas**:
  - [ ] Setup: 10 productos, 5 con cacahuete, rango de precios $5-$20
  - [ ] Test: `get_public_paginated(price_min=1000, price_max=1500, excluir_alergenos="cacahuete")`
  - [ ] Assert: solo productos en rango SIN cacahuete
- **Archivos**: `backend/tests/test_productos_filters.py`
- **Criterios de aceptación**:
  - [ ] Test pasa
  - [ ] Sin regressions
- **Testing**: pytest
- **Commit**: `test(productos): agregar test para compatibilidad alérgenos`
- **⏱️ Tiempo**: 0.2h

---

### **FASE 8: Frontend Tests (1.5h)**

#### 8.1 Test: useProducts Hook
- **Objetivo**: Vitest + React Testing Library para useProducts
- **Tareas**:
  - [ ] Crear `frontend/src/hooks/__tests__/useProducts.test.ts`
  - [ ] Mock TanStack Query, api.get()
  - [ ] Test: hook fetcha con filtros correctos
  - [ ] Test: refetch automático cuando filters cambian
  - [ ] Test: caching (staleTime=5min)
- **Archivos**: `frontend/src/hooks/__tests__/useProducts.test.ts`
- **Criterios de aceptación**:
  - [ ] Tests pasan
  - [ ] Cobertura >80%
- **Testing**: vitest
- **Commit**: `test(hooks): agregar tests para useProducts`
- **⏱️ Tiempo**: 0.3h

#### 8.2 Test: useProductFilters Store
- **Objetivo**: Zustand store persistence
- **Tareas**:
  - [ ] Crear `frontend/src/features/products/__tests__/useProductFilters.test.ts`
  - [ ] Test: setFilters() actualiza state
  - [ ] Test: localStorage persiste
  - [ ] Test: clearFilters() resetea
  - [ ] Test: setPage() cambia página
- **Archivos**: `frontend/src/features/products/__tests__/useProductFilters.test.ts`
- **Criterios de aceptación**:
  - [ ] Tests pasan
  - [ ] localStorage verificado
- **Testing**: vitest
- **Commit**: `test(store): agregar tests para useProductFilters`
- **⏱️ Tiempo**: 0.3h

#### 8.3 Test: PriceRangeFilter Component
- **Objetivo**: Component testing con RTL
- **Tareas**:
  - [ ] Crear `frontend/src/features/products/__tests__/PriceRangeFilter.test.tsx`
  - [ ] Test: renderiza inputs min/max
  - [ ] Test: validación min > max rechaza
  - [ ] Test: botón "Filtrar" llama setFilters()
  - [ ] Test: convierte USD a centavos
- **Archivos**: `frontend/src/features/products/__tests__/PriceRangeFilter.test.tsx`
- **Criterios de aceptación**:
  - [ ] Tests pasan
  - [ ] Cobertura >85%
- **Testing**: vitest + RTL
- **Commit**: `test(components): agregar tests para PriceRangeFilter`
- **⏱️ Tiempo**: 0.3h

#### 8.4 Test: SortDropdown Component
- **Objetivo**: Component testing
- **Tareas**:
  - [ ] Crear `frontend/src/features/products/__tests__/SortDropdown.test.tsx`
  - [ ] Test: renderiza 5 opciones
  - [ ] Test: onChange actualiza store
  - [ ] Test: default es "reciente"
- **Archivos**: `frontend/src/features/products/__tests__/SortDropdown.test.tsx`
- **Criterios de aceptación**:
  - [ ] Tests pasan
- **Testing**: vitest + RTL
- **Commit**: `test(components): agregar tests para SortDropdown`
- **⏱️ Tiempo**: 0.2h

#### 8.5 Test: Integration: Filter → Refetch → Render
- **Objetivo**: End-to-end component integration
- **Tareas**:
  - [ ] Crear `frontend/src/pages/__tests__/CategoryDetailPage.test.tsx`
  - [ ] Test: cambio en PriceRangeFilter → refetch de useProducts
  - [ ] Test: datos nuevos se renderizan
  - [ ] Test: spinner aparece/desaparece
- **Archivos**: `frontend/src/pages/__tests__/CategoryDetailPage.test.tsx`
- **Criterios de aceptación**:
  - [ ] Tests pasan
- **Testing**: vitest + RTL
- **Commit**: `test(pages): agregar integration tests para CategoryDetailPage`
- **⏱️ Tiempo**: 0.2h

---

### **FASE 9: E2E Tests (1h)**

#### 9.1 E2E: Aplicar filtro de precio
- **Objetivo**: Playwright end-to-end test
- **Tareas**:
  - [ ] Crear `frontend/e2e/category-filters.spec.ts`
  - [ ] Navegar a `/categorias/2`
  - [ ] Ingresar min=$10, max=$30
  - [ ] Click "Filtrar"
  - [ ] Esperar resultados
  - [ ] Assert: solo productos en rango visible
- **Archivos**: `frontend/e2e/category-filters.spec.ts`
- **Criterios de aceptación**:
  - [ ] Test pasa
- **Testing**: playwright
- **Commit**: `test(e2e): agregar E2E test para filtro de precio`
- **⏱️ Tiempo**: 0.25h

#### 9.2 E2E: Ordenar resultados
- **Objetivo**: Playwright test para sort
- **Tareas**:
  - [ ] En `category-filters.spec.ts`, agregar scenario
  - [ ] Seleccionar "Menor precio primero"
  - [ ] Esperar resultados
  - [ ] Assert: primer producto es más barato que último
- **Archivos**: `frontend/e2e/category-filters.spec.ts`
- **Criterios de aceptación**:
  - [ ] Test pasa
- **Testing**: playwright
- **Commit**: `test(e2e): agregar E2E test para ordenamiento`
- **⏱️ Tiempo**: 0.2h

#### 9.3 E2E: Paginación con filtros activos
- **Objetivo**: Cambiar página, verificar filtros persisten
- **Tareas**:
  - [ ] En `category-filters.spec.ts`, agregar scenario
  - [ ] Aplicar filtro (price_min=$10)
  - [ ] Click "Siguiente página"
  - [ ] Esperar
  - [ ] Assert: items son diferentes, pero aún en rango
- **Archivos**: `frontend/e2e/category-filters.spec.ts`
- **Criterios de aceptación**:
  - [ ] Test pasa
- **Testing**: playwright
- **Commit**: `test(e2e): agregar E2E test para paginación`
- **⏱️ Tiempo**: 0.2h

#### 9.4 E2E: localStorage persistence
- **Objetivo**: Refresh página, verificar filtros persisten
- **Tareas**:
  - [ ] En `category-filters.spec.ts`, agregar scenario
  - [ ] Aplicar filtro + sort
  - [ ] Hacer F5 (reload)
  - [ ] Esperar page load
  - [ ] Assert: filtros están activos, datos restaurados
- **Archivos**: `frontend/e2e/category-filters.spec.ts`
- **Criterios de aceptación**:
  - [ ] Test pasa
- **Testing**: playwright
- **Commit**: `test(e2e): agregar E2E test para localStorage`
- **⏱️ Tiempo**: 0.15h

---

### **FASE 10: Performance & Polish (1.5h)**

#### 10.1 Benchmark: Query time < 200ms
- **Objetivo**: Verificar que índices mejoraron performance
- **Tareas**:
  - [ ] Ejecutar backend con 5k productos
  - [ ] Test queries:
    - [ ] GET /api/v1/public/productos?price_min=500&price_max=3000
    - [ ] Medir tiempo: debe ser <200ms
    - [ ] Compare: sin índice (antes) vs con índice (después)
  - [ ] Documentar resultados
- **Archivos**: `docs/PERFORMANCE.md` (nuevo)
- **Criterios de aceptación**:
  - [ ] Query time <200ms (con índices)
  - [ ] 50%+ mejora vs sin índices
- **Testing**: Apache Bench o curl + time
- **Commit**: `docs(perf): documentar benchmark de queries`
- **⏱️ Tiempo**: 0.3h

#### 10.2 Accessibility: ARIA labels
- **Objetivo**: Verificar componentes cumplen WCAG 2.1
- **Tareas**:
  - [ ] En PriceRangeFilter: agregar `<label htmlFor="price-min">Precio mínimo</label>`
  - [ ] En SortDropdown: agregar `<label htmlFor="sort-by">Ordenar por</label>`
  - [ ] En botones: agregar `aria-label` descriptivos
  - [ ] Test con axe devtools
- **Archivos**: Frontend components
- **Criterios de aceptación**:
  - [ ] axe devtools sin violations
- **Testing**: axe scan
- **Commit**: `a11y(components): agregar ARIA labels`
- **⏱️ Tiempo**: 0.2h

#### 10.3 UI Polish: Estilos Tailwind
- **Objetivo**: Mejorar visualización con Tailwind CSS
- **Tareas**:
  - [ ] FilterContainer: agregar `bg-gray-100 rounded-lg p-4`
  - [ ] PriceRangeFilter inputs: `focus:ring-blue-500`
  - [ ] Botón "Filtrar": `hover:bg-blue-700 transition-colors`
  - [ ] SortDropdown: `border-gray-300 rounded`
  - [ ] Responsive: `md:block hidden` para desktop/mobile
- **Archivos**: Frontend components
- **Criterios de aceptación**:
  - [ ] UI se ve profesional
  - [ ] Responsive en mobile/tablet/desktop
- **Testing**: Visual inspection + responsive test
- **Commit**: `style(componentes): mejorar estilos con Tailwind`
- **⏱️ Tiempo**: 0.3h

#### 10.4 Documentation: Actualizar README
- **Objetivo**: Documentar cómo usar los nuevos filtros
- **Tareas**:
  - [ ] En `docs/` o `README.md`, agregar sección "Filtros de Productos"
  - [ ] Documentar query params disponibles
  - [ ] Ejemplos de URLs:
    - `GET /api/v1/public/productos?price_min=500&price_max=3000&sort_by=price_asc`
  - [ ] Explicar storage en localStorage
  - [ ] Performance notes
- **Archivos**: `docs/FILTERS.md` (nuevo) o `README.md` (modificado)
- **Criterios de aceptación**:
  - [ ] Documentación clara
  - [ ] Ejemplos funcionales
- **Testing**: Lectura por QA
- **Commit**: `docs(filtros): documentar nueva feature`
- **⏱️ Tiempo**: 0.2h

#### 10.5 Code Review & Final Checks
- **Objetivo**: Revisión final antes de merge
- **Tareas**:
  - [ ] ESLint: `npm run lint` sin warnings
  - [ ] TypeScript: `npm run type-check` sin errores
  - [ ] Prettier: `npm run format:check` OK
  - [ ] Backend: `pylint backend/` OK
  - [ ] Tests: `npm test -- --coverage` >80%
- **Archivos**: N/A (checks)
- **Criterios de aceptación**:
  - [ ] Todos los checks pasan
- **Testing**: CI/CD
- **Commit**: N/A (solo verificación)
- **⏱️ Tiempo**: 0.3h

---

## 📊 Resumen de Tareas

| Fase | Tareas | Horas | Status |
|------|--------|-------|--------|
| 1 | DB Setup | 0.5h | ⏳ Pending |
| 2 | Backend Service | 1.5h | ⏳ Pending |
| 3 | Backend Router | 1h | ⏳ Pending |
| 4 | Frontend Hooks | 1.5h | ⏳ Pending |
| 5 | Frontend Components | 1.5h | ⏳ Pending |
| 6 | Frontend Integration | 1h | ⏳ Pending |
| 7 | Backend Tests | 1.5h | ⏳ Pending |
| 8 | Frontend Tests | 1.5h | ⏳ Pending |
| 9 | E2E Tests | 1h | ⏳ Pending |
| 10 | Performance & Polish | 1.5h | ⏳ Pending |
| | **TOTAL** | **11.5h** | |

---

## ✅ Criterios de Éxito Final

- [ ] Todas las tareas completadas (50/50)
- [ ] Backend: Filtros + sort + paginación funcionando
- [ ] Frontend: Componentes renderizados, store persistente
- [ ] Índices de BD activos, query time <200ms
- [ ] Tests: >80% cobertura, E2E pasando
- [ ] Documentación: Filtros explicados
- [ ] Code review: ESLint/Prettier/mypy OK
