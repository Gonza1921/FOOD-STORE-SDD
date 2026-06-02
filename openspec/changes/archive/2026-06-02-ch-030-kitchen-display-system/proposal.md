# CH-030: Kitchen Display System (KDS) — Order Queue for Kitchen Staff

## Executive Summary

Create a dedicated **KDS (Kitchen Display System)** page for kitchen staff (`COCINERO` role). Shows:

- **Real-time order queue** (pending → in preparation → ready)
- **Order details** (items, quantities, special instructions)
- **Urgency indicator** (color-coded: red > 30min, yellow 15-30min, green < 15min)
- **Quick actions** (start prep, mark item done, ready for delivery)
- **WebSocket updates** (no manual refresh needed)

This is a **complement to CH-023 (backend WebSocket infrastructure)** — uses the same WebSocket endpoint but with optimized frontend UI for kitchen staff.

## Problem Statement

- **Current state**: Kitchen staff has no real-time order view; relies on manual checks
- **Kitchen pain**: "I don't know what to prepare next or which orders are urgent"
- **Missing feature**: KDS is critical for operational efficiency

## Solution

Create `/cocina/display` page with:

1. **Kanban board** — Orders grouped by status (Pending → In Prep → Ready)
2. **Order cards** — Order #, items, time elapsed, urgency color
3. **Checkbox items** — Mark ingredients as done (visual feedback only)
4. **Status buttons** — Quick actions (Start Prep, Mark Ready, Cancel)
5. **Full-screen layout** — Optimized for TV/monitor display in kitchen
6. **WebSocket integration** — Auto-updates from CH-023 backend

## Scope

✅ **Include**:
- KDS page at `/cocina/display` (role guard: COCINERO only)
- Kanban layout (3 columns: Pending, In Prep, Ready)
- Order cards with items + special instructions
- Urgency indicator (color + time elapsed)
- Action buttons (Start Prep, Mark Ready)
- Item checkboxes (local state, no backend sync)
- WebSocket listener (subscribes to order updates)
- Responsive/full-screen layout
- Theme: Dark mode for eye comfort

❌ **Exclude**:
- Printer integration (future)
- Audio alerts (optional, can be CH-031)
- Multi-station kitchen (future, v2)
- Advanced scheduling/planning (future)

## Dependencies

| Change | Dependency | Reason |
|--------|-----------|--------|
| **CH-022** | BLOCKING | KDS requires COCINERO role |
| **CH-023** | BLOCKING | WebSocket infrastructure for real-time |
| **CH-026** | REQUIRED | Needs AdminLayout (KDS is staff-only) |

## Technical Approach

### Backend (CH-023 Responsibility)

**WebSocket endpoint** (from CH-023):
```
WS /api/v1/cocina/pedidos
  - Auth: JWT token (validates COCINERO role)
  - Messages:
    - PEDIDO_NUEVO: new order in CONFIRMADO state
    - PEDIDO_EN_PREPARACION: order moved to EN_PREPARACION
    - PEDIDO_LISTO: order marked LISTO (ready for delivery)
    - PEDIDO_CANCELADO: order cancelled
```

### Frontend Components (CH-030)

```
frontend/src/pages/
├── CocinaDisplayPage.tsx       (main KDS page)

frontend/src/features/kds/
├── components/
│   ├── KdsBoard.tsx            (Kanban board)
│   ├── KdsColumn.tsx           (one column: pending/prep/ready)
│   ├── OrderCard.tsx           (individual order)
│   ├── OrderItemCheckbox.tsx   (item checkbox)
│   ├── UrgencyBadge.tsx        (time + color)
│   ├── ActionButtons.tsx       (start prep, mark ready, cancel)
│   └── ConnectionStatus.tsx    (WebSocket status indicator)
├── hooks/
│   ├── useKdsWebSocket.ts      (connect to CH-023 WebSocket)
│   └── useKdsOrders.ts         (fetch + manage orders)
└── store.ts                    (Zustand for KDS state)
```

