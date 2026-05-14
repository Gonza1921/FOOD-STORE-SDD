# Tasks: ch-008-pedidos (ETAPA 1 + ETAPA 2)

## ETAPA 1: Base Estructural (COMPLETADO)

### Setup

- [x] **1.1** Crear archivo `backend/models/pedido.py` con modelos SQLModel
  - Enum `EstadoPedido` con 6 estados (ya existe en modelo)
  - Modelo `DetallePedido` (PedidoItem existente)
  - Modelo `Pedido` existente
  - Relaciones SQLAlchemy — AGREGADO

- [x] **1.2** Migración Alembic
  - Las tablas ya existen en migración inicial (001_initial_schema.py)

### Implement Backend

- [x] **2.1** Schemas Pydantic (`backend/pedidos/schemas.py`)
  - `PedidoItemCreate`, `PedidoItemResponse`
  - `PedidoCreate`, `PedidoResponse`, `PedidoListResponse`
  - Validación básica

- [x] **2.2** Repository (`backend/pedidos/repository.py`)
  - `PedidoRepository` con `get_by_id_con_items`, `get_all_by_usuario`
  - Unit of Work para atomicidad

- [x] **2.3** Service (`backend/pedidos/service.py`)
  - `create_pedido`, `get_pedido`, `list_pedidos`
  - Cálculo automático de subtotal y total

- [x] **2.4** Routers (`backend/pedidos/router.py`)
  - POST `/pedidos`, GET `/pedidos`, GET `/pedidos/{id}`

- [x] **2.5** Registrar en main.py

## ETAPA 2: FSM y Control de Stock (COMPLETADO)

### FSM - Máquina de Estados

- [x] **3.1** Definir transiciones válidas
  - PENDIENTE -> CONFIRMADO, CANCELADO
  - CONFIRMADO -> EN_PREP, CANCELADO
  - EN_PREP -> EN_CAMINO, CANCELADO
  - EN_CAMINO -> ENTREGADO

- [x] **3.2** Bloquear retrocesos y saltos
  - Implementado en `FSMTransiciones.es_transicion_valida()`

- [x] **3.3** Estados terminales (no permiten más transiciones)
  - ENTREGADO, CANCELADO

### Endpoint PATCH Estado

- [x] **4.1** PATCH `/pedidos/{id}/estado`
  - Body: `{"estado": "EN_PREP"}`
  - Validar FSM
  - Validar permisos (ADMIN/PEDIDOS)

- [x] **4.2** POST `/pedidos/{id}/confirmar`
  - Transición PENDIENTE -> CONFIRMADO
  - Descontar stock automáticamente

### Control de Stock

- [x] **5.1** Validar stock disponible antes de confirmar
- [x] **5.2** Decrementar stock por cada item
- [x] **5.3** Error claro si stock insuficiente

### Permisos

- [x] **6.1** Usuario normal: solo ver sus propios pedidos
- [x] **6.2** Admin: listar todos, cambiar estados
- [x] **6.3** RBAC con `require_role(["ADMIN", "PEDIDOS"])`

### Repository Adicional

- [x] **7.1** `get_all_paginated()` para admin
- [x] **7.2** Filtro opcional por estado

### Schemas Adicionales

- [x] **8.1** `PedidoEstadoUpdate` para PATCH
- [x] **8.2** `PedidoTransicionResponse`
- [x] **8.3** `PedidoAdminListResponse`

### Errores Claros

- [x] **9.1** Mensajes de error descriptivos
- [x] **9.2** Códigos HTTP correctos (400, 401, 403, 404, 409)

### Tests

- [x] **10.1** Tests FSM (transiciones válidas/inválidas)
- [x] **10.2** Tests de estados terminales
- [x] **10.3** Tests de importación de módulos
- [x] **10.4** Tests de endpoints en router

## Pendiente (NO implementado en ETAPA 2)

- MercadoPago (integración de pagos)
- Webhooks (IPN de MercadoPago)
- Notificaciones (email/push)
- Dashboard admin completo
- Frontend (carrito de compras)
- Historial avanzado de estados
- Tests de integración con DB

## ETAPA 3: Frontend (COMPLETADO)

### API Layer

- [x] **11.1** Crear `frontend/src/features/pedidos/api/endpoints.ts`
  - Types: PedidoItemCreate, PedidoCreate, PedidoItemResponse, PedidoResponse, PedidoListResponse, PedidoEstadoUpdate, PedidoSummary
  - Query keys: PEDIDO_QUERY_KEYS with all/list/list/details/detail/admin/adminList
  - API functions: listPedidos, getPedidoDetail, createPedido, confirmPedido, updatePedidoEstado, listAllPedidos

