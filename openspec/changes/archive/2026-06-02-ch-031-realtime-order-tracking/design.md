# Design: CH-031 — Real-Time Order Tracking

## Context

**Current state:**
- Customers can view their orders at `/mis-pedidos/:id` via a static `OrderDetailPage` that fetches data once via TanStack Query
- No live updates — customer must refresh to see status changes
- Backend has WebSocket infrastructure (`WebSocketManager` singleton + KDS endpoint at `WS /api/v1/cocina/ws`) but it broadcasts globally to all kitchen clients
- `Pedido` model has `creado_en` / `actualizado_en` but **no per-status timestamps** — the `HistorialEstadoPedido` table tracks state transitions but doesn't record structured per-status timestamps on the order itself
- `PedidoService.transicionar_estado()` already broadcasts events to KDS WebSocket

**Why we need design:**
- Cross-cutting: touches backend model + WebSocket + frontend components
- New WebSocket architecture for per-user/per-order tracking (different from KDS global broadcast)
- Database migration for timestamp fields
- WebSocket auth with per-order ownership validation

## Goals / Non-Goals

**Goals:**
- Add per-status timestamps to `Pedido` model (`confirmado_en`, `en_preparacion_en`, `listo_en`, `en_camino_en`, `entregado_en`)
- Create per-order WebSocket endpoint at `WS /api/v1/pedidos/{pedido_id}/track` with ownership validation
- Enhance `PedidoService` to emit targeted events to customer WebSocket on state transitions
- Build `OrderTimeline` component with visual progress (horizontal on desktop, vertical on mobile)
- Show ETA (estimated time of arrival) based on current state
- Toast notifications on every status change
- Fallback polling (5s interval) if WebSocket fails
- Auto-reconnect with exponential backoff (1s → 2s → 5s → 10s → max 30s)

**Non-Goals:**
- Driver location tracking (future)
- Push notifications to phone (future)
- BroadcastChannel cross-tab sync (out of scope for this change)
- Multi-instance WebSocket support (no Redis — same limitation as CH-023)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Backend (FastAPI)                            │
│                                                                      │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ PedidoService │───>│ WebSocketManager │───>│ KDS WS (cocina)  │   │
│  │ (transitions) │    │   (global)       │    │ /api/v1/cocina/ws│   │
│  └──────┬───────┘    └──────────────────┘    └──────────────────┘   │
│         │                                                           │
│         │           ┌─────────────────────┐                         │
│         └──────────>│ OrderTracker         │                         │
│                     │  (per-order pub/sub) │                         │
│                     │  pedido_id -> set[]  │                         │
│                     └──────────┬──────────┘                         │
│                                │                                      │
│                     ┌──────────▼──────────┐                         │
│                     │ WS /pedidos/{id}/track│                        │
│                     └──────────┬──────────┘                         │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Frontend (React)       │
                    │                          │
                    │  ┌──────────────────┐    │
                    │  │ OrderTrackingPage │    │
                    │  │ /mis-pedidos/:id  │    │
                    │  └────────┬─────────┘    │
                    │           │               │
                    │  ┌────────▼─────────┐    │
                    │  │  useOrderWebSocket│    │
                    │  │  (WS + fallback)  │    │
                    │  └────────┬─────────┘    │
                    │           │               │
                    │  ┌────────▼─────────┐    │
                    │  │  OrderStore       │    │
                    │  │  (Zustand)        │    │
                    │  └──────────────────┘    │
                    └──────────────────────────┘
