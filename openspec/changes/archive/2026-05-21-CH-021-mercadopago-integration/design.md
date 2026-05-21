# CH-021: Technical Design — Complete MercadoPago Integration

## Technical Approach

Build a complete end-to-end payment flow using MercadoPago SDK on the frontend and webhook signature validation on the backend. The design consolidates checkout into a single page, adds a dedicated payment result page for user feedback after MP redirects, and ensures secure webhook processing with idempotency and proper error handling.

**Key insight**: Backend is production-ready. Frontend needs (1) env-based SDK initialization, (2) proper preference creation → redirect flow, (3) payment result page to show feedback, (4) webhook signature validation to prevent tampering.

---

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| **SDK Loading** | Async, on-demand in CheckoutPage | Global provider in App.tsx | Reduces initial load; payment is not always accessed |
| **Preference Timing** | Create on "pay" click, NOT component mount | Prefer-create on mount | Avoids wasted API calls if user cancels; matches MP UX |
| **Redirect Handling** | Back URLs → PaymentResultPage | Client-side polling only | MP auto-redirects user after payment; polling is backup only |
| **Webhook Validation** | MP SDK signature validation | Only DB idempotency | Prevents forgery; cost is ~5ms per webhook (negligible) |
| **Payment Status UI** | Poll every 10s while pending, auto-stop after 5min | Pure polling or no polling | Balances UX (fast feedback) and server load; MP webhook is primary |
| **State Management** | Zustand store (session-only) | Redux or Context | Session-only prevents stale state across logouts; lightweight |
| **Public Key Storage** | Environment variable `VITE_MERCADOPAGO_PUBLIC_KEY` | Hardcoded in component | Allows prod deployment without code changes; prevents key leaks |

---

## Data Flow

### User Perspective: Complete Payment Journey

```
CHECKOUT FLOW

┌─────────────────────────────────────────────────────────────┐
│ 1. User on CheckoutPage, selects "Mercado Pago" payment     │
│    → Click "Confirmar Pago"                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ createPedido Hook   │
        │ POST /pedidos      │
        │ Response: pedido_id│
        └────────┬───────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ crearPreferencia(pedido_id) │
    │ POST /pagos/crear-preferencia│
    │ Returns: init_point (MP URL)│
    └────────┬────────────────────┘
             │
             ▼
   ┌──────────────────────────────┐
   │ window.location = init_point │
   │ (Redirect to MP checkout)    │
   │ User leaves app →            │
   └──────┬───────────────────────┘
          │
          ▼  MP Checkout Page
     ┌────────────────────────┐
     │ User enters card/wallet│
     │ Completes payment      │
     │ (3-10 seconds)         │
     └────────┬───────────────┘
              │
              ├─ Payment: approved/rejected/pending
              │
              ▼  MP Redirects
     ┌──────────────────────────────────┐
     │ back_urls[status] redirect       │
     │ → /pago/resultado/{pedido_id}   │
     │ + params: ?external_reference=id │
     │   &payment_id=123 &status=...    │
     └────────┬─────────────────────────┘
              │
              ▼
    ┌─────────────────────────────────────┐
    │ PaymentResultPage.tsx               │
    │ - Show "Redirigiendo..." loading    │
    │ - GET /pagos/{pedido_id}            │
    │ - Display badge: ✅/⏳/❌/🚫        │
    │ - Auto-poll 10s if pending          │
    └────────┬────────────────────────────┘
             │
             ├─ Status: approved
             │  ▼ "Ver pedido" link
             │  → /mis-pedidos/{pedido_id}
             │
             ├─ Status: pending/in_process
             │  ▼ "Procesando tu pago..."
             │  Auto-poll for updates
             │
             └─ Status: rejected
                ▼ "Tu pago fue rechazado"
                "Reintentar" → back to /checkout
```

### Backend: Webhook Processing

