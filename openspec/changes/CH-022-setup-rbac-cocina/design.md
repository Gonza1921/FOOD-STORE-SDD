# Design: CH-022 — Setup RBAC Cocinero + Seed

## Context

Food Store es un e-commerce con múltiples actores del sistema: **Client**, **Admin**, **Gestor de Stock**, **Gestor de Pedidos**, y ahora **Cocinero**. El sistema utiliza:
- **Auth**: JWT dual-token (access 30m + refresh 7d) con rotación automática
- **RBAC**: Tabla catálogo `Rol` con PK semántica `codigo` y relación M:M `usuario_rol`
- **Database**: PostgreSQL 15+ con Alembic para migraciones
- **Backend**: FastAPI con middleware de autorización via `require_role()`

Actualmente existen 4 roles estables: `ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT`. Necesitamos agregar `COCINA` para el Kitchen Display System.

## Goals / Non-Goals

**Goals:**
- ✅ Crear rol `COCINA` en tabla `Rol` (PK: `codigo = 'COCINA'`)
- ✅ Actualizar tabla RBAC documenting permiso para cocinero (permisos específicos de preparación)
- ✅ Implementar seed idempotente Alembic para roles + usuario prueba `cocina@foodstore.com`
- ✅ Garantizar que JWT emitido al cocinero incluye rol en payload
- ✅ Documentar capacidades del rol para CH-023 (validación de transiciones)

**Non-Goals:**
- ❌ Implementar `require_role()` middleware (ya existe, usaremos en CH-023)
- ❌ Endpoints de cocina (responsabilidad de CH-023)
- ❌ FSM delta para transiciones de cocinero (responsabilidad de CH-023)
- ❌ Frontend guards o componentes de cocina (responsabilidad de CH-024)
- ❌ Validar transiciones por rol (responsabilidad de CH-023)

## Decisions

### 1. Rol `COCINA` es separado de `PEDIDOS` (no subconjunto)
**Decisión**: `COCINA` es un rol independiente con permisos específicos, no derivado de `PEDIDOS`.

**Rationale**:
- **Claridad**: Las transiciones de cocinero (CONFIRMADO → EN_PREPARACIÓN, EN_PREPARACIÓN → EN_CAMINO) son operativamente distintas de gestión de órdenes (`PEDIDOS` crea, confirma, cancela)
- **Seguridad**: Un cocinero NO debe poder crear, rechazar o cancelar órdenes
- **Escalabilidad**: Permite múltiples sub-roles de cocina en futuro (chef, preparador, etc.)

**Alternativa rechazada**: `COCINA` como subconjunto de `PEDIDOS` → confunde responsabilidades, permite permisos demasiado amplios.

### 2. Seed idempotente via Alembic (no manual)
**Decisión**: Usar downgrade+upgrade de Alembic para garantizar idempotencia.

**Estructura**:
```sql
-- upgrade()
INSERT INTO rol (codigo, nombre, descripcion) 
VALUES ('COCINA', 'Cocinero', 'Prepara y avanza pedidos...')
ON CONFLICT (codigo) DO NOTHING;

-- downgrade()
DELETE FROM rol WHERE codigo = 'COCINA';
```

**Rationale**:
- **Reproducibilidad**: Cualquier env (dev/staging/prod) ejecuta lo mismo
- **Rollback limpio**: `alembic downgrade -1` limpia el rol perfectamente
- **Idempotencia**: Si seed se ejecuta 2x, no hay errores

**Alternativa rechazada**: Seed en `scripts/seed.py` → difícil trackear, no es parte del versionado de DB.

### 3. Usuario prueba `cocina@foodstore.com` va en seed, NO fixture de tests
**Decisión**: Usuario de prueba creado por Alembic, reutilizado en todos los ambientes.

**Contraseña**: Hardcoded como `Test123456!` en seed (para desarrollo solamente).