```

## Decisions

### D1: Per-order WebSocket tracker (separate from KDS broadcast)

**Decision:** Create an `OrderTracker` class that manages per-order WebSocket connections.

**Rationale:**
- The existing `WebSocketManager` broadcasts to ALL clients — unsuitable for customer-specific tracking
- A separate tracker with `{pedido_id: set[WebSocket]}` mapping allows targeted delivery
- When `PedidoService.transicionar_estado()` executes a transition, it broadcasts to:
  1. KDS WebSocket (existing `websocket_manager.broadcast_event`)
  2. Customer tracker (`order_tracker.send_to_order(pedido_id, event)`)

**Alternatives considered:**
- Filter on client side (connect all customers to global WS) → rejected for privacy and bandwidth concerns
- Reuse `WebSocketManager` with channels → rejected: would require modifying the existing working KDS code

### D2: Timestamps on Pedido model (not just HistorialEstadoPedido)

**Decision:** Add `confirmado_en`, `en_preparacion_en`, `listo_en`, `en_camino_en`, `entregado_en` as nullable `datetime` fields on `Pedido`.

**Rationale:**
- UX needs: ETA calculation, delivery time display, timeline rendering
- Query performance: one read on the order row instead of scanning `HistorialEstadoPedido`
- The order row already has `creado_en`; adding per-status timestamps is consistent

**When they're set:** Each field is set at the moment the corresponding state transition is processed in `PedidoService.transicionar_estado()`. This is inside the UnitOfWork so it's atomic with the state change.

### D3: ETA strategy — simple time-based estimation

**Decision:** Calculate ETA based on current state + configurable time estimates:
- `CONFIRMADO` or `EN_PREPARACION`: `creado_en + 30 min` (or `estimated_ready_at` if backend provides it)
- `LISTO` or `EN_CAMINO`: current time + 20 min
- `ENTREGADO`: show `entregado_en` + total delivery time

**Rationale:**
- No queue position data available currently — would require CH-032 analytics
- Simple strategy is honest and avoids overpromising
- The UI displays a range ("20-30 min") rather than exact time to manage expectations

### D4: WebSocket auth via query parameter token

**Decision:** Follow the same pattern as the KDS WebSocket — JWT token passed as `?token=<JWT>` query parameter.

**Rationale:**
- WebSocket API doesn't support custom headers in browser
- Consistent with existing `WS /api/v1/cocina/ws` pattern
- On connection, validate: (1) token is valid JWT, (2) user ID from token matches `pedido.usuario_id`
- If either check fails: close with code 4001 (unauthorized)

### D5: Toast notifications via Zustand store

**Decision:** Create a lightweight toast store in Zustand (or reuse existing UI store) for status change notifications.

**Rationale:**
- Avoids adding a toast library dependency
- Zustand is already in the project
- Toasts are simple: type (`info`/`success`), message, duration (5s)
- No need for TanStack Query here — toasts are UI-only state

## Components

### Backend

#### `backend/core/order_tracker.py` (NEW)
- **Responsibility:** Per-order WebSocket pub/sub
- **Structure:**
  ```python
  class OrderTracker:
      _orders: dict[int, set[WebSocket]]  # pedido_id -> connections
      
      async def connect(pedido_id: int, websocket: WebSocket)
      async def disconnect(pedido_id: int, websocket: WebSocket)
      async def send_to_order(pedido_id: int, event_type: str, payload: dict)
      def active_connections_for(pedido_id: int) -> int
  ```
- **Singleton:** `order_tracker = OrderTracker()` at module level

#### `backend/pedidos/router.py` — NEW WebSocket endpoint
- **Endpoint:** `WS /api/v1/pedidos/{pedido_id}/track`
- **Auth:** JWT via `?token=` query param + ownership validation
- **Flow:**
  1. Extract and validate JWT
  2. Look up pedido by ID, verify `pedido.usuario_id == user_id` from token
  3. Connect to `order_tracker`
  4. Send current order state as initial welcome message
  5. Listen loop (keepalive with PING/PONG)
  6. On disconnect: cleanup

#### `backend/pedidos/service.py` — MODIFIED
- **`transicionar_estado()`:** After successful transition:
  1. Update the corresponding timestamp field on `Pedido`
  2. Broadcast to KDS (existing `websocket_manager.broadcast_event`)
  3. Send to customer tracker: `await order_tracker.send_to_order(pedido_id, ...)`

#### `backend/models/pedido.py` — MODIFIED
- Add fields:
  ```python
  confirmado_en: Optional[datetime] = Field(default=None)
  en_preparacion_en: Optional[datetime] = Field(default=None)
  listo_en: Optional[datetime] = Field(default=None)
  en_camino_en: Optional[datetime] = Field(default=None)
  entregado_en: Optional[datetime] = Field(default=None)
  ```

#### `backend/migrations/` — NEW migration
- `ALEMBIC DOWNGRADE: 011_add_order_tracking_timestamps.py`

#### `backend/pedidos/schemas.py` — MODIFIED
- Add timestamp fields to `PedidoResponse`:
  ```python
  confirmado_en: Optional[datetime] = None
  en_preparacion_en: Optional[datetime] = None
  listo_en: Optional[datetime] = None
  en_camino_en: Optional[datetime] = None
  entregado_en: Optional[datetime] = None
  ```

### Frontend

All new components live in `frontend/src/features/orders/` (existing feature folder).

#### `components/OrderTimeline.tsx` (NEW)
- **Responsibility:** Visual progress bar showing FSM states
- **Props:** `{ order: Pedido }`
- **States rendering:**
  - Completed (green): state timestamp exists and is in the past
  - Current (blue with pulse): current state
  - Future (gray): not yet reached
- **Responsive:** horizontal on desktop (`flex-row`), vertical on mobile (`flex-col`)
- **Connecting lines:** between each state step

#### `components/LiveUpdatesIndicator.tsx` (NEW)
- **Responsibility:** Show WebSocket connection status
- **States:** `conectado` (green "En vivo"), `reconectando` (yellow dot), `fallback` (gray "Actualizando cada 5s")

#### `components/OrderEstimatedTime.tsx` (NEW)
- **Responsibility:** Display ETA based on order state
- **Props:** `{ order: Pedido }`

#### `hooks/useOrderWebSocket.ts` (NEW)
- **Responsibility:** Manage WebSocket connection lifecycle
- **Returns:** `{ connectionStatus, lastUpdate }`
- **Behavior:**
  1. Connect to `WS /api/v1/pedidos/{pedidoId}/track?token=<JWT>`
  2. On message: update `OrderStore` and show toast
  3. On error/close: start fallback polling + reconnect with exponential backoff
  4. Cleanup on unmount

#### `hooks/useOrderTracking.ts` (NEW)
- **Responsibility:** Fetch initial order data + combine with WebSocket updates
- **Returns:** `{ order, isLoading, isError, connectionStatus }`
- **Behavior:**
  1. Fetch initial data via `GET /api/v1/pedidos/{pedido_id}` (TanStack Query)
  2. Start WebSocket connection
  3. WebSocket updates override TanStack Query cache
  4. Fallback polling uses TanStack Query's refetchInterval

#### `store.ts` (NEW)
- **Responsibility:** Zustand store for real-time order state
- **Fields:** `order`, `connectionStatus`, `lastUpdate`, `toasts`
- **Actions:** `setOrder`, `setConnectionStatus`, `addToast`, `removeToast`

#### `OrderDetailPage.tsx` — MODIFIED
- Integrate `OrderTimeline`, `OrderEstimatedTime`, `LiveUpdatesIndicator`
- Move delivery address display from proposal to the detail section
- Preserve existing items table and summary

### Toast System

Since there's no toast library in the project, we implement a minimal one:

```
frontend/src/shared/components/Toast.tsx (NEW)
frontend/src/shared/hooks/useToast.ts (NEW)
```

- Absolute-positioned container fixed to top-right
- Auto-dismiss after 5 seconds
- Slide-in animation
- Types: `success` (green), `info` (blue), `error` (red)

## Data Model Changes

### Pedido (SQLModel)

```python
# NEW fields to add
class Pedido(SQLModel, table=True):
    # ... existing fields ...
    
    # NEW: Per-status timestamps
    confirmado_en: Optional[datetime] = Field(default=None)
    en_preparacion_en: Optional[datetime] = Field(default=None)
    listo_en: Optional[datetime] = Field(default=None)
    en_camino_en: Optional[datetime] = Field(default=None)
    entregado_en: Optional[datetime] = Field(default=None)
