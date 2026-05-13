# Tasks: CH-007 — Productos CRUD + Gestión de Stock

> **Change**: CH-007  
> **Phase**: TASKS (post-DESIGN)  
> **Status**: 🟡 **IN PROGRESS** — Backend + Frontend Implementation Complete, Tests Pending  
> **Total Estimate**: ~23h across 8 phases  
> **Actual Time**: ~21h (completed in 11 commits for Phases 1–8)  

---

## Phase 1: Setup & Infrastructure (1h)

- [x] 1.1 Create backend/productos module structure: `__init__.py`, `repository.py`, `schemas.py`, `service.py`, `router.py`
- [x] 1.2 Create frontend/src/features/products structure: `api/`, `hooks/`, `components/`, `pages/`, `stores/`, `index.ts`
- [x] 1.3 Register ProductRouter in backend/main.py with prefix `/api/v1` and tags `["Productos"]`

---

## Phase 2: Backend Repository Layer (3.5h)

- [x] 2.1 Implement `ProductoRepository` extending `BaseRepository[Producto]` with inherited CRUD (get_all, get_by_id, create, update, delete)
- [x] 2.2 Add `get_all_paginated(skip, limit, include_deleted)` → `tuple[list[Producto], int]` with soft delete filtering and eager load relations
- [x] 2.3 Add `get_by_nombre(nombre)` → `Optional[Producto]` with case-insensitive ILIKE search
- [x] 2.4 Add `get_con_asociaciones(producto_id)` → `Optional[Producto]` with selectinload(categorias, ingredientes)
- [x] 2.5 Implement `ProductoCategoriaRepository` extending `BaseRepository[ProductoCategoria]` with delete_by_producto() and get_by_producto() methods
- [x] 2.6 Implement `ProductoIngredienteRepository` extending `BaseRepository[ProductoIngrediente]` with delete_by_producto() and get_by_producto() methods
- [x] 2.7 Add `get_public_paginated(skip, limit, search, categoria_id)` to ProductoRepository filtering by disponible=true + soft delete + optional category/search

---

## Phase 3: Backend Service Layer (3.5h)

- [x] 3.1 Implement `ProductoService.crear_producto()` with validation: categoria_id exists (409), categorias[] valid (409), ingredientes[] valid (409), atomic UoW M2M insert
- [x] 3.2 Implement `ProductoService.actualizar_producto()` with Replace All M2M strategy: DELETE old categorías/ingredientes, INSERT new (atomic UoW)
- [x] 3.3 Implement `ProductoService.actualizar_stock()` with pessimistic validation: nuevo_stock >= 0 (400 if < 0), atomic update
- [x] 3.4 Implement `ProductoService.obtener_producto()` → ProductoOut or 404
- [x] 3.5 Implement `ProductoService.listar_productos(page, limit, include_deleted)` → {items, total, page, limit}
- [x] 3.6 Implement `ProductoService.obtener_catalogo_publico()` filtering disponible=true + soft delete + optional categoria/search
- [x] 3.7 Implement `ProductoService.eliminar_producto()` soft delete via UoW

---

## Phase 4: Backend Schemas & Validation (1h)

- [x] 4.1 Create Pydantic schemas: ProductoCreate, ProductoUpdate, PatchStockRequest with field validators (precio >= 0, stock >= 0, nombre required, descripcion max 500)
- [x] 4.2 Create response schemas: ProductoOut (admin), ProductoOutPublic (client), nested IngredienteAssociation + CategoriaAssociation
- [x] 4.3 Define query key constants (PRODUCTS_KEYS) for TanStack Query in schemas or separate file

---

## Phase 5: Backend Router Endpoints (1.5h)

- [x] 5.1 Implement `POST /api/v1/productos` with @require_role(["STOCK", "ADMIN"]), validate input, return 201 ProductoOut
- [x] 5.2 Implement `GET /api/v1/productos` with @require_role(["STOCK", "ADMIN"]), pagination, soft delete filter, return {items, total, page, limit}
- [x] 5.3 Implement `GET /api/v1/productos/{id}` with @require_role(["STOCK", "ADMIN"]), return 200 ProductoOut or 404
- [x] 5.4 Implement `PUT /api/v1/productos/{id}` with @require_role(["STOCK", "ADMIN"]), M2M Replace All, return 200 ProductoOut or 404
- [x] 5.5 Implement `PATCH /api/v1/productos/{id}/stock` with @require_role(["STOCK", "ADMIN"]), validate stock >= 0 (400 if < 0), return 200 ProductoOut
- [x] 5.6 Implement `DELETE /api/v1/productos/{id}` with @require_role(["ADMIN"]), soft delete, return 204 No Content
- [x] 5.7 Implement `GET /api/v1/productos/publico/catalogo` (NO AUTH) filtering disponible=true + soft delete, support categoria_id + search, return ProductoOutPublicList

---

## Phase 6: Frontend API & Hooks (2.5h)

