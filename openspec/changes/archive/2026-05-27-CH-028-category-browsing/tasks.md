# Tasks — CH-028 Category Browsing

> **Estimación**: 6 hours  
> **Fases**: Setup (1h), Backend (1.5h), Frontend (3h), Polish (0.5h)

---

## Phase 1: Setup

### 1.1 Backend — Add `slug` field to Categoria model
- [x] Add `slug: str = Field(unique=True, index=True)` to `backend/models/categoria.py`
- [x] Install slugify library: `pip install python-slugify`
- [x] Add slug generation logic (auto from nombre, allow override)
- [x] **Verification**: Model compiles, slug appears in Categoria table schema

### 1.2 Backend — Create Alembic migration
- [x] Create migration `009_add_categoria_slug.py` — adds slug column + backfill + unique constraint
- [x] Review generated migration, verify it adds `slug` column with unique constraint
- [x] Add backfill logic in migration to generate slugs for existing categories
- [x] **Verification**: Migration runs successfully, existing categories get slugs

### 1.3 Backend — Update schemas with slug
- [x] Add `slug: str` to `CategoriaCreate` (optional, generated if not provided)
- [x] Add `slug: str` to `CategoriaOut`
- [x] Add `slug: Optional[str]` to `CategoriaUpdate`
- [x] Create `CategoriaPublicOut` schema with `producto_count: int = 0`
- [x] Create `CategoriaDetailOut` schema with `subcategorias` and `productos` lists
- [x] **Verification**: Schemas validate correctly

---

## Phase 2: Backend Endpoints

### 2.1 Backend — Create public endpoints router
- [x] Create `backend/categorias/public/router.py` for public endpoints
- [x] Implement `GET /api/v1/categorias/publicas` — list all non-deleted categories with product count
- [x] Implement `GET /api/v1/categorias/publicas/{slug}` — category detail with subcategories and products
- [x] Register new router in `backend/main.py`
- [x] **Verification**: Endpoints return data without auth token

### 2.2 Backend — Update Service with public methods
- [x] Add `list_publicas()` method to `CategoriaService` — returns categories with product counts
- [x] Add `get_by_slug(slug)` method to `CategoriaService`
- [x] Add `get_public_detail(slug)` method — category + subcategories + productos + productos from ProductoService.get_public_paginated
- [x] Add repository methods: `get_all_active`, `get_product_count`, `get_children`
- [x] **Verification**: Service methods work with test data

---

## Phase 3: Frontend Infrastructure

### 3.1 Frontend — Update API endpoints
- [x] Add `CATEGORIES_PUBLIC` section to `frontend/src/shared/api/endpoints.ts`:
  - `LIST: '/categorias/publicas'`
  - `DETAIL_BY_SLUG: (slug: string) => `/categorias/publicas/${slug}``
- [x] **Verification**: Constants defined without TS errors

### 3.2 Frontend — Create hooks
- [x] Create `frontend/src/features/categories/hooks/usePublicCategories.ts` — fetch all public categories via axiosClient
- [x] Create `frontend/src/features/categories/hooks/useCategoryDetail.ts` — fetch category detail by slug from public endpoint
- [x] **Verification**: Hooks return typed data without errors

### 3.3 Frontend — Create CategoryCard component
- [x] Create `frontend/src/features/categories/components/CategoryCard.tsx`:
  - Receives `nombre`, `producto_count`, `slug`, color/icon placeholder
  - Shows nombre + count with nice card styling (shadow, rounded, hover)
  - Links to `/categorias/{slug}`
  - **Verification**: Renders correctly with mock data

### 3.4 Frontend — Create BreadcrumbNav component
- [x] Create `frontend/src/features/categories/components/BreadcrumbNav.tsx`:
  - Receives path segments: `[{label, slug?}]`
  - Renders: `Inicio > Categoría > Subcategoría`
  - Links are clickable (navigate to slug or home)
  - **Verification**: Breadcrumb renders with correct links

### 3.5 Frontend — Create CategorySidebar
- [x] Create `frontend/src/features/categories/components/CategorySidebar.tsx`:
  - Receives `subcategorias` list and `selectedSubcategorias` set
  - Checkbox list for filtering by subcategory
  - Responsive: sidebar on desktop, dropdown on mobile (<768px)
  - Emits `onSubcategoryChange(selectedIds)` event
  - **Verification**: Checkboxes affect parent state

---

## Phase 4: Frontend Pages

### 4.1 Frontend — Create CategoriesPage
- [x] Create `frontend/src/pages/CategoriesPage.tsx`:
  - Uses `usePublicCategories()` hook
  - Displays page title "Categorías" with hero section
  - Grid of CategoryCards (responsive: 2 cols mobile, 4 cols desktop)
  - Loading skeleton state
  - Error state with retry button
  - Empty state ("No hay categorías disponibles")
- [x] **Verification**: Page renders at `/categorias`

### 4.2 Frontend — Create CategoryDetailPage
- [x] Create `frontend/src/pages/CategoryDetailPage.tsx`:
  - Reads `slug` from URL params
  - Uses `useCategoryDetail(slug)` hook
  - Renders: BreadcrumbNav, CategorySidebar, sort dropdown, product grid
  - Sort options: "Precio: menor a mayor", "Precio: mayor a menor", "Nombre A-Z", "Más nuevos"
  - Product cards from existing catalog (reuse pattern)
  - Loading skeleton, error state, empty state
  - Responsive layout
- [x] **Verification**: Page renders at `/categorias/{slug}` with products

### 4.3 Frontend — Add routes to Router
- [x] Add `CategoriesPage` and `CategoryDetailPage` imports to `frontend/src/app/Router.tsx`
- [x] Add routes under PublicLayout (no auth required):
  ```tsx
  <Route path="/categorias" element={<CategoriesPage />} />
  <Route path="/categorias/:slug" element={<CategoryDetailPage />} />
  ```
- [x] **Verification**: Routes work, no TS errors

---

## Phase 5: Integration & Polish

### 5.1 Test end-to-end flow
- [x] Backend: model updated with slug, migration 009 created
- [x] Backend: public endpoints registered in main.py
- [x] Backend: service methods implemented (list_publicas, get_public_detail)
- [x] Frontend: TypeScript compiles with no errors (`npx tsc --noEmit`)
- [x] Frontend: CategoriesPage renders at `/categorias` (hero, grid, 3 states)
- [x] Frontend: CategoryDetailPage renders at `/categorias/:slug` (breadcrumb, sidebar, sort, products)
- [x] Frontend: Responsive design (mobile sidebar→dropdown, grid adapts)
- [~] **Pending**: Run migration against real DB, start backend, verify API
- [~] **Pending**: Start frontend, E2E click-through validation

### 5.2 Responsive verification
- [x] Frontend: Tailwind responsive classes applied (grid-cols-2/3/4, md:hidden for sidebar)
- [x] Frontend: CategorySidebar has mobile dropdown variant
- [x] Frontend: BreadcrumbNav uses flex-wrap for overflow
- [~] **Pending**: Visual verification on actual viewports
