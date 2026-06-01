# CH-030 — KDS Enhancements

## Resumen

Mejoras operativas para el Kitchen Display System (CH-024): alerta sonora al recibir pedidos, botón para marcar productos no disponibles desde cocina, tests de WebSocket faltantes, y refinamientos de UX (empty states, animaciones, flash visual). Sin nuevas dependencias externas.

## Problema

El KDS base funciona, pero en operación real surgen necesidades concretas: el cocinero no siempre mira la pantalla (necesita alerta sonora), cuando un ingrediente se agota no puede pausar la venta rápido (depende de STOCK/ADMIN), y la UI carece de feedback visual y empty states.

## Alcance

### Incluye
- Alerta sonora con Web Audio API (OscillatorNode + GainNode, sin MP3 ni librerías)
- Hook `useAudioAlert()` que dispara beep al recibir `PEDIDO_CONFIRMADO`
- Sound toggle en `CocinaHeader` con persistencia en localStorage
- Botón "No Disponible" en PedidoCard con TanStack Query mutation
- Endpoint `PATCH /api/v1/cocina/productos/{id}/disponibilidad` (rol COCINA/ADMIN)
- Tests de WebSocket (mock global, reconexión, polling fallback)
- Empty states con iconos, animaciones Tailwind `animate-*`, flash visual en header

### No incluye
- Reordenamiento drag-and-drop de columnas
- Estimación de tiempo de preparación
- Multi-sucursal ni estaciones de cocina
- Historial de cambios de disponibilidad

## Features

| Feature | Esfuerzo | Complejidad | Detalle técnico |
|---------|----------|-------------|-----------------|
| Alerta sonora | 4-6h | Baja | Web Audio API, AudioContext activado en primer click (autoplay policy) |
| No disponible | 6-8h | Media | PATCH endpoint + `Producto.disponible` (ya existe en BD) + confirm dialog |
| WebSocket tests | 3-4h | Baja | Mock global WebSocket para Vitest, reconexión, eventos |
| UX refinements | 2-3h | Baja | Empty states, animate-*, flash visual en CocinaHeader |

## Dependencias

- **CH-024**: KDS base implementado (componentes, hooks, WebSocket)
- **CH-022/023**: Roles COCINA/ADMIN y WebSocket operativos
- `Producto.disponible` columna existe en BD (no requiere migración)

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Browser autoplay policy bloquea audio | AudioContext se crea/activa en primer user click |
| Mock WebSocket frágil en tests | Usar `vi.stubGlobal('WebSocket', ...)` con clase mock completa |
| CH-025 obsoleto (proponía features similares) | Archivar CH-025 antes de comenzar CH-030 |
| Toggle sonido no persiste entre sesiones | localStorage + fallback a `true` por defecto |

## Enfoque técnico

- **Audio**: `OscillatorNode` (frecuencia 800Hz, duración 200ms, ganancia 0.3) sin archivos externos
- **Disponibilidad**: Endpoint PATCH dedicado en `routers/cocina/` con validación de rol
- **Persistencia**: localStorage para preferencia de sonido, Zustand para estado UI
- **Tests**: Mock de WebSocket global con eventos simulados + timer controlado

## Complejidad total

**Media** — 14-19h estimado. No requiere cambios de infraestructura ni BD. Riesgo principal es el mock de WebSocket en tests.

## Rol requerido

`COCINA`, `ADMIN` — el endpoint de disponibilidad valida rol; el resto de features son de UI y no requieren autorización extra.