### KDS Page Layout

```
┌──────────────────────────────────────────────────────┐
│  🔴 WS Connected  | COCINA KITCHEN DISPLAY SYSTEM    │
├──────────────────┬──────────────────┬────────────────┤
│  PENDIENTE (3)   │  EN PREPARACIÓN  │  LISTO (1)     │
├──────────────────┼──────────────────┼────────────────┤
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌────────────┐ │
│ │ Pedido #1234 │ │ │ Pedido #1233 │ │ │ Pedido #99 │ │
│ │ 🔴 34 min    │ │ │ 🟡 18 min    │ │ │ ✓ Listo    │ │
│ │              │ │ │              │ │ │            │ │
│ │ - Pizza x2   │ │ │ - Burrito x1 │ │ │ - Pasta x1 │ │
│ │ - Soda x2    │ │ │ - Extra: sin │ │ │            │ │
│ │ - Bread x1   │ │ │   cilantro   │ │ │ [Entregar] │ │
│ │              │ │ │              │ │ │            │ │
│ │ [Iniciar]    │ │ │ ✓ Pizza      │ │ └────────────┘ │
│ │             │ │ │ ☐ Burrito    │ │                │
│ │             │ │ │              │ │                │
│ │             │ │ │ [Listo] [X]  │ │                │
│ └──────────────┘ │ └──────────────┘ │                │
│                  │                   │                │
│ ┌──────────────┐ │                   │                │
│ │ Pedido #1232 │ │                   │                │
│ │ 🟢 8 min     │ │                   │                │
│ │              │ │                   │                │
│ │ - Salad x1   │ │                   │                │
│ │ - Juice x1   │ │                   │                │
│ │              │ │                   │                │
│ │ [Iniciar]    │ │                   │                │
│ └──────────────┘ │                   │                │
└──────────────────┴──────────────────┴────────────────┘
```

### Store (Zustand)

```typescript
// src/features/kds/store.ts
interface KdsState {
  // Orders by status
  pendientes: Pedido[];
  enPreparacion: Pedido[];
  listos: Pedido[];
  
  // UI
  conexion: 'conectado' | 'desconectado' | 'fallback';
  ultimaActualizacion: Date | null;
  
  // Local state (items marked done, but not sent to backend)
  itemsCompletados: { [pedidoId: number]: number[] };
  
  // Actions
  agregarPedido: (pedido: Pedido) => void;
  moverPedido: (pedidoId, nuevoStatus) => void;
  marcarItemCompletado: (pedidoId, detalleId) => void;
  setConexion: (status) => void;
}
```

### WebSocket Integration

```typescript
// src/features/kds/hooks/useKdsWebSocket.ts
export function useKdsWebSocket() {
  const kdsStore = useKdsStore();
  
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const conectar = () => {
      const token = useAuthStore.getState().accessToken;
      ws = new WebSocket(
        `${import.meta.env.VITE_WS_URL}/api/v1/cocina/pedidos`,
        {
          // WebSocket doesn't support custom headers, so pass token in URL or use subprotocol
          subprotocols: [`Bearer ${token}`]
        }
      );
      
      ws.onopen = () => kdsStore.setConexion('conectado');
      
      ws.onmessage = (event) => {
        const { tipo, pedido } = JSON.parse(event.data);
        
        if (tipo === 'PEDIDO_NUEVO') {
          kdsStore.agregarPedido(pedido);
        } else if (tipo === 'PEDIDO_EN_PREPARACION') {
          kdsStore.moverPedido(pedido.id, 'EN_PREPARACION');
        } else if (tipo === 'PEDIDO_LISTO') {
          kdsStore.moverPedido(pedido.id, 'LISTO');
        }
      };
      
      ws.onerror = () => kdsStore.setConexion('desconectado');
    };
    
    conectar();
    
    return () => ws?.close();
  }, [kdsStore]);
}
```

