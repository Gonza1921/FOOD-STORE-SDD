# Design: ch-008-pedidos — Frontend Module

## Overview

Este documento describe el diseño técnico del frontend para el módulo de pedidos (CH-008), que completa el frontend faltante para el backend ya implementado. Sigue los patrones FSD (Feature-Sliced Design) del proyecto y el stack existente: React 18, TypeScript, TanStack Query, Zustand, Tailwind CSS, React Router.

## Feature Structure

```
frontend/src/features/pedidos/
├── api/
│   └── endpoints.ts        # API functions + query keys + types
├── hooks/
│   ├── index.ts            # Barrel exports
│   ├── usePedidos.ts       # Query: list user's orders
│   ├── usePedidoDetail.ts  # Query: single order detail
│   └── usePedidoMutations.ts # Mutations: create, confirm, transition state
├── components/
│   ├── index.ts            # Barrel exports (page-level)
│   ├── OrdersPage.tsx      # User's order history list
│   ├── OrderDetailPage.tsx # Single order detail view
│   └── AdminOrdersPage.tsx # Admin: list all, filter, change states
└── index.ts                # Public API barrel
```

## Data Flow

```
CartStore (Zustand)                Backend API
     │                                  │
     │  Items                           │
     ▼                                  ▼
[Checkout/Cart] ──POST /pedidos──> [PedidoService]
                                        │
                                   GET /pedidos
                                        │
                                        ▼
[OrdersPage] ◄──TanStack Query── [PedidoListResponse]
                                        │
                                   GET /pedidos/{id}
                                        │
                                        ▼
[OrderDetailPage] ◄──TanStack Query── [PedidoResponse]
                                        │
                              PATCH /{id}/estado (admin)
                              POST /{id}/confirmar (admin)
                                        │
                                        ▼
[AdminOrdersPage] ◄──TanStack Query── [PedidoAdminListResponse]
```

## API Endpoints Layer

File: `frontend/src/features/pedidos/api/endpoints.ts`

### Types

```typescript
// Matches backend schemas
PedidoItemCreate   { producto_id: number; cantidad: number }
PedidoCreate       { items: PedidoItemCreate[] }
PedidoItemResponse { id: number; producto_id: number; cantidad: number; precio_unitario: string; subtotal: string }
PedidoResponse     { id: number; usuario_id: number; estado: string; total: string; items: PedidoItemResponse[]; creado_en: string; actualizado_en: string }
PedidoListResponse { items: PedidoResponse[]; total: number; skip: number; limit: number }
PedidoEstadoUpdate { estado: string }
PedidoSummary      { id: number; usuario_id: number; estado: string; total: string; creado_en: string }
```

### Query Keys

```typescript
PEDIDO_QUERY_KEYS = {
  all: ['pedidos'] as const,
  lists: () => [...PEDIDO_QUERY_KEYS.all, 'list'] as const,
  list: (params) => [...PEDIDO_QUERY_KEYS.lists(), params] as const,
  details: () => [...PEDIDO_QUERY_KEYS.all, 'detail'] as const,
  detail: (id) => [...PEDIDO_QUERY_KEYS.details(), id] as const,
  admin: () => [...PEDIDO_QUERY_KEYS.all, 'admin'] as const,
  adminList: (params) => [...PEDIDO_QUERY_KEYS.admin(), params] as const,
}
```

### API Functions

| Function | Endpoint | Auth | Description |
|----------|----------|------|-------------|
| `listPedidos(skip, limit)` | GET /pedidos | JWT | User's orders (paginated) |
| `getPedidoDetail(id)` | GET /pedidos/{id} | JWT | Single order detail |
| `createPedido(data)` | POST /pedidos | JWT | Create order from cart |
| `confirmPedido(id)` | POST /pedidos/{id}/confirmar | ADMIN/PEDIDOS | Confirm order |
| `updatePedidoEstado(id, estado)` | PATCH /pedidos/{id}/estado | ADMIN/PEDIDOS | Transition state |
| `listAllPedidos(skip, limit, estado?)` | GET /pedidos/admin/todos | ADMIN | List all orders |

## Hooks Layer

### usePedidos (Query)
- **Params**: `skip`, `limit`, `enabled`
- **Returns**: `{ data, isLoading, isError, error, refetch, total, page, totalPages }`
- **Pattern**: Matches `useProducts` exactly

### usePedidoDetail (Query)
- **Params**: `id`, `enabled`
- **Returns**: `{ data, isLoading, isError, error, refetch }`
- **Pattern**: Matches `useProductDetail` exactly

