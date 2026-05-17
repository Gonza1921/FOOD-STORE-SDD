## 0. Backend — Exponer snapshots en schemas

- [x] 0.1 Agregar `nombre_snapshot` a `PedidoItemResponse` en `backend/pedidos/schemas.py`
- [x] 0.2 Agregar `direccion_snapshot` a `PedidoResponse` en `backend/pedidos/schemas.py`
- [x] 0.3 Agregar helper `_build_pedido_response()` en `backend/pedidos/router.py` para centralizar la construcción de respuestas
- [x] 0.4 Actualizar todos los endpoints del router de pedidos para usar el helper y exponer los nuevos campos
- [x] 0.5 Agregar `FRONTEND_URL` a config y `.env.example` para `back_urls` de MP
- [x] 0.6 Actualizar `backend/pagos/service.py` con `back_urls` y `auto_return: "approved"`

## 1. OrderConfirmation — Pantalla de Confirmación

- [x] 1.1 Crear página `OrderConfirmationPage` en `frontend/src/pages/OrderConfirmationPage.tsx` con ruta `/confirmacion/:pedidoId`
- [x] 1.2 Verificar que `usePedidoDetail` ya existe (✅ ya existe en `frontend/src/features/pedidos/hooks/usePedidoDetail.ts`)
- [x] 1.3 Mostrar resumen del pedido en la confirmación: número de pedido, items (nombre, cantidad, precio), subtotal, costo de envío, total, dirección snapshot
- [x] 1.4 Mostrar estado "PENDIENTE - Esperando pago" con indicador visual
- [x] 1.5 Agregar botón "Ir a pagar ahora" que redirige a `/pagar/{pedidoId}`
- [x] 1.6 Agregar botón "Ver detalle del pedido" que redirige a `/mis-pedidos/{pedidoId}`
- [x] 1.7 Agregar ruta `/confirmacion/:pedidoId` en Router.tsx dentro de ProtectedRoute

## 2. Actualizar CheckoutPage

- [x] 2.1 Modificar flujo post-creación: redirigir a `/confirmacion/:pedidoId` en vez de `/mis-pedidos/:id`
- [x] 2.2 Verificar que el carrito se limpia correctamente al redirigir a confirmación (ya se llama clearCart() antes de navegar)
- [x] 2.3 Manejar estado de carga/error en la transición (el OrderConfirmationPage maneja loading/error states)

## 3. PaymentPage — Configurar back_urls

- [x] 3.1 Actualizar `backend/pagos/service.py` para incluir `back_urls` con `success`, `failure`, `pending` apuntando a `/pago/resultado/{pedidoId}`
- [x] 3.2 Verificar `external_reference` con `pedido_id` (✅ ya existía en el backend)
- [x] 3.3 Configurar `auto_return` en `"approved"` para redirección automática solo en aprobados

## 4. PaymentResultPage — Resultado de Pago

- [x] 4.1 Crear página `PaymentResultPage` en `frontend/src/pages/PaymentResultPage.tsx` con ruta `/pago/resultado/:pedidoId`
- [x] 4.2 Extraer query params `collection_status`, `payment_id`, `external_reference` de la URL
- [x] 4.3 Mostrar estado aprobado: icono verde, mensaje "¡Pago aprobado!", botones "Ver mi pedido" y "Volver al inicio"
- [x] 4.4 Mostrar estado rechazado: icono rojo, mensaje "Pago rechazado", botón "Reintentar pago" y "Ver mi pedido"
- [x] 4.5 Mostrar estado pendiente: icono amarillo, mensaje "Pago pendiente", botón "Ver mi pedido"
- [x] 4.6 Implementar polling cada 5s del estado real del pago contra API (con timeout de 5 min)
- [x] 4.7 Actualizar UI dinámicamente si el estado cambia durante el polling
- [x] 4.8 Agregar ruta `/pago/resultado/:pedidoId` en Router.tsx dentro de ProtectedRoute

## 5. Testing

- [ ] 5.1 Testear flujo completo: checkout → confirmación → pago → resultado (aprobado)
- [ ] 5.2 Testear resultado de pago rechazado con reintento
- [ ] 5.3 Testear resultado de pago pendiente con polling
- [ ] 5.4 Testear acceso directo a confirmación con pedido ID válido
- [ ] 5.5 Testear acceso directo a resultado sin query params
