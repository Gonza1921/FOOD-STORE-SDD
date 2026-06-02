# Diseño Técnico: CH-029 Filtros y Ordenamiento de Productos

## 📐 Enfoque Técnico

CH-029 extiende el endpoint público existente (`GET /api/v1/public/productos`) con filtrado, ordenamiento y paginación completos. El backend provee capacidades completas; el frontend usa TanStack Query para queries inteligentes + Zustand para persistencia local de filtros.

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND USER                          │
│  PriceRangeFilter.tsx | SortDropdown.tsx                    │
└────────────────────┬──────────────────────────────────────────┘
                     │ onChange → setFilters()
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            Zustand Store (filters + localStorage)           │
│  { price_min, price_max, sort_by, page, categoria_id }     │
└────────────────────┬──────────────────────────────────────────┘
                     │ subscribe
                     ↓
┌─────────────────────────────────────────────────────────────┐
│      useProducts() Hook (TanStack Query v5+)                │
│  Detects filter changes → refetch with new params           │
└────────────────────┬──────────────────────────────────────────┘
                     │ HTTP GET /api/v1/public/productos?...
                     ↓
┌─────────────────────────────────────────────────────────────┐
│          BACKEND: FastAPI Router                            │
│  @router.get("/") with query params (price_min, sort_by)   │
└────────────────────┬──────────────────────────────────────────┘
                     │ ProductService.get_public_paginated()
                     ↓
┌─────────────────────────────────────────────────────────────┐
│     Repository Layer: ProductRepository                     │
│  WHERE categoria_id AND precio_base BETWEEN ...             │
│  ORDER BY (sort_by) LIMIT 20 OFFSET 0                       │
└────────────────────┬──────────────────────────────────────────┘
                     │ SQL Query
                     ↓
┌─────────────────────────────────────────────────────────────┐
│      DATABASE: PostgreSQL                                   │
│  productos table (indexed on categoria_id, precio_base)     │
└────────────────────┬──────────────────────────────────────────┘
                     │ Return 20 items + total count
                     ↓
┌─────────────────────────────────────────────────────────────┐
│      Response: PaginatedProductList                         │
│  { items, total, page, has_next, has_prev }                │
└────────────────────┬──────────────────────────────────────────┘
                     │ JSON response
                     ↓
┌─────────────────────────────────────────────────────────────┐
│      TanStack Query: Cache + Deduplicate                    │
│  Auto-updates component state                              │
└────────────────────┬──────────────────────────────────────────┘
                     │ data, isLoading, error
                     ↓
┌─────────────────────────────────────────────────────────────┐
│      ProductList.tsx Component                              │
│  {products.map(p => <ProductCard {...p} />)}               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Decisiones Arquitectónicas

| Decisión | Opción Elegida | Alternativa | Trade-off |
|----------|---|---|---|
| **State Management** | Zustand store + localStorage | Redux / Context / URL state | Zustand es minimalista, localStorage persiste entre sesiones, pero sin URL state (agregar en CH-032) |
| **Paginación** | OFFSET/LIMIT | Cursor-based (keyset) | OFFSET/LIMIT es estándar, simple de implementar. Cursor es mejor para scroll infinito (futuro) |
| **Validación Filtros** | Dual: frontend inline + backend 400 | Backend-only | Validación frontend mejora UX (feedback instant), backend valida por seguridad |
| **Índice DB** | Compuesto (categoria_id, precio_base) | Índices separados | Compuesto optimiza queries con WHERE categoria_id = X AND precio_base BETWEEN Y Z |
| **Caché Queries** | TanStack Query (en-memoria) | Redis backend | MVP rápido sin infraestructura, TQ auto-dedup + stale-while-revalidate |
| **Sort Descending** | Enum hardcoded en backend | Dynamic column + ASC/DESC | Enum previene injection, simpler API, pero menos flexible |

---

## 🔧 Diseño Backend

### ProductService (modificado)

