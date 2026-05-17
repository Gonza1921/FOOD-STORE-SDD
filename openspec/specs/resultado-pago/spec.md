## ADDED Requirements

### Requirement: Cliente ve resultado de pago al volver de MercadoPago

El sistema SHALL mostrar una página de resultado de pago cuando MercadoPago redirige al cliente de vuelta al sitio, indicando claramente si el pago fue aprobado, rechazado o está pendiente.

#### Scenario: Pago aprobado
- **WHEN** MercadoPago redirige al sitio con `collection_status=approved`
- **THEN** se muestra una pantalla de éxito con: icono verde de check, mensaje "¡Pago aprobado!", número de pedido, monto total
- **AND** se muestra botón "Ver mi pedido" que redirige a `/mis-pedidos/{pedidoId}`
- **AND** se muestra botón "Volver al inicio" que redirige a `/dashboard`
- **AND** el carrito se limpia automáticamente

#### Scenario: Pago rechazado
- **WHEN** MercadoPago redirige al sitio con `collection_status=rejected`
- **THEN** se muestra una pantalla con: icono rojo de error, mensaje "Pago rechazado", sugerencia de reintentar con otro medio
- **AND** se muestra botón "Reintentar pago" que redirige a `/pagar/{pedidoId}`
- **AND** se muestra botón "Ver mi pedido" que redirige a `/mis-pedidos/{pedidoId}`

#### Scenario: Pago pendiente
- **WHEN** MercadoPago redirige al sitio con `collection_status=pending`
- **THEN** se muestra una pantalla con: icono amarillo de advertencia, mensaje "Pago pendiente", explicación de que el pago está siendo procesado
- **AND** se muestra botón "Ver mi pedido" que redirige a `/mis-pedidos/{pedidoId}`

#### Scenario: Acceso directo a resultado sin datos de MP
- **WHEN** un usuario accede a `/pago/resultado/{pedidoId}` sin parámetros de retorno de MP
- **THEN** el sistema consulta el estado real del pago vía API
- **AND** muestra el resultado según el estado real del pago

### Requirement: Página de resultado hace polling del estado de pago

El sistema SHALL consultar periódicamente el estado del pago en la página de resultado si el pago está en estado pendiente o en proceso.

#### Scenario: Polling de pago pendiente
- **WHEN** el pago está en estado "pending" o "in_process"
- **THEN** la página consulta el estado cada 5 segundos
- **AND** actualiza dinámicamente el mensaje si el estado cambia a "approved" o "rejected"
- **AND** el polling se detiene al alcanzar un estado terminal (approved/rejected)
- **AND** el polling se detiene después de 5 minutos mostrando mensaje "El pago está tardando más de lo esperado. Podés verificar el estado en Mis Pedidos."
