# Proposal: ch-008-pedidos

## Why

El módulo de pedidos es central para el e-commerce Food Store. Actualmente no existe implementación de pedidos y es necesario construir la base estructural para desbloquear las siguientes funcionalidades: integración con pagos (MercadoPago), control de stock, y dashboard de admin. Este change implementa la primera mitad del módulo: modelos, FSM base, migraciones, y CRUD básico.

## What Changes

- Crear modelos `Pedido` y `PedidoItem` en `backend/models/`
- Definir enum de estados FSM: PENDIENTE, PAGADO, PREPARANDO, ENVIADO, ENTREGADO, CANCELADO
- Crear migraciones Alembic para las nuevas tablas
- Implementar Repository y Unit of Work para pedidos
- Implementar Service layer con lógica básica
- Crear Routers: POST /pedidos, GET /pedidos, GET /pedidos/{id}
- Implementar schemas Pydantic: Create, Response, validation básica
- Calcular subtotal por item y total automáticamente
- Generar archivos OpenSpec: proposal.md, tasks.md, spec.md

## Capabilities

### New Capabilities
- `pedidos`: Sistema de gestión de pedidos con CRUD básico, persistencia en PostgreSQL, y estructura FSM lista para拡張ión futura

### Modified Capabilities
- Ninguna — el módulo de pedidos es completamente nuevo

## Impact

- `backend/models/pedido.py` — nuevo archivo con modelos SQLModel
- `backend/repositories/pedido.py` — nuevo Repository pattern
- `backend/services/pedido.py` — nuevo Service layer
- `backend/routers/pedido.py` — nuevo Router REST
- `backend/schemas/pedido.py` — nuevo Schemas Pydantic
- `backend/core/unit_of_work.py` — registrar nuevo UoW
- `migrations/versions/` — nuevas migraciones Alembic
- `openspec/changes/ch-008-pedidos/` — archivos OpenSpec

## Scope

### In Scope
- Modelos Pedido y PedidoItem con campos mínimos
- Enum de estados FSM (6 estados)
- Relaciones y foreign keys
- Migraciones Alembic
- Repository pattern
- Service layer básico
- CRUD endpoints (POST, GET, GET /{id})
- Cálculo automático de subtotal y total
- Schemas Pydantic con validación básica

### Out of Scope (para esta etapa)
- Validaciones avanzadas de transiciones FSM
- Control de stock
- Permisos admin
- Cancelaciones
- Tests complejos
- Integración con MercadoPago
- Endpoint PUT/PATCH/DELETE
- Historial de estados

## Complexity & Risks

- **Complexity**: Medium — requiere seguir arquitectura existente cuidadosamente
- **Risks**:
  - Integración con modelos existentes (User, Producto)
  - Foreign keys y relaciones deben ser correctas
  - Calcular totales consistente entre frontend y backend
- **Mitigation**: Seguir patrones exactly de módulos anteriores (productos, auth)

## Dependencies

- **Upstream**: CH-004 (backend patterns), CH-005 (auth), CH-007 (productos)
- **Downstream**: CH-009 (transiciones FSM), CH-010 (integración pagos), CH-011 (control stock)