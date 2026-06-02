# Tasks: CH-024 — Frontend KDS (Kitchen Display System)

## 1. Setup — Infrastructure & Types

- [x] 1.1 Create `features/cocina/` folder structure con `hooks/`, `components/`, `api/`, `__tests__/`
- [x] 1.2 Agregar sección `COCINA` en `shared/api/endpoints.ts` con `WS_URL` y `PEDIDOS_LIST`
- [x] 1.3 Crear tipos compartidos: `CocinaPedido`, `CocinaPedidoItem`, `WSEvent`, `ConnectionStatus`, `UrgencyLevel`
- [x] 1.4 Agregar sección `cocina` en `sidebar menuConfig` con roles `['COCINA', 'PEDIDOS', 'ADMIN']` e icono `restaurant`

## 2. Hooks — Lógica de conexión y estado

- [x] 2.1 Implementar `useWebSocketCocina()`: conexión WS con JWT, reconexión automática (3s, max 3), fallback polling (30s), retorna `{ pedidos, connectionStatus, error }`
- [x] 2.2 Implementar `useUrgenciaTimer()`: recibe `CocinaPedido[]`, recalcula `urgencyLevel` cada 15s basado en `tiempo_en_estado`, retorna `CocinaPedidoConUrgencia[]`
- [x] 2.3 Implementar `useUpdateEstado()`: `useMutation` de TanStack Query para PATCH `/pedidos/{id}/estado` con manejo de loading y error

## 3. UI — Componentes

- [x] 3.1 Implementar `UrgenciaBadge`: badge visual que muestra `normal` (gris), `warning` (naranja), `urgent` (rojo) según `urgencyLevel`
- [x] 3.2 Implementar `PedidoCard`: tarjeta con items, total, tiempo transcurrido, UrgenciaBadge, y botón de acción (Iniciar / Listo) con confirmación
- [x] 3.3 Implementar `ColumnaEstado`: contenedor tipo Kanban con header (nombre + contador) y lista de PedidoCards
- [x] 3.4 Implementar `CocinaHeader`: header minimalista con título "Cocina" e indicador de conexión (🟢 En vivo / 🟡 Reconectando... / 🔴 Sin conexión)
- [x] 3.5 Implementar `CocinaPage`: componente página que compone CocinaHeader + 2 ColumnaEstado (CONFIRMADO → EN_PREP) con useWebSocketCocina + useUrgenciaTimer + useUpdateEstado

## 4. Ruteo y Navegación

- [x] 4.1 Agregar ruta `/cocina` en `Router.tsx` SIN AppLayout, con `ProtectedRoute` para roles `['COCINA', 'PEDIDOS', 'ADMIN']`
- [x] 4.2 Exportar `CocinaPage` desde `pages/index.ts`
- [ ] ~~4.3 Agregar título `/cocina` → `'Cocina'` en `routeTitles` de AppLayout~~ — No aplica: `/cocina` está fuera de AppLayout (full-screen KDS), esta ruta nunca usará routeTitles

## 5. Tests

- [x] 5.1 Testear `useUrgenciaTimer`: 14 tests (8 calcUrgency + 4 initial state + 2 offset reset) — todas pasando
- [ ] 5.2 Testear `useWebSocketCocina`: pendiente — requiere mock de WebSocket API + timers (futura mejora)
- [x] 5.3 Testear `PedidoCard` + `UrgenciaBadge`: 31 tests pasando (18 PedidoCard + 13 UrgenciaBadge)

## 6. Verificación Final

- [x] 6.1 Verificar que `pnpm type-check` pasa sin errores ✅
- [x] 6.2 Verificar que `pnpm lint` pasa sin errores ✅
- [x] 6.3 Verificar que los tests unitarios pasan ✅ (45 tests en 3 archivos)
