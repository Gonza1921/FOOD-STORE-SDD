# CH-023: Backend WebSocket + FSM Delta

## Propuesta

### Qué
Implementar la infraestructura de **tiempo real** para el Kitchen Display System mediante:
1. **Endpoint WebSocket** autenticado con JWT en `/api/v1/cocina/ws`
2. **Sistema de eventos en-proceso** (pub/sub asincrónico sin Redis)
3. **Delta del FSM** para autorizar transiciones `CONFIRMADO → EN_PREP` y `EN_PREP → EN_CAMINO` por rol `COCINA`
4. **Endpoint REST** de fallback `GET /api/v1/cocina/pedidos` para carga inicial y polling
5. **Validación granular** de autorización (RN-CO03): el servicio del FSM rechaza transiciones no autorizadas

### Por qué
Food Store hoy es REST puro. El KDS requiere push en tiempo real para que los cocineros vean pedidos nuevos al instante sin recargar. Esto es la **diferencia entre un Kitchen Display System operativo y uno inutilizable**. 

La v1 es single-instance: usamos pub/sub en proceso (`asyncio` + un `set` de WebSockets activos), sin Redis. Esto es suficiente para un negocio de delivery pequeño a mediano. Documentamos claramente el límite: si escalan a multi-instancia, necesitarán un bus externo.

### Alcance
**Incluye:**
- Gestor de conexiones WebSocket en `/app/core/websocket_manager.py`
- Endpoint WebSocket con autenticación JWT en `/app/routers/cocina.py`
- Delta del FSM: nueva autorización por rol en `avanzar_estado()` (RN-CO03)
- Publicación de eventos cuando un pedido cambia de estado (PEDIDO_CONFIRMADO, PEDIDO_EN_PREPARACION, PEDIDO_EN_CAMINO, PEDIDO_CANCELADO)
- Endpoint REST `GET /api/v1/cocina/pedidos` (retorna lista ordenada por antigüedad)
- Tests de integración: WebSocket y FSM con roles
- Documentación de límites (single-instance, necesidad futura de Redis)

**No incluye:**
- Frontend / pantalla React (eso es CH-024)
- Alerta sonora o urgencia visual (eso es CH-025)
- Reutilización de Producto.disponible (eso es CH-025, optional)

### Dependencias
- **C-02 auth**: requiere JWT, `require_role`
- **C-08 pedidos**: requiere FSM, `HistorialEstadoPedido`
- **C-09 pagos**: requiere que exista la transición `PENDIENTE → CONFIRMADO`
- **CH-022**: requiere que exista rol `COCINA` en BD

### Decisión de Diseño Pendiente (Documentar en design.md)
**WebSocket vs SSE**: 
- Decisión actual: **WebSocket** (full-duplex, permite futuro di-dirección)
- Alternativa: **Server-Sent Events** (simplex, más ligero para push puro)
- Tu elección debe estar **justificada en design.md** con tradeoffs explícitos

### Riesgos
- **Medio**: WebSocket es infraestructura nueva, requiere manejo cuidadoso de concurrencia con `asyncio`
- **Bajo**: El FSM ya existe; solo agregamos validación de rol. Cambio conservador
- **Conocido**: single-instance pub/sub no escala a múltiples workers. Documentado como límite v1

### Decisiones Tomadas
1. No hay tabla nueva (reutilizamos `Pedido`, `DetallePedido`, `HistorialEstadoPedido`)
2. Timer de urgencia se calcula **en el cliente** (no en BD) para evitar carga de query
3. Evento `PEDIDO_CONFIRMADO` se publica cuando pago aprobado → transición `PENDIENTE → CONFIRMADO`
4. Best-effort: si no hay conexiones WebSocket activas, el evento se descarta (sin error)

## Historias de Usuario Cubiertas
- **US-COCINA-01**: Pantalla de cocina en tiempo real (endpoint y arquitectura)
- **US-COCINA-02**: Iniciar preparación (FSM + autorización)
- **US-COCINA-03**: Marcar terminado (FSM + autorización)
- **US-COCINA-04** (parcial): require_role en endpoints
- **US-COCINA-08**: Fallback por polling
- **US-COCINA-09**: Auditoría (reutiliza HistorialEstadoPedido)

## Referencias de Entrada
- `openspec/feature-display-cocina-reference/02_modelo_y_reglas.md` (secciones B, C, D)
- `docs/knowledge-base/05_reglas_de_negocio.md` (RN-CO01..RN-CO08)
- `docs/knowledge-base/07_flujos_principales.md` (Flujo 5 — Avance de FSM)
- `docs/knowledge-base/08_arquitectura_propuesta.md` (capas de backend)

## Estimación
- **Tamaño**: Grande (32-40 horas)
- **Esfuerzo**: WebSocket + pub/sub + delta FSM + tests de integración
- **Testing**: Integración con BD real; WebSocket con TestClient de FastAPI

## Siguientes Steps
Después de este change aprobado:
1. **CH-024**: Frontend KDS (requiere este change completamente funcional)
2. **CH-025**: Features opcionales
