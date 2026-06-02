# CH-031: Real-Time Order Tracking — Live Customer Updates

## Executive Summary

Enable customers to **track orders in real-time** as they move through the fulfillment process:

- **Order status updates** (pending → confirmed → in prep → ready → on way → delivered)
- **Real-time notifications** (WebSocket push or polling fallback)
- **Estimated delivery time** (calculated from order time + kitchen queue)
- **Driver location** (optional, for future)
- **Notification bells** (order status changed)

This uses the **same WebSocket infrastructure from CH-023** but with customer-specific channels and filters.

## Problem Statement

- **Current state**: Customers must refresh page to see order status
- **Customer pain**: "Did my order go to the kitchen? When will it be ready?"
- **UX issue**: No feedback = anxiety, support calls

## Solution

Create `/mis-pedidos/:id` page with:

1. **Order timeline** (visual progress: confirmed → prep → ready → on way → delivered)
2. **Current status badge** (with timestamp)
3. **Estimated time** (ETA for delivery)
4. **Live updates** (WebSocket pushes changes instantly)
5. **Toast notifications** (status changed)
6. **Fallback polling** (if WebSocket fails)

## Scope

✅ **Include**:
- Real-time status updates via WebSocket
- Order timeline visualization
- ETA calculation and display
- Toast/notification on status change
- Fallback polling (5s interval)
- Mobile-optimized layout
- Show order items + pricing
- Show delivery address
- Estimated delivery time + actual delivery time

❌ **Exclude**:
- Driver location tracking (future)
- Push notifications to phone (future)
- Estimated time adjustments by driver (future)

## Dependencies

| Change | Dependency | Reason |
|--------|-----------|--------|
| **CH-023** | BLOCKING | WebSocket infrastructure |
| **CH-026** | REQUIRED | Uses CustomerLayout |
| **CH-031** | Optional | Can use order API polling without WebSocket |

## Technical Approach

### Backend (CH-023 Responsibility)

**WebSocket endpoint** (customer-specific channel):
```
WS /api/v1/pedidos/{pedidoId}/track
  - Auth: JWT token (validates customer owns order)
  - Messages:
    - PEDIDO_CONFIRMADO
    - PEDIDO_EN_PREPARACION
    - PEDIDO_LISTO
    - PEDIDO_EN_CAMINO
    - PEDIDO_ENTREGADO
    - PEDIDO_CANCELADO
```

**REST endpoint** (fallback):
```
GET /api/v1/pedidos/{pedidoId}
  - Returns current order state + timestamps for each status
  - Response includes: items, total, address, status timeline
```

### Frontend Components

```
frontend/src/pages/
├── OrderTrackingPage.tsx       (main tracking page)

frontend/src/features/orders/
├── components/
│   ├── OrderTimeline.tsx       (visual progress)
│   ├── OrderStatus.tsx         (current status badge)
│   ├── OrderEstimatedTime.tsx  (ETA display)
│   ├── OrderItems.tsx          (items in order)
│   ├── OrderDeliveryAddress.tsx
│   └── LiveUpdatesIndicator.tsx
├── hooks/
│   ├── useOrderTracking.ts     (fetch + WebSocket)
│   └── useOrderWebSocket.ts    (WebSocket management)
└── store.ts                    (Zustand for tracking)
```

### Order Timeline Component

