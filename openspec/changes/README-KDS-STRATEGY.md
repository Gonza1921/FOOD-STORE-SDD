# Kitchen Display System (KDS) — Estrategia de Implementación

## Overview

El Kitchen Display System (KDS) para Food Store se implementa en **4 changes secuenciales**:

```
CH-022 (Setup RBAC)
    ↓
CH-023 (Backend WebSocket + FSM)
    ↓
CH-024 (Frontend KDS)
    ↓
CH-025 (Optional Features)
```

Cada change es **independientemente deployable** (si necesitás rollback). La secuencia es recomendada pero flexible si ajustas dependencias.

---

## Changes

### CH-022: Setup RBAC — Rol Cocinero + Seed
- **Complejidad**: Pequeña (8-10 h)
- **Depende de**: C-02, C-04
- **Entrega**: Rol COCINA en BD, tabla RBAC, seed de desarrollo
- **Purpose**: Base de autorización para KDS
- **Riesgo**: Muy bajo (solo datos)

### CH-023: Backend WebSocket + FSM Delta
- **Complejidad**: Grande (32-40 h)
- **Depende de**: C-02, C-08, C-09, CH-022
- **Entrega**: 
  - Gestor WebSocket + autenticación JWT
  - Pub/sub en proceso (asyncio, sin Redis)
  - Delta FSM: autorización por rol para transiciones de cocina
  - Endpoint REST fallback para polling
  - Eventos: PEDIDO_CONFIRMADO, PEDIDO_EN_PREPARACION, PEDIDO_EN_CAMINO, PEDIDO_CANCELADO
- **Purpose**: Infraestructura de tiempo real
- **Riesgo**: Medio (WebSocket + concurrencia)
- **Decisión Pendiente**: WebSocket vs SSE (documentar en design.md)

### CH-024: Frontend KDS + UI Cocina
- **Complejidad**: Grande (28-32 h)
- **Depende de**: C-02, CH-022, CH-023
- **Entrega**:
  - Ruta `/cocina` con layout Kanban (2 columnas)
  - Integración WebSocket + polling fallback
  - Timer de urgencia (< 10 min normal, 10-20 naranja, > 20 rojo)
  - Guard de ruta + exclusión de auto-logout
  - Indicador de conexión
- **Purpose**: Interfaz operativa para cocineros
- **Riesgo**: Bajo (React + Tailwind, familiar)
- **Testing**: Jest + Vitest, mocks de WebSocket

### CH-025: Optional Features — KDS Phase 2
- **Complejidad**: Pequeña (12-16 h)
- **Depende de**: CH-024
- **Entrega**:
  - Alerta sonora (Web Audio API) + flash visual
  - Toggle de sonido (localStorage)
  - Endpoint para marcar producto no disponible
  - Botón en UI para cambiar disponibilidad
- **Purpose**: UX mejorada, post-MVP
- **Riesgo**: Muy bajo (features "nice-to-have")

---

## Arquitectura de Referencia

### Stack
- **Backend**: FastAPI (asyncio WebSocket), SQLModel (ORM), PostgreSQL
- **Frontend**: React 19, Tailwind CSS v4, Zustand (state), TanStack Query (server state)
- **Tiempo real**: WebSocket (o SSE, tu elección) + pub/sub en proceso
- **Testing**: pytest (backend), jest/vitest (frontend)

### Modelos Reutilizados (No Hay Tablas Nuevas)
- `Pedido`: filtrado por estado (`CONFIRMADO`, `EN_PREP`)
- `DetallePedido`: ítems y personalización
- `HistorialEstadoPedido`: auditoría de transiciones
- `Producto.disponible`: booleano existente

### Eventos (RN-CO05, RN-CO06)
| Evento | Disparo | Efecto en KDS |
|--------|---------|---------------|
| `PEDIDO_CONFIRMADO` | `PENDIENTE → CONFIRMADO` (pago) | Aparece tarjeta en "Por preparar" |
| `PEDIDO_EN_PREPARACION` | `CONFIRMADO → EN_PREP` (cocinero) | Tarjeta se mueve a "En preparación" |
| `PEDIDO_EN_CAMINO` | `EN_PREP → EN_CAMINO` (cocinero) | Tarjeta desaparece |
| `PEDIDO_CANCELADO` | `* → CANCELADO` (admin) | Tarjeta desaparece |

---

## Reglas de Negocio (RN-CO*)

Documentadas en `feature-display-cocina-reference/02_modelo_y_reglas.md`:

- **RN-CO01**: Cocina solo ve CONFIRMADO + EN_PREP (no PENDIENTE)
- **RN-CO02**: Ordenados por antigüedad ascendente
- **RN-CO03**: Rol COCINA solo puede CONFIRMADO→EN_PREP y EN_PREP→EN_CAMINO (validación en FSM)
- **RN-CO04**: Todas las transiciones se registran en HistorialEstadoPedido
- **RN-CO05**: Nuevo pedido confirmado emite evento (push)
- **RN-CO06**: Pedido fuera de fase cocina emite evento (retira tarjeta)
- **RN-CO07**: Urgencia por tiempo (umbrales: 10, 20 minutos)
- **RN-CO08**: (Opcional) COCINA puede marcar Producto.disponible = false

