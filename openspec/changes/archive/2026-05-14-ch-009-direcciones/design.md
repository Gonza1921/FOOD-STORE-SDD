# Design: Direcciones de Entrega

## Backend Architecture

### Model
- `DireccionEntrega` con `usuario_id`, `alias`, `linea1`, `linea2`, `ciudad`, `provincia`, `codigo_postal`, `referencia`, `es_principal`, audit fields, `deleted_at`

### Capas
- `repository.py` — queries scoped por usuario con soft delete filtering
- `service.py` — ownership validation, principal única, soft delete
- `router.py` — 6 endpoints protegidos con autenticación JWT

### Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/v1/direcciones/ | Listar direcciones del usuario |
| GET | /api/v1/direcciones/{id} | Obtener una dirección (own) |
| POST | /api/v1/direcciones/ | Crear nueva dirección |
| PUT | /api/v1/direcciones/{id} | Actualizar (own) |
| PATCH | /api/v1/direcciones/{id}/principal | Marcar/desmarcar principal |
| DELETE | /api/v1/direcciones/{id} | Soft delete (own) |

### Reglas de negocio
- La primera dirección se auto-asigna como principal
- Solo el dueño puede ver/editar/eliminar su dirección
- No se puede desmarcar principal sin otra dirección que la reemplace
- Soft delete: deleted_at timestamp, no destrucción física

## Frontend Architecture

### Feature-Sliced Design
- `features/direcciones/api/` — tipos, query keys, API functions
- `features/direcciones/hooks/` — TanStack Query hooks con cache invalidation
- `features/direcciones/components/` — DireccionCard, DireccionForm, DireccionesListPage

### Component tree
- `DireccionesListPage` (ruta /mis-direcciones)
  - `DireccionCard` × N (grid)
  - `Modal` → `DireccionForm` (crear/editar)

### Estados por página
- Loading: skeleton grid
- Error: mensaje + retry
- Empty: CTA "Agregar dirección"
- Data: grid de cards con acciones
