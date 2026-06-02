# Tasks: CH-023 — Backend WebSocket + FSM Delta

## Phase 1: Infraestructura WebSocket

- [x] 1.1 Crear `backend/core/websocket_manager.py` con WebSocketManager (connect, disconnect, broadcast con asyncio.Lock)
- [x] 1.2 Crear `backend/cocina/__init__.py`, `schemas.py`, `service.py`, `router.py` con estructura base
- [x] 1.3 Implementar `GET /api/v1/cocina/pedidos` — query CONFIRMADO + EN_PREP con items y tiempo_en_estado
- [x] 1.4 Implementar `WS /api/v1/cocina/ws` — handshake con JWT, validación de rol, registro en WebSocketManager
- [x] 1.5 Agregar keepalive PING/PONG en WebSocket (30s interval, 10s timeout)

## Phase 2: FSM Autorización Granular

- [x] 2.1 Agregar constante `TRANSICIONES_POR_ROL` en `backend/pedidos/service.py`
- [x] 2.2 Refactor `_transicionar_estado()`: cambiar parámetro `es_admin` por `usuario_actual: Optional[Usuario]`
- [x] 2.3 Implementar `_validar_rol_transicion()` que verifica roles contra TRANSICIONES_POR_ROL
- [x] 2.4 Actualizar métodos públicos (`confirmar_pedido`, `transicionar_estado`, `cancelar_pedido`) para pasar usuario actual
- [x] 2.5 Agregar `COCINA` a `require_role` en `pedidos/router.py` para endpoints de transición


## Phase 3: Publicación de Eventos

- [x] 3.1 Implementar `_publicar_evento_cocina()` en PedidoService que determina tipo de evento según transición
- [x] 3.2 Integrar llamado a `_publicar_evento_cocina()` después de transición exitosa en `_transicionar_estado()`
- [x] 3.3 Agregar MAPA_EVENTOS con mapeo (desde, hasta) → tipo de evento
- [x] 3.4 Implementar `broadcast_event()` en WebSocketManager con formato JSON tipado

## Phase 4: Integración y Registro

- [x] 4.1 Registrar `cocina.router` en `backend/main.py`
- [x] 4.2 Agregar método `get_all_by_estados()` en `PedidoRepository`
- [x] 4.3 Verificar que `cancelar_pedido` y `confirmar_pedido_webhook` publican eventos correctamente

## Phase 5: Tests

- [x] 5.1 Tests unitarios para WebSocketManager (connect, disconnect, broadcast concurrente)
- [~] 5.2 Tests de integración para `GET /api/v1/cocina/pedidos` (requiere DB)
- [~] 5.3 Tests de integración para WebSocket (conectar, recibir evento) (requiere DB)
- [x] 5.4 Tests para autorización granular FSM (COCINA puede EN_PREP, no puede ENTREGAR)
- [x] 5.5 Tests de idempotencia: eventos no rompen si no hay conexiones activas

## Phase 6: Finalización

- [x] 6.1 Ejecutar tests existentes para verificar que refactor no rompió nada
- [x] 6.2 Commit convencional por cada fase completada
- [x] 6.3 Archivar change
