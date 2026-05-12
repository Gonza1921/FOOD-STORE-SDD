# CH-006 Tasks — Categorías + Ingredientes

## Setup

- [x] 1.1 Crear `backend/categorias/__init__.py`
- [x] 1.2 Crear `backend/ingredientes/__init__.py`

## Backend Categorías

- [x] 2.1 Crear `backend/categorias/repository.py` — queries con CTE recursiva, búsqueda por nombre+parent_id, verificación de hijos
- [x] 2.2 Crear `backend/categorias/schemas.py` — Pydantic models (CategoriaCreate, CategoriaUpdate, CategoriaOut, CategoriaTree)
- [x] 2.3 Crear `backend/categorias/service.py` — CRUD + validación anti-ciclos + nombre único entre hermanas + soft delete con chequeo ProductoCategoria
- [x] 2.4 Crear `backend/categorias/router.py` — REST endpoints con require_role(["ADMIN"])

## Backend Ingredientes

- [x] 3.1 Crear `backend/ingredientes/repository.py` — búsqueda por nombre, verificación ProductoIngrediente
- [x] 3.2 Crear `backend/ingredientes/schemas.py` — Pydantic models (IngredienteCreate, IngredienteUpdate, IngredienteOut)
- [x] 3.3 Crear `backend/ingredientes/service.py` — CRUD + validación nombre único + hard delete con chequeo ProductoIngrediente
- [x] 3.4 Crear `backend/ingredientes/router.py` — REST endpoints con require_role(["ADMIN"])

## Integración Backend

- [x] 4.1 Registrar routers en `backend/main.py`

## Frontend — Shared

- [x] 5.1 Actualizar `frontend/src/shared/api/endpoints.ts` — agregar bloques CATEGORIES e INGREDIENTS

## Frontend — Categorías

- [x] 6.1 Crear `frontend/src/features/categories/hooks/useCategories.ts` — hook CRUD
- [x] 6.2 Crear `frontend/src/features/categories/components/CategoryForm.tsx` — formulario crear/editar
- [x] 6.3 Crear `frontend/src/features/categories/components/CategoryList.tsx` — listado con árbol
- [x] 6.4 Crear `frontend/src/features/categories/pages/CategoriesAdminPage.tsx` — página admin
- [x] 6.5 Crear `frontend/src/features/categories/index.ts` — barrel exports

## Frontend — Ingredientes

- [x] 7.1 Crear `frontend/src/features/ingredients/hooks/useIngredients.ts` — hook CRUD
- [x] 7.2 Crear `frontend/src/features/ingredients/components/IngredientForm.tsx` — formulario crear/editar
- [x] 7.3 Crear `frontend/src/features/ingredients/components/IngredientList.tsx` — listado
- [x] 7.4 Crear `frontend/src/features/ingredients/pages/IngredientsAdminPage.tsx` — página admin
- [x] 7.5 Crear `frontend/src/features/ingredients/index.ts` — barrel exports

## Frontend — Integración

- [x] 8.1 Actualizar `frontend/src/features/index.ts` — agregar exports de categorías e ingredientes
- [x] 8.2 Actualizar `frontend/src/pages/index.ts` — agregar exports de páginas admin
- [x] 8.3 Actualizar `frontend/src/app/Router.tsx` — agregar rutas protegidas /admin/categorias e /admin/ingredientes

## Verificación

- [x] 9.1 Verificar type-check del backend
- [x] 9.2 Verificar build del frontend
