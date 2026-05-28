# Diseño Técnico: CH-029 Filtros y Ordenamiento de Productos

## Enfoque Técnico

CH-029 extiende el endpoint público existente `GET /api/v1/productos/publico/catalogo` para agregar **filtrado por rango de precio**, **paginación con metadatos**, y **múltiples opciones de ordenamiento**. Se integra con la **arquitectura actual de capas** (Router → Service → UoW → Repository) usando **TanStack Query** en frontend para gestionar estado del servidor y **localStorage** para persistir preferencias de filtro.

---

## Decisiones Arquitectónicas

| Decisión | Elección | Alternativas | Justificación |
|----------|----------|--------------|--------------|
| **Gestión de estado de filtro** | Zustand store local + localStorage | Redux, Context API, TanStack Router | Zustand es ligero, ya usado en el proyecto, localStorage evita query params complejos en fase 1 |
| **Paginación** | OFFSET/LIMIT server-side | Cursor-based, infinite scroll | OFFSET/LIMIT es estándar, simple de implementar, suficiente para MVP con 5k+ items |
| **Validación de filtros** | Dual (backend 400, frontend inline) | Solo backend | Backend rechaza invalid; frontend previene envío, mejor UX |
| **Índices de DB** | Índice compuesto (categoria_id, precio_base) | Índices separados | Compuesto es más eficiente para queries con ambas condiciones |
| **Caché de queries** | TanStack Query (en-memoria) | Redis, HTTP cache headers | TanStack maneja deduplicación automática, stale-while-revalidate nativa |

---

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Componente: ProductCatalog                                      │
│       │                                                           │
│       ├→ useProductFilters() [Zustand store]                    │
│       │  ├ priceMin, priceMax, sortBy, page                     │
│       │  └ setPriceRange(), setSortBy(), clearFilters()        │
│       │                                                           │
│       ├→ useProducts() [TanStack Query]                         │
│       │  ├ key: ['products', {priceMin, priceMax, sortBy, page}]
│       │  ├ fetch: /api/v1/productos/publico/catalogo?...       │
│       │  └ cache: auto-deduplicate, stale-while-revalidate     │
│       │                                                           │
│       └→ localStorage (ch029_filters)                           │
│          └ hydrate Zustand on mount                             │
│                                                                   │
│  UI:                                                             │
│  ┌─────────────────┬──────────────────────────────────┐        │
│  │ PriceRangeFilter│ SortDropdown, Pagination         │        │
│  ├─────────────────┼──────────────────────────────────┤        │
│  │ on change       │ on change                        │        │
│  └─────────┬───────┴──────────────────────────────────┘        │
│            │                                                     │
│            └→ Zustand state update                              │
│               (triggers useProducts refetch)                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Router endpoint: GET /publico/catalogo                         │
│    Query params: precio_min, precio_max, sort_by, page, limit  │
│       ↓                                                           │
│  1. Validar parámetros (400 si invalid)                         │
│  2. ProductoService.get_public_paginated()                      │
│       ↓                                                           │
│  3. ProductoRepository.get_public_paginated()                   │
│       ├ WHERE categoria_id, disponible=true, deleted_at IS NULL│
│       ├ AND precio_base BETWEEN min AND max                    │
│       ├ ORDER BY precio_base (ASC/DESC) / nombre / creado_en   │
│       ├ OFFSET/LIMIT (paginación)                              │
│       └ eager-load ingredientes (selectinload, sin N+1)        │
│       ↓                                                           │
│  4. Estructura: {items, total, page, limit, has_next, has_prev}
│       ↓                                                           │
└─────────────────────────────────────────────────────────────────┘
         ↓ JSON
    Re-render Frontend
