# Tasks: CH-031 — Real-Time Order Tracking

## 1. Backend: Model + Migration + Schemas

- [x] 1.1 Add timestamp fields (`confirmado_en`, `en_preparacion_en`, `listo_en`, `en_camino_en`, `entregado_en`) to `Pedido` model
- [x] 1.2 Create Alembic migration `011_add_order_tracking_timestamps`
- [x] 1.3 Add timestamp fields to `PedidoResponse` schema

## 2. Backend: OrderTracker + WebSocket endpoint

- [x] 2.1 Create `backend/core/order_tracker.py` with `OrderTracker` class (per-order pub/sub with pedido_id → WebSocket mapping)
- [x] 2.2 Add WebSocket endpoint `WS /api/v1/pedidos/{pedido_id}/track` with JWT auth + ownership validation
- [x] 2.3 Send `WELCOME` message with current order state on successful connection

## 3. Backend: PedidoService — timestamps + tracker notifications

- [x] 3.1 Modify `transicionar_estado()` to set the corresponding timestamp field on each state transition
- [x] 3.2 Add notification to `order_tracker.send_to_order()` after each successful transition
- [x] 3.3 Apply Alembic migration to dev database

## 4. Frontend: Toast notification system

- [x] 4.1 Create `Toast` component at `shared/components/Toast.tsx` with slide-in animation + auto-dismiss
- [x] 4.2 Create `useToast` hook with Zustand store for toast queue management
- [x] 4.3 Integrate `ToastContainer` into the app layout (CustomerLayout)

## 5. Frontend: OrderTimeline + ETA components

- [x] 5.1 Create `OrderTimeline` component with horizontal (desktop) / vertical (mobile) layout showing FSM states with colors (green=done, blue=current, gray=future)
- [x] 5.2 Create `LiveUpdatesIndicator` component showing WebSocket connection status (green/yellow/gray)
- [x] 5.3 Create `OrderEstimatedTime` component with ETA calculation based on current state

## 6. Frontend: WebSocket hook + Zustand store

- [x] 6.1 Create Zustand `useOrderStore` for real-time order state + connection status
- [x] 6.2 Create `useOrderWebSocket` hook with WebSocket connection, auto-reconnect (exponential backoff), and fallback polling (5s)
- [x] 6.3 Wire toast notifications on status change events

## 7. Frontend: Enhance OrderDetailPage

- [x] 7.1 Integrate `OrderTimeline`, `OrderEstimatedTime`, `LiveUpdatesIndicator` into existing `OrderDetailPage`
- [x] 7.2 Wire `useOrderWebSocket` hook to provide live updates
- [x] 7.3 Show delivery address from `direccion_snapshot`
- [x] 7.4 Verify responsive layout works on mobile

## 8. Tests & Verification

- [x] 8.1 Test WebSocket connection with valid/invalid JWT and ownership validation
- [x] 8.2 Test state transition sets correct timestamp
- [x] 8.3 Test timeline rendering with different order states
- [x] 8.4 Test fallback polling activates on WebSocket failure
- [x] 8.5 Test toast notifications fire on status change events

