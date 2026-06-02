# kds-cocina-frontend Specification

## Purpose
Generated from CH-024 KDS base. Enhanced by CH-030: alerta sonora, toggle disponibilidad, WebSocket tests, UX refinements (SVG empty states, flash visual).
## Requirements
### Requirement: Layout Kanban de 2 columnas

La página `/cocina` SHALL mostrar un layout Kanban con dos columnas: "Por preparar" (pedidos en `CONFIRMADO`) y "En preparación" (pedidos en `EN_PREP`).

#### Scenario: Visualización inicial con pedidos activos
- **WHEN** un usuario autorizado navega a `/cocina`
- **THEN** se cargan los pedidos activos via `GET /api/v1/cocina/pedidos`
- **AND** los pedidos en `CONFIRMADO` aparecen en la columna "Por preparar"
- **AND** los pedidos en `EN_PREP` aparecen en la columna "En preparación"
- **AND** cada columna tiene un header con el nombre y el contador de pedidos

#### Scenario: Columna vacía con icono animado
- **WHEN** no hay pedidos en `CONFIRMADO`
- **THEN** la columna "Por preparar" muestra un icono de plato vacío (SVG inline) con `animate-pulse`
- **AND** un texto descriptivo "No hay pedidos pendientes"
- **AND** la columna "En preparación" funciona independientemente con icono y texto equivalentes ("No hay pedidos en preparación")

#### Scenario: Orden por antigüedad
- **WHEN** la columna muestra múltiples pedidos
- **THEN** los pedidos se ordenan por antigüedad ascendente (el más antiguo primero)
- **AND** el criterio es `tiempo_en_estado` del campo devuelto por la API

#### Scenario: Diseño responsive para pantalla 16:9
- **WHEN** la pantalla es de 16:9 o superior (≥1280px)
- **THEN** ambas columnas se muestran lado a lado ocupando todo el ancho
- **AND** las tarjetas de pedido tienen tamaño suficiente para mostrar toda la información sin scroll horizontal

### Requirement: Integración WebSocket en tiempo real

El frontend SHALL suscribirse al WebSocket `WS /api/v1/cocina/ws?token=<JWT>` para recibir eventos de transición de pedidos en tiempo real.

#### Scenario: Conexión WebSocket al montar el componente
- **WHEN** el componente KDS se monta
- **THEN** se establece conexión WebSocket con el token JWT del usuario autenticado
- **AND** el indicador de conexión muestra "En vivo"

#### Scenario: Nuevo pedido confirmado llega en tiempo real
- **GIVEN** conexión WebSocket activa
- **WHEN** llega un evento `PEDIDO_CONFIRMADO`
- **THEN** el nuevo pedido aparece instantáneamente en la columna "Por preparar"
- **AND** no se requiere recarga manual ni polling

#### Scenario: Flash visual al recibir nuevo pedido
- **GIVEN** KDS abierto y operativo
- **WHEN** llega evento `PEDIDO_CONFIRMADO`
- **THEN** el header aplica `animate-pulse` con fondo verde por 300ms
- **AND** el badge de conexión parpadea una vez

#### Scenario: Pedido movido a preparación en tiempo real
- **GIVEN** conexión WebSocket activa
- **WHEN** llega un evento `PEDIDO_EN_PREPARACION` con un `pedido_id`
- **THEN** ese pedido se mueve de la columna "Por preparar" a "En preparación"
- **AND** la animación de transición es fluida

#### Scenario: Pedido cancelado en tiempo real
- **GIVEN** conexión WebSocket activa
- **WHEN** llega un evento `PEDIDO_CANCELADO` con un `pedido_id`
- **THEN** el pedido se elimina de su columna actual
- **AND** se muestra un toast/mensaje breve indicando "Pedido #X cancelado"

#### Scenario: Reconexión automática
- **GIVEN** conexión WebSocket activa
- **WHEN** la conexión se pierde inesperadamente
- **THEN** el cliente intenta reconectar automáticamente cada 3 segundos
- **AND** el indicador de conexión muestra "Reconectando..."
- **AND** tras 3 reintentos fallidos, activa el modo polling

