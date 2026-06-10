# Design: Optional Features — KDS Phase 2

## Context

El KDS base (CH-024) implementó la pantalla de cocina con WebSocket, columnas Kanban, y urgencia. Este change agrega tres features opcionales que mejoran la UX operativa sin cambiar la infraestructura existente.

## Goals / Non-Goals

**Goals:**
- Alerta sonora sintetizada al llegar pedido nuevo (Web Audio API)
- Flash visual en header como refuerzo
- Botón para marcar producto no disponible desde tarjeta de pedido

**Non-Goals:**
- No usa archivos de audio externos
- No modifica stock_cantidad (solo Producto.disponible)
- No agrega dependencias externas

## Decisions

### Decision 1: Web Audio API sin archivos externos
- **Opción A** (elegida): `OscillatorNode` + `GainNode` — beep sintetizado en 10 líneas
- **Opción B**: Archivo MP3 embebido — más peso, depende de decode
- **Rationale**: Web Audio API está disponible en todos los browsers modernos sin dependencias. El beep es simple (800 Hz, 150 ms) y no justifica un asset.

### Decision 2: localStorage para mute toggle
- **Opción A** (elegida): `localStorage` con key `kds-muted`
- **Opción B**: Zustand store con persist middleware
- **Rationale**: Es un solo booleano, no necesita el overhead de Zustand. localStorage es síncrono y suficiente.

### Decision 3: Optimistic UI con invalidación en error
- **Opción A** (elegida): Actualización optimista local + refetch en error
- **Opción B**: Esperar respuesta del backend para actualizar UI
- **Rationale**: La respuesta del PATCH puede demorar ~100-300ms. La UI optimista da feedback instantáneo. Si falla, `invalidateQueries` restaura el estado correcto.

### Decision 4: `disponible` como toggle explícito (no toggle ciego)
- **Opción A** (elegida): El frontend calcula `nextDisponible = !currentNoDisponible` y envía el booleano explícito
- **Opción B**: Endpoint `POST /cocina/productos/{id}/toggle` sin body
- **Rationale**: El endpoint PATCH con body explícito es idempotente y más predecible. El frontend es quien decide el nuevo estado.

## Data Flow

### Audio Alert Flow
```
WebSocket message (PEDIDO_CONFIRMADO)
  → CocinaPage useEffect detecta nuevo pedido
  → useAudioAlert.play() crea OscillatorNode (800 Hz)
  → AudioContext.resume() (maneja autoplay policy)
  → Beep suena por 150ms
  → OscillatorNode.stop() + cleanup
```

### Toggle Disponibilidad Flow
```
Kitchen staff clicks "No disponible" button
  → window.confirm() dialog
  → Optimistic: update local Set<productoId> (opacity 50% + strikethrough)
  → PATCH /api/v1/cocina/productos/{id}/disponibilidad { disponible: false }
  → On success: invalidateQueries(['kds-pedidos'])
  → On error: alert(message) + invalidateQueries(['kds-pedidos'])
```

## Components

### Frontend

| Component | Path | Responsibility |
|-----------|------|----------------|
| `useAudioAlert` | `features/cocina/hooks/useAudioAlert.ts` | Synthesize beep, manage mute state |
| `PedidoCard` | `features/cocina/components/PedidoCard.tsx` | Per-item toggle button + optimistic UI |
| `CocinaPage` | `pages/CocinaPage.tsx` | Wire flash + audio + disponibilidad |
| `CocinaHeader` | `features/cocina/components/CocinaHeader.tsx` | Sound toggle button |

### Backend

| Component | Path | Responsibility |
|-----------|------|----------------|
| `CocinaService.toggle_disponibilidad` | `backend/cocina/service.py` | Update Producto.disponible via UoW |
| `toggle_disponibilidad` endpoint | `backend/cocina/router.py` | `PATCH /api/v1/cocina/productos/{id}/disponibilidad` |

## API Changes

### New Endpoint

```
PATCH /api/v1/cocina/productos/{producto_id}/disponibilidad
  Auth: JWT + rol COCINA or ADMIN
  Body: { "disponible": boolean }
  Response 200: { "id": int, "nombre": string, "disponible": boolean }
  Response 404: { "detail": "Producto no encontrado" }
  Response 403: Forbidden (wrong role)
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Browser autoplay policy bloquea audio | Web Audio API requiere user gesture; el toggle mute del header sirve como gesture |
| Optimistic UI desync si PATCH falla | `onError` invalida query de pedidos para refetch |
| Múltiples cocineros togglean mismo producto | Last-write-wins; el backend es autoritativo |
