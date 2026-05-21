# Tasks: CH-021 — Complete MercadoPago Integration

## Overview

| Phase | Tasks | Focus | Hours |
|-------|-------|-------|-------|
| 1: Setup | 1.1-1.2 | Environment config + SDK verification | 1-2 |
| 2: Backend | 2.1-2.4 | Webhook validation + order confirmation + endpoints | 3-4 |
| 3: Frontend | 3.1-3.6 | MP utilities + store + checkout + result page + routes | 5-6 |
| 4: Testing | 4.1-4.6 | Unit + integration + E2E + linting | 3-4 |
| **TOTAL** | **14 tasks** | **Complete MP flow** | **12-16 hours** |

---

## Phase 1: Setup & Environment (1-2 hours)

- [x] **1.1 Configure Environment Variables**
  - Update `backend/.env`: Add `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_URL` from MercadoPago dev console
  - Update `frontend/.env`: Add `VITE_MERCADOPAGO_PUBLIC_KEY=TEST-{key}` (test token)
  - Update `frontend/.env.example`: Document all MP env vars with placeholders
  - Verify backend starts: `python -m uvicorn backend.main:app --reload` (no env errors)
  - Verify frontend starts: `npm run dev` (no env errors)
  - **Done**: Both services start cleanly; env vars present and readable

- [x] **1.2 Verify SDK Installation**
  - Check `backend/requirements.txt` has `mercadopago>=2.0.0`
  - Check `frontend/package.json` has MP SDK (or script injection method documented)
  - Run in backend venv: `pip list | grep mercadopago` → confirms installed
  - Test backend import: `python -c "import mercadopago; print('OK')"`
  - Test CORS preflight: `curl -X OPTIONS http://localhost:8000/api/v1/pagos/webhook -H "Origin: http://localhost:5173"` → 200 OK
  - **Done**: SDK importable; CORS preflight returns 200 (no 307)

---

## Phase 2: Backend Implementation (3-4 hours)

- [x] **2.1 Add Webhook Signature Validation** (1.5 hours)
  - File: `backend/pagos/service.py`, method `procesar_webhook()` (around line 102)
  - Add import: `from mercadopago import mercadopago`
  - BEFORE payload processing:
    - Extract headers: `x_signature = request.headers.get("X-Signature")`
    - Extract headers: `x_request_id = request.headers.get("X-Request-ID")`
    - Extract source IP: `client_ip = request.client.host`
    - Get raw body (must be bytes, not parsed JSON)
    - Call: `is_valid = self.mp_sdk.signature().validate(x_request_id, x_signature, body_bytes)`
    - If NOT valid: log warning + return 401 Unauthorized
    - If valid: continue to rest of webhook handling
  - Update all log statements: add `[MP]` prefix and include source IP + payment_id
  - **Done**:
    - ✅ Valid signature passes through (test with valid MP webhook)
    - ✅ Invalid signature returns 401 (test with tampered signature)
    - ✅ Missing signature header returns 401
    - ✅ Logs include `[MP]`, source IP, payment_id

- [x] **2.2 Fix CORS Routes (Webhook & Payment Endpoints)** (0.5 hours)
  - File: `backend/pagos/router.py`
  - Review line ~48: `@router.get("/webhook", ...)` → change to `@router.get("webhook")` (no leading slash)
  - Review line ~81: `@router.post("/webhook", ...)` → change to `@router.post("webhook")` (no leading slash)
  - Review line ~22: `@router.post("/crear-preferencia", ...)` → change to `@router.post("crear-preferencia")` (no leading slash)
  - Test curl: `curl -X OPTIONS http://localhost:8000/api/v1/pagos/webhook -H "Access-Control-Request-Method: POST" -H "Origin: http://localhost:5173"` → **200 OK** (not 307)
  - Test POST: `curl -X POST http://localhost:8000/api/v1/pagos/crear-preferencia` → **200/201** (not 307)
  - **Done**:
    - ✅ OPTIONS returns 200 (not 307)
    - ✅ POST returns 200/201 (not 307)
    - ✅ CORS headers present in response

