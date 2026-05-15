## Context

Actualmente no existe un módulo de perfil de usuario. La auth maneja registro/login pero no hay endpoints para que el usuario vea o edite sus datos. El modelo `Usuario` ya tiene `nombre`, `apellido`, `email`, `creado_en` — falta agregar `telefono` como campo opcional.

## Goals / Non-Goals

**Goals:**
- Endpoint `GET /api/v1/usuarios/perfil` — datos del usuario autenticado
- Endpoint `PUT /api/v1/usuarios/perfil` — editar nombre y teléfono (email NO cambiable)
- Endpoint `POST /api/v1/usuarios/perfil/cambiar-contrasena` — cambio con validación
- Página `/mi-perfil` en frontend con formularios
- Al cambiar contraseña: invalidar todos los refresh tokens del usuario

**Non-Goals:**
- No se implementa edición de email (es identificador único del sistema)
- No se implementan roles desde el perfil (eso es admin)
- No se implementa avatar/foto de perfil

## Decisions

### 1. Módulo `backend/usuarios/` en lugar de extender `auth/`
- **Decisión**: Crear módulo separado `usuarios/` con su propio router, service, schemas, repository
- **Razón**: auth/ se ocupa de autenticación (register, login, refresh, logout). El perfil es un concepto diferente (gestión de datos del usuario). Separación de concerns.
- **Alternativa**: Extender auth/router.py. Se descarta porque mezcla responsabilidades.

### 2. Campo telefono agregado al modelo existente
- **Decisión**: Agregar `telefono: Optional[str]` al modelo `Usuario` con migración Alembic
- **Razón**: Es el campo que piden las US-061 y US-062. Opcional para no romper usuarios existentes.
- **Alternativa**: Guardar teléfono en tabla separada. Sobrediseño para un campo simple.

### 3. Endpoints bajo `/api/v1/usuarios/perfil` (no `/api/perfil`)
- **Decisión**: Usar el prefijo `/api/v1/usuarios/` consistente con el resto de la API
- **Razón**: El doc original dice `/api/perfil` pero todos los demás endpoints usan `/api/v1/`. Consistencia > doc antiguo.

### 4. Invalidación de refresh tokens al cambiar contraseña
- **Decisión**: Eliminar todos los refresh tokens del usuario al cambiar contraseña
- **Razón**: Seguridad — si la contraseña se comprometió, los tokens existentes deben invalidarse
- **Alternativa**: No invalidar. Riesgo de seguridad.

### 5. Feature `perfil/` en frontend con TanStack Query
- **Decisión**: Hook `usePerfil` con TanStack Query para GET/PUT, formulario con validación
- **Razón**: Consistente con el resto del frontend (TanStack Query para server state)
- **Alternativa**: Zustand. No aplica porque los datos vienen del servidor.

## Risks / Trade-offs

- **[Migración]**: Agregar `telefono` requiere una nueva migración Alembic. Bajo riesgo, campo nullable.
- **[Seguridad]**: El endpoint `cambiar-contrasena` debe recibir contraseña actual. Si alguien obtiene el JWT de un usuario, no debería poder cambiar la contraseña sin saber la actual. La validación de la contraseña actual mitiga esto.
- **[UX]**: Si se invalidan todos los refresh tokens, el usuario debe hacer login de nuevo. Es intencional por seguridad.
