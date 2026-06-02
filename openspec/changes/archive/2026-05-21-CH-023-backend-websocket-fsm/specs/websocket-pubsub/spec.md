# Spec: WebSocket Pub/Sub para KDS

## Overview

Sistema de tiempo real en proceso para el Kitchen Display System. Permite que las pantallas de cocina reciban eventos al instante cuando los pedidos cambian de estado, sin necesidad de polling ni recarga manual.

## Requirements

### REQ-001: Gestor de conexiones WebSocket en proceso

El sistema SHALL implementar un gestor de conexiones WebSocket en proceso que mantenga un registro de todas las conexiones activas.

**Scenarios:**

**Scenario: Conexión WebSocket exitosa**
- Given: un usuario con rol `COCINA`, `PEDIDOS` o `ADMIN` posee un JWT válido
- When: el usuario se conecta a `WS /api/v1/cocina/ws?token=<JWT>`
- Then: la conexión se establece exitosamente
- And: el gestor registra la conexión en su set de conexiones activas

**Scenario: Conexión WebSocket rechazada por token inválido**
- Given: un usuario sin token o con token inválido/expirado
- When: intenta conectarse a `WS /api/v1/cocina/ws`
- Then: la conexión es rechazada con código 1008 (Policy Violation)
- And: el gestor no registra la conexión

**Scenario: Conexión WebSocket rechazada por rol insuficiente**
- Given: un usuario con rol `CLIENT` y JWT válido
- When: intenta conectarse a `WS /api/v1/cocina/ws`
- Then: la conexión es rechazada con código 1008 (Policy Violation)

**Scenario: Desconexión limpia**
- Given: una conexión WebSocket activa registrada en el gestor
- When: el cliente se desconecta (cierra la conexión)
- Then: el gestor remueve la conexión de su set de conexiones activas
- And: no se intentan enviar más mensajes a esa conexión

### REQ-002: Publicación de eventos en tiempo real

Cuando un pedido cambia de estado, el sistema SHALL publicar un evento a todas las conexiones WebSocket activas.

**Scenarios:**

**Scenario: Evento PEDIDO_CONFIRMADO**
- Given: al menos una conexión WebSocket activa de cocina
- When: un pedido pasa de `PENDIENTE` a `CONFIRMADO` (pago aprobado)
- Then: todas las conexiones activas reciben un mensaje JSON con `tipo: "PEDIDO_CONFIRMADO"`
- And: el payload incluye `pedido_id`, `estado_nuevo`, `timestamp` y datos básicos del pedido (items, total, tiempo en cola)

**Scenario: Evento PEDIDO_EN_PREPARACION**
- Given: al menos una conexión WebSocket activa
- When: un pedido pasa de `CONFIRMADO` a `EN_PREP`
- Then: todas las conexiones activas reciben un mensaje JSON con `tipo: "PEDIDO_EN_PREPARACION"`

**Scenario: Evento PEDIDO_EN_CAMINO**
- Given: al menos una conexión WebSocket activa
- When: un pedido pasa de `EN_PREP` a `EN_CAMINO`
- Then: todas las conexiones activas reciben un mensaje JSON con `tipo: "PEDIDO_EN_CAMINO"`

**Scenario: Evento PEDIDO_CANCELADO**
- Given: al menos una conexión WebSocket activa
- When: un pedido en estado `CONFIRMADO` o `EN_PREP` es cancelado
- Then: todas las conexiones activas reciben un mensaje JSON con `tipo: "PEDIDO_CANCELADO"`

**Scenario: Best-effort sin conexiones activas**
- Given: no hay conexiones WebSocket activas
- When: ocurre una transición de estado en un pedido
- Then: el evento se descarta sin error
- And: la transición se completa normalmente

### REQ-003: Formato de mensajes WebSocket

Todos los mensajes enviados por WebSocket SHALL usar formato JSON con campos consistentes.

**Scenarios:**

**Scenario: Formato de mensaje de evento**
- Given: una conexión WebSocket activa
- When: recibe un evento de transición
- Then: el mensaje JSON contiene `tipo` (string), `payload` (object con `pedido_id`, `estado_anterior`, `estado_nuevo`, `timestamp`, `items`)
- And: el campo `tipo` es uno de: `PEDIDO_CONFIRMADO`, `PEDIDO_EN_PREPARACION`, `PEDIDO_EN_CAMINO`, `PEDIDO_CANCELADO`

**Scenario: Heartbeat/keepalive**
- Given: una conexión WebSocket activa y estable
- When: pasan 30 segundos sin actividad
- Then: el servidor envía un mensaje JSON con `tipo: "PING"`
- And: si el cliente no responde con `tipo: "PONG"` en los próximos 10 segundos, la conexión se cierra