- [x] **2.3 Verify Preference Creation Logic** (1 hour)
  - File: `backend/pagos/service.py`, method `crear_preferencia()` (around line 38-79)
  - Review preference_data structure:
    - ✅ `title: f"Pedido #{pedido.id}"`
    - ✅ `quantity: 1` (whole order, not itemized)
    - ✅ `currency_id: "ARS"`
    - ✅ `unit_price: float(pedido.total)` (includes envío, taxes)
    - ✅ `external_reference: str(pedido.id)`
    - ✅ `back_urls`: success, failure, pending all redirect to `/pago/resultado/{pedido_id}`
    - ✅ `auto_return: "approved"`
  - Verify back_urls use `settings.frontend_url` from config (not hardcoded)
  - Test with curl: `curl -X POST http://localhost:8000/api/v1/pagos/crear-preferencia -H "Authorization: Bearer {JWT_TOKEN}" -H "Content-Type: application/json" -d '{"pedido_id": 1}'` → **201** with `{ preference_id, init_point, sandbox_init_point }`
  - **Done**:
    - ✅ Preference creation returns 201
    - ✅ Response includes preference_id and init_point (MP checkout URL)
    - ✅ Preference created in MP sandbox environment (verify in MP dashboard)

- [x] **2.4 Verify Order Confirmation FSM** (1 hour)
  - File: `backend/pagos/service.py`, method `procesar_webhook()` (around line 165-177)
  - Review webhook handling for `status == "approved"`:
    - ✅ Calls `PedidoService.confirmar_pedido(pedido_id, uow)`
    - ✅ Happens within UnitOfWork transaction (atomic)
    - ✅ Stock decremented for all items
    - ✅ Pedido state: PENDIENTE → CONFIRMADO
    - ✅ `HistorialEstadoPedido` record created with timestamp
    - ✅ `Pago.date_approved = webhook.date_approved`
  - Test idempotency: Simulate same webhook twice
    - First: Pedido transitions to CONFIRMADO, stock decremented
    - Second: Returns 200 OK, no state change (idempotent)
  - **Done**:
    - ✅ Confirmed pedido exists with CONFIRMADO estado
    - ✅ Stock decremented correctly in productos table
    - ✅ HistorialEstadoPedido shows CONFIRMADO with timestamp
    - ✅ Duplicate webhook returns 200 without re-processing

---

## Phase 3: Frontend Implementation (5-6 hours)

- [x] **3.1 Create MP SDK Utilities** (1 hour)
  - New file: `frontend/src/shared/lib/mercadopago.ts`
  - Implement `loadMercadoPagoSDK(): Promise<void>`
    - Inject `<script src="https://sdk.mercadopago.com/js/v2" async>`
    - Resolve when `window.MercadoPago` available (or timeout after 5s)
    - Reject with descriptive error on failure
  - Implement `initMercadoPago(publicKey: string): void`
    - Call `window.MercadoPago.setPublishableKey(publicKey)`
    - Throw if SDK not loaded
  - Error handling: Custom error types for dev debugging
  - **Done**:
    - ✅ `npm run build` compiles without errors
    - ✅ In browser: `window.MercadoPago` defined after `loadMercadoPagoSDK()` resolves
    - ✅ No TypeScript errors

- [x] **3.2 Create Payment Store (Zustand)** (0.5 hours)
  - New file: `frontend/src/shared/stores/paymentStore.ts`
  - Define store with state + actions:
    - State: `pedido_id`, `preference_id`, `payment_status`, `mp_status`, `error`
    - Actions: `initiate()`, `setPreferenceId()`, `setPaymentStatus()`, `setMPStatus()`, `setError()`, `reset()`
  - Session-only (no localStorage persistence, to avoid stale state)
  - Clear on logout (if applicable)
  - **Done**:
    - ✅ Store exports via `export const usePaymentStore = create<State>(...)`
    - ✅ `npm run build` compiles with TS strict mode passing

