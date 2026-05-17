## ADDED Requirements

### Requirement: Cliente recibe confirmación visual al crear pedido

El sistema SHALL mostrar una pantalla de confirmación inmediatamente después de crear un pedido exitosamente, con el resumen completo y un llamado a pagar.

#### Scenario: Confirmación con pedido exitoso
- **WHEN** el cliente completa el checkout y el pedido se crea exitosamente
- **THEN** se muestra una pantalla de confirmación con: número de pedido, lista de items (nombre, cantidad, precio), subtotal, costo de envío, total, dirección de entrega, estado "PENDIENTE - Esperando pago"
- **AND** se muestra un botón prominente "Ir a pagar ahora" que redirige a `/pagar/{pedidoId}`
- **AND** se muestra un botón secundario "Ver detalle del pedido" que redirige a `/mis-pedidos/{pedidoId}`

#### Scenario: Confirmación con carrito vacío post-creación
- **WHEN** se muestra la pantalla de confirmación
- **THEN** el carrito del cliente ya está vacío (se limpió al crear el pedido)
- **AND** se indica visualmente que el carrito fue procesado

### Requirement: Confirmación maneja errores de redirección

El sistema SHALL manejar correctamente los casos donde el cliente no puede ser redirigido a MercadoPago desde la confirmación.

#### Scenario: Error al iniciar pago desde confirmación
- **WHEN** el cliente hace clic en "Ir a pagar ahora"
- **AND** ocurre un error al crear la preferencia de pago
- **THEN** se muestra un mensaje de error claro
- **AND** se ofrece la opción de reintentar o volver a mis pedidos
