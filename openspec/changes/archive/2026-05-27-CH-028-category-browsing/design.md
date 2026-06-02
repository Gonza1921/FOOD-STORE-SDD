## Context

FOOD-STORE ahora tiene **CustomerLayout** con Navbar (CH-027) que incluye un dropdown de categorías. Pero no hay páginas dedicadas para explorar productos por categoría. Los clientes no pueden navegar — solo buscar.

Además, el backend actual de categorías requiere **rol ADMIN** para todos los endpoints, y el modelo **no tiene campo `slug`** para URLs amigables.

## Goals / Non-Goals

**Goals:**
- Backend: Agregar `slug` al modelo Categoria + migración
- Backend: Endpoints públicos para categorías (sin auth)
- Frontend: Página `/categorias` — lista todas las categorías como cards
- Frontend: Página `/categorias/:slug` — productos de esa categoría
- Frontend: Breadcrumb navigation (Inicio > Categoría > Subcategoría)
- Frontend: Category sidebar con subcategorías
- Frontend: Sort options (precio, nombre, más nuevo)
- Responsive: sidebar → dropdown en mobile

**Non-Goals:**
- Filtros avanzados (precio slider, alergenos, dietarios) — CH-029
- Carga de imágenes de categorías — placeholders o colores
- Admin de categorías — ya existe

## Decisions

### Decision 1: Agregar `slug` al modelo Categoria

Se agrega campo `slug` de tipo `str` con unique constraint al modelo Categoria.

**Rationale**: URLs amigables (`/categorias/frutas` vs `/categorias/5`) mejoran UX, SEO, y son estándar en ecommerce.

**Trade-off**: Requiere migración de DB. Los slugs se generan automáticamente desde el nombre (slugify).

### Decision 2: Endpoints públicos separados de admin

Se crean endpoints públicos en `/api/v1/categorias/publicas` en lugar de modificar los existentes que requieren ADMIN.

**Rationale**: Los endpoints admin tienen lógica compleja (jerarquía, soft delete) que no es necesaria para el público. Separarlos mantiene la seguridad y simplicidad.

### Decision 3: Breadcrumb desde la jerarquía de categorías

El breadcrumb se construye recursivamente desde `parent_id` de la categoría actual, navegando hacia arriba hasta la raíz.

**Rationale**: No requiere cambios en backend — el frontend puede construir la ruta con los datos existentes.

## Architecture

### Backend Changes

#### Modelo Categoria (modificado)

```python
class Categoria(SQLModel, table=True):
    id: int
    nombre: str
    slug: str = Field(unique=True, index=True)  # NUEVO
    descripcion: str | None
    parent_id: int | None
    creado_en: datetime
    actualizado_en: datetime
    deleted_at: datetime | None
```

#### Nuevos Schemas Públicos

```python
class CategoriaPublicOut(BaseModel):
    id: int
    nombre: str
    slug: str
    descripcion: str | None
    parent_id: int | None
    producto_count: int = 0  # cantidad de productos en esta categoría

class CategoriaDetailOut(CategoriaPublicOut):
    subcategorias: list[CategoriaPublicOut]
    productos: list[ProductoPublic]  # productos en esta categoría
```

#### Nuevos Endpoints Públicos

```
GET /api/v1/categorias/publicas           → list[CategoriaPublicOut]  (sin auth)
GET /api/v1/categorias/publicas/{slug}    → CategoriaDetailOut       (sin auth)
```

#### Productos públicos — endpoint existente

El endpoint `GET /api/v1/productos/publico/catalogo` ya acepta `categoria_id` como filtro. No requiere cambios.

### Frontend Components

```
frontend/src/pages/
├── CategoriesPage.tsx            — Lista todas las categorías
└── CategoryDetailPage.tsx        — Productos en categoría

frontend/src/features/categories/
├── components/
│   ├── CategoryCard.tsx          — Card de categoría (nombre, count, color)
│   ├── CategorySidebar.tsx       — Sidebar con subcategorías para filtrar
│   └── BreadcrumbNav.tsx         — Breadcrumb: Home > Cat > Subcat
├── hooks/
│   ├── usePublicCategories.ts    — Fetch categorías públicas
│   └── useCategoryDetail.ts      — Fetch categoría + productos
```

### Route Structure

```tsx
// En PublicLayout (sin auth):
<Route path="/categorias" element={<CategoriesPage />} />
<Route path="/categorias/:slug" element={<CategoryDetailPage />} />
```

### Data Flow

```
CategoriesPage
  ├── usePublicCategories() → GET /api/v1/categorias/publicas
  └── renderiza CategoryCard por cada categoría

CategoryDetailPage
  ├── useCategoryDetail(slug) → GET /api/v1/categorias/publicas/{slug}
  ├── BreadcrumbNav (construido desde parent_id)
  ├── CategorySidebar (subcategorías)
  ├── Sort selector (price, name, newest)
  └── ProductGrid (productos de la categoría)
```

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Slug collision en categorías existentes | MEDIUM | LOW | Generar slug único con sufijo numérico si hay duplicado |
| Categoría con 1000+ productos lento | LOW | LOW | Paginación en endpoint de productos (ya existe) |
| Migración requiere datos existentes | MEDIUM | MEDIUM | Script de backfill para slugs de categorías existentes |
| Sidebar en mobile ocupa espacio | LOW | LOW | Convertir a dropdown/accordion en mobile |

## Open Questions

- ¿Generar slug automáticamente desde `nombre` al crear categoría, o requerirlo explícitamente? Se genera automático con opción a override.
