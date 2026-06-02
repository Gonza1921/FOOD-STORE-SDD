# realtime-order-tracking Specification

## ADDED Requirements

### Requirement: Per-status timestamps en modelo Pedido

El modelo `Pedido` SHALL registrar timestamps individuales para cada transición de estado, permitiendo calcular tiempos parciales y ETA.

#### Scenario: Creación de pedido registra confirmado_en
- **WHEN** se crea un pedido en estado `PENDIENTE`
- **THEN** `creado_en` SHALL setearse al timestamp actual
- **AND** los demás campos de timestamp (`confirmado_en`, `en_preparacion_en`, `listo_en`, `en_camino_en`, `entregado_en`) SHALL ser `NULL`

#### Scenario: Transición CONFIRMADO registra timestamp
- **WHEN** un pedido pasa de `PENDIENTE` a `CONFIRMADO`
- **THEN** `confirmado_en` SHALL actualizarse al timestamp UTC actual

#### Scenario: Transición EN_PREPARACION registra timestamp
- **WHEN** un pedido pasa de `CONFIRMADO` a `EN_PREPARACION`
- **THEN** `en_preparacion_en` SHALL actualizarse al timestamp UTC actual

#### Scenario: Transición LISTO registra timestamp
- **WHEN** un pedido pasa de `EN_PREPARACION` a `LISTO`
- **THEN** `listo_en` SHALL actualizarse al timestamp UTC actual

#### Scenario: Transición EN_CAMINO registra timestamp
- **WHEN** un pedido pasa de `LISTO` a `EN_CAMINO`
- **THEN** `en_camino_en` SHALL actualizarse al timestamp UTC actual

#### Scenario: Transición ENTREGADO registra timestamp y calcula delivery time
- **WHEN** un pedido pasa de `EN_CAMINO` a `ENTREGADO`
- **THEN** `entregado_en` SHALL actualizarse al timestamp UTC actual
- **AND** el delivery time SHALL calcularse como `entregado_en - en_camino_en`

### Requirement: API devuelve timestamps por estado

El endpoint `GET /api/v1/pedidos/{pedido_id}` SHALL incluir los timestamps de cada estado alcanzado en la respuesta.

#### Scenario: Pedido CONFIRMADO devuelve timestamps parciales
- **WHEN** se consulta un pedido en estado `CONFIRMADO`
- **THEN** la respuesta SHALL incluir `creado_en` y `confirmado_en`
- **AND** los timestamps de estados no alcanzados SHALL ser `null`

#### Scenario: Pedido ENTREGADO devuelve timeline completa
- **WHEN** se consulta un pedido en estado `ENTREGADO`
- **THEN** la respuesta SHALL incluir todos los timestamps: `creado_en`, `confirmado_en`, `en_preparacion_en`, `listo_en`, `en_camino_en`, `entregado_en`

### Requirement: WebSocket endpoint para tracking individual

El backend SHALL exponer un WebSocket `WS /api/v1/pedidos/{pedido_id}/track` que emita eventos de cambio de estado específicos para ese pedido.

#### Scenario: Conexión WebSocket con token válido
- **WHEN** un cliente autenticado se conecta a `WS /api/v1/pedidos/{pedido_id}/track` con un JWT válido
- **AND** el pedido pertenece al usuario autenticado
- **THEN** la conexión SHALL establecerse exitosamente
- **AND** el servidor SHALL enviar un mensaje de bienvenida con el estado actual del pedido

#### Scenario: Conexión rechazada por token inválido
- **WHEN** un cliente no autenticado intenta conectarse
- **THEN** la conexión SHALL cerrarse con código 4001 (No autorizado)

#### Scenario: Conexión rechazada por ownership
- **WHEN** un cliente autenticado intenta conectarse a un pedido que NO le pertenece
- **THEN** la conexión SHALL cerrarse con código 4003 (Prohibido)

#### Scenario: Evento PEDIDO_CONFIRMADO emitido
- **WHEN** el pedido tracking cambia de `PENDIENTE` a `CONFIRMADO`
- **THEN** el WebSocket SHALL emitir `{ "tipo": "PEDIDO_CONFIRMADO", "pedido": { ... }, "timestamp": "..." }`
- **AND** el payload `pedido` SHALL incluir el estado actualizado y todos los timestamps disponibles

#### Scenario: Evento de cada transición emitido
- **WHEN** el pedido tracking transiciona a cualquier estado no terminal
- **THEN** el WebSocket SHALL emitir el evento correspondiente: `PEDIDO_EN_PREPARACION`, `PEDIDO_LISTO`, `PEDIDO_EN_CAMINO`, `PEDIDO_ENTREGADO`, `PEDIDO_CANCELADO`
- **AND** cada evento SHALL incluir `tipo`, `pedido` (objeto completo) y `timestamp`

### Requirement: Timeline visual de progreso

La página `/mis-pedidos/:id` SHALL mostrar un componente `OrderTimeline` con el progreso visual del pedido a través de los estados del FSM: CONFIRMADO → EN_PREPARACION → LISTO → EN_CAMINO → ENTREGADO.