- [x] 6.1 Create endpoints.ts with productAPI client: createProduct, listProducts, getProduct, updateProduct, updateStock, deleteProduct, getPublicCatalog
- [x] 6.2 Create useProducts hook (TanStack Query) with pagination, staleTime 5m, invalidation on create/update/delete
- [x] 6.3 Create useProductDetail hook (TanStack Query) with staleTime 10m, enabled flag, eager load relations
- [x] 6.4 Create usePublicCatalog hook with category/search filters, staleTime 30m
- [x] 6.5 Create useProductCreate mutation with optimistic invalidation of list queryKey
- [x] 6.6 Create useProductUpdate mutation with invalidation of detail + list queryKeys
- [x] 6.7 Create useProductDelete mutation with soft delete + cache invalidation
- [x] 6.8 Create useStockUpdate mutation with optimistic UI + rollback on error
- [x] 6.9 Export all hooks from index.ts (barrel export)

---

## Phase 7: Frontend Components (3.5h)

- [x] 7.1 Create ProductForm.tsx: form with fields (nombre, descripcion, precio_base, stock_cantidad, disponible, categoria_id), TanStack Form validation, submit (create/update)
- [x] 7.2 Create CategoriesSelector.tsx: multi-select component with checkboxes, es_principal toggle, eager loads from useCategories hook
- [x] 7.3 Create IngredientsSelector.tsx: multi-select component with checkboxes, es_removible toggle, eager loads from useIngredientes hook
- [x] 7.4 Create ProductList.tsx: table with pagination, columns (id, nombre, precio, stock, disponible, actions), delete/edit/stock buttons, loading/error states
- [x] 7.5 Create StockManager.tsx: input (min=0), +/- buttons, save button, validates stock >= 0, triggers useStockUpdate
- [x] 7.6 Create ProductsAdminPage.tsx: assembles ProductList + ProductForm (modal or panel), handle CRUD flows, Zustand state integration
- [x] 7.7 Create productStore.ts (Zustand): UI state (filters, selectedProductId, formOpen, editingProduct), actions (setPage, selectProduct, openForm, closeForm)

---

## Phase 8: Frontend Routing & Integration (1.5h)

- [x] 8.1 Add route `/admin/productos` → ProductsAdminPage in frontend/src/app/Router.tsx or routing config
- [x] 8.2 Add ProductsAdminPage to sidebar/menu navigation (if applicable)
- [x] 8.3 Add public catalog route `/catalogo` → PublicCatalogPage (no auth)
- [x] 8.4 Import ProductRouter module in frontend main app; verify endpoint URLs match backend prefix

---

## Phase 9: Testing Backend (3h)

- [ ] 9.1 Write unit tests for ProductoRepository: CRUD, soft delete filtering, paginación, eager load, M2M queries (get_by_producto)
- [ ] 9.2 Write unit tests for ProductoService: crear_producto (valid/invalid categoría/ingredientes), actualizar_producto (M2M Replace All), actualizar_stock (pessimistic validation, >= 0)
- [ ] 9.3 Write unit tests for Pydantic schemas: ProductoCreate validators (precio >= 0, stock >= 0, nombre required, descripcion max 500), ProductoUpdate partial validators
- [ ] 9.4 Write integration tests for 7 endpoints: POST (201), GET list (200 + pagination), GET {id} (200/404), PUT (200 + M2M Replace All), PATCH /stock (200/400), DELETE (200 soft delete), GET /publico (200 + only available)
- [ ] 9.5 Write integration tests for RBAC: POST/PUT/PATCH/DELETE without STOCK/ADMIN role → 403; GET /publico no auth required → 200
- [ ] 9.6 Write integration tests for M2M atomicity: error mid-transaction → rollback, BD state consistent
- [ ] 9.7 Write integration tests for soft delete: GET filters deleted by default, ?deleted=true shows them (admin only), GET /publico never shows deleted
- [ ] 9.8 Verify test coverage >= 80% for repository, service, schemas; run pytest --cov=backend/productos

---

## Phase 10: Testing Frontend (2h)

- [ ] 10.1 Write unit tests for hooks: useProducts, useProductDetail, usePublicCatalog (mocking API, verify query keys, staleTime)
- [ ] 10.2 Write unit tests for mutations: useProductCreate, useProductUpdate, useProductDelete, useStockUpdate (mocking API, verify cache invalidation)
- [ ] 10.3 Write component tests: ProductForm (render fields, validation, submit), ProductList (render rows, pagination, buttons), StockManager (input validation, +/- buttons)
- [ ] 10.4 Write component tests: CategoriesSelector, IngredientsSelector (multi-select, toggles, values reflect in parent form)
- [ ] 10.5 Write integration test for ProductsAdminPage: load list, click create, fill form, submit → invalidation → list refreshes
- [ ] 10.6 Verify test coverage >= 70% for hooks/components; run npm run test:coverage

