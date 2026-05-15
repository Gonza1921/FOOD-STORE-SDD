# Specification: pagos-mercadopago

## ADDED Requirements

### Requirement: Tokenización de datos de tarjeta en frontend

Los datos sensibles de tarjetas NUNCA deben pasar por el servidor de Food Store. La tokenización debe realizarse en el browser utilizando el SDK de MercadoPago.js.

#### Scenario: Cliente inicia proceso de pago
- **WHEN** el cliente tiene un pedido en estado PENDIENTE y hace clic en "Pagar con MercadoPago"
- **THEN** el frontend carga el SDK de MercadoPago y muestra el formulario de tarjeta

#### Scenario: Tokenización exitosa de tarjeta
- **WHEN** el usuario ingresa datos válidos de tarjeta y el SDK de MercadoPago tokeniza correctamente
- **THEN** el SDK retorna un token válido que se usa para crear la preferencia de pago

### Requirement: Creación de preferencia de pago en backend

El backend debe crear una preferencia de pago en MercadoPago usando el SDK oficial, vinculando el pedido mediante external_reference.

#### Scenario: Creación de preferencia exitosa
- **WHEN** el cliente solicita pagar un pedido (POST /api/pagos/crear-preferencia) con un payment_method_token válido
- **THEN** el backend crea la preferencia en MercadoPago y retorna el preference_id y init_point

#### Scenario: Fallo en creación de preferencia
- **WHEN** MercadoPago retorna error al crear la preferencia (datos inválidos, cuenta deshabilitada, etc.)
- **THEN** el backend retorna error 400 con detalle del problema

### Requirement: Idempotencia en webhooks

Cada pago debe tener un idempotency_key único; si se recibe webhook duplicado con la misma key, se debe ignorar.

#### Scenario: Webhook duplicado recibido
- **WHEN** MercadoPago envía notificación de pago y ya existe un registro de pago con el mismo payment_id
- **THEN** el sistema ignora la notificación duplicada y retorna HTTP 200

### Requirement: Verificación de estado de pago

El webhook debe verificar el estado real consultando la API de MercadoPago; nunca se debe confiar solo en los datos del webhook.

#### Scenario: Verificación de payment status
- **WHEN** llega un webhook de tipo "payment" desde MercadoPago
- **THEN** el backend consulta la API de MercadoPago para obtener el estado real del pago

### Requirement: Transición automática de pedido por pago aprobado

Pago "approved" debe dispara transición automática PENDIENTE → CONFIRMADO + decremento de stock.

#### Scenario: Pago aprobado confirma pedido
- **WHEN** el webhook recibe payment_status = "approved" para un pedido en estado PENDIENTE
- **THEN** el pedido transiciona a CONFIRMADO
- **AND** se decrementa atómicamente el stock de cada producto del pedido
- **AND** se crea registro en HistorialEstadoPedido

#### Scenario: Pago rechazado mantiene pedido pendiente
- **WHEN** el webhook recibe payment_status = "rejected" para un pedido en estado PENDIENTE
- **THEN** el pedido permanece en estado PENDIENTE
- **AND** se registra el intento de pago fallido

#### Scenario: Pago pendiente mantiene pedido pendiente
- **WHEN** el webhook recibe payment_status = "pending" o "in_process" para un pedido
- **THEN** el pedido sigue en estado PENDIENTE
- **AND** se actualiza el estado del pago

### Requirement: Respuesta inmediata del webhook

El webhook debe responder HTTP 200 inmediatamente para evitar reintentos de MercadoPago.

#### Scenario: Webhook procesa correctamente
- **WHEN** el webhook recibe notificación de pago
- **THEN** responde HTTP 200 de forma inmediata (sin esperar procesos largos)

### Requirement: Múltiples intentos de pago por pedido

Un pedido puede tener múltiples intentos de pago (relación 1:N Pedido → Pago).

#### Scenario: Cliente reintenta pago después de rechazo
- **WHEN** un cliente whose pedido tiene un pago rechazado intenta pagar nuevamente
- **THEN** se crea un nuevo registro de Pago asociado al mismo Pedido
- **AND** el pedido sigue en estado PENDIENTE

### Requirement: Uso de external_reference para vinculación

Se usa external_reference para vincular la preferencia de MercadoPago con el pedido en Food Store.

#### Scenario: Vinculación correcta de preferencia a pedido
- **WHEN** se crea preferencia de pago para un pedido
- **THEN** el campo external_reference de la preferencia contiene el ID del pedido