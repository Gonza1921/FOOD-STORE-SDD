## Why

El proyecto Food Store necesita completar el flujo de compra para que los clientes puedan pagar sus pedidos. Actualmente el sistema maneja pedidos con FSM pero sin integración de pagos. El ch-010 implementó las transiciones de estado pero la confirmación automática por pago aprobado (PENDIENTE → CONFIRMADO) requiere la integración con MercadoPago.

## What Changes

- **Backend**: Nuevo módulo `pagos/` con router, service, schemas y repository para gestionar preferencias de pago y webhooks IPN de MercadoPago
- **Frontend**: Componente de checkout que integra MercadoPago.js SDK para tokenización y pago
- **Integración**: Webhook endpoint que recibe notificaciones de pago y dispara transición automática de pedido
- **Modelo**: Entidad `Pago` con idempotency_key, external_reference, status, timestamp

## Capabilities

### New Capabilities
- `pagos-mercadopago`: Integración completa con MercadoPago para crear preferencias de pago, procesar pagos con SDK frontend y recibir webhooks IPN para confirmar automáticamente pedidos

### Modified Capabilities
- `pedidos`: La especificación de pedidos actual (openspec/specs/pedidos/spec.md) define FSM pero no incluye la regla RN-PE02 de que PENDIENTE → CONFIRMADO es automática por pago aprobado. Se agregará esta transición al design.

## Impact

- **Backend**: Nuevo módulo `backend/pagos/` (router, service, schemas, repository)
- **Frontend**: Nuevo feature `frontend/src/features/payment/` con componentes de checkout
- **Modelo**: Nueva tabla `Pago` en PostgreSQL (o extender existente)
- **Dependencias**: MercadoPago SDK tanto en backend (`mercadopago`) como frontend (`@mercadopago/sdk-js`)
- **Workflow**: Cambio en flujo de pedidos - webhook de pago trigger FSM