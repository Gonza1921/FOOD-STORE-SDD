## Why

El sistema no tiene configuración dinámica. Hoy parámetros como `costo_envio`, `limite_stock_bajo` y `orden_mínima` están hardcodeados. La US-060 pide una tabla de configuración clave-valor editable por ADMIN desde el panel, sin necesidad de redeploy.

## What Changes

- Modelo `Configuracion` (clave, valor, descripcion, actualizado_en)
- Migración Alembic para crear la tabla
- Seed data con valores por defecto
- Endpoints GET/PUT /api/v1/admin/configuracion (solo ADMIN)
- Sección de configuración en el panel de admin

## Capabilities

### New Capabilities
- `admin-configuracion`: Gestión de configuración del sistema mediante tabla clave-valor

### Modified Capabilities
- `admin-dashboard`: Agregar sección de configuración en el panel de admin

## Impact

- Backend: modelo nuevo, endpoints nuevos, seed data
- Frontend: widget nuevo en admin dashboard
- Base de datos: migración + seed
