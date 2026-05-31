# Design: CH-030 — KDS Enhancements

## Technical Approach

Cinco features independientes sobre el KDS base (CH-024). Sin nuevas dependencias ni migraciones BD. Backend: un PATCH endpoint en `routers/cocina/`. Frontend: hooks y componentes dentro de `features/cocina/` (FSD). Tests con Vitest + mock de WebSocket global.

---

## Architecture Decisions

### Decision: Web Audio API vs HTML5 Audio vs librería externa

| Opción | Trade-off | Decisión |
|--------|-----------|----------|
| Web Audio API (OscillatorNode) | Sin assets, control fino frecuencia/duración/ganancia. Requiere manejo autoplay policy. | ✅ **Elegido** |
| HTML5 Audio (`new Audio()`) | Requiere archivo MP3 externo, sin control fino de tono. | ❌ Dependencia externa innecesaria |
| Librería (Howler.js, Tone.js) | Overkill para un beep de 200ms. | ❌ 0 dependencias nuevas |

### Decision: Sound toggle en CocinaHeader vs panel de settings

| Opción | Trade-off | Decisión |
|--------|-----------|----------|
| Switch en CocinaHeader | Acceso inmediato, sin navegación extra. | ✅ **Elegido** |
| Panel de settings (modal/página) | Más ordenado pero requiere navegación adicional para toggle rápido. | ❌ Overhead innecesario |

### Decision: Scope del "No Disponible" — producto completo vs ingrediente específico

| Opción | Trade-off | Decisión |
|--------|-----------|----------|
| Producto completo (`disponible=false`) | Simple, columna existente. No requiere migración. | ✅ **Elegido** |
| Ingrediente específico | Más granular pero requiere cambios en modelo y lógica de pedidos. | ❌ Fuera de alcance |

### Decision: Location del endpoint PATCH

| Opción | Trade-off | Decisión |
|--------|-----------|----------|
| `routers/cocina/` | Coherente con feature de cocina, rol COCINA. | ✅ **Elegido** |
| `routers/productos/` | Lógico (recurso producto), pero requiere ampliar roles existentes. | ❌ Mezcla capas de autorización |

---

## Data Flow

### Feature 1 — Alerta Sonora

```
WebSocket "PEDIDO_CONFIRMADO"
    → useWebSocketCocina.handleEvent() detecta nuevo pedido
        → useAudioAlert.play() (disparado por callback externo)
            → AudioContext.resume() (autoplay policy)
                → OscillatorNode(800Hz).start()
                    → GainNode(0.3).connect(destination)
                        → stop() después de 200ms
```

`useAudioAlert()` se integra EN `useWebSocketCocina` vía un callback `onNuevoPedido` que `CocinaPage` pasa para conectar el audio. El hook maneja:
1. Creación lazy de `AudioContext` en el primer user click
2. `resume()` forzado antes de cada play
3. Limpieza en unmount (`AudioContext.close()`)

### Feature 3 — No Disponible PATCH

```
[CocinaPage]
    → [PedidoCard] muestra botón "No Disponible" por item
        → window.confirm() "¿Marcar {producto} como no disponible?"
            → useMutation (TanStack Query) PATCH /api/v1/cocina/productos/{id}/disponibilidad
                → [Backend Router] require_role(['COCINA', 'ADMIN'])
                    → [CocinaService] cambia Producto.disponible = False
                        → [ProductoRepository] update parcial
                            → DB commit
                ← Response 200 OK
            → invalidateQueries (productos activos en catálogo)
```

---

## File Changes

### Frontend (FSD: `features/cocina/`)

