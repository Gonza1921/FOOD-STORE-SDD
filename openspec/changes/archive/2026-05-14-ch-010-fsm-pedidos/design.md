## Context

CH-008 implementó el CRUD básico de pedidos (crear, listar, obtener detalle) con estado inicial PENDIENTE. Este change (CH-009) completa la máquina de estados (FSM) para permitir transiciones de estado, cancelaciones, control de stock, y auditoría.

**Estado actual:**
- Modelos: Pedido, PedidoItem creados
- Endpoints: POST /pedidos, GET /pedidos, GET /pedidos/{id}
- Estado inicial: PENDIENTE
- Out of scope actual: transiciones FSM, control stock, cancelaciones, historial

## Goals / Non-Goals

**Goals:**
1. Implementar transiciones FSM válidas: PENDIENTE → CONFIRMADO → EN_PREPARACIÓN → EN_CAMINO → ENTREGADO
2. Implementar cancelaciones desde PENDIENTE, CONFIRMED, EN_PREPARACIÓN
3. Control de stock: decrementar al confirmar, restaurar al cancelar
4. Historial append-only (audit trail)
5. Validación de permisos RBAC por transición
6. Estados terminales (ENTREGADO, CANCELADO) bloquean transiciones

**Non-Goals:**
- Integración con MercadoPago (futuro change)
- Notificaciones email/SMS
- Panel de administración UI
- Tests de carga
- Reintentos automáticos de pago

## Decisions

### D1: Transiciones FSM como función del Service

**Alternativas consideradas:**
- A) Validar en Router (filtro rápido pero lógica separada)
- B) Validar en Service (reutiliza dependencias, mantiene encapsulamiento) ✅
- C) Validar en Repository (acoplamiento innecesario)

**Decisión**: Validar en Service. El service ya tiene acceso a UnitOfWork, puede validar permisos, y mantiene la lógica de negocio centralizada.

### D2: Stock como decremento/absoluto

**Alternativas:**
- A) Stock absoluto: PUT /stock con valor exacto (riesgoso si hay concurrencia)
- B) Stock delta: PATCH /stock with +/- cantidad (más complejo de validar)
- C) Solo vía FSM: stock solo cambia en transiciones FSM ✅

**Decisión**: Solo vía transiciones FSM. El stock se decrementa automáticamente al confirmar y se restaura al cancelar. No hay endpoint separado para modificar stock.

### D3: Historial como tabla separada vs. campo en Pedido

**Alternativas:**
- A) Campo JSON en tabla Pedido (simple pero no consultable)
- B) Tabla separada HistorialEstadoPedido ✅
- C) Event sourcing completo (overkill)

**Decisión**: Tabla separada HistorialEstadoPedido. Permite consultas eficientes, auditorías, y sigue el patrón append-only del proyecto.

### D4: Observación obligatoria en cancelaciones

**Alternativas:**
- A) Opcional (más flexible)
- B) Obligatoria ✅

**Decisión**: Obligatoria. Requiere motivo documentado para cancelaciones, útil para auditoría y para que el admin entienda por qué se canceló.

### D5: Validación de stock antes de decrementar (optimista vs pesimista)

**Alternativas:**
- A) Optimista: decrementar y rollback si falla (puede dejarDB inconsistente temporalmente)
- B) Pesimista: validar stock primero, luego decrementar en misma transacción ✅

**Decisión**: Validación pesimista. Primero verificar stock disponible, luego decrementar en la misma transacción UoW.

## API Design

### Endpoints a agregar:

```
PATCH /api/v1/pedidos/{id}/estado
- Body: { "estado": "confirmado" | "en_preparacion" | "en_camino" | "entregado" }
- Permisos: ADMIN, PEDIDOS
- Returns: Pedido actualizado

PATCH /api/v1/pedidos/{id}/cancelar
- Body: { "observacion": "string" }
- Permisos: Propietario (PENDIENTE), ADMIN (todos los estados permitidos)
- Returns: Pedido actualizado

GET /api/v1/pedidos/{id}/historial
- Permisos: Propietario o ADMIN
- Returns: Lista de historial
```

### Modelo HistorialEstadoPedido:

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| pedido_id | UUID | FK -> pedidos.id |
| estado_desde | EstadoPedido | Nullable (NULL para primer estado) |
| estado_hacia | EstadoPedido | NOT NULL |
| usuario_id | UUID | FK -> usuarios.id |
| observacion | String | Nullable |
| created_at | DateTime | TimestampMixin |

## Risks / Trade-offs

- **Riesgo**: Concurrencia en stock. Si dos admins confirman el mismo pedido simultáneamente.
  - **Mitigación**: Usar SELECT FOR UPDATE en la validación de stock, o validar stock > cantidad en el mismo query atómico.

- **Riesgo**: Rollback de stock si la transacción falla a mitad de camino.
  - **Mitigación**: Todo dentro de UnitOfWork, el rollback es automático.

- **Riesgo**: usuario_id null en historial (si el cambio lo hace el sistema por webhook).
  - **Mitigación**: Por ahora solo usuarios logueados pueden cambiar estado. Webhook marketplace，届时 vendría con usuario del sistema.

- **Trade-off**: Observación obligatoria puede bloquear cancelaciones rápidas.
  - **Mitigación**: UI puede sugerir obs predefinidas ("Cliente lo solicitó", "Sin stock", "Otro").

## Migration Plan

1. Crear migración Alembic para tabla HistorialEstadoPedido (si no existe)
2. Actualizar service.py con lógica de transiciones
3. Agregar endpoints al router.py
4. Agregar tests unitarios para transiciones
5. Deploy: azul/verde o Canary (mismo proceso que otros cambios)
6. Rollback: reversar migración si hay problemas críticos

## Open Questions

- ¿El webhook de MercadoPago (futuro) debe estar en este change o en CH-040 (MercadoPago)? → Queda en CH-040, este change solo cubre transiciones manuales.
- ¿Se necesita endpoint para obtener el historial de TODOS los pedidos de un admin? → No por ahora, se puede agregar cuando se haga el panel de admin.