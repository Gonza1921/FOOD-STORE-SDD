# Tasks: orders-create-pedido

## 1. Backend - Actualizar Schema

- [x] 1.1 Actualizar PedidoItemCreate schema para incluir `personalizacion: list[int] | None`
- [x] 1.2 Actualizar PedidoCreate schema para incluir `direccion_id: int` y `forma_pago_id: int`
- [x] 1.3 Agregar validación que direccion_id y forma_pago_id sean requeridos

## 2. Backend - Actualizar Service

- [x] 2.1 Agregar método `validar_direccion_pertenece_usuario(direccion_id, usuario_id)` en PedidoService
- [x] 2.2 Agregar método `validar_stock_suficiente(items)` en PedidoService
- [x] 2.3 Agregar método `generar_direccion_snapshot(direccion_id)` en PedidoService
- [x] 2.4 Actualizar `create_pedido` para aceptar direccion_id, forma_pago_id, personalizacion
- [x] 2.5 Integrar validación de dirección y stock antes de crear
- [x] 2.6 Generar snapshot de direcciónserializada al crear pedido
- [x] 2.7 Calcular total = subtotal + costo_envio ( costo_envio hardcodeado = 500 por ahora)

## 3. Backend - Actualizar Router

- [x] 3.1 Actualizar POST /api/v1/pedidos para aceptar nuevo body con direccion_id y forma_pago_id
- [x] 3.2 Agregar manejo de errores: 400 (stock insuficiente), 403 (dirección no autorizada)
- [x] 3.3 Actualizar respuesta para incluir costo_envio en el response

## 4. Frontend - Actualizar API y Hooks

- [x] 4.1 Actualizar tipo PedidoCreate en frontend para incluir direccion_id y forma_pago_id
- [x] 4.2 Actualizar hook `useCreatePedido` para aceptar nuevos parámetros
- [x] 4.3 Actualizar endpoint en endpoints.ts si es necesario

## 5. Frontend - Checkout con Dirección y Forma de Pago

- [x] 5.1 Crear hook `useDirecciones` para obtener las direcciones del usuario autenticado
- [x] 5.2 Crear componente AddressSelector en CheckoutPage (dropdown de direcciones)
- [x] 5.3 Crear componente PaymentSelector en CheckoutPage (enum de formas de pago)
- [x] 5.4 Agregar estado para direccion_id y forma_pago_id seleccionados
- [x] 5.5 Validar que el usuario tenga al menos una dirección antes de permitir checkout
- [x] 5.6 Enviar direccion_id y forma_pago_id al crear pedido

## 6. Frontend - Integrar Personalización

- [x] 6.1 Actualizar cart store: cambiar `personalizacion: string` a `ingredientes_excluidos: number[]`
- [x] 6.2 Actualizar CheckoutPage para enviar ingredientes_excluidos en cada item

## 7. Testing

- [x] 7.1 Testear crear pedido con dirección válida
- [x] 7.2 Testear crear pedido con dirección de otro usuario (debe fallar 403)
- [x] 7.3 Testear crear pedido sin stock suficiente (debe fallar 400)
- [x] 7.4 Testear crear pedido sin dirección (debe fallar 422)
- [x] 7.5 Testear que el total incluya costo de envío
- [x] 7.6 Testear que los snapshots se guardan correctamente