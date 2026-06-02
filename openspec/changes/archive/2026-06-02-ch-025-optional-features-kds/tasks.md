# Tasks: Optional Features — KDS Phase 2

## 1. Backend — Toggle Disponibilidad Endpoint

- [x] 1.1 Add `toggle_disponibilidad` method to `CocinaService` with `UnitOfWork`
- [x] 1.2 Add `PATCH /api/v1/cocina/productos/{id}/disponibilidad` endpoint to `cocina/router.py`
- [x] 1.3 Add `PatchDisponibilidadRequest` and `DisponibilidadResponse` schemas to `cocina/schemas.py`
- [x] 1.4 Write unit tests for toggle disponibilidad (success, 404, 403)

## 2. Frontend — Audio Alert

- [x] 2.1 Create `useAudioAlert` hook with Web Audio API beep synthesis
- [x] 2.2 Implement mute toggle persisted in localStorage
- [x] 2.3 Add `SoundToggle` button to `CocinaHeader`
- [x] 2.4 Wire audio alert in `CocinaPage` on new `PEDIDO_CONFIRMADO`

## 3. Frontend — Flash Visual

- [x] 3.1 Add `flashNewOrder` state + timeout reset logic in `CocinaPage`
- [x] 3.2 Add CSS keyframe animation for flash effect

## 4. Frontend — Toggle Disponibilidad UI

- [x] 4.1 Create `useToggleDisponibilidad` mutation hook with optimistic UI
- [x] 4.2 Add per-item toggle button in `PedidoCard` (opacity 50% + strikethrough)
- [x] 4.3 Wire `handleToggleDisponibilidad` in `CocinaPage`
- [x] 4.4 Handle error case with `alert()` + query invalidation
