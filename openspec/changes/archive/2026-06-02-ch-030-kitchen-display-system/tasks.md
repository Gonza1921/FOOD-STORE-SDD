# Tasks: Kitchen Display System (KDS)

## 1. Backend — KDS Service and Endpoints

- [x] 1.1 Create `CocinaService` with `get_pedidos_cocina()` method
- [x] 1.2 Create `GET /api/v1/cocina/pedidos` REST endpoint with role guard
- [x] 1.3 Create `WS /api/v1/cocina/ws` WebSocket endpoint with keepalive
- [x] 1.4 Create `ItemCocinaSchema`, `PedidoCocinaResponse` Pydantic schemas

## 2. Frontend — Core KDS Components

- [x] 2.1 Create `CocinaPage` with two-column layout (CONFIRMADO + EN_PREP)
- [x] 2.2 Create `ColumnaEstado` component for rendering a status column
- [x] 2.3 Create `PedidoCard` component with items list, total, and action buttons
- [x] 2.4 Create `UrgenciaBadge` component with color-coded time indicator
- [x] 2.5 Create `CocinaHeader` with connection status indicator

## 3. Frontend — WebSocket Integration

- [x] 3.1 Create `useWebSocketCocina` hook with auto-connect and message handling
- [x] 3.2 Implement fallback polling via REST when WebSocket disconnects
- [x] 3.3 Create `useUrgenciaTimer` hook for local timer increment
- [x] 3.4 Create `useUpdateEstado` mutation for PATCH estado transitions

## 4. Frontend — State Transitions

- [x] 4.1 Wire "Iniciar" button to transition CONFIRMADO → EN_PREP
- [x] 4.2 Wire "Listo" button to transition EN_PREP → EN_CAMINO
- [x] 4.3 Add confirmation dialogs for state transitions
- [x] 4.4 Add loading state (spinner + disabled) during API calls

## 5. Styling and Polish

- [x] 5.1 Apply dark theme optimized for kitchen monitor
- [x] 5.2 Implement responsive full-screen layout
- [x] 5.3 Add border-color urgency indication (green/yellow/red)