- [x] **3.3 Update CheckoutPage with MP Integration** (1.5 hours)
  - File: `frontend/src/features/payment/pages/CheckoutPage.tsx`
  - Replace hardcoded TEST key with: `import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY`
  - Add error handling: if `VITE_MERCADOPAGO_PUBLIC_KEY` undefined, disable MP option + show message
  - When MP selected and "Confirmar Compra" clicked:
    - Show loading: "Redirigiendo a Mercado Pago..."
    - Disable button
    - Call `useCreatePedido()` → POST `/api/v1/pedidos` → get `pedido_id`
    - Call `crearPreferencia(pedido_id)` → POST `/api/v1/pagos/crear-preferencia` → get `init_point`
    - Execute: `window.location.href = init_point` (redirect to MP)
  - Handle errors: show toast, re-enable button, allow retry
  - Keep form payment method selector (efectivo, tarjeta, mercadopago)
  - **Done**:
    - ✅ No hardcoded MP keys in source code
    - ✅ MP redirect flow works in browser
    - ✅ `npm run build` compiles, 0 TS errors
    - ✅ Loading state shows + button disabled during flow

- [x] **3.4 Create PaymentResultPage** (1.5 hours)
  - New file: `frontend/src/features/payment/pages/PaymentResultPage.tsx`
  - Route: `/pago/resultado/:pedido_id` (add in Router.tsx in task 3.6)
  - Component structure:
    - Extract `pedido_id` from URL params
    - On mount: fetch payment status via `GET /api/v1/pagos/{pedido_id}`
    - Show loading spinner: "Verificando estado de tu pago..."
    - Based on `mp_status`:
      - `"approved"` → ✅ Green badge, "¡Tu pago fue aprobado!", button "Ver pedido"
      - `"pending"` / `"in_process"` → ⏳ Yellow badge, "Tu pago está siendo procesado", start polling
      - `"rejected"` → ❌ Red badge, "Tu pago fue rechazado", show reason, button "Reintentar"
      - `null` → 🚫 Gray badge, "No pagado"
    - Polling logic (if pending):
      - GET `/api/v1/pagos/{pedido_id}` every 10 seconds
      - Stop after 5 minutes OR when status terminal (approved/rejected)
      - Auto-update UI when status changes
    - Order summary: show items, total, address, timestamps
    - Navigation buttons: "Ver pedido" → `/mis-pedidos/{id}`, "Reintentar" → `/checkout`, "Soporte" → `/contacto`
  - Use existing premium SaaS theme colors/components
  - **Done**:
    - ✅ Page renders at `/pago/resultado/{pedido_id}`
    - ✅ Shows correct status badge with color + icon + text
    - ✅ Polling works for pending status (verify in DevTools Network tab)
    - ✅ Buttons navigate correctly
    - ✅ Order summary displayed

- [x] **3.5 Update OrderDetailPage with Payment Badge** (1 hour)
  - File: `frontend/src/pages/OrderDetailPage.tsx`
  - On mount: fetch payment status:
    - Import hook: `import { usePago } from '@/features/payment/hooks/usePago'` (or use TanStack Query)
    - Call: `const { data: pago } = usePago.getByPedido(pedido_id, { refetchInterval: pago?.mp_status === 'pending' ? 10000 : false })`
  - Render badge in order header with state-based styling:
    - `pago?.mp_status === "approved"` → ✅ **PAGADO** (green background, checkmark icon)
    - `pago?.mp_status === "pending"` → ⏳ **PENDIENTE** (yellow background, hourglass icon)
    - `pago?.mp_status === "rejected"` → ❌ **RECHAZADO** (red background, X icon)
    - `!pago` → 🚫 **NO PAGADO** (gray background, dash icon)
  - Show timestamp: "Pagado el 18 May 2026 14:30"
  - Auto-refetch every 10s if status is pending (use `refetchInterval`)
  - **Done**:
    - ✅ Badge renders on order detail
    - ✅ Color, icon, text correct for each status
    - ✅ Auto-refetch works (verify in DevTools Network every 10s if pending)
    - ✅ Badge updates when status changes