```

---

## Diseño Backend

### Cambios en Service (ProductoService)

**Método actual:**
```python
async def get_public_paginated(
    self,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    categoria_id: Optional[int] = None,
    excluir_alergenos: Optional[list[int]] = None,
) -> tuple[list[Producto], int]
```

**Método actualizado:**
```python
async def get_public_paginated(
    self,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    categoria_id: Optional[int] = None,
    excluir_alergenos: Optional[list[int]] = None,
    precio_min: Optional[int] = None,      # NEW (en centavos)
    precio_max: Optional[int] = None,      # NEW (en centavos)
    sort_by: str = "reciente",             # NEW (enum: price_asc, price_desc, nombre_asc, nombre_desc, reciente)
) -> tuple[list[Producto], int]
```

**Lógica en repository:**
- Agregar filtro `WHERE precio_base >= precio_min AND precio_base <= precio_max`
- Agregar ordenamiento dinámico según `sort_by` enum
- Mantener compatibilidad con filtro de alergenos existente (AND lógico)

### Cambios en Repository (ProductoRepository)

**Nuevo método:**
```python
async def get_public_paginated(
    self,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    categoria_id: Optional[int] = None,
    excluir_alergenos: Optional[list[int]] = None,
    precio_min: Optional[int] = None,
    precio_max: Optional[int] = None,
    sort_by: str = "reciente",
) -> tuple[list[Producto], int]
```

**Implementación:**
```python
# Base query
stmt = select(Producto).where(
    Producto.disponible == True,
    Producto.deleted_at.is_(None),
)

# Filtro categoria_id (si aplica)
if categoria_id:
    stmt = stmt.where(Producto.categoria_id == categoria_id)

# Filtro precio (NEW)
if precio_min is not None:
    stmt = stmt.where(Producto.precio_base >= Decimal(str(precio_min / 100)))
if precio_max is not None:
    stmt = stmt.where(Producto.precio_base <= Decimal(str(precio_max / 100)))

# Filtro search
if search:
    stmt = stmt.where(
        or_(
            Producto.nombre.ilike(f"%{search}%"),
            Producto.descripcion.ilike(f"%{search}%"),
        )
    )

# Filtro alergenos (existente)
if excluir_alergenos:
    # JOIN ProductoIngrediente, filtrar por IDs
    stmt = stmt.where(
        ~exists(
            select(ProductoIngrediente).where(
                ProductoIngrediente.producto_id == Producto.id,
                ProductoIngrediente.ingrediente_id.in_(excluir_alergenos),
            )
        )
    )

# Ordenamiento (NEW)
if sort_by == "price_asc":
    stmt = stmt.order_by(Producto.precio_base.asc())
elif sort_by == "price_desc":
    stmt = stmt.order_by(Producto.precio_base.desc())
elif sort_by == "nombre_asc":
    stmt = stmt.order_by(Producto.nombre.asc())
elif sort_by == "nombre_desc":
    stmt = stmt.order_by(Producto.nombre.desc())
else:  # reciente (default)
    stmt = stmt.order_by(Producto.creado_en.desc())

# Eager-load para evitar N+1
stmt = stmt.options(
    selectinload(Producto.ingredientes),
    selectinload(Producto.categorias),
)

# Contar total
count_stmt = select(func.count()).select_from(Producto).where(
    # SAME WHERE conditions as above
)
total = await self.session.execute(count_stmt).scalar() or 0

# Paginación
stmt = stmt.offset(skip).limit(limit)

# Ejecutar
result = await self.session.execute(stmt)
items = list(result.unique().scalars().all())

return items, total
```

### Schema Pydantic (NEW)

```python
class PaginatedProductList(BaseModel):
    """Response con paginación completa"""
    items: list[ProductoOutPublic]
    total: int          # Total de items que coinciden con filtros
    page: int           # Página actual (1-indexed)
    limit: int          # Items por página
    has_next: bool      # True si hay página siguiente
    has_prev: bool      # True si hay página anterior