```python
# backend/productos/service.py

class ProductoService:
    
    async def get_public_paginated(
        self,
        categoria_id: Optional[int] = None,
        price_min: Optional[int] = None,  # NEW: en centavos
        price_max: Optional[int] = None,  # NEW: en centavos
        sort_by: str = "reciente",        # NEW: enum
        page: int = 1,
        limit: int = 20,
        excluir_alergenos: Optional[str] = None,  # EXISTING
    ) -> PaginatedProductList:
        """
        Retorna productos con filtros + ordenamiento + paginación.
        
        Args:
            categoria_id: Filtro por categoría (opcional)
            price_min: Precio mínimo en centavos (opcional)
            price_max: Precio máximo en centavos (opcional)
            sort_by: "price_asc", "price_desc", "nombre_asc", "nombre_desc", "reciente"
            page: 1-indexed page number
            limit: Items per page (max 100)
            excluir_alergenos: CSV string de alérgenos a excluir
        
        Returns:
            PaginatedProductList con items, total, metadata
        
        Raises:
            ValueError: Si price_min > price_max o sort_by inválido
        """
        # Validación
        if price_min is not None and price_max is not None:
            if price_min > price_max:
                raise ValueError("price_min debe ser <= price_max")
        
        if sort_by not in ["price_asc", "price_desc", "nombre_asc", "nombre_desc", "reciente"]:
            raise ValueError(f"sort_by inválido: {sort_by}")
        
        limit = min(limit, 100)  # Cap at 100
        offset = (page - 1) * limit
        
        # Delegamos al repository
        items, total = await self.repository.find_public_paginated(
            categoria_id=categoria_id,
            price_min=price_min,
            price_max=price_max,
            sort_by=sort_by,
            offset=offset,
            limit=limit,
            excluir_alergenos=excluir_alergenos,
        )
        
        return PaginatedProductList(
            items=items,
            total=total,
            page=page,
            limit=limit,
            has_next=offset + limit < total,
            has_prev=page > 1,
        )
```

### ProductRepository (modificado)

```python
# backend/productos/repository.py

class ProductoRepository:
    
    async def find_public_paginated(
        self,
        categoria_id: Optional[int] = None,
        price_min: Optional[int] = None,
        price_max: Optional[int] = None,
        sort_by: str = "reciente",
        offset: int = 0,
        limit: int = 20,
        excluir_alergenos: Optional[str] = None,
    ) -> Tuple[List[ProductoOutPublic], int]:
        """
        Ejecuta query optimizada con índices.
        """
        query = select(Producto).where(Producto.eliminado_en.is_(None))
        
        # Filtro categoría
        if categoria_id:
            query = query.where(Producto.categoria_id == categoria_id)
        
        # Filtro precio
        if price_min is not None:
            query = query.where(Producto.precio_base >= price_min)
        if price_max is not None:
            query = query.where(Producto.precio_base <= price_max)
        
        # Filtro alérgenos (mantener lógica existente)
        if excluir_alergenos:
            alergenlist = [a.strip() for a in excluir_alergenos.split(",")]
            subquery = select(ProductoIngrediente.producto_id).join(
                Ingrediente
            ).where(
                Ingrediente.nombre.in_(alergenlist)
            )
            query = query.where(~Producto.id.in_(subquery))
        
        # Ordenamiento
        if sort_by == "price_asc":
            query = query.order_by(Producto.precio_base.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Producto.precio_base.desc())
        elif sort_by == "nombre_asc":
            query = query.order_by(Producto.nombre.asc())
        elif sort_by == "nombre_desc":
            query = query.order_by(Producto.nombre.desc())
        else:  # "reciente"
            query = query.order_by(Producto.creado_en.desc())
        
        # Eager load ingredientes (evita N+1)
        query = query.options(selectinload(Producto.ingredientes))
        
        # Contar total ANTES de LIMIT/OFFSET
        total_result = await self.session.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar()
        
        # Aplicar paginación
        query = query.offset(offset).limit(limit)
        result = await self.session.execute(query)
        productos = result.scalars().unique().all()
        
        # Convertir a schemas
        items = [ProductoOutPublic.from_orm(p) for p in productos]
        
        return items, total
```

### Router (modificado)

```python
# backend/productos/router.py

@router.get("/")
async def get_public_productos(
    categoria_id: Optional[int] = Query(None),
    price_min: Optional[int] = Query(None, ge=0),
    price_max: Optional[int] = Query(None, ge=0),
    sort_by: str = Query("reciente", regex="^(price_asc|price_desc|nombre_asc|nombre_desc|reciente)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    excluir_alergenos: Optional[str] = Query(None),
    service: ProductoService = Depends(get_producto_service),
) -> PaginatedProductList:
    """
    Listado público de productos con filtros, ordenamiento y paginación.
    
    Query params:
    - categoria_id: int (opcional)
    - price_min: int en centavos (opcional)
    - price_max: int en centavos (opcional)
    - sort_by: enum (opcional, default: reciente)
    - page: int (opcional, default: 1)
    - limit: int (opcional, default: 20, max: 100)
    - excluir_alergenos: CSV string (opcional)
    """
    try:
        return await service.get_public_paginated(
            categoria_id=categoria_id,
            price_min=price_min,
            price_max=price_max,
            sort_by=sort_by,
            page=page,
            limit=limit,
            excluir_alergenos=excluir_alergenos,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 🎨 Diseño Frontend

### Hook: useProducts

```typescript
// frontend/src/hooks/useProducts.ts

