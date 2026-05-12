# CH-006 Design — Categorías + Ingredientes

## Arquitectura

### Backend

```
Router (/api/v1/categorias, /api/v1/ingredientes)
    ↓
Service (reglas de negocio, validaciones)
    ↓
Repository → BaseRepository[T] (CRUD genérico + queries específicas)
    ↓
SQLModel (Categoria, Ingrediente)
```

Cada módulo sigue el patrón de `auth/`:
- `repository.py` → hereda `BaseRepository[Modelo]`
- `service.py` → `async with UnitOfWork()` + registro de repo
- `schemas.py` → Pydantic request/response
- `router.py` → FastAPIRouter con `Depends(require_role(["ADMIN"]))`

### Frontend

```
Pages (CategoriesAdminPage, IngredientsAdminPage)
    ↓
Components (CategoryList, CategoryForm, IngredientList, IngredientForm)
    ↓
Hooks (useCategories, useIngredients) → axiosClient → API
```

- Hooks: llamadas CRUD vía `axiosClient` a los endpoints
- Componentes: formularios + listados con Tailwind
- Páginas: componen el listado + formulario en layout admin

## Decisiones técnicas

### CTE Recursiva para árbol de categorías
- Se implementa como query raw SQL con `WITH RECURSIVE` en el repository
- Listado retorna flat list con `parent_id`, el frontend construye el árbol
- Alternativa considerada: construir árbol en Python — descartada por performance

### Anti-ciclos en categorías
- Antes de asignar `parent_id`, validar que el nuevo padre no sea descendiente del nodo actual
- Usar la misma CTE recursiva para verificar

### Soft delete en Categorías
- `Categoria.deleted_at` se setea al eliminar
- Antes de soft-delete: verificar que no haya productos activos asociados vía `ProductoCategoria`
- Si hay asociaciones activas → bloquear con `ConflictError`

### Hard delete en Ingredientes
- `Ingrediente` no tiene `deleted_at` (hard delete físico)
- Antes de eliminar: verificar que no haya productos activos asociados vía `ProductoIngrediente`
- Si hay asociaciones activas → bloquear con `ConflictError`

### Validación nombre único
- Categorías: único entre hermanas (mismo `parent_id` y mismo nivel)
- Ingredientes: único global (columna `unique=True` en modelo)

## Modelos

### Categoria (existente)
```
id: int (PK)
nombre: str(100)
descripcion: str(200)?
parent_id: int? (FK → categoria.id)
creado_en: datetime
actualizado_en: datetime
deleted_at: datetime?
```

### Ingrediente (existente)
```
id: int (PK)
nombre: str(100) UNIQUE
descripcion: str(200)?
es_alergeno: bool
creado_en: datetime
actualizado_en: datetime
```

## Flujos

### GET /categorias (con CTE)
```
1. Ejecutar WITH RECURSIVE para obtener todas las categorías
2. Retornar flat list ordenada por nivel → nombre
3. Frontend construye árbol en memoria
```

### POST /categorias
```
1. Validar nombre único entre hermanas (mismo parent_id)
2. Asignar parent_id (None = raíz)
3. Crear y retornar
```

### DELETE /categorias/:id (soft delete)
```
1. Verificar ProductoCategoria activo → bloquear si existe
2. Si tiene hijos: reasignar hijos al padre del eliminado (parent_id = categoria.parent_id)
3. Setear deleted_at
```
