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

## Verificación con DB

- [ ] Los endpoints funcionan con datos reales
- [ ] Las transiciones FSM se ejecutan correctamente
- [ ] El stock se descuenta adecuadamente
- [ ] Los permisos se aplican correctamente