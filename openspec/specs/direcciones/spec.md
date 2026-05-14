# Specification: Direcciones de Entrega

## Overview

Módulo de direcciones de entrega para usuarios del Food Store. Permite CRUD completo con ownership validation, una dirección principal por usuario, y soft delete.

## Models

### Model: DireccionEntrega

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | Integer | Primary key, auto-increment |
| usuario_id | Integer | Foreign key → usuario.id, indexed |
| alias | String(50) | Nullable. Ej: "Casa", "Trabajo" |
| linea1 | String(200) | NOT NULL. Calle y número |
| linea2 | String(200) | Nullable. Piso, depto |
| ciudad | String(50) | NOT NULL |
| provincia | String(50) | NOT NULL |
| codigo_postal | String(10) | NOT NULL |
| referencia | String(200) | Nullable. Punto de referencia |
| es_principal | Boolean | Default: false. Una por usuario |
| creado_en | DateTime | Default: now() |
| actualizado_en | DateTime | Default: now() |
| deleted_at | DateTime | Nullable, indexed. Soft delete |

## Endpoints

### `GET /api/v1/direcciones/`
Listar direcciones del usuario autenticado. Retorna array, ordenadas por principal primero.

### `GET /api/v1/direcciones/{id}`
Obtener una dirección específica. Solo el dueño puede acceder.

### `POST /api/v1/direcciones/`
Crear nueva dirección. La primera dirección se auto-asigna como principal.

### `PUT /api/v1/direcciones/{id}`
Actualizar dirección existente. Solo el dueño. `exclude_unset` para actualización parcial.

### `PATCH /api/v1/direcciones/{id}/principal`
Marcar/desmarcar dirección como principal. Al marcar una nueva, se desmarca la anterior.

### `DELETE /api/v1/direcciones/{id}`
Soft delete. Solo el dueño. Marca `deleted_at` con timestamp actual.

## Frontend

### Página: /mis-direcciones
- Ruta protegida con autenticación
- Grid responsivo de tarjetas de dirección
- Modal para crear/editar
- Confirmación antes de eliminar

### Componentes
- `DireccionCard`: tarjeta con datos + acciones (principal, editar, eliminar)
- `DireccionForm`: formulario con validación de campos obligatorios
- `DireccionesListPage`: página completa con loading/error/empty/data states

### Hooks (TanStack Query)
- `useDirecciones`: list query (staleTime: 2min)
- `useDireccionDetail`: detail query (staleTime: 5min)
- `useCreateDireccion`: invalidates lists on success
- `useUpdateDireccion`: invalidates detail + lists
- `useDeleteDireccion`: invalidates lists
- `useSetDireccionPrincipal`: invalidates lists + detail

## Business Rules

1. **Ownership**: un usuario solo puede ver/editar/eliminar sus propias direcciones
2. **Principal única**: solo una dirección puede ser principal por usuario
3. **Auto-asignación**: la primera dirección del usuario se marca como principal automáticamente
4. **Soft delete**: las direcciones no se eliminan físicamente, solo se marcan con timestamp
5. **Inmutabilidad de principal**: no se puede desmarcar la principal sin otra dirección que la reemplace
