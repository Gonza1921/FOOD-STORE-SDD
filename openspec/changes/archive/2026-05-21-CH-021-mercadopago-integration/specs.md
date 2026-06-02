# CH-021 Specifications — Complete MercadoPago Integration

## Purpose

These specifications define requirements and scenarios for integrating MercadoPago payment processing end-to-end. The system MUST validate webhook signatures, automatically confirm orders on approved payments with atomic stock deductions, and provide users with clear payment feedback through a dedicated result page.

---

## Domain: Backend Payments (`backend/pagos`)

### REQ-BE-001: Webhook Signature Validation

**Requirement**

The system MUST verify every incoming webhook using MercadoPago SDK signature validation before processing any payment data. If signature validation fails, the webhook MUST be rejected with HTTP 401 and logged for security audit.

| Field | Strength | Details |
|-------|----------|---------|
| Signature check | MUST | Extract `X-Signature` and `X-Request-ID` headers, call `mp_sdk.signature().validate()` |
| Invalid signature | MUST NOT | Process payment if validation fails; log source IP for forensics |
| Valid signature | MUST | Continue to payment processing (extract payment_id, verify with MP API) |

#### Scenario: Valid Webhook Signature

- GIVEN a POST request to `/api/v1/pagos/webhook` with `X-Signature: ABC123=` and `X-Request-ID: 12345`
- WHEN webhook handler receives payment notification from MercadoPago
- THEN extract both headers and call `mp_sdk.signature().validate(x_request_id, x_signature, raw_body)`
- AND validation passes (returns `True`)
- AND HTTP 200 OK response

#### Scenario: Invalid/Tampered Signature

- GIVEN webhook with `X-Signature: INVALID=` (incorrect signature)
- WHEN webhook handler validates signature
- THEN `mp_sdk.signature().validate()` returns `False`
- AND log warning with source IP: `"[MP Webhook] Invalid signature from {IP}, Payment: {payment_id}"`
- AND HTTP 401 Unauthorized response
- AND NO database changes (payment NOT processed)

#### Scenario: Missing Signature Header

- GIVEN POST to `/api/v1/pagos/webhook` without `X-Signature` header
- WHEN webhook handler checks headers
- THEN treat as invalid signature
- AND return HTTP 401 Unauthorized
- AND log: `"[MP Webhook] Missing X-Signature header from {IP}"`

---

### REQ-BE-002: Automatic Order Confirmation on Approved Payment

**Requirement**

When a webhook confirms payment status "approved", the system MUST atomically transition the associated Pedido from `PENDIENTE` to `CONFIRMADO`, decrement stock for all items, and record the state change—all within a single database transaction (Unit of Work). If any operation fails, the entire transaction MUST rollback.

| Field | Strength | Details |
|-------|----------|---------|
| State transition | MUST | Pedido: `PENDIENTE` → `CONFIRMADO` on webhook approval |
| Stock decrement | MUST | Subtract item quantities from stock within same transaction |
| Atomicity | MUST | All changes commit together or rollback together (UoW pattern) |
| Timestamp | MUST | Set `Pedido.confirmado_en = NOW()`, `Pago.date_approved = webhook.date_approved` |
| Idempotency | MUST | If same `mp_payment_id` processed twice, second request returns 200 OK without re-processing |

#### Scenario: Payment Approved, Stock Available

- GIVEN Pedido #42 with items: [2x Leche (stock: 5), 1x Pan (stock: 10)], estado = `PENDIENTE`
- WHEN webhook delivers `status: "approved"` with `external_reference: 42`
- THEN within UoW transaction:
  - Extract `external_reference` → Pedido 42
  - Call `PedidoService.confirmar_pedido(42)`
  - Pedido.estado_codigo = `CONFIRMADO`
  - Pedido.confirmado_en = NOW()
  - Decrement: Leche stock 5 → 3, Pan stock 10 → 9
  - Create `HistorialEstadoPedido` record with event = `CONFIRMADO`, timestamp
  - Set Pago.mp_status = `"approved"`, Pago.date_approved from webhook
  - Commit all changes
- AND HTTP 200 OK
- AND send confirmation email to customer (async)