```

### OrderTracker (new class)

```python
# Pseudocode — runs in-process, no persistence needed
class OrderTracker:
    _orders: dict[int, set[WebSocket]]
    
    async def connect(self, pedido_id: int, ws: WebSocket):
        async with self._lock:
            self._orders.setdefault(pedido_id, set()).add(ws)
    
    async def disconnect(self, pedido_id: int, ws: WebSocket):
        async with self._lock:
            self._orders.get(pedido_id, set()).discard(ws)
    
    async def send_to_order(self, pedido_id: int, event_type: str, payload: dict):
        connections = self._orders.get(pedido_id, set()).copy()
        for ws in connections:
            await ws.send_json({
                "tipo": event_type,
                "pedido": payload,
                "timestamp": datetime.utcnow().isoformat()
            })
```

## API Changes

### NEW: WebSocket endpoint

```
WS /api/v1/pedidos/{pedido_id}/track?token=<JWT>
```

**Auth:** JWT token + ownership validation

**Events sent to client:**

| Event | Payload | When |
|-------|---------|------|
| `WELCOME` | `{ pedido: OrderResponse }` | On initial connection |
| `PEDIDO_CONFIRMADO` | `{ pedido: OrderResponse }` | Order confirmed |
| `PEDIDO_EN_PREPARACION` | `{ pedido: OrderResponse }` | Preparation started |
| `PEDIDO_LISTO` | `{ pedido: OrderResponse }` | Order ready |
| `PEDIDO_EN_CAMINO` | `{ pedido: OrderResponse }` | On the way |
| `PEDIDO_ENTREGADO` | `{ pedido: OrderResponse }` | Delivered |
| `PEDIDO_CANCELADO` | `{ pedido: OrderResponse }` | Cancelled |

### MODIFIED: GET /api/v1/pedidos/{pedido_id}

**Response additions** to `PedidoResponse`:
```json
{
  "confirmado_en": "2026-06-02T12:30:00Z",
  "en_preparacion_en": "2026-06-02T12:35:00Z",
  "listo_en": null,
  "en_camino_en": null,
  "entregado_en": null
}
```

## WebSocket Message Flow

```
CLIENT                              SERVER
  │                                    │
  │──── WS CONNECT /pedidos/123/track ──→│
  │     ?token=eyJ...                    │
  │                                    │  validate JWT + ownership
  │◄─── WELCOME + estado_actual ───────│
  │                                    │
  │     ... time passes ...            │
  │                                    │  PedidoService changes state
  │◄─── PEDIDO_EN_PREPARACION + data ──│
  │                                    │
  │  ┌─ update timeline ─┐             │
  │  │ show toast        │             │
  │  │ update ETA        │             │
  │  └───────────────────┘             │
  │                                    │
  │     ... WebSocket drops ...        │
  │                                    │
  │  ┌─ start polling 5s ──┐           │
  │  │─ GET /pedidos/123 ──────→       │
  │  │←─── 200 + data ──────────       │
  │  │─ GET /pedidos/123 ──────→       │
  │  └──────────────────────┘          │
  │                                    │
  │──── WS RECONNECT ─────────────────→│
  │◄─── WELCOME + estado_actual ───────│
  │  ┌─ stop polling ──┐               │
  │  └─────────────────┘               │
