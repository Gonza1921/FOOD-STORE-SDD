## Why

Actualmente los usuarios registrados no tienen forma de ver ni editar sus datos personales (nombre, teléfono) ni cambiar su contraseña. Para cerrar el ciclo de experiencia del cliente, necesitamos una sección de perfil donde puedan consultar y mantener actualizada su información.

## What Changes

- Nuevo backend: módulo `usuarios/perfil` con 3 endpoints REST:
  - `GET /api/v1/usuarios/perfil` — ver datos propios
  - `PUT /api/v1/usuarios/perfil` — editar nombre y teléfono
  - `POST /api/v1/usuarios/perfil/cambiar-contrasena` — cambiar contraseña con validación
- Nuevo frontend: página `/mi-perfil` con formularios de datos y cambio de contraseña
- Al cambiar contraseña: invalidar todos los refresh tokens del usuario (forzar re-login)
- El email NO se puede modificar (es identificador único)

## Capabilities

### New Capabilities
- `perfil-usuario`: Visualización y edición de datos personales del usuario autenticado, con cambio de contraseña y validación de seguridad

### Modified Capabilities
<!-- No existing specs change — es funcionalidad nueva -->

## Impact

- **Backend**: Nuevo módulo `backend/usuarios/perfil/` con router, service, schemas
- **Frontend**: Nueva página `PerfilPage` + ruta `/mi-perfil` en el Router
- **Auth**: El endpoint de cambio de contraseña debe invalidar refresh tokens (modificación en auth service)
- **Modelo**: Usuario ya tiene los campos necesarios (nombre, email, telefono, hash_contrasena) — no requiere migración
