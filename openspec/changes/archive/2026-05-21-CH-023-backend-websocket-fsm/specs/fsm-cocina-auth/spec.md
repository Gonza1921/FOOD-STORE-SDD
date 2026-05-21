# Spec: FSM — Autorización granular por rol para COCINA

## Overview

Refinar el sistema de autorización del FSM de pedidos para que cada transición verifique los roles permitidos, no solo si el usuario es administrador. El rol `COCINA` solo puede ejecutar transiciones dentro de la fase de cocina.

## Requirements

### REQ-001: Mapa de transiciones permitidas por rol

El sistema SHALL definir qué roles pueden ejecutar cada transición del FSM.

**Transiciones y roles autorizados:**

| Desde | Hasta | Roles autorizados |
|-------|-------|-------------------|
| PENDIENTE | CONFIRMADO | Sistema (automático por pago) |
| PENDIENTE | CANCELADO | CLIENT, PEDIDOS, ADMIN |
| CONFIRMADO | EN_PREP | COCINA, PEDIDOS, ADMIN |
| CONFIRMADO | CANCELADO | PEDIDOS, ADMIN |
| EN_PREP | EN_CAMINO | COCINA, PEDIDOS, ADMIN |
| EN_PREP | CANCELADO | ADMIN (solo admin) |
| EN_CAMINO | ENTREGADO | PEDIDOS, ADMIN |
| ENTREGADO | — | Terminal |
| CANCELADO | — | Terminal |

**Scenarios:**

**Scenario: COCINA puede iniciar preparación**
- Given: un pedido en estado `CONFIRMADO`
- When: un usuario con rol `COCINA` solicita transición a `EN_PREP`
- Then: la transición se ejecuta exitosamente
- And: se registra en `HistorialEstadoPedido` con el `usuario_id` del cocinero

**Scenario: COCINA puede marcar como terminado**
- Given: un pedido en estado `EN_PREP`
- When: un usuario con rol `COCINA` solicita transición a `EN_CAMINO`
- Then: la transición se ejecuta exitosamente

**Scenario: COCINA NO puede confirmar pedidos**
- Given: un pedido en estado `PENDIENTE`
- When: un usuario con rol `COCINA` solicita transición a `CONFIRMADO`
- Then: la transición es rechazada con error 403
- And: el mensaje de error indica "rol no autorizado para esta transición"

**Scenario: COCINA NO puede entregar pedidos**
- Given: un pedido en estado `EN_CAMINO`
- When: un usuario con rol `COCINA` solicita transición a `ENTREGADO`
- Then: la transición es rechazada con error 403

**Scenario: COCINA NO puede cancelar pedidos en preparación**
- Given: un pedido en estado `EN_PREP`
- When: un usuario con rol `COCINA` solicita cancelación
- Then: la transición es rechazada con error 403

**Scenario: ADMIN puede ejecutar cualquier transición**
- Given: un pedido en cualquier estado no terminal
- When: un usuario con rol `ADMIN` solicita cualquier transición válida del FSM
- Then: la transición se ejecuta exitosamente

### REQ-002: Validación en el servicio del FSM

La validación de autorización por rol SHALL vivir en el servicio del FSM (`PedidoService`), no solo en el `require_role` del router.

**Scenarios:**

**Scenario: Validación granular en service**
- Given: un endpoint protegido con `require_role(["COCINA", "PEDIDOS", "ADMIN"])`
- When: un cocinero intenta una transición no autorizada para su rol (ej: `EN_CAMINO` → `ENTREGADO`)
- Then: el servicio rechaza la transición con 403
- And: esto ocurre aunque el `require_role` del endpoint permita el acceso

### REQ-003: Registro en HistorialEstadoPedido

Toda transición ejecutada SHALL registrarse en `HistorialEstadoPedido` con el `usuario_id` del usuario que la ejecutó (0 para operaciones de sistema).

**Scenarios:**

**Scenario: Historial con usuario_id correcto**
- Given: un cocinero con ID 12 ejecuta una transición
- When: la transición se completa exitosamente
- Then: se crea un registro en `HistorialEstadoPedido` con `usuario_id = 12`
- And: los campos `estado_desde`, `estado_nuevo` y `created_at` son correctos