### Requirement: Fallback polling

Si el WebSocket no está disponible, el frontend SHALL hacer fetch periódico a `GET /api/v1/cocina/pedidos` cada 30 segundos.

#### Scenario: Polling activo al perder conexión
- **GIVEN** WebSocket desconectado tras 3 reintentos
- **WHEN** se activa el modo fallback
- **THEN** se hace fetch a `GET /api/v1/cocina/pedidos` cada 30 segundos
- **AND** el indicador de conexión muestra "Sin conexión — Actualizando cada 30s"

#### Scenario: Polling se detiene al reconectar WebSocket
- **GIVEN** modo polling activo
- **WHEN** el WebSocket se reconecta exitosamente
- **THEN** el polling se detiene
- **AND** se restaura el modo tiempo real
- **AND** el indicador vuelve a "En vivo"

#### Scenario: Polling inicial (carga de datos)
- **WHEN** el componente KDS se monta por primera vez
- **THEN** se hace un fetch inicial a `GET /api/v1/cocina/pedidos` para cargar el estado actual
- **AND** luego se establece la conexión WebSocket

### Requirement: Timer de urgencia visual

Cada tarjeta de pedido SHALL mostrar un indicador visual de urgencia basado en el tiempo transcurrido desde que entró al estado actual.

#### Scenario: Pedido reciente (menos de 10 minutos)
- **GIVEN** un pedido con `tiempo_en_estado < 600` segundos
- **THEN** la tarjeta se muestra en color gris normal
- **AND** muestra el tiempo transcurrido en formato "X min"

#### Scenario: Pedido en advertencia (10-20 minutos)
- **GIVEN** un pedido con `tiempo_en_estado` entre 600 y 1200 segundos
- **THEN** la tarjeta se muestra con borde/badge naranja
- **AND** muestra el tiempo transcurrido con icono de alerta

#### Scenario: Pedido urgente (más de 20 minutos)
- **GIVEN** un pedido con `tiempo_en_estado > 1200` segundos
- **THEN** la tarjeta se muestra con fondo/borde rojo intenso
- **AND** muestra el tiempo transcurrido con icono de urgencia pulsante

#### Scenario: Timer se actualiza cada 15 segundos
- **GIVEN** un pedido visible en el KDS
- **WHEN** pasan 15 segundos
- **THEN** el `tiempo_en_estado` visual se recalcula incrementando 15s
- **AND** el color de urgencia se actualiza si cambió de rango

### Requirement: Acciones de avance de estado

Cada tarjeta de pedido SHALL tener botones de acción para avanzar el estado del pedido, según el estado actual.

#### Scenario: Botón "Iniciar" en pedido confirmado
- **GIVEN** un pedido en columna "Por preparar" (`CONFIRMADO`)
- **WHEN** el cocinero hace clic en "Iniciar"
- **THEN** se envía PATCH a `/api/v1/pedidos/{id}/estado` con `estado_nuevo: "EN_PREP"`
- **AND** el pedido se mueve a la columna "En preparación"
- **AND** el botón "Iniciar" se reemplaza por "Listo"

#### Scenario: Botón "Listo" en pedido en preparación
- **GIVEN** un pedido en columna "En preparación" (`EN_PREP`)
- **WHEN** el cocinero hace clic en "Listo"
- **THEN** se envía PATCH a `/api/v1/pedidos/{id}/estado` con `estado_nuevo: "EN_CAMINO"`
- **AND** el pedido desaparece del KDS (ya no está en estado de cocina)

#### Scenario: Confirmación antes de accionar
- **WHEN** el cocinero hace clic en "Iniciar" o "Listo"
- **THEN** se muestra un diálogo de confirmación: "¿Estás seguro?"
- **AND** solo si confirma, se envía el PATCH

#### Scenario: Error al cambiar estado (transición inválida)
- **GIVEN** un pedido que ya fue cambiado por otro usuario
- **WHEN** se intenta el PATCH
- **THEN** el backend responde con error 409 (Conflict)
- **AND** el KDS muestra un mensaje "El pedido ya fue actualizado por otro usuario"
- **AND** se refresca la vista para reflejar el estado actual

