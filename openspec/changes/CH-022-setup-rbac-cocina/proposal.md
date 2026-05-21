# CH-022: Setup RBAC — Rol Cocinero + Seed

## Propuesta

### Qué
Crear el rol `COCINA` en la base de datos como sexto actor del sistema Food Store. Actualizar la tabla RBAC para reflejar nuevas capacidades de autorización específicas del cocinero. Implementar seed de desarrollo con usuario `cocina@foodstore.com`.

### Por qué
El Kitchen Display System requiere un nuevo rol operativo especializado. El cocinero tiene capacidades muy específicas (solo puede avanzar transiciones dentro de la fase de preparación) que no se solapan totalmente con `PEDIDOS` ni `ADMIN`. Crear un rol dedicado permite:
- Control granular de autorización
- Auditoría clara de acciones por rol
- Escalabilidad futura (ex: múltiples equipos de cocina)
- Separación de responsabilidades

### Alcance
**Incluye:**
- Nuevo registro en tabla catálogo `Rol` (PK semántica: `codigo = 'COCINA'`)
- Seed idempotente (ON CONFLICT DO NOTHING) para roles y usuario de prueba
- Documentación de tabla RBAC actualizada con nueva columna

**No incluye:**
- Cambios en el FSM (eso es CH-023)
- Endpoints de cocina (eso es CH-023 y CH-024)
- Validación de transiciones por rol (eso es CH-023)

### Dependencias
- **C-02 auth**: requiere que exista `require_role`, manejo de JWT y RBAC base
- **C-04 productos**: requiere que exista tabla `Producto` con campo `disponible`

### Riesgos
- **Bajo**: solo es datos + seed, sin lógica nueva
- Si rompemos la idempotencia del seed, migraciones futuras sufren conflictos

### Decisiones Tomadas
1. El rol `COCINA` es separado de `PEDIDOS` (no un subconjunto) para claridad de autorización
2. Permiso para marcar disponibilidad de producto (RN-CO08) se agrega aquí pero es opcional en v1
3. No hay cambios en el FSM en este change (responsabilidad de CH-023)

## Historias de Usuario Cubiertas
- **US-COCINA-04** (parcial): Setup del rol COCINA y guard de ruta
  - Este change cubre: rol en BD, RBAC, seed, preparación para `require_role`
  - CH-023 / CH-024 cubren: `require_role` en endpoints, guards de ruta frontend

## Referencias de Entrada
- `openspec/feature-display-cocina-reference/01_rol_cocinero.md` (sección RBAC actualizada)
- `docs/knowledge-base/03_actores_y_roles.md` (contexto de actores existentes)
- `docs/knowledge-base/05_reglas_de_negocio.md` (RN-RB09, RN-RB10)

## Estimación
- **Tamaño**: Pequeño (8-10 horas)
- **Esfuerzo**: Datos + migración Alembic + seed
- **Testing**: Tests unitarios de autorización en backend (sin WebSocket)

## Siguientes Steps
Después de este change aprobado:
1. **CH-023**: Backend WebSocket + FSM delta (requiere este change)
2. **CH-024**: Frontend KDS (requiere CH-023)
3. **CH-025**: Features opcionales