#### Scenario: Timeline muestra todos los estados
- **WHEN** un cliente navega a `/mis-pedidos/:id`
- **THEN** SHALL mostrar una línea de tiempo horizontal con todos los estados del FSM
- **AND** cada estado SHALL mostrar un ícono y una etiqueta textual
- **AND** los estados alcanzados SHALL mostrarse en color verde
- **AND** el estado actual SHALL mostrarse en color azul con indicador de "activo"
- **AND** los estados no alcanzados SHALL mostrarse en gris

#### Scenario: Timeline muestra timestamps por estado
- **WHEN** el timeline se renderiza con un pedido que tiene timestamps
- **THEN** cada estado alcanzado SHALL mostrar su timestamp formateado debajo
- **AND** el formato SHALL ser HH:MM en hora local

#### Scenario: Timeline responsive
- **WHEN** la pantalla es menor a 640px
- **THEN** el timeline SHALL mostrarse en formato vertical (en lugar de horizontal)
- **AND** cada paso SHALL ocupar el ancho completo

### Requirement: Actualizaciones en vivo vía WebSocket

La página `/mis-pedidos/:id` SHALL conectarse al WebSocket `WS /api/v1/pedidos/{pedido_id}/track` para recibir actualizaciones en tiempo real.

#### Scenario: Timeline se actualiza con evento WebSocket
- **GIVEN** conexión WebSocket activa en la página de tracking
- **WHEN** llega un evento `PEDIDO_EN_PREPARACION`
- **THEN** el timeline SHALL actualizarse instantáneamente mostrando el nuevo estado
- **AND** el badge de estado SHALL reflejar el cambio
- **AND** el timestamp del nuevo estado SHALL mostrarse

#### Scenario: Indicador de conexión WebSocket
- **WHEN** el WebSocket está conectado
- **THEN** SHALL mostrarse un indicador verde "En vivo" en la página
- **WHEN** el WebSocket se desconecta
- **THEN** SHALL mostrarse un indicador amarillo "Reconectando..."
- **WHEN** el WebSocket falla y se usa fallback
- **THEN** SHALL mostrarse un indicador gris "Actualizando cada 5s"

### Requirement: ETA (Estimated Time of Arrival)

La página SHALL mostrar un tiempo estimado de entrega que se actualiza según el estado actual del pedido.

#### Scenario: ETA para pedido en preparación
- **WHEN** el pedido está en `CONFIRMADO` o `EN_PREPARACION`
- **THEN** SHALL mostrar "Tiempo estimado: ~X min" basado en `estimated_ready_at`
- **AND** si no hay `estimated_ready_at`, SHALL usar un default de 25-35 minutos desde `creado_en`

#### Scenario: ETA para pedido listo o en camino
- **WHEN** el pedido está en `LISTO` o `EN_CAMINO`
- **THEN** SHALL mostrar "Entrega estimada: ~X min" basado en diferencia con `en_camino_en`
- **AND** SHALL usar un default de 15-20 minutos desde `listo_en`

#### Scenario: ETA para pedido entregado
- **WHEN** el pedido está en `ENTREGADO`
- **THEN** SHALL mostrar "Entregado" con el timestamp de `entregado_en`
- **AND** SHALL mostrar el delivery time total (diferencia entre `entregado_en` y `creado_en`)

### Requirement: Toast notifications en cambio de estado

La aplicación SHALL mostrar una notificación toast cuando el estado del pedido cambia en tiempo real.

#### Scenario: Toast al confirmar pedido
- **WHEN** el WebSocket recibe evento `PEDIDO_CONFIRMADO`
- **THEN** SHALL mostrarse un toast con mensaje "Tu pedido ha sido confirmado"
- **AND** el toast SHALL tener duración de 5 segundos
- **AND** el toast SHALL tener un ícono de check

#### Scenario: Toast al cambiar a cada estado
- **WHEN** el WebSocket recibe cualquier evento de transición
- **THEN** SHALL mostrarse un toast con el mensaje correspondiente:
  - `PEDIDO_EN_PREPARACION`: "Tu pedido está siendo preparado"
  - `PEDIDO_LISTO`: "Tu pedido está listo"
  - `PEDIDO_EN_CAMINO`: "Tu pedido está en camino"
  - `PEDIDO_ENTREGADO`: "Tu pedido ha sido entregado"
  - `PEDIDO_CANCELADO`: "Tu pedido ha sido cancelado"

### Requirement: Fallback polling

Si el WebSocket no puede conectarse o se desconecta, la página SHALL hacer polling cada 5 segundos a `GET /api/v1/pedidos/{pedido_id}` como fallback.

#### Scenario: Polling automático al fallar WebSocket
- **WHEN** el WebSocket falla al conectar
- **THEN** SHALL iniciar polling cada 5 segundos a `GET /api/v1/pedidos/{pedido_id}`
- **AND** SHALL intentar reconectar el WebSocket cada 10 segundos
- **AND** cuando el WebSocket se reconecte, SHALL detener el polling

#### Scenario: Polling con retry exponencial
- **WHEN** el WebSocket se desconecta después de haber estado conectado
- **THEN** SHALL intentar reconexión inmediata
- **AND** si falla, SHALL esperar 2s, luego 5s, luego 10s (retry exponencial, max 30s)
- **AND** durante el retry, el indicador SHALL mostrar "Reconectando..."
