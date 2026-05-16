## Context

El módulo de pedidos actual (`ch-008`) implementa el CRUD básico de pedidos pero está desconectado del flujo de checkout:

**Estado actual:**
- Backend: `POST /api/v1/pedidos` acepta solo `{ items: [{ producto_id, cantidad }] }`
- Frontend: CheckoutPage envía items sin dirección ni forma de pago
- Carrito: Tiene campo `personalizacion` pero es string, no array de ingredient IDs

**Qué falta según CH-032:**
- El request debe incluir `direccion_id`, `forma_pago_id`, y `personalizacion` por item
- Validar que la dirección pertenezca al usuario
- Validar stock suficiente antes de crear
- Snapshots de precio y dirección inmutables
- Transacción atómica completa

## Goals / Non-Goals

**Goals:**
- Completar el flujo de checkout: carrito → dirección → forma pago → pedido
- Validar stock antes de crear pedido (evitar overselling)
- Crear pedido con transacción atómica (Pedido + DetallePedido + Historial)
- Generar snapshots inmutables de precio y dirección
- Integrar personalización del carrito (ingredientes a excluir)

**Non-Goals:**
- Integración con MercadoPago (ch-040 ya lo cubre)
- Avance automático de estado (FSM ya existe en ch-010)
- Envío de email/notificaciones (fuera de scope)
- Descuentos o cupones (no está en el spec actual)

## Decisions

### D1: Estructura del request de creación de pedido

**Opción A:** Incluir dirección y forma de pago en el nivel superior del request
```json
{ "items": [...], "direccion_id": 5, "forma_pago_id": 1 }
```

**Opción B:** Incluir dirección en cada item
```json
{ "items": [{ "producto_id": 1, "cantidad": 2, "direccion_id": 5 }] }
```

**Decisión:** Opción A. Una dirección por pedido es el modelo actual de Food Store (ver Direccion model). La forma de pago también es única por pedido.

**Rationale:** Mantiene consistencia con la arquitectura actual donde cada Pedido tiene una FK a Direccion. Permite validar rápidamente que el usuario tenga direcciones antes de permitir checkout.

---

### D2: Validación de stock - cuándo hacerlo

**Opción A:** Validar en el momento de crear el pedido (transacción atómica)
**Opción B:** Reservar stock al agregar al carrito

**Decisión:** Opción A. La reserva en carrito es compleja (timeout, stock compartido entre usuarios). Validar en creación simplifica y evita locked rows.

**Rationale:** El spec CH-032 dice "Validación: stock suficiente, productos disponibles". Si el stock cambia entre que agrega al carrito y crea el pedido, se valida en el momento de crear. Si falla: rollback, error 400, cliente intenta de nuevo.

---

### D3: Formato de personalización

**Opción A:** Array de ingredient IDs a excluir
**Opción B:** String自由文本

**Decisión:** Opción A. El carrito actual tiene `personalizacion?: string` pero debería ser `ingredientes_excluidos: number[]` para validación en backend.

**Rationale:** Permite validar que los ingredientes a excluir realmente existen en el producto. Evita datos inconsistentes.

---

### D4: Costo de envío

**Opción A:** Fijo ($500 por ejemplo)
**Opción B:** Según distancia/zona (no implementado aún)

**Decisión:** Opción A temporal. Un costo fijo simplify el MVP. Later se puede extender con zonas de entrega.

**Rationale:** CH-032 menciona "costo de envío" pero no especifica cálculo. Usar valor fijo por ahora.

---

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Race condition de stock | Dos usuarios compran el último unit simultáneamente | UoW con SELECT FOR UPDATE en productos |
| Dirección no pertenece al usuario | Seguridad: usuario podría usar dirección ajena | Validar ownership en servicio antes de crear |
| Personalización no corresponde al producto | Ingredientes a excluir que no existen en el producto | Validar que cada ingredient ID esté asociado al producto |
| Fallo parcial en creación | Algunos items se crean, otros no | Transacción atómica: todo o nada |

## Migration Plan

1. **Backend primero:**
   - Actualizar PedidoCreate schema
   - Agregar validación de dirección + stock en service
   - Crear snapshot de direcciónserializada
   - Tests unitarios de validación

2. **Frontend después:**
   - Obtener direcciones del usuario (API existente)
   - Mostrar selector de dirección en CheckoutPage
   - Mostrar selector de forma de pago (enum hardcodeado por ahora)
   - Actualizar useCreatePedido para enviar nuevos campos

3. **Deploy:**
   - Backend primer (no rompe clientes)
   - Frontend después (usa nuevos campos)

## Open Questions

- [ ] ¿Cuál es el valor del costo de envío? ¿Debe ser config?
- [ ] ¿Las formas de pago se cargan de BD o son enum hardcodeado? (FormaPago table ya existe en BD)
- [ ] ¿El carrito debe validar stock al agregar, o solo al confirmar?