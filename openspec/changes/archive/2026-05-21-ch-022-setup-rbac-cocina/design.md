# Design: CH-022 — Setup RBAC: Rol Cocinero + Seed

## Architecture Overview

Cambio puramente en la **capa de datos**. No se modifican modelos, servicios, routers ni dependencias. El modelo `Rol` existente ya es genérico (PK semántica `codigo VARCHAR(20)`) y soporta cualquier código de rol sin cambios estructurales.

Se agrega una **migración Alembic** (`008_add_cocina_role.py`) que:
1. Inserta el nuevo rol `COCINA` en la tabla catálogo `rol`
2. Crea un usuario de prueba `cocina@foodstore.com` con rol `COCINA`

## Componentes

### Migración: `008_add_cocina_role.py`
- **Responsabilidad**: Seed idempotente del rol COCINA y usuario de prueba
- **Ubicación**: `backend/migrations/versions/008_add_cocina_role.py`
- **Dependencia**: `down_revision = "007_add_configuracion"` (última migración existente)
- **Operaciones**: `op.execute()` con SQL INSERT + ON CONFLICT DO NOTHING

### Modelos (sin cambios)
- `Rol` — tabla catálogo genérica, PK = `codigo`. No requiere modificación.
- `UsuarioRol` — tabla N:M, FK = `rol_codigo`. No requiere modificación.
- `Usuario` — entidad existente con `lazy="selectin"` para roles. No requiere modificación.

## Data Model

No hay cambios en esquema de tablas. Solo nuevos registros:

### Tabla: `rol`

| codigo | nombre | descripcion |
|--------|--------|-------------|
| COCINA | Cocinero | Operación de cocina: recibe pedidos confirmados y gestiona su preparación |

### Tabla: `usuario`

| email | password_hash | nombre | apellido | telefono |
|-------|--------------|--------|----------|----------|
| cocina@foodstore.com | bcrypt('cocina123') | Cocinero | Prueba | (null) |

### Tabla: `usuario_rol`

| usuario_id | rol_codigo | asignado_en | asignado_por_id |
|-----------|------------|-------------|-----------------|
| (id del usuario creado) | COCINA | NOW() | (null) — seed automático |

## API Changes

**Ninguno.** Este change no expone ni modifica endpoints.

## Implementation Notes

### Patrón idempotente
Usar `ON CONFLICT DO NOTHING` para roles (PK `codigo`) y para usuario (UK `email`). Esto permite re-ejecutar la migración sin errores ni duplicados.

```sql
INSERT INTO rol (codigo, nombre, descripcion)
VALUES ('COCINA', 'Cocinero', 'Operación de cocina: recibe pedidos confirmados y gestiona su preparación')
ON CONFLICT (codigo) DO NOTHING;
```

### Hash de contraseña
La contraseña del seed debe generarse con `bcrypt` via Python dentro de la migración (no SQL puro). Usar `passlib.hash.bcrypt._generate_salt()` o el mismo método que usa `AuthService.register()`.

```python
from passlib.hash import bcrypt
password_hash = bcrypt.hash("cocina123")
```

### Asignación de rol al usuario
Como el `usuario_id` es autoincremental y no se conoce de antemano, usar una subquery o INSERT ... RETURNING:

```sql
WITH new_user AS (
    INSERT INTO usuario (email, password_hash, nombre, apellido)
    VALUES ('cocina@foodstore.com', :pw_hash, 'Cocinero', 'Prueba')
    ON CONFLICT (email) DO NOTHING
    RETURNING id
)
INSERT INTO usuario_rol (usuario_id, rol_codigo)
SELECT id, 'COCINA' FROM new_user
ON CONFLICT (usuario_id, rol_codigo) DO NOTHING;
```

### Convención de migraciones
Siguiendo el patrón del proyecto: revision ID `008_add_cocina_role`, archivo `008_add_cocina_role.py`, con `down_revision = "007_add_configuracion"`.

## Archivos Modificados/Creados

| Archivo | Acción | Propósito |
|---------|--------|-----------|
| `backend/migrations/versions/008_add_cocina_role.py` | **CREAR** | Seed COCINA + usuario de prueba |
| `backend/models/usuario.py` | — | Sin cambios (confirmado) |
| `backend/core/dependencies.py` | — | Sin cambios (confirmado) |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| El hash bcrypt dentro de migración puede diferir del método usado por `AuthService` | Usar exactamente `passlib.hash.bcrypt` que es el mismo que usa el proyecto |
| Usuario `cocina@foodstore.com` podría existir (colisiónde email) | `ON CONFLICT (email) DO NOTHING` garantiza idempotencia |
| Rollback debe limpiar datos correctamente | `downgrade()` elimina registros específicos por codigo/email, no truncates masivos |