```

## Frontend Route Changes

### Router.tsx — MODIFIED

The existing route `/mis-pedidos/:id` already exists. No route changes needed — we enhance the existing component.

**However**, we need to ensure the `OrderDetailPage` is wrapped with `CustomerLayout` (check if it already is):

```
<Route element={<CustomerLayout />}>
  <Route path="/mis-pedidos" element={<OrdersPage />} />
  <Route path="/mis-pedidos/:id" element={<OrderDetailPage />} />  ← enhance this
</Route>
```

## Migration Plan

### Phase 1: Backend Timestamps
1. Add timestamp fields to `Pedido` model
2. Create Alembic migration
3. Update `PedidoResponse` schema
4. Run migration on dev database

### Phase 2: OrderTracker + WebSocket
1. Create `backend/core/order_tracker.py`
2. Add WebSocket endpoint to `pedidos/router.py`
3. Modify `PedidoService.transicionar_estado()` to:
   a. Set per-status timestamps
   b. Notify `order_tracker`

### Phase 3: Frontend Components
1. Create `Toast` shared component
2. Create `useOrderWebSocket` hook
3. Create `OrderStore` (Zustand)
4. Create `OrderTimeline` component
5. Create `LiveUpdatesIndicator`
6. Create `OrderEstimatedTime`
7. Modify `OrderDetailPage` to integrate everything

### Phase 4: Verify
1. Test WebSocket connection with JWT
2. Test ownership validation
3. Test timeline rendering
4. Test ETA calculation
5. Test toast notifications
6. Test fallback polling
7. Test reconnect behavior

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| WebSocket per-order scales poorly (many customers = many connections) | Acceptable for single-instance MVP. Each connection is cheap (memory only). Future: Redis-based pub/sub. |
| Timestamps not backfilled for existing orders | Migration adds nullable fields — existing orders stay NULL. Only new transitions set timestamps. |
| Customer sees outdated status after WS reconnect | Send full current state on WELCOME event. The client always has the latest. |
| WebSocket drop during state transition = missed event | The `WELCOME` message on reconnect includes latest state. Polling catches any missed events. |
| Toast notifications on multiple tabs | Not addressed in this change — BroadcastChannel would be needed (deferred). |
| ETA is naive (30 min fixed) — may be inaccurate | Display as range ("20-30 min") rather than exact time. Future: analytics-based estimation from CH-032. |