#### Scenario: Payment Approved, Stock Exhausted

- GIVEN Pedido #43 with items: [3x Leche (stock: 2)]
- WHEN webhook delivers `status: "approved"`
- THEN UoW detects insufficient stock
- AND entire transaction rollbacks:
  - Pago.mp_status NOT updated
  - Pedido.estado_codigo remains `PENDIENTE`
  - HistorialEstadoPedido NOT created
- AND HTTP 200 OK (idempotent response)
- AND admin notified of stock conflict (log + optional email)

#### Scenario: Payment Rejected

- GIVEN Pedido #44, webhook with `status: "rejected"` and rejection reason
- WHEN webhook handler processes rejected payment
- THEN Pago.mp_status = `"rejected"`
- AND Pedido.estado_codigo remains `PENDIENTE` (no state change)
- AND user can retry with different payment method
- AND HTTP 200 OK

#### Scenario: Duplicate Webhook (Idempotency)

- GIVEN same webhook received twice (same `mp_payment_id`)
- WHEN webhook handler processes second request
- THEN check if Pago record with `mp_payment_id` already exists (unique constraint)
- AND if exists: return HTTP 200 OK, skip processing
- AND if not exists: process normally, insert Pago record
- AND exact state remains consistent (no double-processing)

---

### REQ-BE-003: Preference Creation Endpoint

**Requirement**

The endpoint `POST /api/v1/pagos/crear-preferencia` MUST create a MercadoPago preference with order details, set notification URLs for webhooks, and return the preference ID and checkout URL. The endpoint MUST validate that the Pedido exists and is in `PENDIENTE` state.

| Field | Strength | Details |
|-------|----------|---------|
| Authentication | MUST | Require valid JWT token (user must be authenticated) |
| Pedido validation | MUST | Verify Pedido exists and `estado_codigo == PENDIENTE` |
| Preference data | MUST | Include title, quantity, unit_price (total), currency_id, external_reference, notification_url, back_urls |
| Response | MUST | Return `{ preference_id, init_point, pedido_id }` (init_point is MP checkout URL) |
| CORS | MUST | No HTTP 307 redirects; respond with 201 Created + CORS headers |

#### Scenario: Preference Created Successfully

- GIVEN user authenticated, Pedido #123 with total = 1500.00 ARS, estado = `PENDIENTE`
- WHEN POST `/api/v1/pagos/crear-preferencia` with body `{ pedido_id: 123 }`
- THEN fetch Pedido 123 (validate exists + PENDIENTE state)
- AND create preference_data:
  - `title: "Pedido #123"`
  - `quantity: 1` (whole order)
  - `unit_price: 1500.00`
  - `currency_id: "ARS"`
  - `external_reference: "123"`
  - `notification_url: {backend_webhook_url}` (from config)
  - `back_urls: { success, failure, pending }` (all → `/pago/resultado/123`)
  - `auto_return: "approved"`
- AND call `mp_sdk.preference().create(preference_data)`
- AND extract `preference.id`, `preference.init_point` from response
- AND HTTP 201 Created with response: `{ preference_id, init_point, pedido_id }`

#### Scenario: Pedido Not Found

