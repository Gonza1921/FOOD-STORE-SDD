# CH-028: Category Browsing — Navigate Products by Category

## Executive Summary

Create a **category browsing system** so customers can explore products by category (Frutas, Verduras, Lácteos, etc.). Includes:

- **Category sidebar** (on product listing page) or **breadcrumbs** (in navbar)
- **Category page** (shows all products in that category)
- **Filter by subcategory** (if category is parent)
- **Sort options** (price low→high, name, newest)

## Problem Statement

- **Current state**: Customers can only search; no way to browse by category
- **Customer pain**: "I want to see all fruits, not search individually"
- **Missing feature**: Category navigation is essential for ecommerce

## Solution

Create:

1. **`/categorias` page** — Lists all categories as cards
2. **`/categorias/:slug` page** — Shows products in that category + subcategories
3. **Category sidebar** (optional, for filtering)
4. **Breadcrumb navigation** (Coffee > Beans > Dark Roast)

## Scope

✅ **Include**:
- Categories page (list all with icons/images)
- Category detail page (show products in category)
- Subcategory filtering
- Sort options (price, name, newest)
- Breadcrumb navigation
- Responsive category cards

❌ **Exclude**:
- Category images/icons (use placeholder or simple colors)
- Advanced filters (that's CH-029)
- Admin category management (already exists in CH-005)

## Dependencies

| Change | Dependency | Reason |
|--------|-----------|--------|
| **CH-026** | BLOCKING | Needs CustomerLayout |
| **CH-027** | REQUIRED | Navbar needs categories dropdown |
| **CH-029** | Optional | Filters work with categories |

## Technical Approach

### Backend Changes

**No new endpoints** — use existing:
- `GET /api/v1/categorias` (list all)
- `GET /api/v1/categorias/:id` (get category + products)
- `GET /api/v1/productos?categoria_id=5` (filter by category)

**Optional enhancement**:
- Add `slug` field to Categoria model (for friendly URLs)
- Endpoint: `GET /api/v1/categorias/slug/{slug}`

### Frontend Components

```
frontend/src/pages/
├── CategoriesPage.tsx          (list all categories)
└── CategoryDetailPage.tsx      (products in category)

frontend/src/features/categories/
├── components/
│   ├── CategoryCard.tsx        (category with image)
│   ├── CategorySidebar.tsx     (filter sidebar)
│   └── BreadcrumbNav.tsx
├── hooks/
│   ├── useCategories.ts        (fetch all)
│   └── useCategoryDetail.ts    (fetch + products)
└── store.ts                    (Zustand for selected category)
```

### Category Page Layout

```
┌─────────────────────────────────────────────┐
│             CATEGORIES                       │
├──────────────────┬──────────────────────────┤
│                  │  ┌─────────────────────┐ │
│  🥬 Vegetables   │  │ 🍎 Apples           │ │
│  🍎 Fruits       │  │ 12 products         │ │
│  🥛 Dairy        │  │                     │ │
│  🧀 Cheese       │  └─────────────────────┘ │
│  🌾 Grains       │  ┌─────────────────────┐ │
│  🍗 Proteins      │  │ 🍌 Bananas          │ │
│                  │  │ 8 products          │ │
│                  │  └─────────────────────┘ │
└──────────────────┴──────────────────────────┘
```

### Category Detail Page

```
┌─────────────────────────────────────────────┐
│ Home > Fruits > Apples                       │ (breadcrumb)
├──────────────────┬──────────────────────────┤
│ 🍎 APPLES        │ Sort: [Price ▼]          │
│                  │ View: [Grid] [List]      │
│ Subcategories:   │                          │
│ ☐ Red Apples     │ ┌─────────────────────┐ │
│ ☐ Green Apples   │ │ Red Delicious Apple  │ │
│ ☐ Golden Apples  │ │ $2.99/lb             │ │
│                  │ │ ⭐⭐⭐⭐⭐ (42)        │ │
│                  │ └─────────────────────┘ │
└──────────────────┴──────────────────────────┘
```

## Data Model

**Backend** (already exists):
```python
class Categoria(SQLModel, table=True):
    id: int = Field(primary_key=True)
    nombre: str
    descripcion: str | None = None
    padre_id: int | None = Field(foreign_key="categoria.id")  # parent category
    # NEW: slug para URLs amigables
    slug: str = Field(unique=True)
```

## Effort Estimate

- **Backend changes**: 1.5 hours
  - Add `slug` field to Categoria: 0.5h
  - Create migration: 0.5h
  - Endpoint `GET /categorias/slug/{slug}`: 0.5h

- **Frontend components**: 3.5 hours
  - CategoriesPage (list all): 1h
  - CategoryDetailPage: 1h
  - BreadcrumbNav + CategorySidebar: 1.5h

- **Testing & responsive design**: 1 hour

**Total**: 6 hours

## Acceptance Criteria

- [ ] Categories page lists all categories
- [ ] Categories show image/icon and product count
- [ ] Clicking category → category detail page
- [ ] Category detail shows products with filters
- [ ] Subcategories show as checkboxes
- [ ] Filter by subcategory works
- [ ] Sort options work (price, name, newest)
- [ ] Breadcrumb navigation works
- [ ] Responsive design (mobile shows as dropdown)
- [ ] Slug-based URLs work (`/categorias/frutas`)
- [ ] No console errors

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Category hierarchy (nested) complex | MEDIUM | MEDIUM | Document parent_id logic, test with real data |
| Slug collision | LOW | LOW | Add unique constraint in DB + API validation |
| Category with 1000+ products slow | LOW | LOW | Add pagination (20 per page) |
| Mobile navigation confusing | MEDIUM | LOW | Use dropdown instead of sidebar on mobile |

## Timeline

- **Start**: After CH-027 navbar is merged
- **Duration**: 6 hours
- **Delivery**: Feature branch, 2 commits (backend + frontend)
- **Merge**: When responsive design validated

## Next Steps (After This Change)

1. **CH-029** — Add advanced filters (price range, allergens, dietary)
2. **CH-031** — Connect to real-time order updates

---

**Change Owner**: Full-stack team  
**Status**: 🟡 Planning  
**Created**: 2026-05-21  
**Last Updated**: 2026-05-21
