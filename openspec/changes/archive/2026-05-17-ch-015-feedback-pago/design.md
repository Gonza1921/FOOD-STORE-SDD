## Context

**Estado actual:**
- CheckoutPage crea el pedido vía `POST /api/v1/pedidos` y redirige directamente a `/pagar/{pedidoId}` (PaymentPage)
- PaymentPage crea preferencia MP, abre checkout, y hace polling; al aprobarse navega a `/mis-pedidos/{id}`
- No hay pantalla de confirmación intermedia entre la creación del pedido y el pago
- MP no tiene `back_urls` configuradas, por lo que el usuario siempre vuelve al sitio vía navegación manual o botón "Volver al sitio"

**Lo que falta (US-071 y US-072):**
- Confirmación visual post-creación del pedido con resumen y botón de pago
- Página de resultado al volver de MP con feedback claro del estado del pago
- `back_urls` en la preferencia de MP para redirigir automáticamente

## Goals / Non-Goals

**Goals:**
- Mostrar pantalla de confirmación con resumen del pedido antes de redirigir a pago
- Mostrar página de resultado de pago al volver de MP (aprobado/rechazado/pendiente)
- Configurar `back_urls` en la preferencia de MP para redirigir a nuestra página de resultado
- Hacer polling de estado en la página de resultado para actualizaciones en tiempo real

**Non-Goals:**
- Modificar el backend de pagos (solo frontend + configuración de preferencia MP)
- Agregar nuevos endpoints de API (usar los existentes: `API.PAGOS.DETALLE`)
- Enviar emails de confirmación (fuera de scope)
- Pantalla de "tracking" del pedido (ya existe en Mis Pedidos)

## Decisions

### D1: Flujo de navegación post-creación

**Opción A:** CheckoutPage → OrderConfirmation → (click "Pagar") → PaymentPage → (MP redirige) → PaymentResultPage
**Opción B:** CheckoutPage → PaymentPage directamente (actual), MP redirige a PaymentResultPage

**Decisión:** Opción A. La pantalla de confirmación es un paso intermedio que le da al usuario certeza de que su pedido fue creado. Además, separa la creación del pedido del inicio del pago.

**Rationale:** El usuario necesita ver que su pedido existe antes de pagar. Si hay algún error (stock, dirección), se muestra en el checkout, no después de pagar.

### D2: Implementación de OrderConfirmation

**Opción A:** Componente dentro de CheckoutPage que se muestra al completar
**Opción B:** Página separada (`/confirmacion/{pedidoId}`) con datos cargados vía API

**Decisión:** Opción B (página separada).

**Rationale:** Es una URL compartible, el usuario puede volver a ella, y desacopla la lógica de confirmación del checkout. Además, si el usuario recarga la página, los datos se mantienen (se cargan del backend).

### D3: Carga de datos de confirmación

**Opción A:** Pasar datos vía state de React Router (useNavigate con state)
**Opción B:** Cargar datos del pedido vía API existente `GET /api/pedidos/{id}`

**Decisión:** Opción B. Pasar datos por state de router es frágil (se pierde al recargar). Cargar del backend es la fuente de verdad.

**Rationale:** `GET /api/pedidos/{id}` ya existe y devuelve toda la data necesaria (items, total, dirección snapshot, estado). Solo necesitamos pasarlo a la pantalla de confirmación.

### D4: back_urls de MercadoPago

**Decisión:** Configurar `back_urls` en la creación de preferencia con `success`, `failure`, `pending` apuntando a `/pago/resultado/{pedidoId}?status={status}`.

**Rationale:** MP permite definir URLs de retorno por estado. Así el usuario vuelve automáticamente a nuestra página de resultado sin necesidad de navegación manual.

### D5: Detección de resultado de pago

**Opción A:** Confiar en los query params que MP envía al redirigir (`collection_status`, `payment_id`)
**Opción B:** Ignorar query params y siempre consultar la API backend

**Decisión:** Híbrido: usar query params para mostrar resultado inmediato, pero verificar contra API backend para evitar manipulación.

**Rationale:** RN-PA04 del sistema dice "Siempre se verifica el estado real consultando la API". Los query params son para feedback instantáneo, la verificación real va contra backend.

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Usuario cierra ventana de MP sin pagar | Pedido queda PENDIENTE sin pago | El pedido es visible en Mis Pedidos, puede pagar después desde ahí |
| Recarga de página de resultado pierde query params | Muestra estado genérico | Siempre consultar API backend como fallback |
| Polling excesivo en resultado | Carga innecesaria al backend | Timeout de 5 minutos + limpieza de interval en unmount |
| MP no redirige por configuración incorrecta | Usuario no ve resultado | Botón manual "Volver al sitio" en MP + polling en PaymentPage |

## Migration Plan

1. **Crear OrderConfirmation page** (`/confirmacion/{pedidoId}`) con resumen del pedido
2. **Actualizar CheckoutPage** para redirigir a `/confirmacion/{pedidoId}` en lugar de `/mis-pedidos/{id}`
3. **Crear PaymentResultPage** (`/pago/resultado/{pedidoId}`) con feedback de estado
4. **Actualizar PaymentPage** para configurar `back_urls` en la preferencia MP
5. **Agregar rutas** en Router.tsx
6. **Actualizar endpoints** en frontend si es necesario

## Open Questions

- [ ] ¿El costo de envío fijo ($500) debe mostrarse en la confirmación? (Sí, ya viene en el response del pedido)
- [ ] ¿Debe haber un botón "Volver al carrito" en la confirmación? (No, el carrito ya se limpió)