```
WEBHOOK FLOW (Async & Idempotent)

MP Webhook Notification
    ↓
POST /api/v1/pagos/webhook
    ↓
Extract X-Signature header
    ↓
Validate signature with MP SDK
    ├─ Invalid → Log warning, return 401
    └─ Valid ↓
    ↓
Extract payment_id from body
    ↓
Call MP SDK payment().get(payment_id)
    ↓
Extract: status, external_reference, amount
    ↓
UnitOfWork Transaction:
    ├─ Check idempotency (get_by_mp_payment_id)
    │  ├─ Already processed → return 200 (ignore)
    │  └─ New payment ↓
    ├─ Get pedido_id from external_reference
    ├─ Create/update Pago record
    ├─ If status == "approved":
    │  ├─ Call PedidoService.confirmar_pedido()
    │  ├─ Decrement stock (atomic with UoW)
    │  ├─ Pedido: PENDIENTE → CONFIRMADO
    │  └─ Send confirmation email (async)
    ├─ Else if status == "rejected":
    │  └─ Pago.mp_status = "rejected" (no state change)
    └─ Commit transaction
    ↓
Return 200 OK (always, for idempotency)
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/features/payment/pages/CheckoutPage.tsx` | **Modify** | Remove hardcoded TEST key, use env var; fix payment method selector logic; add proper loading state |
| `frontend/src/features/payment/pages/PaymentResultPage.tsx` | **Create** | New page to handle MP redirects, show payment status badge, auto-poll if pending |
| `frontend/src/pages/OrderDetailPage.tsx` | **Modify** | Add payment status badge to order header; auto-refetch payment status on mount if pending |
| `frontend/src/shared/lib/mercadopago.ts` | **Create** | MP SDK utilities: `loadMercadoPagoSDK()`, `initMercadoPago()` with error handling |
| `frontend/src/shared/stores/paymentStore.ts` | **Create** | Zustand store for payment state (session-only, not persisted) |
| `frontend/src/app/Router.tsx` | **Modify** | Add route: `<Route path="/pago/resultado/:pedido_id" element={<PaymentResultPage />} />` |
| `frontend/.env.example` | **Modify** | Update with `VITE_MERCADOPAGO_PUBLIC_KEY` comment |
| `backend/pagos/service.py` | **Modify** | Add signature validation in `procesar_webhook()` before processing |
| `backend/pagos/router.py` | **Keep** | Existing endpoints remain unchanged (routes already correct) |
| `backend/core/config.py` | **Review** | Ensure `MP_WEBHOOK_URL` and `frontend_url` are set correctly |

---

## Interfaces & Contracts

### Frontend: Payment Store (Zustand)

```typescript
// frontend/src/shared/stores/paymentStore.ts

type PaymentStatus = 'idle' | 'creating' | 'processing' | 'success' | 'pending' | 'rejected' | 'error';

export interface PaymentState {
  // State
  pedido_id: number | null;
  preference_id: string | null;
  payment_status: PaymentStatus;
  mp_status: string | null; // 'approved', 'pending', 'rejected'
  error: string | null;
  
  // Actions
  initiate(pedido_id: number): void;
  setPreferenceId(id: string): void;
  setPaymentStatus(status: PaymentStatus): void;
  setMPStatus(status: string): void;
  setError(error: string): void;
  reset(): void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  pedido_id: null,
  preference_id: null,
  payment_status: 'idle',
  mp_status: null,
  error: null,
  
  initiate: (id) => set({ pedido_id: id, payment_status: 'creating' }),
  setPreferenceId: (id) => set({ preference_id: id }),
  setPaymentStatus: (status) => set({ payment_status: status }),
  setMPStatus: (status) => set({ mp_status: status }),
  setError: (error) => set({ error }),
  reset: () => set({
    pedido_id: null,
    preference_id: null,
    payment_status: 'idle',
    mp_status: null,
    error: null,
  }),
}));
```

### Backend: Webhook Signature Validation