## Action Handlers

```typescript
// Actions triggered by kitchen staff

// 1. Start preparing order
const handleStartPrep = (pedidoId: number) => {
  // PATCH /api/v1/pedidos/{pedidoId}/estado
  // { "estado": "EN_PREPARACION" }
  // Backend broadcasts update → WebSocket
  axios.patch(`/api/v1/pedidos/${pedidoId}/estado`, {
    estado: 'EN_PREPARACION'
  });
};

// 2. Mark order as ready for delivery
const handleMarkReady = (pedidoId: number) => {
  // PATCH /api/v1/pedidos/{pedidoId}/estado
  // { "estado": "LISTO" }
  axios.patch(`/api/v1/pedidos/${pedidoId}/estado`, {
    estado: 'LISTO'
  });
};

// 3. Cancel order (admin/manager override)
const handleCancelOrder = (pedidoId: number) => {
  // DELETE /api/v1/pedidos/{pedidoId} or PATCH with CANCELADO
  axios.patch(`/api/v1/pedidos/${pedidoId}/estado`, {
    estado: 'CANCELADO',
    razon: 'Cancelado por cocina'
  });
};
```

## Effort Estimate

- **Frontend components**: 5 hours
  - KDS board layout (Kanban): 1.5h
  - Order cards: 1h
  - Action buttons + handlers: 1h
  - Urgency indicator + timer: 0.5h
  - Connection status: 0.5h

- **WebSocket integration**: 2 hours
  - useKdsWebSocket hook: 1h
  - Store + message handling: 1h

- **Styling & responsive**: 2 hours
  - Full-screen layout: 1h
  - Mobile fallback: 0.5h
  - Dark theme: 0.5h

- **Testing**: 1.5 hours
  - Manual WebSocket testing
  - Order state transitions
  - Responsive design

**Total**: 10.5 hours

## Acceptance Criteria

- [ ] KDS page loads at `/cocina/display`
- [ ] Route guard enforces COCINERO role
- [ ] WebSocket connects and receives real-time updates
- [ ] Orders appear in correct column (pending/prep/ready)
- [ ] Urgency color changes based on time (green < 15, yellow < 30, red > 30)
- [ ] "Start Prep" button works (CONFIRMADO → EN_PREP)
- [ ] "Mark Ready" button works (EN_PREP → LISTO)
- [ ] Item checkboxes work (local state, no backend call)
- [ ] Cancel button works (order marked CANCELADO)
- [ ] WebSocket status indicator shows connection
- [ ] Fallback to polling if WebSocket fails (5s interval)
- [ ] Layout is full-screen, optimized for TV
- [ ] Dark theme applied
- [ ] No console errors

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| WebSocket connection drops | MEDIUM | HIGH | Implement fallback polling + auto-reconnect |
| Order state out of sync | MEDIUM | MEDIUM | Validate state on WebSocket message |
| Multiple staff + state conflict | MEDIUM | MEDIUM | Last-write-wins strategy (backend authoritative) |
| Item checkboxes lost on refresh | LOW | LOW | Warn before leaving page |
| Urgency timer drifts | LOW | LOW | Recalc from server timestamp each minute |

## Timeline

- **Start**: After CH-022 (role) and CH-023 (WebSocket) are ready
- **Duration**: 10.5 hours (parallel with CH-031)
- **Delivery**: Feature branch, 3 commits (components + WebSocket + styling)
- **Merge**: When WebSocket tested with real backend

## Next Steps (After This Change)

1. **CH-031** — Customer real-time order tracking (uses same WebSocket)
2. **CH-032** — Admin dashboard with KDS analytics

---

**Change Owner**: Full-stack team (frontend + backend WebSocket from CH-023)  
**Status**: 🟡 Planning  
**Created**: 2026-05-21  
**Last Updated**: 2026-05-21