**Rationale**:
- Tests usan fixtures + mocks, no necesitan usuario real
- E2E testing en staging usa este usuario predefinido
- Facilita debugging: login manual en dashboard cocina

**Alternativa rechazada**: Crear usuario en cada test fixture → overhead innecesario, tests deben ser aislados.

### 4. Permisos del rol `COCINA` (RBAC tabla)
**Decisión**: `COCINA` tiene permisos granulares para pedidos en fase PREPARACIÓN.

**Matriz de permisos** (aplicada en CH-023):
```
Recurso                 ADMIN  STOCK  PEDIDOS  COCINA  CLIENT
─────────────────────────────────────────────────────────────
Pedido.Read             ✅     ✅      ✅       ✅      (self)
Pedido.TransitionState  ✅     —       ✅       ⚠️      —
  └─ (solo PREPARACIÓN)
Pedido.Cancel           ✅     —       ✅       —       (self)
Pedido.ApprovePayment   ✅     —       ✅       —       —
```

**Rationale**: Cocinero solo puede avanzar transiciones de preparación (CONFIRMADO → EN_PREPARACIÓN, EN_PREPARACIÓN → EN_CAMINO), no crear ni cancelar.

### 5. JWT payload incluye array de `roles` (ya existe)
**Decisión**: Token JWT ya incluye `roles: ["COCINA"]`, middleware `require_role()` lo valida.

**Estructura existente**:
```python
{
  "sub": "cocina@foodstore.com",
  "roles": ["COCINA"],
  "exp": 1234567890
}
```

**Rationale**: Middleware ya existe (CH-005), solo necesitamos que nuevo rol esté en el array.

## Risks / Trade-offs

| Risk | Probabilidad | Impacto | Mitigación |
|------|------------|--------|-----------|
| **Seed duplica usuario si se ejecuta sin `ON CONFLICT`** | Media | Alto | Usar `ON CONFLICT DO NOTHING` en upgrade, test seed idempotence |
| **Contraseña hardcoded en seed** | Baja | Medio | Solo en desarrollo, docum. claramente, cambiar en prod |
| **Olvidad agregar `COCINA` a JWT payload generación** | Baja | Alto | Test unitario valida `roles` en token para usuario COCINA |
| **Permisos futuros más granulares (sub-roles)** | Baja | Bajo | Estructura RBAC permite columnas futuras, migración futura es compatible |

## Migration Plan

### 1. Phase 1: Database (Alembic Migration)
```bash
alembic revision --autogenerate -m "Add COCINA role and seed cocina user"
alembic upgrade head
```

**Archivo generado**: `backend/alembic/versions/<timestamp>_add_cocina_role.py`
- Inserta `Rol` con código `COCINA`
- Inserta usuario `cocina@foodstore.com` con hashed password
- Relaciona usuario con rol via `usuario_rol` M:M
- ON CONFLICT safeguards

### 2. Phase 2: Seed Verification
```bash
pytest backend/tests/test_rbac.py::TestCocineroRole -v
```

Tests:
- Rol existe en DB
- Usuario existe con rol COCINA
- Token generado para cocinero incluye `roles: ["COCINA"]`

### 3. Phase 3: Documentation
- Actualizar `docs/knowledge-base/03_actores_y_roles.md` con COCINA
- Agregar a AGENTS.md matriz de RBAC

### Rollback Strategy
```bash
alembic downgrade -1  # Elimina rol, usuario, M:M records
```

## Open Questions

1. **¿Permiso para cambiar disponibilidad de producto (RN-CO08)?**
   - Propuesta: Agregar en v1 pero inactivo, CH-025 lo activa
   - Decisión: Dejar para v1.1

2. **¿Sub-roles de cocina (chef de turno, preparador)?**
   - Futuro: Agregar columna `subrole` en `usuario_rol`
   - Por ahora: Monolítico `COCINA`

3. **¿Password recovery para usuario cocina@foodstore.com?**
   - Por ahora: Manual (admin reset)
   - Futuro: Implementar flow de password reset (CH-025)