### usePedidoMutations (Mutations)
- **createPedido**: invalidates `lists` + `admin`
- **confirmPedido**: invalidates `detail(id)` + `lists` + `admin`
- **updatePedidoEstado**: invalidates `detail(id)` + `lists` + `admin`

## Components

### OrdersPage — User's Order History
- Path: `/mis-pedidos`
- Role: Any authenticated user
- Layout: Premium glass container with header
- States: Loading (skeleton), Empty (illustration + CTA), Error (retry), Data (card list)
- Pagination: Skip/Limit navigation with prev/next
- Content: Order cards with: ID, date, total, status badge (color-coded), item count
- Actions: Click card → navigate to detail

### OrderDetailPage — Single Order Detail
- Path: `/mis-pedidos/:id`
- Role: Any authenticated user (owner only)
- Layout: Premium glass container, back button, detail sections
- States: Loading (skeleton), Error (not found/forbidden), Data
- Content: Order header (ID, date, status), items table (product, qty, price, subtotal), total summary, status timeline
- Actions: Back to orders list

### AdminOrdersPage — Admin Order Management
- Path: `/admin/pedidos`
- Role: ADMIN, PEDIDOS
- Layout: Dashboard-style with filter bar
- States: Loading, Empty, Error, Data
- Features: Filter by status dropdown, paginated list, action buttons per order
- Admin actions: Confirm order, transition state (dropdown/select)
- Content: Order table with: ID, user, date, total, status (with status badge), actions

## Routing

Add to `Router.tsx`:

```tsx
// User routes (inside AppLayout)
<Route
  path="/mis-pedidos"
  element={
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/mis-pedidos/:id"
  element={
    <ProtectedRoute>
      <OrderDetailPage />
    </ProtectedRoute>
  }
/>

// Admin routes (inside AppLayout)
<Route
  path="/admin/pedidos"
  element={
    <ProtectedRoute roles={['ADMIN', 'PEDIDOS']}>
      <AdminOrdersPage />
    </ProtectedRoute>
  }
/>
```

## Sidebar Navigation

Add to `Sidebar.tsx` navItems:
```tsx
{ path: '/mis-pedidos', label: 'Mis Pedidos', icon: 'receipt_long', roles: [] },
{ path: '/admin/pedidos', label: 'Pedidos', icon: 'assignment', roles: ['ADMIN', 'PEDIDOS'] },
```

## Pages Barrel (`pages/index.ts`)

Add exports:
```typescript
export { OrdersPage, OrderDetailPage, AdminOrdersPage } from '@/features/pedidos';
```

## Features Barrel (`features/index.ts`)

Add:
```typescript
export { OrdersPage, OrderDetailPage, AdminOrdersPage } from './pedidos';
```

## State Management

- **Cart → Order flow**: `useCartStore.items` → map to `PedidoItemCreate[]` → `createPedido()` mutation → on success `clearCart()`
- **No new Zustand store**: All server state via TanStack Query; client state for cart already exists

## Status Badge Colors

| Estado | Color |
|--------|-------|
| PENDIENTE | `bg-amber-100 text-amber-800` (warning) |
| CONFIRMADO | `bg-blue-100 text-blue-800` (info) |
| EN_PREP | `bg-indigo-100 text-indigo-800` (processing) |
| EN_CAMINO | `bg-purple-100 text-purple-800` (in transit) |
| ENTREGADO | `bg-green-100 text-green-800` (success) |
| CANCELADO | `bg-red-100 text-red-800` (error) |

## Order of Implementation

1. `pedidos/api/endpoints.ts` — Types, query keys, API functions
2. `pedidos/hooks/` — TanStack Query hooks
3. `pedidos/components/OrdersPage.tsx` — User order history
4. `pedidos/components/OrderDetailPage.tsx` — Order detail
5. `pedidos/components/AdminOrdersPage.tsx` — Admin management
6. `pedidos/index.ts` — Feature barrel
7. Update `pages/index.ts` — Pages barrel
8. Update `features/index.ts` — Features barrel
9. Update `Router.tsx` — Add routes
10. Update `Sidebar.tsx` — Add nav items

## Acceptance Criteria

1. ✅ User can see their order history at /mis-pedidos
2. ✅ User can view order detail at /mis-pedidos/:id
3. ✅ Admin can list all orders with status filter at /admin/pedidos
4. ✅ Admin can confirm orders (PENDIENTE → CONFIRMADO) with stock decrement
5. ✅ Admin can transition order states following FSM
6. ✅ Status badges show correct colors per estado
7. ✅ Loading states show skeletons
8. ✅ Error states show retry option
9. ✅ Empty states show helpful message
10. ✅ Responsive layout (mobile + desktop)
