# Design: CH-024 — Frontend KDS (Kitchen Display System)

## Context

El backend ya expone toda la infraestructura necesaria (CH-023):
- **WebSocket** en `WS /api/v1/cocina/ws?token=<JWT>` con eventos `PEDIDO_CONFIRMADO`, `PEDIDO_EN_PREPARACION`, `PEDIDO_EN_CAMINO`, `PEDIDO_CANCELADO`
- **REST fallback** en `GET /api/v1/cocina/pedidos` con pedidos ordenados por antigüedad
- **FSM granular** con autorización por rol (COCINA puede: CONFIRMADO→EN_PREP, EN_PREP→EN_CAMINO)
- **PATCH** `/api/v1/pedidos/{id}/estado` ya existe en `API.ORDERS.UPDATE_STATUS`

El frontend actual tiene:
- `ProtectedRoute` con `roles` prop para guards de ruta
- Sidebar con `menuConfig` role-based
- Sistema de autenticación Zustand con `hasRole()`
- Feature-Sliced Design (FSD) con features auto-contenidas

## Goals / Non-Goals

**Goals:**
- Pantalla KDS en `/cocina` con layout Kanban de 2 columnas
- Integración WebSocket en tiempo real con reconexión automática
- Fallback polling cada 30s si WebSocket falla
- Timer de urgencia visual (<10min normal, 10-20min naranja, >20min rojo)
- Botones "Iniciar" y "Listo" con confirmación para avanzar estado
- Guard de ruta para roles COCINA/PEDIDOS/ADMIN
- Indicador de estado de conexión (en vivo / reconectando / sin conexión)
- Link "Cocina" en sidebar para roles autorizados
- Sin auto-logout en pantalla de cocina

**Non-Goals:**
- Alerta sonora (CH-025)
- Botón "No disponible" (CH-025)
- Multi-sucursal (Food Store es single-store)
- Integración con impresora de tickets

## Decisions

### DEC-001: Feature `cocina` como feature auto-contenida (FSD)
- **Decisión**: Crear `features/cocina/` siguiendo FSD con `hooks/`, `components/`, `api/`
- **Por qué**: Consistente con el resto del proyecto (auth, cart, pedidos, etc.)
- **Alternativa**: Meter todo en `pages/CocinaPage.tsx` gigante — rechazado por violar FSD

### DEC-002: `useWebSocketCocina` hook para WebSocket + polling
- **Decisión**: Hook único que maneja ciclo de vida WS, reconexión (3s, max 3 intentos), y fallback polling (30s)
- **Por qué**: Encapsula toda la lógica de conectividad en un hook. Los componentes solo consumen estado.
- **API**: `{ pedidos, connectionStatus, error }` donde `connectionStatus` es `'live' | 'reconnecting' | 'polling'`
- **Alternativa**: Librería externa como `react-use-websocket` — rechazado por dependencia innecesaria

### DEC-003: `useUrgenciaTimer` separado del WebSocket
- **Decisión**: Hook independiente que recalcula `tiempoEnEstado` cada 15s sumando incrementos locales
- **Por qué**: El timer sigue corriendo aunque WebSocket esté caído (el cocinero ve tiempos aproximados)
- **API**: Recibe array de pedidos con `tiempo_en_estado`, retorna mismos pedidos con `urgencyLevel: 'normal' | 'warning' | 'urgent'`

### DEC-004: Urgencia calculada 100% en cliente
- **Decisión**: El nivel de urgencia se calcula en frontend usando `tiempo_en_estado` (segundos desde backend) + incremento local
- **Por qué**: No requiere sync con backend (RN-CO07). El backend ya devuelve `tiempo_en_estado` en el endpoint REST
- **Trade-off**: Si el reloj del cliente está muy desviado, los tiempos pueden diferir levemente del backend

### DEC-005: PedidoCard como componente puro (presentacional)
- **Decisión**: `PedidoCard` recibe props y callbacks, sin estado interno
- **Por qué**: Fácil de testear, reutilizable, sin efectos secundarios
- **Props**: `pedido`, `onIniciar`, `onListo`, `isLoading`, `urgencyLevel`

### DEC-006: Confirmación antes de acciones
- **Decisión**: Diálogo de confirmación nativo (`window.confirm`) antes de enviar PATCH
- **Por qué**: Simple, sin dependencias de librerías de modales. La acción es irreversible.
- **Alternativa**: Modal personalizado — reject por complejidad innecesaria

