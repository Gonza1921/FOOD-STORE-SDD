# Delta for kds-cocina-frontend — CH-030 KDS Enhancements

## ADDED Requirements

### Requirement: Alerta Sonora en Nuevo Pedido

El KDS MUST emitir un beep mediante Web Audio API (OscillatorNode 800Hz, GainNode 0.3, duración 200ms) al recibir evento `PEDIDO_CONFIRMADO` por WebSocket, respetando la política de autoplay del navegador.

#### Scenario: Beep al recibir pedido confirmado
- **GIVEN** KDS abierto con sonido habilitado
- **WHEN** llega evento `PEDIDO_CONFIRMADO`
- **THEN** se crea OscillatorNode 800Hz + GainNode 0.3
- **AND** el sonido dura exactamente 200ms y se detiene automáticamente

#### Scenario: Mute activo silencia el beep
- **GIVEN** sonido deshabilitado via toggle en CocinaHeader
- **WHEN** llega evento `PEDIDO_CONFIRMADO`
- **THEN** NO se invoca `play()`
- **AND** el estado `isMuted=true` persiste en localStorage

#### Scenario: AudioContext se activa en primer click (autoplay policy)
- **GIVEN** usuario ingresa al KDS por primera vez en la sesión
- **WHEN** hace clic en cualquier parte del KDS
- **THEN** se crea AudioContext y se llama `resume()`
- **AND** los beep posteriores funcionan sin restricción

### Requirement: Botón No Disponible en Productos de PedidoCard

El KDS MUST permitir a usuarios COCINA/ADMIN marcar un producto como no disponible desde la tarjeta de pedido, con confirmación previa y feedback visual inmediato.

#### Scenario: Marcar producto no disponible
- **GIVEN** un PedidoCard con detalle de producto visible
- **WHEN** el cocinero hace clic en "No disponible"
- **AND** confirma en el diálogo de confirmación
- **THEN** se envía `PATCH /api/v1/cocina/productos/{id}/disponibilidad` con `disponible: false`
- **AND** la UI deshabilita visualmente el producto (tachado + gris)
- **AND** se invalida la query `['kds-pedidos']`

#### Scenario: Re-habilitar producto disponible
- **GIVEN** un producto previamente marcado no disponible
- **WHEN** el cocinero hace clic en "Disponible"
- **THEN** se envía PATCH con `disponible: true`
- **AND** la UI restaura el producto a estado normal

#### Scenario: Error 404 — producto inexistente
- **GIVEN** un producto que fue eliminado de la BD
- **WHEN** se envía el PATCH
- **THEN** el backend responde 404
- **AND** se muestra toast "Producto no encontrado"
- **AND** la UI recarga los pedidos vía refetch

#### Scenario: Error 403 — rol no autorizado
- **GIVEN** un usuario autenticado sin rol COCINA/ADMIN
- **WHEN** intenta acceder al endpoint
- **THEN** el backend responde 403
- **AND** el botón "No disponible" no se renderiza

### Requirement: WebSocket Tests con Mock Global

Los tests del KDS MUST usar `vi.stubGlobal('WebSocket', MockWebSocket)` para simular eventos de conexión, reconexión y polling fallback sin depender de un servidor real.

#### Scenario: Mock simula reconexión automática
- **GIVEN** mock WebSocket con `vi.stubGlobal`
- **WHEN** se dispara `onclose` simulando pérdida de conexión
- **THEN** el hook intenta reconectar en ≤3 segundos
- **AND** se verifica que se creó una nueva instancia WebSocket

#### Scenario: Polling fallback tras 3 reintentos fallidos
- **GIVEN** mock WebSocket configurado
- **WHEN** se simulan 3 eventos `onclose` consecutivos sin éxito
- **THEN** el hook activa polling cada 30s via `vi.advanceTimersByTime`
- **AND** se verifica fetch a `GET /api/v1/cocina/pedidos`

### Requirement: UX Refinements — Empty States y Flash Visual