- GIVEN POST `/api/v1/pagos/crear-preferencia` with `{ pedido_id: 999 }` (doesn't exist)
- WHEN service tries to fetch Pedido 999
- THEN raise `ValidationError("Pedido 999 no encontrado")`
- AND HTTP 404 Not Found

#### Scenario: Pedido Not in PENDIENTE State

- GIVEN Pedido #123 with `estado_codigo = CONFIRMADO` (already paid/confirmed)
- WHEN POST `/api/v1/pagos/crear-preferencia` with `{ pedido_id: 123 }`
- THEN raise `ValidationError("Solo pedidos en estado PENDIENTE pueden ser pagados")`
- AND HTTP 400 Bad Request
- AND prevent preference creation (state guard)

---

### REQ-BE-004: No HTTP 307 Redirects on Routes

**Requirement**

The router MUST use `@router.post("")` (empty string) instead of `@router.post("/")` (trailing slash) to prevent FastAPI from issuing HTTP 307 Temporary Redirect responses. This ensures CORS preflight requests are answered correctly and POST requests complete without redirect.

#### Scenario: POST Without Trailing Slash

- GIVEN endpoint defined as `@router.post("")` on `/api/v1/pagos/crear-preferencia`
- WHEN client sends `POST /api/v1/pagos/crear-preferencia` with `Content-Type: application/json`
- THEN FastAPI responds directly with 201 Created
- AND NO HTTP 307 redirect
- AND response body includes `{ preference_id, init_point }`

#### Scenario: CORS Preflight Request

- GIVEN browser sends `OPTIONS /api/v1/pagos/crear-preferencia`
- WHEN CORS middleware processes preflight
- THEN response includes:
  - `Access-Control-Allow-Origin: {frontend_url}` (from config)
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
- AND HTTP 200 OK (not 307)

---

## Domain: Frontend Checkout (`frontend/src/features/payment`)

### REQ-FE-001: Payment Method Selection and Preference Creation

**Requirement**

When a user selects "Mercado Pago" as payment method on CheckoutPage and clicks confirm, the system MUST create a Pedido, then immediately create a MercadoPago preference, and redirect the user to the MP checkout URL. The button MUST show loading state and be disabled to prevent double-submission.

| Field | Strength | Details |
|-------|----------|---------|
| SDK loading | MUST | Load MP SDK on-demand with public key from env var `VITE_MERCADOPAGO_PUBLIC_KEY` |
| Preference creation | MUST | Call `crearPreferencia(pedido_id)` after Pedido created successfully |
| Redirect | MUST | `window.location.href = init_point` (MP SDK URL) |
| Loading state | MUST | Show "Redirigiendo a Mercado Pago..." and disable button during flow |
| Error handling | MUST | Show toast on failure, re-enable button, allow retry |

#### Scenario: Successful Preference Creation and Redirect

- GIVEN user on CheckoutPage with cart: 2x Leche (500), 1x Pan (300), envío (500), address selected
- WHEN user selects payment method = "Mercado Pago"
- AND clicks "Confirmar Compra"
- THEN show loading: "Redirigiendo a Mercado Pago..."
- AND disable button
- AND call `useCreatePedido()` → POST `/pedidos`
- AND on success, extract `pedido_id = 42`
- AND call `crearPreferencia(42)` → POST `/pagos/crear-preferencia`
- AND on success, extract `init_point = "https://www.mercadopago.com.ar/checkout/v1/..."`
- AND execute `window.location.href = init_point`
- AND user navigates to MP checkout (leaves app)

#### Scenario: Preference Creation Fails (Network Error)

- GIVEN user clicked "Confirmar Compra"
- WHEN `crearPreferencia(42)` fails with network error
- THEN show error toast: "Error al procesar el pago. Intenta de nuevo."
- AND re-enable button
- AND cart preserved (user can retry or select different payment method)

#### Scenario: MP SDK Failed to Load

- GIVEN `import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY` is undefined or invalid
- WHEN CheckoutPage mounts and user selects MP payment
- THEN show error: "Mercado Pago no disponible. Intenta con otra forma de pago."
- AND disable MP option
- AND show alternative options (tarjeta, efectivo)

---

### REQ-FE-002: Payment Result Page

**Requirement**

After user completes payment on MercadoPago and is redirected to `/pago/resultado/:pedido_id`, the system MUST fetch payment status from backend, display appropriate UI badge (✅/⏳/❌/🚫), and auto-poll for updates if payment is pending.

| Field | Strength | Details |
|-------|----------|---------|
| Page route | MUST | Add route `/pago/resultado/:pedido_id` in Router.tsx |
| Initial load | MUST | Show loading spinner: "Verificando estado de tu pago..." |
| Fetch payment | MUST | Call `GET /pagos/:pedido_id` to retrieve payment status |
| Badge display | MUST | Show ✅ PAGADO, ⏳ PENDIENTE, ❌ RECHAZADO, or 🚫 NO PAGADO |
| Polling | MUST | If status pending/in_process, poll every 10s for max 5 minutes |
| Auto-update | MUST | If status changes during polling, update UI immediately |

#### Scenario: Payment Approved (Happy Path)

- GIVEN user redirected to `/pago/resultado/42`
- WHEN PageLoad → GET `/pagos/42` returns `{ mp_status: "approved", total: 1300, items: [...] }`
- THEN show ✅ badge with "¡Tu pago fue aprobado!"
- AND display order summary (items, total, address)
- AND show button "Ver pedido" → `/mis-pedidos/42`
- AND no polling (status terminal)

#### Scenario: Payment Pending (Auto-Polling)

- GIVEN user redirected to `/pago/resultado/42`
- WHEN GET `/pagos/42` returns `{ mp_status: "in_process" }`
- THEN show ⏳ badge with "Tu pago está siendo procesado"
- AND text: "Te enviaremos un email cuando se confirme"
- AND start polling `GET /pagos/42` every 10 seconds
- AND if webhook updates status to "approved":
  - THEN next poll returns new status
  - AND UI auto-updates to ✅ PAGADO
  - AND polling stops
- AND polling stops after 5 minutes (max)

#### Scenario: Payment Rejected

- GIVEN user redirected to `/pago/resultado/42`
- WHEN GET `/pagos/42` returns `{ mp_status: "rejected", reason: "fondos insuficientes" }`
- THEN show ❌ badge with "Tu pago fue rechazado"
- AND display reason: "Razón: fondos insuficientes"
- AND show button "Reintentar" → `/checkout?pedido_id=42`
- AND show button "Ver contacto" → `/soporte`

---

### REQ-FE-003: Environment-Based MP Public Key

**Requirement**

The application MUST read MercadoPago public key from environment variable `VITE_MERCADOPAGO_PUBLIC_KEY` at runtime. The key MUST be used to initialize the MP SDK. If the key is undefined or empty, MP payment method MUST be disabled with clear user messaging.

| Field | Strength | Details |
|-------|----------|---------|
| Env var | MUST | Read `import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY` |
| Validation | MUST | Check if defined and non-empty before SDK init |
| Fallback | MUST | If undefined, disable MP option and show toast |
| No hardcode | MUST NOT | Hardcode TEST or PROD keys in source code |

#### Scenario: Valid TEST Key

- GIVEN `.env`: `VITE_MERCADOPAGO_PUBLIC_KEY=TEST-4cd6aeec-...`
- WHEN app boots and CheckoutPage mounts
- THEN MP SDK initialized with TEST key
- AND checkout works in sandbox mode
- AND MP option available in payment method selector

#### Scenario: Missing Key

- GIVEN `.env` file missing `VITE_MERCADOPAGO_PUBLIC_KEY`
- WHEN app boots
- THEN log warning to console: `"[Payment] VITE_MERCADOPAGO_PUBLIC_KEY not configured"`
- AND disable MP payment option
- AND show toast in checkout: `"Mercado Pago no configurado"`

---

### REQ-FE-004: Order Detail Payment Badge

**Requirement**

When user views an order detail page at `/mis-pedidos/:pedido_id`, the system MUST display a payment status badge with icon, color, and timestamp. If payment is pending, the page MUST auto-refetch payment status every 10 seconds until terminal state.

| Field | Strength | Details |
|-------|----------|---------|
| Badge states | MUST | approved → ✅ PAGADO (green), pending → ⏳ PENDIENTE (yellow), rejected → ❌ RECHAZADO (red), null → 🚫 NO PAGADO (gray) |
| Display | MUST | Show icon, text, color, timestamp: "Pagado el 18 May 2026 14:30" |
| Polling | MUST | If status pending/in_process, refetch every 10 seconds |
| Stop polling | MUST | Stop when status terminal (approved or rejected) |

#### Scenario: Payment Approved Badge

- GIVEN user viewing `/mis-pedidos/42`
- WHEN OrderDetailPage loads and fetches Pago by pedido_id
- AND Pago.mp_status = "approved"
- THEN show badge: ✅ PAGADO (green background)
- AND timestamp: "Pagado el 18 May 2026 14:30"
- AND no polling (status terminal)

#### Scenario: Payment Pending — Auto-Update Via Webhook

- GIVEN user viewing `/mis-pedidos/42`
- WHEN Pago.mp_status = "pending"
- THEN show badge: ⏳ PENDIENTE (yellow background)
- AND start polling `GET /pagos/42` every 10 seconds
- AND when backend webhook updates status to "approved":
  - THEN next poll returns new status
  - AND UI auto-updates to ✅ PAGADO (green)
  - AND polling stops

---

## Domain: Security (`backend/core`, `frontend/shared`)

### REQ-SEC-001: Webhook Source IP Audit Logging

**Requirement**

Every incoming webhook MUST be logged with source IP address for security forensics. If invalid signature or tampering is detected, the log MUST include the suspicious IP for incident response.

| Field | Strength | Details |
|-------|----------|---------|
| Logging | MUST | Log on every webhook: source IP, payment_id, status, timestamp |
| Forensics | MUST | Store IP for post-incident analysis (audit trail) |
| Format | MUST | `"[MP Webhook] Source IP: {IP}, Payment ID: {payment_id}, Status: {status}"` |

#### Scenario: Log Valid Webhook

- GIVEN POST `/api/v1/pagos/webhook` from IP 203.0.113.45
- WHEN webhook processed successfully
- THEN log: `"[MP Webhook] Source IP: 203.0.113.45, Payment ID: 9876543210, Status: approved"`

#### Scenario: Log Invalid Webhook

- GIVEN webhook with invalid signature from IP 192.0.2.99
- WHEN signature validation fails
- THEN log: `"[MP Webhook] Invalid signature from 192.0.2.99, Payment ID: 9876543210"`

---

### REQ-SEC-002: Webhook Idempotency via Unique Constraint

**Requirement**

The system MUST process each webhook exactly once by enforcing a unique constraint on `Pago.mp_payment_id`. If the same payment_id is received twice, the second request MUST return HTTP 200 OK without re-processing (idempotent behavior).

| Field | Strength | Details |
|-------|----------|---------|
| Constraint | MUST | `Pago.mp_payment_id` unique in database |
| Check on insert | MUST | Before processing, check if payment_id exists in Pago table |
| Duplicate handling | MUST | If exists, return 200 OK without state change; if new, process normally |

#### Scenario: First Webhook Processed

- GIVEN webhook with `payment_id: 123456` (not in DB yet)
- WHEN webhook handler processes
- THEN insert Pago record with `mp_payment_id: 123456`
- AND update Pedido state if approved
- AND HTTP 200 OK

#### Scenario: Duplicate Webhook (Idempotent)

- GIVEN same webhook received twice with `payment_id: 123456`
- WHEN second webhook handler runs
- THEN check: does Pago with `mp_payment_id: 123456` exist?
- AND yes → return HTTP 200 OK, skip processing
- AND no database changes on second request
- AND state remains exactly as after first webhook

---

## Acceptance Criteria Summary

| Criteria | Backend | Frontend | Tests |
|----------|---------|----------|-------|
| Webhook signature validated before processing | ✅ | — | Unit + Integration |
| Order confirmed atomically with stock deduction | ✅ | — | Integration + E2E |
| Preference created with correct MP data | ✅ | ✅ | Integration |
| No HTTP 307 redirects on payment endpoints | ✅ | ✅ | E2E |
| Payment result page shows correct badge | — | ✅ | Component + E2E |
| Auto-polling works for pending status | — | ✅ | Component |
| MP public key read from env var | — | ✅ | Integration |
| Webhook idempotency enforced | ✅ | — | Integration |
| Audit log includes source IP | ✅ | — | Unit |

---

## Related Artifacts

- **Design**: `sdd/CH-021/design` (architecture, file changes, interfaces)
- **Tasks**: `sdd/CH-021/tasks` (implementation breakdown)
- **User Stories**: US-070 (Customer Payment Flow), US-071 (Webhook Processing)

---

**Status**: ✅ Complete — Ready for Design Review & Task Breakdown  
**Confidence**: 95% — Covers happy path, edge cases, security, and idempotency  
**Domain Coverage**: Backend (pagos), Frontend (payment features), Security (webhooks)
