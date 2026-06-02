# Design: Kitchen Display System (KDS)

## Context

El KDS es la pantalla operativa para el personal de cocina. Muestra pedidos activos (CONFIRMADO y EN_PREP) con indicadores de urgencia, updates en tiempo real via WebSocket, y botones de acción para transiciones de estado FSM.

## Goals / Non-Goals

**Goals:**
- Pantalla full-screen optimizada para monitor de cocina
- Columnas de estado (Por preparar / En preparación)
- Indicador de urgencia por tiempo transcurrido
- WebSocket en vivo con fallback a polling REST
- Botones Iniciar / Listo por pedido

**Non-Goals:**
- No hay columna "Listo" (se va a EN_CAMINO, fuera del KDS)
- No hay drag-and-drop
- No hay multi-sucursal ni estaciones de cocina

## Decisions

### Decision 1: Two columns instead of three
- El proposal original mostraba 3 columnas (Pendiente, Prep, Listo)
- **Decisión**: 2 columnas — "Por preparar" (CONFIRMADO) y "En preparación" (EN_PREP)
- **Rationale**: Cuando un pedido pasa a EN_CAMINO ya no es responsabilidad de cocina. Simplifica la UI y evita una columna vacía.

### Decision 2: Urgencia calculada en frontend con timer
- El backend envía `tiempo_en_estado` (segundos)
- El frontend incrementa localmente con `setInterval` cada 10s
- **Rationale**: Evita polling al backend solo para actualizar el timer. El cálculo local es suficientemente preciso.

### Decision 3: WebSocket como fuente primaria, REST como fallback
- **Conexión principal**: WebSocket con keepalive PING/PONG cada 30s
- **Fallback**: Polling REST cada 5s si WebSocket se desconecta
- **Rationale**: WebSocket da updates inmediatos sin polling. El fallback asegura que el KDS nunca se quede ciego.

## Data Flow

```
Initial Load:
  GET /api/v1/cocina/pedidos → CocinaService.get_pedidos_cocina()
    → PedidoRepository (CONFIRMADO, EN_PREP)
    → Calcular tiempo_en_estado desde HistorialEstadoPedido
    → Obtener cliente_nombre desde Usuario
    → Response con items + metadata

Real-time Updates:
  WebSocket message → useWebSocketCocina hook
    → PEDIDO_CONFIRMADO: agregar a columna "Por preparar"
    → PEDIDO_EN_PREPARACION: mover a columna "En preparación"
    → PEDIDO_EN_CAMINO / CANCELADO: remover del board

State Transitions:
  Click "Iniciar" → PATCH /pedidos/{id}/estado { estado: "EN_PREP" }
  Click "Listo" → PATCH /pedidos/{id}/estado { estado: "EN_CAMINO" }
  → Backend actualiza FSM + broadcast via WebSocket
```

## Components

### Frontend

| Component | Path | Responsibility |
|-----------|------|----------------|
| `CocinaPage` | `pages/CocinaPage.tsx` | Main KDS page, orchestrates columns, wiring |
| `ColumnaEstado` | `features/cocina/components/ColumnaEstado.tsx` | Single column with orders list |
| `PedidoCard` | `features/cocina/components/PedidoCard.tsx` | Order card with items, urgency, actions |
| `UrgenciaBadge` | `features/cocina/components/UrgenciaBadge.tsx` | Time display + urgency color |
| `CocinaHeader` | `features/cocina/components/CocinaHeader.tsx` | Header with connection status |
| `useWebSocketCocina` | `features/cocina/hooks/useWebSocketCocina.ts` | WebSocket connection + message handling |
| `useUrgenciaTimer` | `features/cocina/hooks/useUrgenciaTimer.ts` | Local urgency timer increment |
| `useUpdateEstado` | `features/cocina/hooks/useUpdateEstado.ts` | Mutation for PATCH estado |

### Backend

| Component | Path | Responsibility |
|-----------|------|----------------|
| `CocinaService.get_pedidos_cocina` | `backend/cocina/service.py` | Fetch KDS orders with time-in-state |
| `listar_pedidos_cocina` endpoint | `backend/cocina/router.py` | `GET /api/v1/cocina/pedidos` |
| `websocket_cocina` endpoint | `backend/cocina/router.py` | `WS /api/v1/cocina/ws` |

## API Changes

### REST Endpoint
```
GET /api/v1/cocina/pedidos
  Auth: JWT + rol COCINA, PEDIDOS or ADMIN
  Response: PedidoCocinaResponse[]
    - id, estado_codigo, items[], tiempo_en_estado, cliente_nombre, etc.
```

### WebSocket
```
WS /api/v1/cocina/ws?token=<JWT>
  Events: PEDIDO_CONFIRMADO, PEDIDO_EN_PREPARACION, PEDIDO_EN_CAMINO, PEDIDO_CANCELADO
  Keepalive: PING cada 30s server → PONG del cliente
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| WebSocket disconnection | Auto-reconnect + polling fallback cada 5s |
| Urgencia timer desync | Se recalcula desde server cada 10s vía REST si es necesario |
| Múltiples cocineros mismo pedido | Backend es autoritativo (FSM valida transiciones) |
