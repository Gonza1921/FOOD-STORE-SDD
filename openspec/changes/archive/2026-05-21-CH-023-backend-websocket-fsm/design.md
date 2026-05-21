# Design: CH-023 — Backend WebSocket + FSM Delta

## Architecture Overview

Se agrega una **capa de tiempo real** al backend single-instance. No se cambia la arquitectura general (capas, UoW, repositorios). Los cambios son:

1. **Nuevo módulo**: `backend/core/websocket_manager.py` — gestor de conexiones WebSocket in-process
2. **Nuevo módulo**: `backend/cocina/` — router REST + WebSocket para el KDS
3. **Refactor menor**: `backend/pedidos/service.py` — autorización granular por rol + publicación de eventos

**Decisión: WebSocket vs SSE**
- Elegimos **WebSocket** (full-duplex) porque:
  - Permite que el KDS envíe señales al servidor en el futuro (ej: acknowledge de recepción, keepalive bidireccional)
  - El frontend puede reconectar automáticamente sin pérdida de contexto
  - FastAPI tiene soporte nativo con `WebSocket` + `WebSocketDisconnect`
  - SSE es más simple pero simplex (solo servidor→cliente)
- **Tradeoff**: WebSocket requiere manejo explícito de estados de conexión (conectado, reconectando, caído) en el frontend

**Decisión: Single-instance pub/sub**
- Usamos un `set[WebSocket]` protegido con `asyncio.Lock`
- Sin Redis, sin base de datos externa
- **Límite documentado**: no escala horizontalmente a múltiples workers. Si el negocio crece, migrar a Redis Pub/Sub

## Componentes

### WebSocketManager
- **Responsabilidad**: Gestiona conexiones WebSocket activas y broadcast de eventos
- **Ubicación**: `backend/core/websocket_manager.py`
- **Patrón**: Singleton de módulo (instancia global)
- **Interface**:
  ```python
  class WebSocketManager:
      async def connect(self, websocket: WebSocket)  # Registra conexión
      async def disconnect(self, websocket: WebSocket)  # Elimina conexión
      async def broadcast(self, message: dict)  # Envía a TODAS las conexiones activas
      async def broadcast_event(self, tipo: str, payload: dict)  # Envía evento tipado
      @property
      def active_connections(self) -> int  # Cantidad de conexiones activas
  ```
- **Thread safety**: `asyncio.Lock` para todas las operaciones sobre el set
- **Error handling**: Si un `send_json()` falla (cliente desconectado), se llama a `disconnect()` automáticamente

### Cocina Router
- **Responsabilidad**: Endpoints REST y WebSocket para el KDS
- **Ubicación**: `backend/cocina/router.py`
- **Endpoints**:

  | Método | Path | Auth | Propósito |
  |--------|------|------|-----------|
  | GET | `/api/v1/cocina/pedidos` | `require_role(["COCINA","PEDIDOS","ADMIN"])` | REST fallback — lista pedidos activos |
  | WS | `/api/v1/cocina/ws` | JWT query param + role check | WebSocket para tiempo real |

- **GET /cocina/pedidos**:
  - Query: `SELECT pedidos WHERE estado_codigo IN ('CONFIRMADO', 'EN_PREP') ORDER BY ...`
  - Orden: por `HistorialEstadoPedido.created_at` del estado actual (ASC)
  - Calcula `tiempo_en_estado` = NOW() - `created_at` del historial actual
  - Retorna: `list[PedidoCocinaResponse]`

- **WS /cocina/ws**:
  - Extrae JWT de `query_params["token"]`
  - Valida JWT con `verify_token()` (reutiliza lógica existente)
  - Valida rol con `require_role(["COCINA","PEDIDOS","ADMIN"])`
  - Si válido: `websocket_manager.connect(websocket)`, loop de receive (keepalive)
  - Si inválido: cierra con código 1008
  - Al desconectar: `websocket_manager.disconnect(websocket)`
  - Keepalive: envía `{"tipo": "PING"}` cada 30s, espera `{"tipo": "PONG"}` 10s

### Cocina Schemas
- **Responsabilidad**: Schemas de request/response para endpoints de cocina
- **Ubicación**: `backend/cocina/schemas.py`