### DEC-007: Estado del botón durante PATCH
- **Decisión**: `useMutation` de TanStack Query para el PATCH con `onMutate` → deshabilitar botón + spinner
- **Por qué**: TanStack Query ya está en el stack. `onMutate` da optimista sin complicaciones.
- **Alternativa**: useState manual en PedidoCard — rechazado porque TanStack Query ya maneja isLoading

### DEC-008: Ruta /cocina fuera del AppLayout (sin sidebar)
- **Decisión**: La ruta `/cocina` se renderiza SIN `AppLayout` (sin sidebar, sin topbar) para maximizar espacio de pantalla
- **Por qué**: El KDS está diseñado para pantallas 16:9 ocupando todo el viewport. El cocinero no necesita navegación durante el turno.
- **Ruta alternativa**: Podría tener un layout minimalista propio con solo indicador de conexión

## Component Tree

```
<Routes>
  ├── (sin AppLayout)
  │   └── <CocinaPage>                        ← /cocina
  │       ├── <CocinaHeader>                   ← Indicador de conexión + título
  │       ├── <ColumnaEstado> "Por preparar"   ← CONFIRMADO
  │       │   └── <PedidoCard>[]
  │       │       ├── Datos del pedido (items, total, tiempo)
  │       │       ├── <UrgenciaBadge>          ← nivel de urgencia
  │       │       └── <BotonIniciar>           ← PATCH → EN_PREP
  │       └── <ColumnaEstado> "En preparación" ← EN_PREP
  │           └── <PedidoCard>[]
  │               ├── Datos del pedido
  │               ├── <UrgenciaBadge>
  │               └── <BotonListo>             ← PATCH → EN_CAMINO
  │
  └── (con AppLayout)
      └── sidebar con link "Cocina" (COCINA/PEDIDOS/ADMIN)
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         COCINA PAGE                                   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    useWebSocketCocina()                       │    │
│  │  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐    │    │
│  │  │ WS Init  │───▶│ Reconexión   │───▶│ Fallback Polling │    │    │
│  │  │ (JWT)    │    │ (3s, x3)     │    │ (30s)            │    │    │
│  │  └──────────┘    └──────────────┘    └──────────────────┘    │    │
│  │                                                              │    │
│  │  Output: { pedidos[], connectionStatus, error }              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    useUrgenciaTimer()                         │    │
│  │  - Recibe pedidos[], recorre cada 15s                         │    │
│  │  - Calcula urgencyLevel basado en tiempo_en_estado + offset   │    │
│  │  - Output: pedidos[] con urgencyLevel anotado                 │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  mutation: updateEstado(pedidoId, estadoNuevo)               │    │
│  │  - POST /api/v1/pedidos/{id}/estado                          │    │
│  │  - TanStack Query useMutation                                │    │
│  │  - onSuccess: WebSocket event actualizará la lista           │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────┐   ┌──────────────────┐                        │
│  │ Columna           │   │ Columna           │                       │
│  │ "Por preparar"    │   │ "En preparación"  │                       │
│  │ CONFIRMADO        │   │ EN_PREP           │                       │
│  │ ┌──┐ ┌──┐ ┌──┐    │   │ ┌──┐ ┌──┐        │                       │
│  │ │PC│ │PC│ │PC│    │   │ │PC│ │PC│        │                       │
│  │ └──┘ └──┘ └──┘    │   │ └──┘ └──┘        │                       │
│  └──────────────────┘   └──────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

## Files to Create / Modify

### New files

| File | Purpose |
|------|---------|
| `frontend/src/features/cocina/hooks/useWebSocketCocina.ts` | WebSocket + polling hook |
| `frontend/src/features/cocina/hooks/useUrgenciaTimer.ts` | Urgency calculation timer |
| `frontend/src/features/cocina/hooks/useUpdateEstado.ts` | PATCH mutation hook |
| `frontend/src/features/cocina/hooks/index.ts` | Barrel export |
| `frontend/src/features/cocina/components/PedidoCard.tsx` | Pedido card component |
| `frontend/src/features/cocina/components/ColumnaEstado.tsx` | Kanban column |
| `frontend/src/features/cocina/components/CocinaHeader.tsx` | Header with connection status |
| `frontend/src/features/cocina/components/UrgenciaBadge.tsx` | Urgency indicator |
| `frontend/src/features/cocina/components/index.ts` | Barrel export |
| `frontend/src/features/cocina/api/endpoints.ts` | Cocina API endpoints |
| `frontend/src/features/cocina/index.ts` | Feature barrel export |
| `frontend/src/pages/CocinaPage.tsx` | Page component |
| `frontend/src/features/cocina/__tests__/useWebSocketCocina.test.ts` | WS hook tests |
| `frontend/src/features/cocina/__tests__/useUrgenciaTimer.test.ts` | Timer tests |
| `frontend/src/features/cocina/__tests__/PedidoCard.test.tsx` | Card tests |

### Modified files

| File | Change |
|------|--------|
| `frontend/src/pages/index.ts` | Export `CocinaPage` |
| `frontend/src/app/Router.tsx` | Add `/cocina` route (outside AppLayout) |
| `frontend/src/widgets/Sidebar/Sidebar.tsx` | Add `cocina` group to `menuConfig` with roles `['COCINA', 'PEDIDOS', 'ADMIN']` |
| `frontend/src/shared/api/endpoints.ts` | Add `COCINA` section: `PEDIDOS_LIST`, `WS_URL` |

## Data Types

```typescript
// Estado de conexión
type ConnectionStatus = 'live' | 'reconnecting' | 'polling' | 'disconnected';

