# Categorías — Especificaciones

## MUST

- MUST permitir crear categoría con nombre, descripción y parent_id opcional
- MUST listar todas las categorías no eliminadas usando CTE recursiva
- MUST retornar categoría individual por ID
- MUST permitir actualizar nombre, descripción y parent_id de una categoría
- MUST hacer soft delete de categoría (setear deleted_at)
- MUST validar que parent_id no cree ciclos (nuevo padre no puede ser descendiente del nodo)
- MUST validar nombre único entre categorías hermanas (mismo parent_id)
- MUST devolver 404 si la categoría no existe

## SHOULD

- SHOULD reasignar hijos al abuelo cuando se elimina una categoría con hijos
- SHOULD devolver árbol plano con campo nivel para que frontend construya jerarquía

## MAY

- MAY permitir filtrar categorías por nivel de profundidad

## Scenarios

### Crear categoría raíz
GIVEN no existen categorías
WHEN se crea categoría "Bebidas" sin parent_id
THEN se retorna la categoría creada con id, nombre="Bebidas", parent_id=None
AND status 201

### Crear subcategoría
GIVEN existe categoría "Bebidas" con id=1
WHEN se crea categoría "Gaseosas" con parent_id=1
THEN se retorna la categoría con parent_id=1
AND status 201

### Crear categoría con nombre duplicado entre hermanas
GIVEN existe categoría "Bebidas" con id=1 y subcategoría "Gaseosas" con parent_id=1
WHEN se crea otra categoría "Gaseosas" con parent_id=1
THEN se retorna error 409 "Ya existe una categoría con ese nombre en este nivel"

### Crear categoría con parent_id que crea ciclo
GIVEN existe árbol A(1) → B(2) → C(3)
WHEN se actualiza categoría A con parent_id=3
THEN se retorna error 422 "La categoría no puede ser su propio descendiente"

### Soft delete categoría sin productos
GIVEN existe categoría "Bebidas" sin productos asociados
WHEN se elimina la categoría
THEN se setea deleted_at
AND la categoría deja de aparecer en listados

### Soft delete categoría con productos activos
GIVEN existe categoría "Bebidas" con productos activos asociados via ProductoCategoria
WHEN se intenta eliminar
THEN se retorna error 409 "No se puede eliminar: tiene productos asociados"
