## Context

El proyecto Food Store necesita completar el flujo de compra integrando pagos con MercadoPago. El ch-010 implementó la FSM de pedidos (PENDIENTE → CONFIRMADO → EN_PREPARACIÓN → EN_CAMINO → ENTREGADO | CANCELADO), pero la transición PENDIENTE → CONFIRMADO debe ser automática cuando el pago se aprueba vía webhook de MercadoPago.

**Estado actual:**
- Backend: Módulos auth, usuarios, categorias, ingredientes, productos, pedidos, direcciones
- Frontend: Feature payment con store (solo store existente, sin componentes)
- No existe módulo de pagos en backend

**Reglas de negocio relevantes:** RN-PA01 a RN-PA09

## Goals / Non-Goals

**Goals:**
- Integrar SDK de MercadoPago.js en frontend para tokenización de tarjetas
- Crear preferencia de pago en backend vinculada al pedido
- Procesar webhooks IPN de MercadoPago para confirmar pedidos automáticamente
- Manejar idempotencia para evitar procesamiento doble de pagos

**Non-Goals:**
- No almacenar datos sensibles de tarjetas en nuestro servidor
- No implementar otros métodos de pago besides MercadoPago (solo)
- No crear panel de administración de pagos (futuro)

## Decisions

### Decision: Arquitectura de pagos con tokenización client-side

**Choice:** Los datos de tarjeta se tokenizan en el frontend usando MercadoPago.js SDK. El token se envía al backend solo para crear la preferencia de pago.

**Rationale:** Cumple con PCI DSS SAQ-A (datos de tarjeta nunca tocan nuestro servidor). El SDK de MercadoPago maneja la complejidad de seguridad.

### Decision: Webhook síncrono con verificación

**Choice:** El webhook de MercadoPago consulta la API de MP para verificar el estado real antes de procesar.

**Rationale:** RN-PA04 requiere verificación, no confiar en datos del webhook directamente.

### Decision: Modelo de pagos como tabla separada

**Choice:** Crear tabla `Pago` en PostgreSQL con relación 1:N a Pedido.

**Rationale:** Permite múltiples intentos de pago por pedido (RN-PA08) y mantiene auditoría de cada intento.

### Decision: Transición de pedido en el mismo UoW que webhook

**Choice:** El procesamiento del webhook ejecuta la transición de FSM dentro de un Unit of Work.

**Rationale:** Garantiza atomicidad: si el decremento de stock falla, se revierte todo (RN-FS04).

## Risks / Trade-offs

- **[Risk]** Webhook no llega (MP puede no enviar por falla de red) → **Mitigation**: Mostrar al cliente botón "Verificar pago" que consulta estado manualmente
- **[Risk]** Race condition en webhook (múltiples notificaciones simultáneas) → **Mitigation**: Idempotency_key con constraint unique en BD
- **[Risk]** Timeout en consulta a API de MP durante webhook → **Mitigation**: Responder 200 inmediatamente, procesar en background job (futuro)

## Migration Plan

1. Agregar dependencia `mercadopago` a backend/requirements.txt
2. Agregar dependencia `@mercadopago/sdk-js` a frontend/package.json
3. Crear migración de base de datos para tabla `Pago`
4. Deploy backend con nuevo endpoint de preferencias
5. Configurar webhook de MP en cuenta de MP (URL configurable por entorno)
6. Deploy frontend con checkout flow