---

## Historias de Usuario (US-COCINA-*)

Documentadas en `feature-display-cocina-reference/03_historias_de_usuario.md`:

| US | Título | Prioridad | Change |
|----|--------|-----------|--------|
| US-COCINA-01 | Ver pedidos en tiempo real | Alta | CH-024 |
| US-COCINA-02 | Tomar pedido (EN_PREP) | Alta | CH-023 + CH-024 |
| US-COCINA-03 | Marcar terminado (EN_CAMINO) | Alta | CH-023 + CH-024 |
| US-COCINA-04 | Setup rol + guard | Alta | CH-022 + CH-023 |
| US-COCINA-05 | Alerta sonora | Media | CH-025 |
| US-COCINA-06 | Urgencia por tiempo | Media | CH-024 |
| US-COCINA-07 | Marcar no disponible | Baja | CH-025 |
| US-COCINA-08 | Fallback polling | Media | CH-024 |
| US-COCINA-09 | Auditoría | Alta | CH-023 |

---

## Decisiones Arquitectónicas Documentadas

### D-1: Tiempo Real con WebSocket (o SSE)
**Decisión Actual**: WebSocket en `/api/v1/cocina/ws` con auth JWT
**Alternativa**: Server-Sent Events (más simple, unidireccional)
**Justificación**: Tu elección en `design.md` de CH-023

### D-2: Cocinero es dueño de fase EN_PREPARACIÓN
**Decisión**: Cocina ejecuta CONFIRMADO→EN_PREP y EN_PREP→EN_CAMINO
**No**: no hay estado intermedio LISTO (pregunta abierta PA-CO-01)
**Justificación**: Modelo simple para v1, extensible en v2

### D-3: Pub/Sub en Proceso (Sin Redis)
**Decisión**: v1 single-instance usa asyncio + set de conexiones en memoria
**Límite Conocido**: No escala a múltiples workers (requiere Redis Pub/Sub si creces)
**Documentación**: Claro en `design.md` de CH-023

### D-4: Timer de Urgencia en Cliente
**Decisión**: Recalculado cada 15 s en el cliente (JavaScript)
**Ventaja**: Sin carga en BD
**Límite**: Puede estar desincronizado si reloj del cliente está mal

---

## Dependencias Externas

### Changes Existentes Requeridos
- **C-02 auth**: JWT, RBAC, require_role
- **C-04 productos**: Tabla Producto con disponible
- **C-08 pedidos**: FSM, HistorialEstadoPedido
- **C-09 pagos**: Transición PENDIENTE→CONFIRMADO por webhook IPN

### Decisiones Tomadas vs. Feature Pack Original
- ✅ Reutilizamos modelos (no agregamos tablas)
- ✅ WebSocket en lugar de Server-Sent Events (tu decisión)
- ✅ Pub/sub en proceso en lugar de Redis (documentado como límite)
- ✅ Timer en cliente en lugar de sincronizado con BD
- ✅ Sin estaciones de cocina (BAR, GRILL) en v1

---

## Flujo de Implementación Recomendado

```
1. Review propuestas de CH-022..025
2. Create specs + design para CH-022 (rápido)
3. Create specs + design para CH-023 (la más compleja)
4. Create specs + design para CH-024
5. Create tasks para CH-022
6. Apply CH-022 (fin de sprint 1)
7. Create tasks para CH-023
8. Apply CH-023 (fin de sprint 2, requiere testing exhaustivo)
9. Create tasks para CH-024
10. Apply CH-024 (fin de sprint 3)
11. Create tasks para CH-025 (opcional)
12. Apply CH-025 (post-MVP si hay tiempo)
13. Archive todos los changes
```

---

## Testing Strategy

### CH-022 (RBAC)
- Tests de BD: seed idempotente, role creado, RBAC como se espera
- Tests de autorización: require_role rechaza sin COCINA

### CH-023 (WebSocket + FSM)
- Integración con PostgreSQL real (no mock)
- WebSocket: handshake, auth, recepción de eventos
- FSM: transiciones autorizadas/rechazadas por rol
- Eventos: emitidos cuando debe, contenido correcto

### CH-024 (Frontend)
- Jest: renderizado de layout, eventos simulados
- Vitest: hooks de WebSocket, timer de urgencia
- Vitest: fallback a polling si WebSocket cae
- E2E (opcional): Playwright contra instancia real si recursos

### CH-025 (Features)
- Tests de alerta sonora (mock de Web Audio)
- Tests de disponibilidad (endpoint + UI)

---

## Referencias

- **Feature Pack Original**: `openspec/feature-display-cocina-reference/` (4 archivos)
- **Knowledge Base**: `docs/knowledge-base/` (modelos, reglas, flujos, arquitectura)
- **Historias Existentes**: `docs/Historias_de_usuario.txt` (US-000..076)
- **AGENTS.md**: Sección "Reglas de Arquitectura" (Backend, Frontend, DB)
- **Convenciones**: `AGENTS.md` (nomenclatura, commits, branches)

---

## Estado

- **Fecha**: 21 de Mayo de 2026
- **Status**: Propuestas creadas, listas para specs + design
- **Próximo**: Cargar skill `openspec-spec` para escribir especificaciones de CH-022
