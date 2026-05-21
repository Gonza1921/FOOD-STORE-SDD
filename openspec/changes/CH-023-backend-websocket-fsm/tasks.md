# Tasks: CH-023 — Backend WebSocket + FSM Delta

## Phase 1: Infraestructura WebSocket

- [ ] 1.1 Crear `backend/core/websocket_manager.py` con WebSocketManager (connect, disconnect, broadcast con asyncio.Lock)
- [ ] 1.2 Crear `backend/cocina/__init__.py`, `schemas.py`, `service.py`, `router.py` con estructura base
- [ ] 1.3 Implementar `GET /api/v1/cocina/pedidos` — query CONFIRMADO + EN_PREP con items y tiempo_en_estado
- [ ] 1.4 Implementar `WS /api/v1/cocina/ws` — handshake con JWT, validación de rol, registro en WebSocketManager
- [ ] 1.5 Agregar keepalive PING/PONG en WebSocket (30s interval, 10s timeout)

## Phase 2: FSM Autorización Granular

- [ ] 2.1 Agregar constante `TRANSICIONES_POR_ROL` en `backend/pedidos/service.py`
- [ ] 2.2 Refactor `_transicionar_estado()`: cambiar parámetro `es_admin` por `usuario_actual: Optional[Usuario]`
- [ ] 2.3 Implementar `_validar_rol_transicion()` que verifica roles contra TRANSICIONES_POR_ROL
- [ ] 2.4 Actualizar métodos públicos (`confirmar_pedido`, `transicionar_estado`, `cancelar_pedido`) para pasar usuario actual
- [ ] 2.5 Agregar `COCINA` a `require_role` en `pedidos/router.py` para endpoints de transición


## Phase 3: Publicación de Eventos

- [ ] 3.1 Implementar `_publicar_evento_cocina()` en PedidoService que determina tipo de evento según transición
- [ ] 3.2 Integrar llamado a `_publicar_evento_cocina()` después de transición exitosa en `_transicionar_estado()`
- [ ] 3.3 Agregar MAPA_EVENTOS con mapeo (desde, hasta) → tipo de evento
- [ ] 3.4 Implementar `broadcast_event()` en WebSocketManager con formato JSON tipado

## Phase 4: Integración y Registro

- [ ] 4.1 Registrar `cocina.router` en `backend/main.py`
- [ ] 4.2 Agregar método `get_all_by_estados()` en `PedidoRepository`
- [ ] 4.3 Verificar que `cancelar_pedido` y `confirmar_pedido_webhook` publican eventos correctamente

## Phase 5: Tests

- [ ] 5.1 Tests unitarios para WebSocketManager (connect, disconnect, broadcast concurrente)
- [ ] 5.2 Tests de integración para `GET /api/v1/cocina/pedidos` (con datos de prueba)
- [ ] 5.3 Tests de integración para WebSocket (conectar, recibir evento, desconectar)
- [ ] 5.4 Tests para autorización granular FSM (COCINA puede EN_PREP, no puede ENTREGAR)
- [ ] 5.5 Tests de idempotencia: eventos no rompen si no hay conexiones activas

## Phase 6: Finalización

- [ ] 6.1 Ejecutar tests existentes para verificar que refactor no rompió nada
- [ ] 6.2 Commit convencional por cada fase completada
- [ ] 6.3 Archivar change