```tsx
// Visual progression
function OrderTimeline({ order }: { order: Pedido }) {
  const estados = [
    { estado: 'CONFIRMADO', label: 'Confirmado', icon: '✓' },
    { estado: 'EN_PREPARACION', label: 'En Preparación', icon: '🔨' },
    { estado: 'LISTO', label: 'Listo', icon: '📦' },
    { estado: 'EN_CAMINO', label: 'En Camino', icon: '🚗' },
    { estado: 'ENTREGADO', label: 'Entregado', icon: '✓' },
  ];
  
  return (
    <div className="flex items-center justify-between">
      {estados.map((paso, idx) => (
        <div key={paso.estado} className="flex flex-col items-center">
          {/* Circle with icon, colored if reached */}
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${order.estado === paso.estado ? 'bg-blue-500 text-white' : 
              estados.findIndex(e => e.estado === orden.estado) > idx ? 'bg-green-500 text-white' :
              'bg-gray-300 text-gray-600'
            }
          `}>
            {paso.icon}
          </div>
          <span className="text-sm mt-2">{paso.label}</span>
          {/* Timestamp if this status was reached */}
          {order.timestamps?.[paso.estado] && (
            <span className="text-xs text-gray-500">
              {formatTime(order.timestamps[paso.estado])}
            </span>
          )}
          {/* Connecting line */}
          {idx < estados.length - 1 && (
            <div className="w-12 h-1 bg-gray-300 absolute left-full"></div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### ETA Calculation

```typescript
// src/features/orders/hooks/useOrderTracking.ts

function calculateETA(order: Pedido): Date {
  const ahora = new Date();
  
  // If already delivered, return actual delivery time
  if (order.estado === 'ENTREGADO') {
    return order.entregado_en;
  }
  
  // If in kitchen, estimate based on position in queue
  if (['CONFIRMADO', 'EN_PREPARACION'].includes(order.estado)) {
    // Backend should provide estimated_ready_at
    // Or calculate: created_at + avg_prep_time + queue_position
    return order.estimated_ready_at || new Date(ahora.getTime() + 30 * 60000); // 30 min default
  }
  
  // If ready or in delivery, show estimated delivery time
  if (order.estado === 'LISTO' || order.estado === 'EN_CAMINO') {
    // avg delivery time (e.g., 20 min)
    return new Date(ahora.getTime() + 20 * 60000);
  }
  
  return null;
}
```

### WebSocket Integration

```typescript
// src/features/orders/hooks/useOrderWebSocket.ts

export function useOrderWebSocket(pedidoId: number) {
  const orderStore = useOrderStore();
  const [conexion, setConexion] = useState('desconectado');
  
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectInterval: NodeJS.Timeout | null = null;
    
    const conectar = () => {
      const token = useAuthStore.getState().accessToken;
      
      try {
        ws = new WebSocket(
          `${import.meta.env.VITE_WS_URL}/api/v1/pedidos/${pedidoId}/track`,
          [`Bearer ${token}`]
        );
        
        ws.onopen = () => {
          setConexion('conectado');
          clearInterval(reconnectInterval);
        };
        
        ws.onmessage = (event) => {
          const { tipo, pedido, timestamp } = JSON.parse(event.data);
          
          // Actualizar estado del pedido
          orderStore.setOrder(pedido);
          
          // Mostrar toast
          showToast({
            type: 'info',
            message: `Tu orden: ${tipo.replaceAll('_', ' ').toLowerCase()}`,
            duration: 5
          });
          
          // Actualizar ETA
          orderStore.setETA(calculateETA(pedido));
        };
        
        ws.onerror = () => {
          setConexion('fallback');
          // Iniciar polling cada 5 segundos
          reconnectInterval = setInterval(() => {
            fetchOrderStatus(pedidoId);
          }, 5000);
        };
        
        ws.onclose = () => setConexion('desconectado');
        
      } catch (e) {
        setConexion('fallback');
        reconnectInterval = setInterval(() => {
          fetchOrderStatus(pedidoId);
        }, 5000);
      }
    };
    
    conectar();
    
    return () => {
      ws?.close();
      clearInterval(reconnectInterval);
    };
  }, [pedidoId]);
  
  return conexion;
}

// Fallback: Polling every 5s
async function fetchOrderStatus(pedidoId: number) {
  try {
    const { data } = await axios.get(`/api/v1/pedidos/${pedidoId}`);
    orderStore.setOrder(data);
  } catch (e) {
    console.error('Failed to fetch order status:', e);
  }
}
```

### Order Tracking Page Layout

```
┌──────────────────────────────────────────────────┐
│ Mi Pedido #1234                   🔴 Conectado   │
├──────────────────────────────────────────────────┤
│                                                  │
│ ✓ Confirmado    🔨 En Prep    📦 Listo    🚗... │
│ 2:30pm          2:35pm         2:55pm           │
│                                                  │
├──────────────────────────────────────────────────┤
│ Estado Actual: EN PREPARACION                    │
│ Tiempo Estimado: 18 min                          │
│ Listo: ~2:53 PM                                  │
├──────────────────────────────────────────────────┤
│ Items del Pedido:                                │
│ - Pizza Margherita x2 ...................... $15 │
│ - Coca Cola x2 .............................. $5 │
│ - Postre: Tiramisu x1 ........................ $6 │
│                                                  │
│ Total: $26.00                                    │
├──────────────────────────────────────────────────┤
│ Entrega en:                                      │
│ Calle Mitre 123, Buenos Aires                    │
│ Depto 4B                                         │
└──────────────────────────────────────────────────┘
```

## Backend Data Model

**New fields on `Pedido` model**:
```python
class Pedido(SQLModel, table=True):
    # ... existing fields ...
    
    # NEW: Timestamps for tracking
    confirmado_en: datetime = Field(default_factory=datetime.utcnow)
    en_preparacion_en: datetime | None = None
    listo_en: datetime | None = None
    en_camino_en: datetime | None = None
    entregado_en: datetime | None = None
    
    # NEW: ETA estimate
    estimated_ready_at: datetime | None = None
    estimated_delivered_at: datetime | None = None
```

## Effort Estimate

- **Backend changes**: 1.5 hours
  - Add timestamp fields to Pedido: 0.5h
  - Update WebSocket endpoint for individual order tracking: 1h

- **Frontend components**: 4 hours
  - Order timeline: 1h
  - Status badge + ETA: 1h
  - Order details (items, address): 1h
  - Responsive layout: 1h

- **WebSocket integration**: 2 hours
  - useOrderWebSocket hook: 1h
  - Fallback polling: 1h

- **Testing & refinement**: 1.5 hours

**Total**: 9 hours

## Acceptance Criteria

- [ ] Order tracking page loads at `/mis-pedidos/:id`
- [ ] WebSocket connects and receives real-time updates
- [ ] Order timeline updates when status changes
- [ ] ETA is displayed and updates correctly
- [ ] Toast notification shows when status changes
- [ ] Fallback polling works if WebSocket fails
- [ ] Order items displayed with prices
- [ ] Delivery address shown
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] Performance: updates < 1 second latency

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Customer sees outdated status | MEDIUM | MEDIUM | Validate server state on socket message |
| WebSocket connection unstable | MEDIUM | HIGH | Implement fallback polling + retry logic |
| ETA inaccurate (affects UX) | MEDIUM | LOW | Show range instead of exact time (e.g., 20-30 min) |
| Multiple tabs open (state conflict) | LOW | LOW | BroadcastChannel for cross-tab sync |

## Timeline

- **Start**: After CH-023 WebSocket is ready
- **Duration**: 9 hours (parallel with CH-030)
- **Delivery**: Feature branch, 3 commits (backend + frontend + WebSocket)
- **Merge**: When tested with real WebSocket

## Next Steps (After This Change)

1. **CH-032** — Admin dashboard improvements
2. **Future**: Driver location tracking, push notifications

---

**Change Owner**: Full-stack team  
**Status**: 🟡 Planning  
**Created**: 2026-05-21  
**Last Updated**: 2026-05-21
