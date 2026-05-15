# Proposal: ch-010-fsm-pedidos

## Why

El módulo de pedidos creado en CH-008 implementó el CRUD básico pero dejó la máquina de estados (FSM) como "Out of Scope". Sin las transiciones FSM, los pedidos no pueden avanzar de PENDIENTE a ENTREGADO, no se puede cancelar, y no hay historial de estados. Este change completa el ciclo de vida del pedido, habilitando la integración con pagos (CH-040) y el panel de administración (CH-041).

## What Changes

- Implementar endpoint PATCH `/api/v1/pedidos/{id}/estado` para avanzar transiciones FSM
- Implementar endpoint PATCH `/api/v1/pedidos/{id}/cancelar` para cancelar pedidos
- Implementar lógica de transiciones validando: PENDIENTE → CONFIRMADO → EN_PREPARACIÓN → EN_CAMINO → ENTREGADO
- Permitir CANCELADO desde PENDIENTE, CONFIRMADO, EN_PREPARACIÓN (solo ADMIN desde EN_PREPARACIÓN)
- Decrementar stock automáticamente al confirmar pedido (PENDIENTE → CONFIRMADO)
- Restaurar stock al cancelar pedido
- Crear tabla HistorialEstadoPedido (append-only, solo INSERT) para audit trail
- Implementar historial de estados accesible via GET `/api/v1/pedidos/{id}/historial`
- Agregar validación de permisos: PEDIDOS/ADMIN pueden avanzar estados, solo ADMIN puede cancelar desde EN_PREPARACIÓN

## Capabilities

### New Capabilities

- `fsm-pedidos`: Máquina de estados para transiciones de pedidos con validación de permisos, control de stock, e historial append-only

### Modified Capabilities

- Ninguna — el capability de `pedidos` existente (CH-008) se extiende con FSM, no se modifica el comportamiento existente

## Impact

- `backend/pedidos/service.py` — agregar métodos para transiciones FSM, control de stock, cancelaciones
- `backend/pedidos/router.py` — agregar endpoints PATCH estado, cancelar, historial
- `backend/models/pedido.py` —可能会有字段调整 (si es necesario)
- `backend/migrations/versions/` — nueva migración si hay cambios en modelo
- `openspec/specs/pedidos/spec.md` — actualizar spec existente con transiciones FSM

## Scope

### In Scope

- Validación de transiciones según FSM definido
- Decremento de stock en transición a CONFIRMADO
- Restauración de stock en cancelación
- Historial de estados append-only
- Permisos RBAC para cada transición
- Estados terminales (ENTREGADO, CANCELADO) no permiten más cambios
- Observación (motivo) requerida al cancelar

### Out of Scope

- Integración con MercadoPago (CH-040)
- Panel de administración (CH-041)
- Notificaciones al cliente por email/SMS
- Tests de carga o stress
- Reintentos automáticos de pago