import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";

export interface ProductFilters {
  categoria_id?: number;
  price_min?: number;
  price_max?: number;
  sort_by?: "price_asc" | "price_desc" | "nombre_asc" | "nombre_desc" | "reciente";
  page?: number;
  limit?: number;
}

export function useProducts(filters: ProductFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["productos", filters],
    queryFn: async () => {
      const response = await api.get("/api/v1/public/productos", { params: filters });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  return {
    items: data?.items || [],
    total: data?.total || 0,
    page: data?.page || 1,
    has_next: data?.has_next || false,
    has_prev: data?.has_prev || false,
    isLoading,
    error,
    refetch,
  };
}
```

### Store: useProductFilters

```typescript
// frontend/src/features/products/useProductFilters.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductFiltersState {
  categoria_id?: number;
  price_min?: number;
  price_max?: number;
  sort_by: "price_asc" | "price_desc" | "nombre_asc" | "nombre_desc" | "reciente";
  page: number;
  
  setFilters: (filters: Partial<ProductFiltersState>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
}

export const useProductFilters = create<ProductFiltersState>()(
  persist(
    (set) => ({
      sort_by: "reciente",
      page: 1,
      
      setFilters: (filters) =>
        set((state) => ({ ...state, ...filters, page: 1 })), // Reset page on filter change
      
      clearFilters: () =>
        set({
          categoria_id: undefined,
          price_min: undefined,
          price_max: undefined,
          sort_by: "reciente",
          page: 1,
        }),
      
      setPage: (page) => set({ page }),
    }),
    {
      name: "product-filters", // localStorage key
    }
  )
);
```

### Componentes

```typescript
// frontend/src/features/products/PriceRangeFilter.tsx

export function PriceRangeFilter() {
  const { price_min, price_max, setFilters } = useProductFilters();
  const [min, setMin] = useState(price_min ? price_min / 100 : "");
  const [max, setMax] = useState(price_max ? price_max / 100 : "");
  const [error, setError] = useState("");

  const handleApply = () => {
    const minNum = min ? parseInt(min) * 100 : undefined;
    const maxNum = max ? parseInt(max) * 100 : undefined;

    if (minNum && maxNum && minNum > maxNum) {
      setError("El precio mínimo no puede ser mayor que el máximo");
      return;
    }

    setError("");
    setFilters({ price_min: minNum, price_max: maxNum });
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        type="number"
        placeholder="Precio mín"
        value={min}
        onChange={(e) => setMin(e.target.value)}
        className="px-3 py-2 border rounded"
      />
      <input
        type="number"
        placeholder="Precio máx"
        value={max}
        onChange={(e) => setMax(e.target.value)}
        className="px-3 py-2 border rounded"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        onClick={handleApply}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Filtrar
      </button>
    </div>
  );
}

// frontend/src/features/products/SortDropdown.tsx

export function SortDropdown() {
  const { sort_by, setFilters } = useProductFilters();

  const options = [
    { value: "reciente", label: "Más reciente" },
    { value: "nombre_asc", label: "Nombre A-Z" },
    { value: "nombre_desc", label: "Nombre Z-A" },
    { value: "price_asc", label: "Menor precio" },
    { value: "price_desc", label: "Mayor precio" },
  ];

  return (
    <select
      value={sort_by}
      onChange={(e) => setFilters({ sort_by: e.target.value as any })}
      className="px-3 py-2 border rounded"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
```

---

## 📊 Cambios de Archivos

| Archivo | Cambio | Descripción |
|---------|--------|-------------|
| `backend/productos/service.py` | Modificado | Extender `get_public_paginated()` con price_min, price_max, sort_by |
| `backend/productos/repository.py` | Modificado | Implementar query con filtros + ordenamiento + paginación |
| `backend/productos/router.py` | Modificado | Agregar query params, validación, error handling |
| `backend/productos/schemas.py` | Modificado | Agregar `PaginatedProductList` schema |
| `migrations/versions/XXX_add_product_indexes.py` | Nuevo | Alembic migration: índice compuesto (categoria_id, precio_base) |
| `frontend/src/hooks/useProducts.ts` | Nuevo | TanStack Query hook para fetch con filtros |
| `frontend/src/features/products/useProductFilters.ts` | Nuevo | Zustand store para persistencia de filtros |
| `frontend/src/features/products/PriceRangeFilter.tsx` | Nuevo | Componente de filtro de precio |
| `frontend/src/features/products/SortDropdown.tsx` | Nuevo | Componente de ordenamiento |
| `frontend/src/pages/CategoryDetailPage.tsx` | Modificado | Integrar useProducts() + filter components |

---

## 🗄️ Cambios de Base de Datos

### Migration: Crear Índices

```python
# migrations/versions/20260528_add_producto_indexes.py

def upgrade():
    op.create_index(
        "idx_productos_categoria_precio",
        "productos",
        ["categoria_id", "precio_base"],
        unique=False,
    )

def downgrade():
    op.drop_index("idx_productos_categoria_precio", table_name="productos")
```

**Impacto**: Queries con `WHERE categoria_id = X AND precio_base BETWEEN Y Z` ahora usan índice compuesto, reduciendo scan a <100ms (vs 500ms sin índice en 5k+ items).

---

## 🧪 Estrategia Testing

### Backend Unit Tests

```python
# backend/tests/test_productos_filters.py

@pytest.mark.asyncio
async def test_filter_by_price_range():
    # Setup: productos con precios $5, $10, $15, $20
    service = ProductoService(...)
    
    result = await service.get_public_paginated(
        price_min=1000,  # $10
        price_max=1500,  # $15
    )
    
    assert len(result.items) == 2  # $10 y $15
    assert all(1000 <= p.precio_base <= 1500 for p in result.items)

@pytest.mark.asyncio
async def test_sort_by_price_asc():
    result = await service.get_public_paginated(sort_by="price_asc")
    prices = [p.precio_base for p in result.items]
    assert prices == sorted(prices)

@pytest.mark.asyncio
async def test_invalid_price_range_raises_error():
    with pytest.raises(ValueError):
        await service.get_public_paginated(price_min=2000, price_max=1000)
```

### Frontend Component Tests

```typescript
// frontend/src/features/products/__tests__/useProducts.test.ts

import { renderHook, waitFor } from "@testing-library/react";
import { useProducts } from "@/hooks/useProducts";

test("fetches products with price filters", async () => {
  const { result } = renderHook(() =>
    useProducts({ price_min: 1000, price_max: 3000 })
  );

  await waitFor(() => {
    expect(result.current.items).toHaveLength(5);
  });

  expect(result.current.items.every((p) => p.precio_base >= 1000)).toBe(true);
});
```

### E2E Tests

```typescript
// frontend/e2e/category-filters.spec.ts

test("apply filter + sort + pagination flow", async ({ page }) => {
  await page.goto("/categorias/2");
  
  // Apply price filter
  await page.fill("input[placeholder='Precio mín']", "10");
  await page.fill("input[placeholder='Precio máx']", "30");
  await page.click("button:has-text('Filtrar')");
  
  // Wait for results
  await page.waitForLoadState("networkidle");
  const products = page.locator("[data-testid='product-card']");
  expect(products).toHaveCount(12);
  
  // Sort by price
  await page.selectOption("select", "price_asc");
  await page.waitForLoadState("networkidle");
  
  // Verify first product is cheapest
  const firstPrice = await products.first().locator("[data-testid='price']").textContent();
  expect(parseInt(firstPrice)).toBeLessThan(30);
});
```

---

## ⚡ Consideraciones de Performance

| Aspecto | Estrategia | Resultado Esperado |
|--------|-----------|-------------------|
| **Query Optimization** | Índice compuesto (categoria_id, precio_base) | 50-70% mejora vs sin índice |
| **N+1 Prevention** | `selectinload()` para ingredientes | 1 query por página (20 items) |
| **Client Caching** | TanStack Query con staleTime=5min | Reduce refetches innecesarias |
| **Pagination** | OFFSET/LIMIT con limit=20 | <100ms response time |
| **Query Timeout** | Backend: timeout de 5s | Falla rápido en queries lentas |

---

## 🚀 Extensibilidad Futura

| Feature | Fase | Notas |
|---------|------|-------|
| **URL State Sync** | CH-032 Polish | Guardar filtros en URL para compartibilidad |
| **Preferencias Dietarias** | CH-031+ | Agregar vegan/gluten_free/keto como filtros |
| **Elasticsearch** | Scaling (v2) | Reemplazar queries SQL con ES para faceted search |
| **Redis Caching** | Scaling (v2) | Cache results por query hash |
| **Scroll Infinito** | UX Enhancement | Migrar de OFFSET/LIMIT a cursor-based pagination |
| **Faceted Search** | Feature (v3) | Mostrar "5 productos bajo $10", "20 sin gluten", etc. |
