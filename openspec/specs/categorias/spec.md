# Categorías — Especificaciones

## MUST — Modelo y Admin

- MUST permitir crear categoría con nombre, slug, descripción y parent_id opcional
- MUST generar slug automáticamente desde `nombre` usando slugify si no se especifica
- MUST validar slug único globalmente
- MUST listar todas las categorías no eliminadas usando CTE recursiva
- MUST retornar categoría individual por ID
- MUST permitir actualizar nombre, slug, descripción y parent_id de una categoría
- MUST hacer soft delete de categoría (setear deleted_at)
- MUST validar que parent_id no cree ciclos (nuevo padre no puede ser descendiente del nodo)
- MUST validar nombre único entre categorías hermanas (mismo parent_id)
- MUST devolver 404 si la categoría no existe

## SHOULD — Admin

- SHOULD reasignar hijos al abuelo cuando se elimina una categoría con hijos
- SHOULD devolver árbol plano con campo nivel para que frontend construya jerarquía

## MUST — Público

- MUST proveer endpoint `GET /api/v1/categorias/publicas` para listar categorías sin autenticación
- MUST retornar `id`, `nombre`, `slug`, `descripcion`, `parent_id`, `producto_count` en listado público
- MUST excluir categorías eliminadas (deleted_at) del listado público
- MUST proveer endpoint `GET /api/v1/categorias/publicas/{slug}` para detalle de categoría sin autenticación
- MUST retornar subcategorías y productos en el detalle público
- MUST devolver 404 si el slug no existe

## MUST — Frontend

- MUST mostrar página `/categorias` con grilla de tarjetas de categorías
- MUST mostrar nombre y cantidad de productos en cada tarjeta
- MUST navegar a `/categorias/{slug}` al hacer clic en una tarjeta
- MUST mostrar breadcrumb `Inicio > Categoría` en página de detalle
- MUST mostrar sidebar con checkboxes de subcategorías en desktop
- MUST mostrar sidebar como dropdown en mobile (<768px)
- MUST mostrar grilla de productos de la categoría
- MUST proveer opciones de ordenamiento: precio asc/desc, nombre A-Z, más nuevos

## MAY

- MAY permitir filtrar categorías por nivel de profundidad

## Scenarios — Admin

### Crear categoría raíz
GIVEN no existen categorías
WHEN se crea categoría "Bebidas" sin parent_id
THEN se retorna la categoría creada con id, nombre="Bebidas", slug="bebidas", parent_id=None
AND status 201

### Crear subcategoría
GIVEN existe categoría "Bebidas" con id=1
WHEN se crea categoría "Gaseosas" con parent_id=1
THEN se retorna la categoría con parent_id=1 y slug="gaseosas"
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

## Scenarios — Público

### Listar categorías públicas
GIVEN existen categorías "Bebidas" (id=1) y "Lácteos" (id=2) no eliminadas
WHEN se realiza GET a `/api/v1/categorias/publicas`
THEN se retorna lista con ambas categorías incluyendo slug y producto_count
AND status 200
AND no se requiere token de autenticación

### Obtener detalle de categoría por slug
GIVEN existe categoría "Bebidas" con slug="bebidas" y productos asociados
WHEN se realiza GET a `/api/v1/categorias/publicas/bebidas`
THEN se retorna la categoría con sus subcategorías y productos
AND status 200

### Slug inválido devuelve 404
WHEN se realiza GET a `/api/v1/categorias/publicas/no-existe`
THEN se retorna error 404

## Scenarios — Frontend

### Navegar a categorías
WHEN un usuario navega a `/categorias`
THEN se muestra grilla de tarjetas con nombre y cantidad de productos
AND cada tarjeta linkea a `/categorias/{slug}`

### Ver detalle de categoría
WHEN un usuario navega a `/categorias/frutas`
THEN se muestra breadcrumb, sidebar de subcategorías, opciones de ordenamiento y grilla de productos