```python
class ItemCocinaSchema(BaseModel):
    nombre_snapshot: str
    cantidad: int
    precio_snapshot: Decimal
    ingredientes_excluidos: Optional[str]  # JSON string con IDs

class PedidoCocinaResponse(BaseModel):
    id: int
    estado_codigo: str  # 'CONFIRMADO' | 'EN_PREP'
    subtotal: Decimal
    total: Decimal
    notas: Optional[str]
    creado_en: datetime
    items: list[ItemCocinaSchema]
    tiempo_en_estado: int  # segundos
    cliente_nombre: str  # usuario.nombre + usuario.apellido
```

### FSM — Autorización granular

**Cambio en `backend/pedidos/service.py`:**

1. **Nueva constante** `TRANSICIONES_POR_ROL`:
```python
TRANSICIONES_POR_ROL: dict[tuple[str, str], set[str]] = {
    ("PENDIENTE", "CONFIRMADO"): set(),          # Solo sistema (webhook)
    ("PENDIENTE", "CANCELADO"): {"CLIENT", "PEDIDOS", "ADMIN"},
    ("CONFIRMADO", "EN_PREP"):  {"COCINA", "PEDIDOS", "ADMIN"},
    ("CONFIRMADO", "CANCELADO"): {"PEDIDOS", "ADMIN"},
    ("EN_PREP", "EN_CAMINO"):   {"COCINA", "PEDIDOS", "ADMIN"},
    ("EN_PREP", "CANCELADO"):   {"ADMIN"},
    ("EN_CAMINO", "ENTREGADO"): {"PEDIDOS", "ADMIN"},
}
```

2. **Refactor `_transicionar_estado()`**:
   - Cambia parámetro `es_admin: bool` → `usuario_actual: Optional[Usuario]`
   - Nueva lógica de validación:
     ```python
     @staticmethod
     def _validar_rol_transicion(desde: str, hasta: str, roles: set[str]) -> bool:
         """Valida si algún rol del usuario está autorizado para esta transición."""
         permitidos = TRANSICIONES_POR_ROL.get((desde, hasta), set())
         if not permitidos:
             return False  # Transición solo de sistema (CONFIRMADO)
         return bool(roles & permitidos)
     ```
   - Si `usuario_actual is None` (operación de sistema): salta validación de roles
   - Si `usuario_actual` no tiene roles autorizados: `raise HTTPException(403, "Rol no autorizado para esta transición")`

3. **Publicación de eventos**:
   - Después de `session.flush()` exitosa, determina tipo de evento según transición
   - Llama a `websocket_manager.broadcast_event(tipo, payload)`
   - Wrap en try/except para que no rompa la transición si falla el broadcast

### Event Flow (Secuencia)

```
Cliente KDS          FastAPI             PedidoService       WebSocketManager    DB
   │                    │                     │                    │              │
   │──WS /cocina/ws────>│                     │                    │              │
   │                    │──validate JWT──────>│                    │              │
   │                    │<───ok───────────────│                    │              │
   │                    │───connect()─────────────────────────────>│              │
   │<──accept───────────│                     │                    │              │
   │                    │                     │                    │              │
   │                    │   (alguien paga)    │                    │              │
   │                    │──PATCH /estado──────>│                    │              │
   │                    │                     │──update estado────>│             │
   │                    │                     │<──ok───────────────│             │
   │                    │                     │──broadcast_event()─>│             │
   │<──PEDIDO_CONFIRMADO──────────────────────│                    │              │
```

### Cocina Service
- **Responsabilidad**: Lógica de negocio para obtener pedidos de cocina
- **Ubicación**: `backend/cocina/service.py`
- **Métodos**:
  - `get_pedidos_cocina()`: Query CONFIRMADO + EN_PREP con items y tiempo en estado
  - Usa `PedidoRepository.get_all_by_estados(estados)` (nuevo método)
  - Calcula `tiempo_en_estado` desde `HistorialEstadoPedido`

## API Changes

### Nuevos endpoints