---

## Phase 11: Code Quality (1.5h)

- [ ] 11.1 Run mypy on backend/productos with strict mode: `mypy app/productos --strict` → 0 errors
- [ ] 11.2 Run pylint on backend/productos: `pylint app/productos` → 0 errors (warnings acceptable)
- [ ] 11.3 Run black format check on backend/productos: `black --check app/productos` → 0 diffs
- [ ] 11.4 Run ESLint on frontend/src/features/products: `npm run lint` → 0 errors
- [ ] 11.5 Run TypeScript type-check on frontend: `npm run type-check` → 0 errors
- [ ] 11.6 Run Prettier format check on frontend: `npm run format:check` → 0 diffs

---

## Phase 12: End-to-End Verification (1h)

- [ ] 12.1 Manual test: Admin UI CRUD flow — create product → appears in list → edit fields → update → delete (soft) → verify GET filters it
- [ ] 12.2 Manual test: Stock Manager — adjust stock with +/- buttons → PATCH /stock → verify BD updated and UI reflects
- [ ] 12.3 Manual test: M2M associations — create product with categorias[1,2,3] → verify ProductoCategoria rows created + eager load works
- [ ] 12.4 Manual test: Public catalog — GET /publico without auth → returns only disponible=true + no admin fields (stock, timestamps, deleted_at)
- [ ] 12.5 Manual test: RBAC — try POST /productos without STOCK/ADMIN role → 403 Forbidden
- [ ] 12.6 Manual test: Validation — try negative stock, missing categoria_id, invalid categoria_id → verify error messages (400/409)

---

## Phase 13: Commits & Documentation (1h)

- [ ] 13.1 Commit Phase 2-3 tasks: `feat(productos/backend): implement repository and service layers with UoW atomicity`
- [ ] 13.2 Commit Phase 4-5 tasks: `feat(productos/backend): add schemas, validators, and 7 CRUD endpoints with RBAC`
- [ ] 13.3 Commit Phase 6-7 tasks: `feat(productos/frontend): add API client, hooks, components, and admin page`
- [ ] 13.4 Commit Phase 8 tasks: `feat(productos/frontend): integrate routing and navigation`
- [ ] 13.5 Commit Phase 9 tasks: `test(productos/backend): add unit and integration tests with 80%+ coverage`
- [ ] 13.6 Commit Phase 10 tasks: `test(productos/frontend): add hook and component tests with 70%+ coverage`
- [ ] 13.7 Commit Phase 11 tasks: `chore(productos): linting, type-check, format compliance`
- [ ] 13.8 Update backend/productos/README.md (if new) or docstrings in modules documenting patterns used

---

## Implementation Order & Rationale

**Dependency Chain**: Repository (no deps) → Service (depends on Repo) → Router (depends on Service) → Schemas (async to Router/Service) → Frontend API (depends on backend endpoints) → Frontend Hooks (depends on API) → Frontend Components (depends on Hooks) → Integration (wires everything)

**Why This Order**:
1. **Phase 1-3**: Backend foundation must be solid first (layers bottom-up)
2. **Phase 4-5**: Schemas and endpoints next (contracts)
3. **Phase 6-8**: Frontend can now call stable API (top-down)
4. **Phase 9-12**: Testing and verification after implementation
5. **Phase 13**: Documentation and commits final

---

## Acceptance Criteria Summary

| Layer | Criteria | Verification |
|-------|----------|--------------|
| **Backend** | 7 endpoints working (POST/GET/PUT/PATCH/DELETE/GET publico) | Postman/curl test all 7 |
| **Backend** | RBAC enforced (403 without STOCK/ADMIN on mutations) | Try without token |
| **Backend** | Stock pessimistic validation (reject < 0 with 400) | PATCH /stock with -1 |
| **Backend** | M2M Replace All atomic (DELETE + INSERT in UoW) | Insert product with 3 categories, update to 2, verify 2 remain |
| **Backend** | Soft delete filtered by default (GET returns only deleted_at IS NULL) | Create 2 products, delete 1, GET should return 1 |
| **Backend** | Type safety (mypy strict, no untyped functions) | `mypy app/productos --strict` → 0 errors |
| **Frontend** | Admin page renders with list + form | Navigate to /admin/productos, see table + form |
| **Frontend** | CRUD flows work end-to-end (create→list refresh) | Create product, verify appears in list |
| **Frontend** | Validation prevents invalid input (stock < 0 blocked) | Try negative stock, button/input disabled |
| **Frontend** | Type safety (TypeScript strict, no `any`) | `npm run type-check` → 0 errors |
| **Tests** | Backend coverage >= 80% | `pytest --cov=backend/productos --cov-fail-under=80` |
| **Tests** | Frontend coverage >= 70% | `npm run test:coverage -- --coverage-threshold 70` |

---

**Next Step**: → `/sdd-apply` phase to implement tasks 1.1 through 13.8 sequentially