#### Scenario: Deshabilitar botón durante la solicitud
- **WHEN** el cocinero hace clic en "Iniciar" o "Listo"
- **THEN** el botón se deshabilita inmediatamente
- **AND** muestra un spinner de carga
- **AND** se rehabilita si la solicitud falla (para reintentar)

### Requirement: Guard de ruta por rol

La ruta `/cocina` SHALL estar protegida y accesible solo para usuarios con roles `COCINA`, `PEDIDOS` o `ADMIN`.

#### Scenario: Acceso concedido para rol autorizado
- **GIVEN** un usuario autenticado con rol `COCINA`, `PEDIDOS` o `ADMIN`
- **WHEN** navega a `/cocina`
- **THEN** se muestra el KDS sin restricciones

#### Scenario: Redirección para rol no autorizado
- **GIVEN** un usuario autenticado con rol `CLIENT` o `STOCK`
- **WHEN** intenta navegar a `/cocina`
- **THEN** es redirigido a `/` (home)
- **AND** se muestra un toast "No tenés acceso a la cocina"

#### Scenario: Redirección para usuario no autenticado
- **GIVEN** un usuario no autenticado
- **WHEN** intenta navegar a `/cocina`
- **THEN** es redirigido a `/login`
- **AND** después del login exitoso, vuelve a `/cocina`

### Requirement: Indicador de estado de conexión

El KDS SHALL mostrar un indicador visual persistente del estado de la conexión en tiempo real.

#### Scenario: Estado "En vivo"
- **GIVEN** WebSocket conectado y estable
- **THEN** se muestra un badge verde "🟢 En vivo" en el header del KDS

#### Scenario: Estado "Reconectando..."
- **GIVEN** WebSocket desconectado
- **WHEN** el cliente intenta reconectar
- **THEN** se muestra un badge amarillo "🟡 Reconectando..." con animación de spinner

#### Scenario: Estado "Sin conexión"
- **GIVEN** WebSocket caído tras 3 reintentos
- **WHEN** el modo polling está activo
- **THEN** se muestra un badge rojo "🔴 Sin conexión — Actualizando cada 30s"

### Requirement: Sin auto-logout en pantalla de cocina

La pantalla de cocina SHALL mantener la sesión activa durante el turno del cocinero, sin forzar cierre de sesión por inactividad.

#### Scenario: No hay cierre por inactividad en KDS
- **GIVEN** un cocinero con sesión activa en `/cocina`
- **WHEN** pasan más de 30 minutos sin interacción
- **THEN** la sesión NO se cierra automáticamente
- **AND** el refresh token se renueva en background si es necesario

#### Scenario: Refresh token automático
- **GIVEN** el access token está por expirar
- **WHEN** el interceptor de Axios detecta 401
- **THEN** renueva el token usando el refresh token
- **AND** la pantalla de cocina sigue funcionando sin interrupción

### Requirement: Navegación con ruta /cocina

El menú de navegación SHALL incluir un link a `/cocina` visible solo para usuarios con roles `COCINA`, `PEDIDOS` o `ADMIN`.

#### Scenario: Link visible para cocineros
- **GIVEN** un usuario autenticado con rol `COCINA`, `PEDIDOS` o `ADMIN`
- **WHEN** el menú de navegación se renderiza
- **THEN** aparece un link "Cocina" que navega a `/cocina`
- **AND** el icono del link es un utensilio de cocina (fire o chef hat)

#### Scenario: Link oculto para otros roles
- **GIVEN** un usuario autenticado con rol `CLIENT` o `STOCK`
- **WHEN** el menú de navegación se renderiza
- **THEN** el link "Cocina" NO aparece

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

#### Scenario: Flash visual en CocinaHeader al recibir pedido
- **GIVEN** KDS abierto y operativo
- **WHEN** llega evento `PEDIDO_CONFIRMADO`
- **THEN** el header aplica clase `animate-pulse` o flash de bg verde por 300ms
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

