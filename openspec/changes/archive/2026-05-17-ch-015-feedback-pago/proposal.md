## Why

El flujo de checkout actual crea el pedido y redirige directamente a MercadoPago, pero el usuario no recibe una confirmación visual clara de que su pedido fue creado exitosamente (US-071). Además, cuando MercadoPago redirige de vuelta al sitio (US-072), el usuario aterriza directamente en el detalle del pedido sin un feedback de estado de pago claro — no sabe si el pago fue aprobado, rechazado o está pendiente sin tener que interpretar la UI.

## What Changes

- Crear pantalla de **confirmación de pedido** post-creación con resumen visual (items, total, dirección, estado "PENDIENTE - Esperando pago") y botón "Ir a pagar ahora"
- Crear página de **resultado de pago** (aprobado/rechazado/pendiente) para el retorno de MercadoPago vía `back_urls`
- Actualizar `PaymentPage` para usar `back_urls` de MP que redirijan a nuestra página de resultado
- Agregar componente `OrderConfirmation` para la confirmación post-creación
- Agregar polling inteligente en la página de resultado de pago
- Actualizar flujo: CheckoutPage → OrderConfirmation → PaymentPage → PaymentResultPage

## Capabilities

### New Capabilities
- `confirmacion-pedido`: Pantalla de confirmación visual post-creación con resumen del pedido y llamado a pagar
- `resultado-pago`: Página de resultado de pago al regresar de MercadoPago con feedback de estado

### Modified Capabilities
- `pagos-mercadopago`: Actualizar creación de preferencia para incluir `back_urls` que apunten a nuestra página de resultado

## Impact

- `frontend/src/pages/CheckoutPage.tsx` — Redirigir a OrderConfirmation en lugar de `/mis-pedidos/:id`
- `frontend/src/pages/` — Nueva página `PaymentResultPage.tsx` para resultado de pago
- `frontend/src/features/payment/` — Nuevo componente `OrderConfirmation`, actualizar `PaymentPage` con `back_urls`
- `frontend/src/app/Router.tsx` — Nueva ruta `/pago/resultado/:pedidoId`
- `backend/pagos/router.py` — Endpoint para consultar estado de pago por pedido (ya existe parcialmente)