```

### Router Actualizado

```python
@router.get(
    "/publico/catalogo",
    response_model=PaginatedProductList,  # CAMBIO: antes ProductoOutPublicList
    summary="Catálogo público con filtros",
)
async def get_catalogo_publico(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, gt=0, le=100),  # CAMBIO: reducir a 100 max
    search: Optional[str] = Query(None, max_length=200),
    categoria_id: Optional[int] = Query(None, gt=0),
    excluir_alergenos: Optional[str] = Query(None),
    precio_min: Optional[int] = Query(None, ge=0),      # NEW: centavos
    precio_max: Optional[int] = Query(None, ge=0),      # NEW: centavos
    sort_by: str = Query("reciente", regex="^(price_asc|price_desc|nombre_asc|nombre_desc|reciente)$"),  # NEW
) -> PaginatedProductList:
    """Catálogo público con filtros, ordenamiento y paginación"""
    
    # Validaciones
    if precio_min is not None and precio_max is not None:
        if precio_min > precio_max:
            raise HTTPException(status_code=400, detail="precio_min no puede ser mayor a precio_max")
    
    if page < 1:
        raise HTTPException(status_code=400, detail="page debe ser >= 1")
    
    # Parse alergenos (existente)
    alergenos_ids = None
    if excluir_alergenos and settings.ff_filtro_alergenos:
        try:
            alergenos_ids = [int(x.strip()) for x in excluir_alergenos.split(",") if x.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="excluir_alergenos inválido")
    
    service = ProductoService()
    items, total = await service.get_public_paginated(
        skip=skip,
        limit=limit,
        search=search,
        categoria_id=categoria_id,
        excluir_alergenos=alergenos_ids,
        precio_min=precio_min,      # NEW
        precio_max=precio_max,      # NEW
        sort_by=sort_by,            # NEW
    )
    
    # Calcular paginación
    page = (skip // limit) + 1
    has_next = (skip + limit) < total
    has_prev = skip > 0
    
    return PaginatedProductList(
        items=[ProductoOutPublic.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
        has_next=has_next,
        has_prev=has_prev,
    )
```

### Índice de Base de Datos (Migration)

**Alembic migration:**
```sql
-- Crear índice compuesto para acelerar filtros de precio + categoría
CREATE INDEX idx_producto_categoria_precio 
ON producto(categoria_id, precio_base);

-- Crear índice para ordenamiento por fecha
CREATE INDEX idx_producto_creado_en 
ON producto(creado_en DESC);
```

**Impacto estimado:** Queries con filtro de precio mejoran ~50-70% en datasets >5k items.

---

## Diseño Frontend

### Componentes Nuevos

#### 1. `PriceRangeFilter.tsx`
```typescript
interface PriceRangeFilterProps {
  minPrice: number;
  maxPrice: number;
  onApply: (min: number, max: number) => void;
  isLoading?: boolean;
}

export function PriceRangeFilter(props: PriceRangeFilterProps) {
  const [localMin, setLocalMin] = useState(props.minPrice);
  const [localMax, setLocalMax] = useState(props.maxPrice);
  const [error, setError] = useState<string | null>(null);
  
  const isValid = localMin <= localMax;
  
  const handleApply = () => {
    if (!isValid) {
      setError("El mínimo no puede ser mayor al máximo");
      return;
    }
    setError(null);
    props.onApply(localMin, localMax);
  };
  
  return (
    <div className="space-y-2">
      <label>Rango de Precio</label>
      <input 
        type="number" 
        placeholder="$0" 
        value={localMin}
        onChange={(e) => setLocalMin(+e.target.value)}
      />
      <input 
        type="number" 
        placeholder="$100" 
        value={localMax}
        onChange={(e) => setLocalMax(+e.target.value)}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button 
        onClick={handleApply} 
        disabled={!isValid || props.isLoading}
      >
        Filtrar
      </button>
    </div>
  );
}
```

#### 2. `SortDropdown.tsx`
```typescript
interface SortDropdownProps {
  value: 'reciente' | 'price_asc' | 'price_desc' | 'nombre_asc' | 'nombre_desc';
  onChange: (value: typeof value) => void;
}

export function SortDropdown(props: SortDropdownProps) {
  const options = [
    { label: "Más reciente", value: "reciente" },
    { label: "Menor precio primero", value: "price_asc" },
    { label: "Mayor precio primero", value: "price_desc" },
    { label: "Nombre (A-Z)", value: "nombre_asc" },
    { label: "Nombre (Z-A)", value: "nombre_desc" },
  ];
  
  return (
    <select value={props.value} onChange={(e) => props.onChange(e.target.value as any)}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
```

### Hook Personalizado: `useProducts.ts`

```typescript
interface UseProductsParams {
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'reciente' | 'price_asc' | 'price_desc' | 'nombre_asc' | 'nombre_desc';
  page?: number;
  limit?: number;
  searchTerm?: string;
}

interface PaginatedProductList {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export function useProducts(params: UseProductsParams) {
  return useQuery<PaginatedProductList>({
    queryKey: ['products', params],  // Auto-deduplicate con TanStack Query
    queryFn: async () => {
      const response = await axiosInstance.get('/api/v1/productos/publico/catalogo', {
        params: {
          skip: ((params.page || 1) - 1) * (params.limit || 20),
          limit: params.limit || 20,
          categoria_id: params.categoryId,
          precio_min: params.priceMin ? params.priceMin * 100 : undefined,  // Convertir USD a centavos
          precio_max: params.priceMax ? params.priceMax * 100 : undefined,
          sort_by: params.sortBy || 'reciente',
          search: params.searchTerm,
        },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,  // 5 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos (antes cacheTime)
  });
}
```

### Zustand Store: `useProductFilters.ts`

```typescript
interface ProductFiltersState {
  // Filtros
  priceMin: number | null;
  priceMax: number | null;
  sortBy: 'reciente' | 'price_asc' | 'price_desc' | 'nombre_asc' | 'nombre_desc';
  page: number;
  
  // Acciones
  setPriceRange: (min: number | null, max: number | null) => void;
  setSortBy: (sort: ProductFiltersState['sortBy']) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  hydrate: (state: Partial<ProductFiltersState>) => void;
}

export const useProductFilters = create<ProductFiltersState>((set) => ({
  priceMin: null,
  priceMax: null,
  sortBy: 'reciente',
  page: 1,
  
  setPriceRange: (min, max) => set({ priceMin: min, priceMax: max, page: 1 }),
  setSortBy: (sort) => set({ sortBy: sort, page: 1 }),
  setPage: (page) => set({ page }),
  clearFilters: () => set({ priceMin: null, priceMax: null, sortBy: 'reciente', page: 1 }),
  hydrate: (state) => set(state),
}));

// localStorage persistence
export function useFiltersHydration() {
  useEffect(() => {
    const stored = localStorage.getItem('ch029_filters');
    if (stored) {
      try {
        const state = JSON.parse(stored);
        useProductFilters.getState().hydrate(state);
      } catch (e) {
        console.error('Failed to hydrate filters:', e);
      }
    }
  }, []);
  
  // Subscribe to store changes and persist
  useEffect(() => {
    const unsubscribe = useProductFilters.subscribe((state) => {
      localStorage.setItem('ch029_filters', JSON.stringify({
        priceMin: state.priceMin,
        priceMax: state.priceMax,
        sortBy: state.sortBy,
      }));
    });
    return unsubscribe;
  }, []);
}
```

### Componente Principal: `ProductCatalog.tsx`

```typescript
export function ProductCatalog() {
  const filters = useProductFilters();
  useFiltersHydration();  // Hydrate on mount + subscribe to changes
  
  const { data, isLoading, error } = useProducts({
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    sortBy: filters.sortBy,
    page: filters.page,
  });
  
  if (error) {
    return (
      <Toast 
        type="error" 
        message="Error al cargar productos" 
        action={() => location.reload()}
      />
    );
  }
  
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar Filtros */}
      <aside className="col-span-3 space-y-4">
        <PriceRangeFilter
          minPrice={filters.priceMin || 0}
          maxPrice={filters.priceMax || 100}
          onApply={(min, max) => filters.setPriceRange(min, max)}
          isLoading={isLoading}
        />
        <SortDropdown
          value={filters.sortBy}
          onChange={(sort) => filters.setSortBy(sort)}
        />
        <button onClick={() => filters.clearFilters()}>
          Limpiar filtros
        </button>
      </aside>
      
      {/* Grid Productos */}
      <section className="col-span-9">
        {isLoading && <div>Cargando...</div>}
        {data?.items.length === 0 && <div>No hay productos que coincidan</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {/* Paginación */}
        <div className="mt-6 flex justify-between">
          <button 
            onClick={() => filters.setPage(filters.page - 1)}
            disabled={!data?.has_prev}
          >
            ← Anterior
          </button>
          <span>Página {filters.page} de {Math.ceil((data?.total || 0) / (data?.limit || 20))}</span>
          <button 
            onClick={() => filters.setPage(filters.page + 1)}
            disabled={!data?.has_next}
          >
            Siguiente →
          </button>
        </div>
      </section>
    </div>
  );
}
```

---

## Cambios de Archivos

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `backend/productos/service.py` | Modificar | Agregar parámetros `precio_min`, `precio_max`, `sort_by` a `get_public_paginated()` |
| `backend/productos/repository.py` | Modificar | Agregar lógica de filtro y ordenamiento en query builder |
| `backend/productos/router.py` | Modificar | Actualizar endpoint `/publico/catalogo` con nuevos parámetros y validaciones |
| `backend/productos/schemas.py` | Crear | Schema `PaginatedProductList` con metadatos de paginación |
| `backend/migrations/alembic/versions/` | Crear | Migration: Crear índice compuesto `(categoria_id, precio_base)` |
| `frontend/src/features/products/hooks/useProducts.ts` | Crear | Hook TanStack Query para fetch con filtros |
| `frontend/src/features/products/hooks/useProductFilters.ts` | Crear | Zustand store + localStorage para estado de filtros |
| `frontend/src/features/products/components/PriceRangeFilter.tsx` | Crear | Componente input range de precio |
| `frontend/src/features/products/components/SortDropdown.tsx` | Crear | Componente dropdown de ordenamiento |
| `frontend/src/pages/ProductCatalog.tsx` | Modificar | Integrar nuevos hooks y componentes de filtro |

---

## Contratos de API

### Request
```
GET /api/v1/productos/publico/catalogo?precio_min=1000&precio_max=5000&sort_by=price_asc&page=1&limit=20
```

### Response (200 OK)
```json
{
  "items": [
    {
      "id": 1,
      "nombre": "Leche descremada",
      "precio_base": 1500,
      "stock_cantidad": 10,
      "es_destacado": false,
      "categoria_id": 2
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "has_next": true,
  "has_prev": false
}
```

### Response (400 Bad Request)
```json
{
  "error": "precio_min no puede ser mayor a precio_max"
}
```

---

## Estrategia de Testing

| Capa | Qué Testear | Enfoque |
|------|-------------|---------|
| **Unit (Backend)** | Lógica de filtro, validaciones precio min/max, enum sort_by | pytest + mock session |
| **Unit (Frontend)** | useProducts hook, useProductFilters store | Vitest + msw (mock service worker) |
| **Integración** | Endpoint `/publico/catalogo` con BD real | Alembic + SQLite in-memory |
| **E2E** | Filtro precio → resultados → paginación → localStorage | Playwright |

---

## Migración / Rollout

**Sin migración de datos requerida** — solo cambios de schema (índice) y lógica de query.

**Rollout:**
1. Deploy Alembic migration (índice)
2. Deploy backend cambios
3. Deploy frontend cambios
4. Monitoreo: latencia de query, tasa de errores 400

---

## Preguntas Abiertas

- ¿Es aceptable el formato de respuesta con `page` (1-indexed) o preferir `skip`?
  - **Respuesta (del spec):** page 1-indexed ✓
- ¿Hacer filtro de alergenos visualmente en UI? (Fase 2, no incluido en CH-029)
  - **Respuesta (del proposal):** Fase 2, solo precio + sort en CH-029 ✓

---

## Consideraciones de Performance

**Índice compuesto:** `(categoria_id, precio_base)` acelera:
- WHERE categoria_id = X AND precio_base BETWEEN Y AND Z
- Mejora estimada: ~50-70% en datasets >5k items

**TanStack Query:** Auto-deduplicación de requests idénticos dentro de `staleTime` (5 min)

**localStorage:** Evita re-fetch de metadatos filtro en recargas, menos tráfico HTTP

**Query timeout:** Backend configura timeout a 5s (slowapi middleware ya presente)

---

## Extensibilidad Futura

| Feature Futura | Entrypoint |
|---|---|
| **URL state sync (CH-032)** | Router puede inyectar query params desde URL en Zustand |
| **Filtros dietarios (vegan/gluten-free)** | Agregar parámetro `etiquetas` a repository query builder |
| **Elasticsearch** | Reemplazar query builder con cliente ES cuando escale >100k items |
| **Redis caching** | Wrapper en repository.get_public_paginated() para cache query results |
| **Rating filter** | Agregar campo `rating` a Producto, índice, y parámetro sort_by |

---

## Resumen de Decisiones Clave

✅ **Zustand + localStorage:** Suficiente para fase 1; fácil migrar a URL state después  
✅ **OFFSET/LIMIT:** Standard, simple de debuggear, MVP-friendly  
✅ **Índice compuesto:** Optimización crítica para queries complejas  
✅ **Dual validation:** Frontend previene envío inválido, backend rechaza de todos modos  
✅ **TanStack Query:** Caching + deduplicación automáticos, menos re-fetches  

**Listo para tasks.**