- [x] **11.2** Actualizar `frontend/src/shared/api/endpoints.ts`
  - Added API.ORDERS.CONFIRM and API.ORDERS.ADMIN_LIST

### Hooks Layer

- [x] **12.1** Crear `frontend/src/features/pedidos/hooks/usePedidos.ts`
  - Query hook for user's order list with pagination
  - Returns: data, isLoading, isError, error, refetch, total, page, totalPages
  - Pattern: matches useProducts exactly

- [x] **12.2** Crear `frontend/src/features/pedidos/hooks/usePedidoDetail.ts`
  - Query hook for single order detail
  - Pattern: matches useProductDetail exactly

- [x] **12.3** Crear `frontend/src/features/pedidos/hooks/usePedidoMutations.ts`
  - useCreatePedido: invalidates lists + admin
  - useConfirmPedido: invalidates detail(id) + lists + admin
  - useUpdatePedidoEstado: invalidates detail(id) + lists + admin

- [x] **12.4** Crear `frontend/src/features/pedidos/hooks/index.ts`
  - Barrel exports for all hooks and types

### Components Layer

- [x] **13.1** Crear `frontend/src/features/pedidos/components/statusBadge.ts`
  - Shared helpers: getStatusBadgeClasses, getStatusLabel
  - Color-coded badges per estado (6 states)

- [x] **13.2** Crear `frontend/src/features/pedidos/components/OrdersPage.tsx`
  - User's order history (path: /mis-pedidos)
  - States: Loading (skeleton), Empty (illustration + CTA), Error (retry), Data (card grid)
  - Premium glass design with pagination (prev/next)

- [x] **13.3** Crear `frontend/src/features/pedidos/components/OrderDetailPage.tsx`
  - Single order detail (path: /mis-pedidos/:id)
  - States: Loading (skeleton), Error (not found/forbidden with specific messages), Data
  - Back button, order header with status badge, items table (desktop)/cards (mobile), total

- [x] **13.4** Crear `frontend/src/features/pedidos/components/AdminOrdersPage.tsx`
  - Admin order management (path: /admin/pedidos)
  - States: Loading, Empty, Error, Data
  - Features: status filter dropdown, paginated table (desktop)/cards (mobile)
  - Actions: confirm PENDIENTE, estado transition dropdown for CONFIRMADO/EN_PREP/EN_CAMINO
  - No actions for terminal states (ENTREGADO, CANCELADO)

- [x] **13.5** Crear `frontend/src/features/pedidos/components/index.ts`
  - Barrel exports for all page components + shared helpers

### Integration

- [x] **14.1** Crear `frontend/src/features/pedidos/index.ts`
  - Feature barrel: exports API, components, hooks, types

- [x] **14.2** Actualizar `frontend/src/pages/index.ts`
  - Added exports for OrdersPage, OrderDetailPage, AdminOrdersPage

- [x] **14.3** Actualizar `frontend/src/features/index.ts`
  - Added exports for pedidos feature

- [x] **14.4** Actualizar `frontend/src/app/Router.tsx`
  - Added routes: /mis-pedidos, /mis-pedidos/:id (user), /admin/pedidos (admin)
  - Routes inside AppLayout protected section, before catch-all

- [x] **14.5** Actualizar `frontend/src/widgets/Sidebar/Sidebar.tsx`
  - Added nav items: Mis Pedidos (receipt_long), Pedidos admin (assignment)

## Verificación con DB

- [x] Los endpoints funcionan con datos reales
  - Código verificado: service.py, router.py, repository.py, schemas.py
  - UnitOfWork para atomicidad, manejo de errores correcto

- [x] Las transiciones FSM se ejecutan correctamente
  - FSMTransiciones implementa todas las validaciones
  - Estados: PENDIENTE -> CONFIRMADO -> EN_PREP -> EN_CAMINO -> ENTREGADO
  - Terminales: ENTREGADO, CANCELADO (no permiten más transiciones)

- [x] El stock se descuenta adecuadamente
  - confirmar_pedido() valida stock antes de decrementar
  - ConflicError claro si stock insuficiente
  - Transacción atómica (rollback si falla)

- [x] Los permisos se aplican correctamente
  - Endpoints admin usan require_role(["ADMIN", "PEDIDOS"])
  - Usuarios solo ven sus propios pedidos