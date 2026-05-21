# CH-029: Product Filters & Sorting — Advanced Product Discovery

## Executive Summary

Enhance product discovery with **advanced filters** so customers can narrow down products by:

- **Price range** (slider: $0–$100)
- **Allergens** (checkboxes: peanuts, dairy, gluten, etc.)
- **Dietary restrictions** (vegan, vegetarian, keto, etc.)
- **In stock only** (toggle)
- **Rating** (4+ stars, 3+ stars, etc.)

Plus **sorting options**:
- Price (low → high, high → low)
- Name (A → Z)
- Newest first
- Best rating

## Problem Statement

- **Current state**: Customers can search, but can't filter
- **Customer pain**: "I want only vegan products under $5"
- **Missing feature**: Filters are essential for modern ecommerce

## Solution

Create a **filter sidebar** with reactive filters:

```
┌─────────────────────────────────────────────┐
│             FILTROS                          │
├──────────────────┬──────────────────────────┤
│ Price:           │ Sort: [Price ▼]          │
│ ◄──────────────► │ Mostrar: Grid / List     │
│ $0        $100   │                          │
│                  │ ┌──────────────────────┐ │
│ Allergens:       │ │ Product Card         │ │
│ ☐ Peanuts       │ │ Filtered by:          │ │
│ ☐ Dairy         │ │ - Price < $10         │ │
│ ☐ Gluten        │ │ - Vegan ✓             │ │
│                  │ │ - In stock ✓          │ │
│ Dietary:         │ └──────────────────────┘ │
│ ☐ Vegan         │                          │
│ ☐ Vegetarian    │                          │
│ ☐ Keto          │                          │
│                  │                          │
│ Stock:           │                          │
│ ☑ In stock only  │                          │
│                  │                          │
│ [Clear Filters]  │                          │
└──────────────────┴──────────────────────────┘
```

## Scope

✅ **Include**:
- Price range slider (min/max)
- Allergen checkboxes
- Dietary restriction checkboxes
- In stock toggle
- Rating filter (1-5 stars)
- Sort dropdown (price, name, rating, newest)
- Real-time filter updates (URL state sync)
- Mobile-friendly filter panel
- "Clear filters" button

❌ **Exclude**:
- Admin filter management (skip for now)
- Filter combinations (AND/OR logic, documented as future work)
- Search + filter combination tuning

## Dependencies

| Change | Dependency | Reason |
|--------|-----------|--------|
| **CH-028** | REQUIRED | Filters work on category pages |
| **CH-027** | Required | Uses navbar search integration |

## Technical Approach

### Backend Changes

**New endpoints**:
- `GET /api/v1/productos/filtros/opciones` — returns available filters (allergens, dietary tags)
- `GET /api/v1/productos?precio_min=0&precio_max=100&alergenos=leche&vegetariano=true&en_stock=true`

**Database changes** (minor):
- Add fields to `Producto` model (if missing):
  - `precio: float` (already exists)
  - `en_stock: bool` (already exists)
  - `rating: float` (optional, for future)
  - `alergenos: list[str]` (M2M relationship, already exists as Ingrediente)
  - `etiquetas: list[str]` (vegetarian, vegan, keto, etc.)

### Frontend Components

```
frontend/src/features/products/
├── components/
│   ├── ProductFilters.tsx          (sidebar)
│   ├── PriceRangeSlider.tsx        (price filter)
│   ├── AllergenCheckboxes.tsx      (allergen filter)
│   ├── DietaryCheckboxes.tsx       (dietary filter)
│   ├── StockToggle.tsx             (in stock filter)
│   ├── SortDropdown.tsx            (sort options)
│   └── FilterResults.tsx           (shows active filters)
├── hooks/
│   ├── useProductFilters.ts        (Zustand store for filter state)
│   └── useFilteredProducts.ts      (fetch with filters)
└── store.ts                        (Zustand)
```

### Filter State Management (Zustand)

```typescript
// src/features/products/store.ts
interface FilterState {
  // Filters
  priceMin: number;
  priceMax: number;
  allergens: string[];
  dietary: string[];
  inStock: boolean;
  
  // Sorting
  sortBy: 'price_asc' | 'price_desc' | 'name_asc' | 'rating_desc' | 'newest';
  
  // Actions
  setPriceRange: (min, max) => void;
  toggleAllergen: (allergen: string) => void;
  toggleDietary: (dietary: string) => void;
  setInStock: (value: boolean) => void;
  setSortBy: (sort: string) => void;
  clearFilters: () => void;
}

export const useProductFilters = create<FilterState>(...)
```

### URL State Sync

Filters are stored in URL query params for shareable links:

```
/categorias/frutas?precio_max=10&vegetariano=true&sort=price_asc

Query params:
- precio_min
- precio_max
- alergenos (comma-separated)
- vegetariano
- vegano
- keto
- en_stock
- sort
```

## Data Model

**New endpoints response**:

```python
# GET /api/v1/productos/filtros/opciones
{
  "alergenos": [
    {"id": 1, "nombre": "Cacahuates"},
    {"id": 2, "nombre": "Leche"},
    {"id": 3, "nombre": "Gluten"}
  ],
  "etiquetas": [
    {"id": 1, "nombre": "Vegano"},
    {"id": 2, "nombre": "Vegetariano"},
    {"id": 3, "nombre": "Keto"}
  ],
  "precio_rango": {"min": 0.50, "max": 99.99}
}
```

## Effort Estimate

- **Backend changes**: 2 hours
  - Add filter endpoints: 1h
  - Update query builder for filters: 1h

- **Frontend components**: 4 hours
  - Filter sidebar structure: 1h
  - Price slider: 0.5h
  - Allergen/Dietary checkboxes: 1h
  - Sort dropdown + results: 1h
  - URL state sync: 0.5h

- **Testing & refinement**: 2 hours

**Total**: 8 hours

## Acceptance Criteria

- [ ] Price slider works (min/max independently)
- [ ] Allergen checkboxes filter products
- [ ] Dietary checkboxes filter products
- [ ] In stock toggle works
- [ ] Sorting options work correctly
- [ ] Multiple filters work together (AND logic)
- [ ] URL params update when filters change
- [ ] Sharing filtered link works (reproducible filters)
- [ ] Mobile filter panel is usable
- [ ] "Clear filters" button resets all
- [ ] Performance is good (< 500ms filter response)
- [ ] No console errors

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| URL state + local state out of sync | MEDIUM | MEDIUM | Sync on mount + URL change handler |
| Filter combinations slow (10+ filters) | LOW | LOW | Add pagination + limit query |
| Mobile filter panel too cramped | MEDIUM | LOW | Use accordion (collapsible sections) |
| No allergen data for old products | MEDIUM | MEDIUM | Provide admin tool to tag existing products |

## Timeline

- **Start**: After CH-028 is merged
- **Duration**: 8 hours
- **Delivery**: Feature branch, 2 commits (backend + frontend)
- **Merge**: When all filters tested and responsive

## Next Steps (After This Change)

1. **CH-030 + CH-031** — WebSocket for real-time inventory updates
2. **CH-032** — Admin dashboard with filter analytics

---

**Change Owner**: Full-stack team  
**Status**: 🟡 Planning  
**Created**: 2026-05-21  
**Last Updated**: 2026-05-21
