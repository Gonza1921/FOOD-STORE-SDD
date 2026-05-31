# Tasks: CH-030 — KDS Enhancements

## Phase 1: Foundation / Infrastructure

- [x] 1.1 **Backend schema** — Agregar `PatchDisponibilidadRequest` + `DisponibilidadResponse` a `backend/cocina/schemas.py`
- [x] 1.2 **API endpoint URL** — Agregar `DISPONIBILIDAD(id)` a `frontend/src/features/cocina/api/endpoints.ts`
- [x] 1.3 **Types** — Agregar `onNuevoPedido` callback type a `frontend/src/features/cocina/types.ts`
- [x] 1.4 **Mock WebSocket class** — Crear `mockWebSocket.ts` helper para tests (clase `MockWebSocket` con `vi.stubGlobal`)

## Phase 2: Backend — PATCH Disponibilidad

- [x] 2.1 **Service** — Agregar `toggle_disponibilidad(producto_id, disponible)` a `backend/cocina/service.py` con validación de existencia + soft-delete
- [x] 2.2 **Router** — Agregar `PATCH /api/v1/cocina/productos/{id}/disponibilidad` con `require_role(['COCINA', 'ADMIN'])` a `backend/cocina/router.py`

## Phase 3: Frontend Hooks

- [x] 3.1 **useAudioAlert** — Crear `features/cocina/hooks/useAudioAlert.ts` con `OscillatorNode(800Hz)` + `GainNode(0.3)` + autoplay policy handling (lazy `AudioContext`)
- [x] 3.2 **useSoundToggle** — Crear `features/cocina/hooks/useSoundToggle.ts` con `localStorage` persistencia (`kds-sound-enabled`, default `true`)
- [x] 3.3 **useToggleDisponibilidad** — Crear `features/cocina/hooks/useToggleDisponibilidad.ts` con TanStack `useMutation` → `PATCH DISPONIBILIDAD` + `invalidateQueries`
- [x] 3.4 **Barrel exports** — Actualizar `features/cocina/hooks/index.ts` exportando los 3 nuevos hooks

## Phase 4: Frontend Components

- [x] 4.1 **SoundToggle** — Crear `features/cocina/components/SoundToggle.tsx` (switch altavoz on/off con iconos, verde/gris)
- [x] 4.2 **CocinaHeader** — Agregar `SoundToggle` + flash visual (`animate-pulse` bg verde 300ms) al recibir nuevo pedido
- [x] 4.3 **PedidoCard** — Agregar botón "No disponible" con confirm dialog + estados (rojo outline / gris tachado) — simplificado a botón único al final de tarjeta (no por item)
- [x] 4.4 **ColumnaEstado** — Reemplazar empty text por SVG inline + `animate-pulse` + mensajes descriptivos
- [x] 4.5 **Components barrel** — Exportar `SoundToggle` desde `features/cocina/components/index.ts`
- [x] 4.6 **CocinaPage** — Integrar `useAudioAlert()` (detección de nuevos pedidos → `play()`) + `useToggleDisponibilidad` + flash visual state

## Phase 5: Backend Tests

- [x] 5.1 **Service test** — Test `toggle_disponibilidad`: producto existe, no existe, soft-deleted, cambio disponible→no disponible y viceversa
- [x] 5.2 **Integration test** — Test `PATCH` endpoint con FastAPI TestClient: rol COCINA/ADMIN OK, sin rol 403, 404 producto

## Phase 6: Frontend Tests

- [x] 6.1 **useAudioAlert.test** — Mock `AudioContext`, verificar `OscillatorNode.start/stop/connect`, `play()` no-op cuando muted
- [x] 6.2 **useSoundToggle.test** — Mock `localStorage.getItem/setItem`, verificar default `true`, toggle persiste, re-hidrata desde storage
- [x] 6.3 **WebSocketCocina.test** — `MockWebSocket` global: reconexión ≤3s tras `onclose`, polling fallback tras 3 fallos, eventos `PEDIDO_CONFIRMADO`/`EN_PREP`/`EN_CAMINO`/`CANCELADO`

## Commit Template

```bash
feat(cocina): schema y endpoint PATCH disponibilidad producto
feat(cocina): hook useAudioAlert con Web Audio API beep 800Hz
feat(cocina): hook useSoundToggle con persistencia localStorage
feat(cocina): hook useToggleDisponibilidad con TanStack mutation
feat(cocina): componente SoundToggle y actualización CocinaHeader
feat(cocina): botón "No disponible" en PedidoCard con confirm dialog
feat(cocina): empty states SVG con animate-pulse en ColumnaEstado
feat(cocina): integrar audio y flash visual en CocinaPage
test(cocina): useAudioAlert, useSoundToggle y WebSocket mock global
test(cocina): toggle_disponibilidad service test y endpoint PATCH
```
