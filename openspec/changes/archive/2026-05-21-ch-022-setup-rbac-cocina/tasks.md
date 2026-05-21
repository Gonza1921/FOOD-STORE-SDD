# Tasks: CH-022 — Setup RBAC: Rol Cocinero + Seed

## Phase 1: Migración + Seed

- [x] 1.1 Crear migración `008_add_cocina_role.py` con `down_revision = "007_add_configuracion"`
- [x] 1.2 Agregar seed del rol `COCINA` en tabla `rol` con `ON CONFLICT DO NOTHING`
- [x] 1.3 Agregar seed del usuario `cocina@foodstore.com` con password hasheado (bcrypt)
- [x] 1.4 Asignar rol `COCINA` al usuario seed vía `usuario_rol` con `ON CONFLICT DO NOTHING`
- [x] 1.5 Implementar `downgrade()` que revierte los inserts (DELETE por codigo/email)

## Phase 2: Verificación

- [x] 2.1 Ejecutar `alembic upgrade head` y verificar que los registros existen
- [x] 2.2 Ejecutar `alembic downgrade -1` y verificar que los registros se limpian
- [x] 2.3 Re-aplicar `alembic upgrade head` para dejar la base al día
- [x] 2.4 Commit convencional: `feat(rbac): agregar rol COCINA y seed de usuario cocina`