```python
# backend/pagos/service.py

async def procesar_webhook(self, webhook_data: dict, 
                          x_signature: str, 
                          x_request_id: str) -> dict:
    """Validate webhook signature before processing."""
    
    # 1. Validate signature (prevents forgery)
    try:
        is_valid = self.mp_sdk.signature().validate(
            x_request_id=x_request_id,
            x_signature=x_signature,
            body=raw_request_body  # Must be raw bytes
        )
        if not is_valid:
            logger.warning(f"Invalid webhook signature from {client_ip}")
            return {"status": "invalid_signature", "code": 401}
    except Exception as e:
        logger.error(f"Signature validation error: {str(e)}")
        return {"status": "error", "code": 400}
    
    # 2. Continue with existing webhook processing
    # (extract payment_id, verify with MP API, update DB, etc.)
```

### Frontend: MP SDK Utilities

```typescript
// frontend/src/shared/lib/mercadopago.ts

export async function loadMercadoPagoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).MercadoPago) {
      resolve(); // Already loaded
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load MP SDK'));
    document.body.appendChild(script);
  });
}

export function initMercadoPago(publicKey: string): void {
  if (!(window as any).MercadoPago) {
    throw new Error('MP SDK not loaded');
  }
  (window as any).MercadoPago(publicKey, { locale: 'es-AR' });
}
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit (Frontend)** | `usePaymentStore` state transitions | Jest snapshots of store mutations |
| **Unit (Backend)** | Signature validation logic | Mock MP SDK, test valid/invalid signatures |
| **Integration (Frontend)** | CheckoutPage → PaymentResultPage flow | TanStack Query mocking with MSW |
| **Integration (Backend)** | `procesar_webhook()` with UoW | Test idempotency (same payment_id twice), state transitions |
| **E2E** | Full flow with MP test account | Ngrok + MP sandbox; simulate payment → webhook → redirect |
| **Security** | Webhook signature spoofing | Attempt invalid signature, verify 401 response |

---

## Migration / Rollout

**No migration required.** This is a new feature layer on top of existing backend.

**Rollout steps**:
1. Deploy backend changes (webhook signature validation)
2. Deploy frontend changes (CheckoutPage fix, PaymentResultPage, utilities)
3. Verify env vars are set correctly (TEST keys in staging, PROD keys in production)
4. Test full flow with MP test account
5. Monitor webhook logs for errors

**Rollback plan**:
- Revert commits (git revert)
- Restore previous `.env` values
- Clear browser cache (MP SDK might be cached)
- Monitor logs for webhook errors

---

## Performance Considerations

- **SDK Loading**: Async on-demand; non-blocking
- **Polling**: 10s intervals with exponential backoff; max 5 minutes
- **Webhook Processing**: O(1) DB queries (idempotency check), atomic transaction
- **No N+1**: Single pedido query per webhook, no nested loops
- **Cache**: MP SDK cached in global window object after first load

---

## Security Decisions

### Why Signature Validation?
- Prevents forgery attacks (attacker sends false "approved" webhook)
- MP SDK provides built-in validation
- Cost: ~5ms per webhook (negligible)

### Why Back URLs Over Pure Polling?
- MP redirects user automatically after payment
- User gets immediate feedback (better UX)
- Polling is backup for cases where redirect fails

### Why NOT Hardcode TEST Key?
- Allows prod deployment without code changes (12-factor app)
- Reduces risk of TEST→PROD key leaks
- ENV-based secrets are the standard

---

## Open Questions

- [ ] Should we implement payment method selection UI (card vs wallet) or use MP's default?
  - **Recommendation**: Use MP's default (simpler, MP handles rendering)
- [ ] Do we need idempotency for `crear_preferencia` endpoint (duplicate requests)?
  - **Recommendation**: Yes, cache by `(usuario_id, pedido_id)` to prevent duplicate preferences

---

## Related Artifacts

- **Proposal**: `sdd/CH-021/proposal` (what + why + scope)
- **Specs**: `sdd/CH-021/spec` (requirements + scenarios, if created)
- **Tasks**: `sdd/CH-021/tasks` (implementation breakdown)

---

**Confidence**: 95% — Backend is solid, frontend needs consolidation + new page. No architectural surprises.  
**Estimated Effort**: 8-10 hours (4 frontend files + 1 backend modification + tests)  
**Risk**: Low — isolated feature layer, no DB changes
