# Proposal: orders-create-pedido

## Why

El módulo de pedidos actual (ch-008) permite crear pedidos pero no integra la selección de dirección de entrega ni forma de pago. El flujo de checkout está inconexo: el usuario no puede elegir dónde recibir su pedido ni cómo pagar. Este change conecta el carrito con la creación de pedidos real, incluyendo validación de stock, snapshots de precio y dirección, y persistencia transaccional.

## What Changes

- Actualizar schema `PedidoCreate` en backend para aceptar `direccion_id`, `forma_pago_id`, y `personalizacion` en cada item
- Agregar validación de que la dirección pertenece al usuario autenticado
- Implementar validación de stock suficiente antes de crear el pedido (rollback si no hay)
- Generar snapshots inmutables de precio y dirección al crear el pedido
- Crear transacción atómica: Pedido + DetallePedido + HistorialEstadoPedido
- Actualizar frontend CheckoutPage para seleccionar dirección y forma de pago
- Integrar personalización del carrito (ingredientes a excluir) con la creación del pedido
- Agregar costo de envío al total del pedido

## Capabilities

### New Capabilities
- `pedido-checkout`: Flujo completo de checkout desde el carrito hasta la creación del pedido con validación transaccional

### Modified Capabilities
- `carrito-compras`: Actualizar para enviar dirección y forma de pago al backend
- `productos`: Verificar disponibilidad de stock antes de crear pedido

## Impact

- `backend/pedidos/schemas.py` — Actualizar PedidoCreate con nuevos campos
- `backend/pedidos/service.py` — Agregar validación de dirección y stock
- `backend/pedidos/router.py` — Aceptar nuevos campos en POST /pedidos
- `frontend/src/pages/CheckoutPage.tsx` — Selector de dirección y forma de pago
- `frontend/src/features/cart/store.ts` — Adaptar personalización
- `frontend/src/features/pedidos/` — Actualizar hook useCreatePedido