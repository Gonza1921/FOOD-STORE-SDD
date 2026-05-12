# Ingredientes — Especificaciones

## MUST

- MUST permitir crear ingrediente con nombre, descripción y es_alergeno
- MUST listar todos los ingredientes con paginación
- MUST retornar ingrediente individual por ID
- MUST permitir actualizar nombre, descripción y es_alergeno
- MUST permitir eliminar ingrediente (hard delete)
- MUST validar nombre único global
- MUST devolver 404 si el ingrediente no existe

## SHOULD

- SHOULD permitir filtrar listado por es_alergeno
- SHOULD devolver ingredientes ordenados por nombre

## Scenarios

### Crear ingrediente
GIVEN no existe ingrediente "Harina"
WHEN se crea ingrediente con nombre="Harina", es_alergeno=true
THEN se retorna ingrediente con nombre="Harina", es_alergeno=true
AND status 201

### Crear ingrediente con nombre duplicado
GIVEN existe ingrediente "Harina"
WHEN se crea otro ingrediente con nombre="Harina"
THEN se retorna error 409 "Ya existe un ingrediente con ese nombre"

### Eliminar ingrediente sin productos
GIVEN existe ingrediente "Sal" sin productos asociados
WHEN se elimina el ingrediente
THEN se elimina físicamente
AND status 204

### Eliminar ingrediente con productos activos
GIVEN existe ingrediente "Harina" con productos activos via ProductoIngrediente
WHEN se intenta eliminar
THEN se retorna error 409 "No se puede eliminar: tiene productos asociados"