El KDS SHOULD mostrar estados vacíos con iconos y animaciones Tailwind `animate-*`, y emitir flash visual en el header al recibir un nuevo pedido.

#### Scenario: Empty state con icono animado
- **GIVEN** la columna "Por preparar" sin pedidos
- **THEN** se muestra icono de plato vacío (SVG inline)
- **AND** texto "No hay pedidos pendientes"
- **AND** el icono aplica `animate-pulse` de Tailwind

#### Scenario: Flash visual en CocinaHeader al recibir pedido
- **GIVEN** KDS abierto y operativo
- **WHEN** llega evento `PEDIDO_CONFIRMADO`
- **THEN** el header aplica clase `animate-ping` o flash de bg verde por 300ms
- **AND** el badge de conexión parpadea una vez

## API Specification

### PATCH /api/v1/cocina/productos/{id}/disponibilidad

**Roles requeridos**: `COCINA`, `ADMIN`

**Request Body**:
```json
{
  "disponible": false
}
```

Schema:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `disponible` | boolean | MUST | Nuevo estado de disponibilidad |

**Response 200 OK**:
```json
{
  "id": 1,
  "nombre": "Pizza Margherita",
  "disponible": false,
  "actualizado_en": "2026-05-28T10:30:00Z"
}
```

**Errores**:

| Código | Condición | Body |
|--------|-----------|------|
| 404 | Producto no existe o soft-deleted | `{"detail": "Producto no encontrado"}` |
| 403 | Usuario sin rol COCINA/ADMIN | `{"detail": "No autorizado para esta acción"}` |
| 422 | Body inválido (ej: campo faltante) | `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}` |

## Component Specification

### Hook: `useAudioAlert()`

```typescript
interface UseAudioAlertReturn {
  play: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

function useAudioAlert(): UseAudioAlertReturn;
```

Comportamiento:
- `play()`: Crea OscillatorNode (800Hz) + GainNode (0.3) conectados a AudioContext.destination. Duración 200ms via `stop()`. No-op si `isMuted === true`.
- `isMuted`: Lee de Zustand store slice `kdsPreferences`, inicializado desde localStorage con fallback `true`.
- `toggleMute()`: Invierte value, persiste a localStorage vía Zustand subscribe.

### Componente: `SoundToggle`

Renderizado en `CocinaHeader`. Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isMuted` | boolean | — | Estado actual del mute |
| `onToggle` | `() => void` | — | Callback al hacer clic |

Visual: icono altavoz (on) verde `text-green-500` cuando habilitado, icono mute gris `text-gray-400` cuando silenciado.

### Botón "No disponible" en PedidoCard

Ubicación: por cada `DetallePedido` dentro de la tarjeta.

| Estado | Texto | Color | Acción |
|--------|-------|-------|--------|
| Normal | "No disponible" | Rojo outline (`border-red-500 text-red-500`) | Abre confirm dialog → mutation |
| Cargando | Spinner | Deshabilitado | — |
| No disponible | "Disponible" | Verde outline (`border-green-500 text-green-500`) | Abre confirm dialog → mutation (con `disponible: true`) |

Usa `useMutation` de TanStack Query con invalidación automática de `['kds-pedidos']` on success.

## Criterios de Aceptación

| Feature | MUST | SHOULD |
|---------|------|--------|
| **Alerta Sonora** | Beep 800Hz/200ms en `PEDIDO_CONFIRMADO`; mute persiste en localStorage; AudioContext creado en primer click | Frecuencia configurable via constante |
| **No Disponible** | PATCH endpoint con validación de rol; diálogo de confirmación; UI refleja cambio inmediato; error 404/403 manejado | Animación de transición al cambiar estado |
| **WebSocket Tests** | Mock global con `vi.stubGlobal`; reconexión en ≤3s; polling activo tras 3 fallos | Cobertura ≥80% en hook useWebSocket |
| **UX Refinements** | Empty states con icono + `animate-pulse`; flash visual en header al recibir pedido | Transición suave al desaparecer empty state |