- [x] **3.6 Add Routes & Update Configuration** (0.5 hours)
  - File: `frontend/src/app/Router.tsx` (or route config)
  - Add route:
    ```typescript
    {
      path: '/pago/resultado/:pedido_id',
      element: <PaymentResultPage />,
      errorElement: <ErrorPage />
    }
    ```
  - File: `frontend/.env.example`
    - Add: `VITE_MERCADOPAGO_PUBLIC_KEY=TEST-4cd6aeec-bd3d-461c-90e2-76e470617387` (example TEST key)
    - Add comment: `# MercadoPago public key (TEST for sandbox, PROD for production)`
  - Verify no import errors in Router.tsx
  - **Done**:
    - ✅ Route accessible in browser
    - ✅ `.env.example` updated with MP key placeholder
    - ✅ Router compiles without errors

---

## Phase 4: Testing (3-4 hours)

- [ ] **4.1 Backend Unit Tests — Webhook Signature Validation** (1 hour)
  - File: `backend/tests/test_pagos_webhook.py` (new or extend existing)
  - Tests to write:
    - `test_webhook_valid_signature()`: Mock `mp_sdk.signature().validate()` → True; POST webhook → 200 OK
    - `test_webhook_invalid_signature()`: Mock validate → False; POST webhook → 401 Unauthorized, NO DB changes
    - `test_webhook_missing_signature_header()`: POST without `X-Signature` header → 401
    - `test_webhook_logs_source_ip()`: Verify log includes source IP in format `[MP Webhook] ...`
  - Use pytest fixtures for webhook payloads
  - Mock `mp_sdk` with `unittest.mock.patch`
  - **Done**: All 4 tests pass via `pytest backend/tests/test_pagos_webhook.py`

- [ ] **4.2 Backend Integration Tests — Payment FSM & Idempotency** (1 hour)
  - File: `backend/tests/test_pedidos_payment_fsm.py` (new or extend existing)
  - Tests to write:
    - `test_payment_approved_pedido_confirmed()`: Create PENDIENTE pedido → webhook "approved" → CONFIRMADO + stock decremented
    - `test_payment_approved_stock_exhausted()`: 3x Item (stock=1) → webhook approved → UoW rollback, pedido PENDIENTE, stock unchanged
    - `test_payment_rejected_pedido_unchanged()`: webhook "rejected" → Pago.mp_status="rejected", Pedido stays PENDIENTE
    - `test_webhook_idempotency()`: Send same webhook twice → first returns 200, second returns 200, no double-processing
  - Use database fixtures (fresh DB or rollback after each test)
  - **Done**: All 4 tests pass via `pytest backend/tests/test_pedidos_payment_fsm.py -v`

- [ ] **4.3 Frontend Unit Tests — Payment Store** (0.5 hours)
  - File: `frontend/src/features/payment/__tests__/paymentStore.test.ts`
  - Tests to write:
    - `test_initiate_sets_pedido_id_and_status()`: `initiate(42)` → state has `pedido_id=42, payment_status='creating'`
    - `test_setPreferenceId_updates_state()`: `setPreferenceId('pref_123')` → state has `preference_id='pref_123'`
    - `test_reset_clears_all_state()`: Call `reset()` → all fields back to defaults
    - `test_store_session_only()`: Verify no localStorage writes (session-only)
  - **Done**: All 4 tests pass via `npm run test -- paymentStore`

- [ ] **4.4 Frontend Integration Tests — Checkout & Payment Flow** (1 hour)
  - File: `frontend/src/features/payment/__tests__/paymentFlow.integration.test.tsx`
  - Setup: MSW mock handlers for:
    - `POST /api/v1/pedidos` → 201 with `{ id: 42, ... }`
    - `POST /api/v1/pagos/crear-preferencia` → 201 with `{ preference_id, init_point: "https://mp.checkout..." }`
    - `GET /api/v1/pagos/{id}` → 200 with payment status
  - Tests to write:
    - `test_checkout_mp_success()`: Render CheckoutPage, select MP, click confirm → `crearPreferencia` called, init_point extracted (mock redirect)
    - `test_payment_result_approved_status()`: Render PaymentResultPage with pedido_id → mock GET returns approved → ✅ badge shown
    - `test_payment_result_pending_polling()`: PageResult with pending → verify polling starts (mock advancing time with Jest timers)
    - `test_mp_sdk_load_error()`: SDK fails to load → show "Mercado Pago no disponible"
  - **Done**: All 4 tests pass via `npm run test -- paymentFlow`

