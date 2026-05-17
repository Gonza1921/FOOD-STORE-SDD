# Design: Configuración del Sistema (US-060)

## Architecture

### Modelo `Configuracion`

- **Tabla**: `configuracion` con clave primaria `clave` (string)
- **Columnas**: `clave`, `valor`, `descripcion`, `actualizado_en`
- **Sin relaciones**: tabla independiente, sin FK

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/configuracion` | ADMIN | Lista todas las configuraciones |
| PUT | `/api/v1/admin/configuracion` | ADMIN | Actualiza una o más configuraciones (upsert) |

### Frontend

- **Hook**: `useAdminConfiguracion` (Query + Mutation via TanStack Query)
- **Componente**: `ConfigSection` dentro de `AdminDashboardPage`
- Inline editing: click en valor → input → Enter/Escape para guardar/cancelar

## Data Flow

```
PUT /api/v1/admin/configuracion  →  [{clave, valor}]  →  UPSERT en tabla configuracion
                                                       →  Refresh automático vía query invalidation
```

## Migration Strategy

- Nueva migración Alembic `007_add_configuracion.py`
- Seed de 6 configuraciones por defecto (costo_envio, pedido_minimo, etc.)