| Método | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/cocina/pedidos` | Lista pedidos activos en cocina |
| `WS` | `/api/v1/cocina/ws?token=<JWT>` | WebSocket de tiempo real |

### Endpoints modificados

| Método | Path | Cambio |
|--------|------|--------|
| `PATCH` | `/api/v1/pedidos/{id}/estado` | Agregar `COCINA` a `require_role(["ADMIN","PEDIDOS","COCINA"])` |
| `POST` | `/api/v1/pedidos/{id}/confirmar` | (sin cambios — solo ADMIN/PEDIDOS confirman) |

## Data Model

**Sin cambios en esquema de BD.** Se reutilizan:
- `Pedido` — filtrado por `estado_codigo IN ('CONFIRMADO', 'EN_PREP')`
- `DetallePedido` — items con snapshots
- `HistorialEstadoPedido` — para calcular `tiempo_en_estado` y registrar transiciones
- `Usuario`, `Rol`, `UsuarioRol` — para autorización granular

## Archivos a Modificar/Crear

| Archivo | Acción | Propósito |
|---------|--------|-----------|
| `backend/core/websocket_manager.py` | **CREAR** | Gestor de conexiones + broadcast |
| `backend/cocina/__init__.py` | **CREAR** | Package init |
| `backend/cocina/router.py` | **CREAR** | Endpoints REST + WebSocket |
| `backend/cocina/service.py` | **CREAR** | Lógica de consulta para KDS |
| `backend/cocina/schemas.py` | **CREAR** | Schemas de respuesta |
| `backend/pedidos/service.py` | **MODIFICAR** | Autorización granular + eventos |
| `backend/pedidos/router.py` | **MODIFICAR** | Agregar COCINA a require_role |
| `backend/pedidos/repository.py` | **MODIFICAR** | Agregar método get_all_by_estados |
| `backend/main.py` | **MODIFICAR** | Registrar cocina router |
| `backend/tests/test_cocina_ws.py` | **CREAR** | Tests WebSocket |
| `backend/tests/test_cocina_rest.py` | **CREAR** | Tests REST endpoint |
| `backend/tests/test_fsm_auth.py` | **CREAR** | Tests autorización granular |

## Implementation Notes

### WebSocket Auth Flow Detallado
```python
@router.websocket("/cocina/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    
    try:
        payload = verify_token(token, token_type="access")
        user = await get_user_by_id(payload["sub"])
        roles = {rol.codigo for rol in user.roles}
        if not roles & {"COCINA", "PEDIDOS", "ADMIN"}:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return
    
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("tipo") == "PONG":
                continue  # Keepalive response
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket)
```

### Calculando tiempo_en_estado
```sql
SELECT h.created_at
FROM historial_estado_pedido h
WHERE h.pedido_id = :pid
  AND h.estado_nuevo = :estado_actual
ORDER BY h.created_at DESC
LIMIT 1;
-- tiempo_en_estado = NOW() - created_at (en segundos)
```

### Mapa de eventos por transición
```python
MAPA_EVENTOS = {
    ("PENDIENTE", "CONFIRMADO"): "PEDIDO_CONFIRMADO",
    ("CONFIRMADO", "EN_PREP"):   "PEDIDO_EN_PREPARACION",
    ("EN_PREP", "EN_CAMINO"):    "PEDIDO_EN_CAMINO",
}

# Para cancelación: evento solo si estaba en fase cocina
if nuevo_estado == "CANCELADO" and estado_anterior in ("CONFIRMADO", "EN_PREP"):
    tipo_evento = "PEDIDO_CANCELADO"
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| WebSocket sin conexión activa: evento se pierde | Best-effort v1. Documentado como límite. Polling REST como respaldo |
| broadcast() lento bloquea la transición | try/except alrededor del broadcast. Timeout de 1s por conexión |
| Múltiples conexiones simultáneas: condición de carrera | `asyncio.Lock` en todas las operaciones del set |
| JWT en query param: logueado en servidores intermedios | El token expira en 30 min. Usar `wss://` en producción |
| Refactor de `es_admin` rompe tests existentes | Mantener compatibilidad hacia atrás: `es_admin=True` equivale a rol ADMIN + PEDIDOS |