- [ ] **4.5 E2E Tests — Full Payment Flow (Manual or Playwright)** (1 hour)
  - Setup:
    - Backend running: `python -m uvicorn backend.main:app --reload`
    - Frontend running: `npm run dev`
    - ngrok tunnel: `ngrok http 8000` (expose localhost:8000 to public URL for webhook testing)
    - Update `backend/.env`: `MP_WEBHOOK_URL=https://your-ngrok-url/api/v1/pagos/webhook`
  - Manual E2E steps:
    1. User → Catalogo → Add items to cart
    2. → Checkout → Select MercadoPago → "Confirmar Compra"
    3. → Redirect to MP sandbox checkout page
    4. Simulate payment in MP dashboard: approve payment
    5. → Webhook arrives at backend (ngrok tunnel)
    6. Backend processes: signature validated, order confirmed, stock decremented
    7. → MP redirects user to `/pago/resultado/{pedido_id}`
    8. → PaymentResultPage shows ✅ "Tu pago fue aprobado"
    9. Click "Ver pedido" → OrderDetailPage shows ✅ PAGADO badge
  - OR use Playwright with headless browser (optional)
  - **Done**:
    - ✅ Full flow works end-to-end
    - ✅ Webhook signature validated successfully
    - ✅ Order confirmed and stock decremented
    - ✅ Payment badge shows in order detail

- [ ] **4.6 Linting, Type Checking & Build Verification** (0.5 hours)
  - Backend:
    - Run: `pylint backend --disable=all --enable=E,F` (errors + fatal only)
    - Run: `mypy backend --strict` (type checking)
    - Run: `python -m pytest backend/tests -q` (all tests)
    - Fix all errors
  - Frontend:
    - Run: `npm run lint` (ESLint)
    - Run: `npm run type-check` (TypeScript)
    - Run: `npm run test` (Jest)
    - Run: `npm run build` (full build)
    - Fix all errors and warnings
  - **Done**:
    - ✅ Backend: 0 linting errors, 0 type errors, all tests pass
    - ✅ Frontend: 0 ESLint errors, 0 TS errors, all tests pass
    - ✅ `npm run build` succeeds with no warnings
    - ✅ No new console errors or deprecation warnings

---

## Implementation Order & Dependencies

1. **Phase 1 first** (Setup) — Unblocks all later phases
2. **Phase 2 next** (Backend) — Must be done before frontend can test
3. **Phase 3 parallel** (Frontend) — Can work in parallel with Phase 2 after 2.3
4. **Phase 4 last** (Testing) — Can write tests in parallel with implementation

### Critical Path
```
1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.3 → [3.2, 3.4, 3.5 parallel] → 3.6 → 4.1-4.6
```

### Parallelizable Tasks
- **2.3 & 3.x**: Backend preference endpoint can be tested independently from frontend
- **3.2 & 3.4 & 3.5**: Frontend store, result page, and order detail badge can be built in parallel
- **4.1-4.6**: Tests can be written as code is implemented

---

## Definition of Done (Overall)

- ✅ All 14 tasks completed and marked as done
- ✅ `npm run build` succeeds
- ✅ `pytest backend/tests -q` passes (all tests)
- ✅ `npm run test` passes (all frontend tests)
- ✅ E2E manual flow verified (user → checkout → payment → redirect → confirmation)
- ✅ No linting errors or TypeScript errors
- ✅ Webhook signature validation working
- ✅ Order confirmed atomically with stock decremented
- ✅ Payment badges display correctly in order detail
- ✅ Polling works for pending payment status
- ✅ All 14 commits pushed (one per task, conventional format)

---

**Status**: Ready for Implementation  
**Estimated Duration**: 12-16 hours  
**Phases**: 4 (Setup → Backend → Frontend → Testing)  
**Task Count**: 14  
**Confidence**: 95% (dependencies clear, file changes specific, done criteria concrete)