| File | Action | Description |
|------|--------|-------------|
| `hooks/useAudioAlert.ts` | Create | Web Audio API beep (800Hz, 200ms, gain 0.3) con autoplay policy handling |
| `hooks/useSoundToggle.ts` | Create | localStorage persistencia (`kds-sound-enabled`), default `true` |
| `hooks/useToggleDisponibilidad.ts` | Create | TanStack `useMutation` para PATCH disponibilidad |
| `hooks/index.ts` | Modify | Exportar nuevos hooks |
| `components/SoundToggle.tsx` | Create | Switch component con icono de altavoz |
| `components/CocinaHeader.tsx` | Modify | Agregar `SoundToggle` y flash visual en nuevos pedidos |
| `components/PedidoCard.tsx` | Modify | Agregar botón "No Disponible" por item |
| `components/ColumnaEstado.tsx` | Modify | Empty states mejorados con SVG inline |
| `types.ts` | Modify | Agregar `onNuevoPedido` callback type (opcional) |
| `api/endpoints.ts` | Modify | Agregar `COCINA_API.DISPONIBILIDAD` URL |
| `__tests__/useAudioAlert.test.ts` | Create | Test de reproducción de beep |
| `__tests__/useSoundToggle.test.ts` | Create | Test de persistencia localStorage |
| `__tests__/WebSocketCocina.test.ts` | Create | Mock WebSocket global + eventos |

### Pages

| File | Action | Description |
|------|--------|-------------|
| `pages/CocinaPage.tsx` | Modify | Integrar `useAudioAlert()` + `useToggleDisponibilidad` + flash visual state |

### Backend (Feature-First: `backend/cocina/`)

| File | Action | Description |
|------|--------|-------------|
| `schemas.py` | Modify | Agregar `PatchDisponibilidadRequest { disponible: bool }` |
| `service.py` | Modify | Agregar `toggle_disponibilidad(producto_id, disponible)` |
| `router.py` | Modify | Agregar `PATCH /api/v1/cocina/productos/{id}/disponibilidad` con `require_role(['COCINA', 'ADMIN'])` |

---

## Interfaces / Contracts

### Backend Schema

```python
# backend/cocina/schemas.py — nuevo schema
class PatchDisponibilidadRequest(BaseModel):
    disponible: bool = Field(..., description="Nuevo estado de disponibilidad")

class DisponibilidadResponse(BaseModel):
    id: int
    nombre: str
    disponible: bool
```

### Backend Endpoint

```
PATCH /api/v1/cocina/productos/{id}/disponibilidad
Authorization: Bearer <token>
Content-Type: application/json

Request:  { "disponible": false }
Response: { "id": 1, "nombre": "Pizza Muzzarella", "disponible": false }
Errors:
  403 — rol insuficiente (requiere COCINA o ADMIN)
  404 — producto no encontrado o soft-deleted
```

### Frontend Hook

```typescript
// hooks/useToggleDisponibilidad.ts
export function useToggleDisponibilidad() {
  return useMutation({
    mutationFn: ({ productoId, disponible }: { productoId: number; disponible: boolean }) =>
      axiosClient.patch(COCINA_API.DISPONIBILIDAD(String(productoId)), { disponible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}
```

### localStorage Key

```typescript
const STORAGE_KEY = 'kds-sound-enabled'; // default: true
```

---

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (Frontend) | `useAudioAlert` | Mock `AudioContext`, verificar `OscillatorNode.start/stop` |
| Unit (Frontend) | `useSoundToggle` | `vi.fn()` sobre `localStorage.getItem/setItem`, default `true` |
| Integration (Frontend) | WebSocket flow | `vi.stubGlobal('WebSocket', MockWebSocket)`, simular reconexión (3 intentos), polling fallback, eventos PEDIDO_CONFIRMADO/EN_PREP/EN_CAMINO/CANCELADO |
| Unit (Backend) | `toggle_disponibilidad` | Test con producto existente, no existente, soft-deleted |
| Integration (Backend) | PATCH endpoint | FastAPI TestClient con rol COCINA/ADMIN y sin rol |

---

## Migration / Rollout

No migration required. `Producto.disponible` columna existe desde migración inicial. Sin feature flags.

---

## Open Questions

- [ ] ¿`PEDIDO_CONFIRMADO` debe activar el beep SIEMPRE o solo cuando cambia la lista visible (nuevo pedido vs. re-conexión WebSocket)? Por ahora: solo cuando `pedidos` array crece con un nuevo `id`.
- [ ] ¿El endpoint PATCH debe registrar auditoría de quién cambió disponibilidad? Por ahora no (alcance acotado), pero `actualizado_en` se actualiza automáticamente.