// Nivel de urgencia
type UrgencyLevel = 'normal' | 'warning' | 'urgent';

// Pedido desde API cocina
interface CocinaPedido {
  id: number;
  estado_codigo: 'CONFIRMADO' | 'EN_PREP';
  subtotal: number;
  total: number;
  notas: string | null;
  creado_en: string;          // ISO datetime
  tiempo_en_estado: number;    // segundos
  cliente_nombre: string;
  items: CocinaPedidoItem[];
}

interface CocinaPedidoItem {
  nombre_snapshot: string;
  cantidad: number;
  precio_snapshot: number;
  ingredientes_excluidos: string[];
}

// Pedido con urgencia (anotado por useUrgenciaTimer)
interface CocinaPedidoConUrgencia extends CocinaPedido {
  urgencyLevel: UrgencyLevel;
}

// Evento WebSocket
interface WSEvent {
  tipo: 'PEDIDO_CONFIRMADO' | 'PEDIDO_EN_PREPARACION' | 'PEDIDO_EN_CAMINO' | 'PEDIDO_CANCELADO' | 'PING';
  payload: {
    pedido_id: number;
    estado_anterior: string;
    estado_nuevo: string;
    timestamp: string;
    items?: CocinaPedidoItem[];
  };
}
```

## WebSocket Event Handling

```
Evento recibido → Acción en frontend:

PEDIDO_CONFIRMADO      → Agregar pedido a columna "Por preparar"
PEDIDO_EN_PREPARACION  → Mover pedido de "Por preparar" a "En preparación"
PEDIDO_EN_CAMINO       → Remover pedido del KDS (ya no está en estado cocina)
PEDIDO_CANCELADO       → Remover pedido + mostrar toast
PING                   → Responder con PONG (mantener conexión viva)
```

## API Endpoints to Add

```typescript
// frontend/src/features/cocina/api/endpoints.ts
export const COCINA_API = {
  PEDIDOS_LIST: '/cocina/pedidos',              // GET
  WS_URL: `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/api/v1/cocina/ws`,
};
```

El PATCH de estado ya existe en `API.ORDERS.UPDATE_STATUS(id)` → `/pedidos/{id}/estado`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| WebSocket puede fallar en redes inestables | Reconexión automática (3s, 3 intentos) + fallback polling (30s) |
| Timer de urgencia desincronizado | Es deliberado (RN-CO07). El backend es la fuente de verdad, el timer es visual |
| Mutation PATCH sin actualización optimista | No es necesario porque el WebSocket propagará el cambio a todos los clientes |
| Pantalla de cocina muy cargada con muchos pedidos | Scroll vertical por columna. Las tarjetas son compactas (nombre, items, tiempo) |
| Botón "Iniciar" / "Listo" presionado dos veces | Botón se deshabilita inmediatamente en `onMutate` |

## Open Questions

- ¿El layout de cocina debería tener su propio layout (header minimalista) o renderizar sin layout? → Decisión: sin AppLayout, con header propio mínimo.
- ¿Usar `window.confirm()` nativo o un modal del sistema? → Decisión: `window.confirm()` por simplicidad.
