# E2E Manual Test: Full Payment Flow (Task 4.5)

## Prerequisites

| Requirement | How To |
|-------------|--------|
| PostgreSQL running | `docker start food-store-db` or local PG |
| Backend server | `uvicorn backend.main:app --reload` (port 8000) |
| Frontend dev server | `pnpm dev` (port 5173) |
| ngrok tunnel (webhook) | `ngrok http 8000` → copy HTTPS URL |
| MP_ACCESS_TOKEN | Set in `backend/.env` from MercadoPago Dev Dashboard |
| VITE_MERCADOPAGO_PUBLIC_KEY | Set in `frontend/.env` (TEST key from MP dashboard) |
| MP_WEBHOOK_URL | `backend/.env`: set to `https://{ngrok-id}.ngrok-free.app/api/v1/pagos/webhook` |

## Step-by-Step Flow

### 1. Browse Catalog
1. Open `http://localhost:5173` in browser
2. Navigate to catalog page → products are displayed

### 2. Add Items to Cart
3. Click a product → see detail page
4. Select quantity → click "Agregar al Carrito"
5. Verify badge counter increments
6. Repeat for 2-3 products

### 3. Go to Checkout
7. Click cart icon → CartPage shows items with totals
8. Click "Finalizar Compra" → redirected to checkout
9. Verify: order summary shows items, quantities, prices, total
10. Verify: address form is visible (if direcciones feature is active)

### 4. Select MercadoPago Payment
11. In checkout, select "MercadoPago" as payment method
12. Click "Confirmar Compra"
13. Verify: loading state appears ("Redirigiendo a Mercado Pago...")
14. Verify: redirected to MercadoPago sandbox checkout page

### 5. Simulate Payment in MP Sandbox
15. On MP sandbox page, you'll see the order total
16. **For approved**: Use test card `5031 7557 3453 0604` with any future expiry and any CVC
17. **For rejected**: Use test card `5031 7557 3453 0604` and enter CVC `999` (or use `pending` card)
18. Complete the MP checkout flow

### 6. Webhook Processing (Automatic)
19. After payment, MP sends webhook to `{ngrok-url}/api/v1/pagos/webhook`
20. Backend validates the `X-Signature` header
21. If valid → processes the payment:
    - Verifies `external_reference` matches `pedido_id`
    - If `status = "approved"`:
      - Transitions Pedido from `PENDIENTE` → `CONFIRMADO`
      - Decrements stock for all items atomically
      - Creates `Pago` record with `date_approved`
      - Creates `HistorialEstadoPedido` entry
    - If `status = "rejected"`:
      - Sets `Pago.mp_status = "rejected"`
      - Pedido stays `PENDIENTE` (user can retry)
22. Verify in backend logs: `[MP Webhook]` prefix with source IP and payment_id

### 7. User Redirected to Result Page
23. After MP flow, user is redirected to `/pago/resultado/{pedido_id}`
24. **If approved**: ✅ Green badge "¡Tu pago fue aprobado!"
25. **If rejected**: ❌ Red badge "Tu pago fue rechazado" + reason + "Reintentar" button
26. **If pending**: ⏳ Yellow badge with polling indicator

### 8. Verify Order Detail
27. Click "Ver pedido" → redirected to `/mis-pedidos/{pedido_id}`
28. Verify payment badge in header:
    - ✅ "PAGADO" (green) for approved
    - ❌ "RECHAZADO" (red) for rejected
    - ⏳ "PENDIENTE" (yellow) for pending
29. Verify order items, total, timestamps correct

### 9. Verify Database State (Optional)
30. Connect to PostgreSQL: `psql -d food_store`
31. Run these queries:
    ```sql
    -- Check pedido estado
    SELECT id, estado, total FROM pedidos WHERE id = {pedido_id};

    -- Check payment record
    SELECT * FROM pagos WHERE pedido_id = {pedido_id};

    -- Check stock decremented
    SELECT p.nombre, pi.stock_original, pi.stock_actual
    FROM pedido_items pi
    JOIN productos p ON p.id = pi.producto_id
    WHERE pi.pedido_id = {pedido_id};

    -- Check historial
    SELECT * FROM historial_estado_pedido
    WHERE pedido_id = {pedido_id}
    ORDER BY creado_en;
    ```

## Test Scenarios Matrix

| Scenario | Card Used | Expected Result |
|----------|-----------|-----------------|
| Approved payment | `5031 7557 3453 0604` (any CVC) | Pedido → CONFIRMADO, stock decremented, ✅ badge |
| Rejected payment | `5031 7557 3453 0604` (CVC 999) | Pedido stays PENDIENTE, ❌ badge, retry available |
| Pending payment (if available) | Use MP pending test card | ⏳ badge, polling every 10s |
| Invalid signature | Tamper `X-Signature` header | 401 returned, no DB changes |
| Duplicate webhook | Send same webhook twice | First 200 (processed), second 200 (idempotent) |
| Missing env vars | Remove `MP_ACCESS_TOKEN` | Backend startup fails with clear error |
| Expired/empty cart | Try checkout without items | Cart page shows empty state |

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 307 redirect on OPTIONS | Missing trailing slashes in router | Check router.py paths (no leading slash) |
| Webhook returns 401 | Invalid or missing X-Signature | Verify ngrok URL in MP dashboard settings |
| Payment not processed | Webhook not reaching backend | Check ngrok tunnel is active |
| Stock not decremented | UoW rollback due to error | Check backend logs for SQL errors |
| "MercadoPago no disponible" | SDK load failed | Check internet, verify CDN URL in mercadopago.ts |
| Blank checkout page | MP public key missing | Verify `VITE_MERCADOPAGO_PUBLIC_KEY` in `.env` |

## Test Completion Criteria

- [ ] User can browse catalog and add items to cart
- [ ] Checkout shows order summary and MP payment option
- [ ] Redirect to MP sandbox checkout works
- [ ] Approved payment: order confirmed, stock decremented, badge shows PAGADO
- [ ] Rejected payment: order stays PENDIENTE, badge shows RECHAZADO
- [ ] Pending payment: polling works, badge updates on status change
- [ ] Webhook signature validation works (valid → 200, invalid → 401)
- [ ] Idempotency: duplicate webhook doesn't double-process
- [ ] Database state matches expectations
