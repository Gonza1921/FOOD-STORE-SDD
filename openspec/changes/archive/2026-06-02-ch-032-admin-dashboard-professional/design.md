# Design: CH-032 Admin Dashboard Professional

## Context

El dashboard admin actual tiene una **base sólida** dejada por cambios anteriores (CH-026+):
- **Backend**: `GET /admin/metrics` con KPIs básicos, más endpoints avanzados en `metrics_router.py` (top productos, ventas por período)
- **Frontend**: `AdminDashboardPage` en `/admin` con MetricCards (4), ChartBar, ChartLine, ChartPie, TopProductosTable, VentasPeriodoChart, ConfigSection

**Lo que falta** para cumplir la propuesta CH-032:
- Backend: low-stock detail, recent orders, recent customers, staff metrics, enhanced metrics con KPI trends
- Frontend: LowStockAlerts, RecentOrdersTable, RecentCustomersTable, StaffMetrics, DateRangeFilter, QuickActions
- Sidebar apunta a `/admin/dashboard` (legacy) en vez de `/admin` (nuevo)
- Ruta `/admin/metricas` en sidebar no tiene componente

## Goals / Non-Goals

**Goals:**
- Completar el dashboard profesional con todas las secciones de la propuesta
- Extender el backend con los endpoints faltantes
- Integrar nuevos componentes en la `AdminDashboardPage` existente
- Redirigir el sidebar y rutas para que el nuevo dashboard sea el default

**Non-Goals:**
- NO reemplazar componentes existentes que ya funcionan (ChartBar, ChartPie, MetricCard, TopProductosTable, VentasPeriodoChart)
- NO modificar el modelo de datos (no hay cambios de schema)
- NO agregar caché externa ni Redis (queda para futuro)
- NO implementar exportación CSV/excel ni report builder

## Decisions

### Decision 1: New backend router for dashboard endpoints

**Context**: La propuesta requiere 4 nuevos endpoints que no existen.

**Decision**: Crear `backend/admin/dashboard_router.py` con prefijo `/api/v1/admin/dashboard`.

| Endpoint | Propósito | Data Source |
|----------|-----------|-------------|
| `GET /api/v1/admin/dashboard/low-stock` | Productos con stock < mínimo, con severidad | `Producto` model, raw SQL |
| `GET /api/v1/admin/dashboard/recent-orders` | Últimas 10 órdenes con datos de cliente | `Pedido` JOIN `usuario` |
| `GET /api/v1/admin/dashboard/recent-customers` | Últimos 10 clientes registrados | `Usuario` where rol CLIENT |
| `GET /api/v1/admin/dashboard/staff-metrics` | Métricas de cocina (tiempo prep, peak hours) | `Pedido` + `HistorialEstadoPedido` |

**Rationale**: Router separado mantiene cohesión. El existente `router.py` se queda para el aggregated metrics endpoint. Todos los endpoints requieren rol ADMIN via `require_role(["ADMIN"])`.

**Alternative considered**: Meter todo en `router.py` existente — descartado porque mezcla concerns (metrics aggregate vs detail endpoints).

### Decision 2: Enhanced metrics endpoint with KPI trends

**Context**: Los specs piden KPI cards con trend indicators (↑12%, ↓5%) vs período anterior.

**Decision**: Modificar `GET /admin/metrics` para incluir `tendencias` con comparación vs período anterior.

**Nuevos campos en response**:
```json
{
  "totalPedidos": 342,
  "pedidosPendientes": 5,
  "ingresosTotales": 15234.50,
  "productosStockBajo": 3,
  "pedidosPorEstado": { ... },
  "ingresosPorDia": [ ... ],
  "tendenciaPedidos": [ ... ],
  "totalClientes": 156,
  "ticketPromedio": 44.51,
  "tendencias": {
    "pedidos": { "valor": 342, "anterior": 325, "cambio": 5.2 },
    "ingresos": { "valor": 15234.50, "anterior": 14100.0, "cambio": 8.0 },
    "clientes": { "valor": 156, "anterior": 144, "cambio": 8.3 },
    "ticketPromedio": { "valor": 44.51, "anterior": 43.20, "cambio": 3.0 }
  }
}
```

**Rationale**: Single round-trip en vez de N requests para los KPI. El cálculo de "período anterior" usa la misma ventana desplazada (ej: últimos 30 días vs 30 días antes de eso).

### Decision 3: Dashboard page composition

**Context**: La `AdminDashboardPage` existente ya tiene estructura. Hay que integrar los nuevos componentes.

**Decision**: Modificar `AdminDashboardPage` para que use un layout de 2 columnas responsive:

```
┌─────────────────────────────────────────────┐
│ ┌── DateRangeFilter ──────────────────────┐ │
│ │ [Hoy] [7d] [30d] [Personalizado ▼]      │ │
│ └──────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ ┌── 4 KPI Cards (existentes, mejorados) ─┐ │
│ └──────────────────────────────────────────┘ │
├──────────────┬──────────────────────────────┤
│ Sales Chart  │ Order Status Pie             │
│ (line chart) │ (pie chart - existente)      │
├──────────────┴──────────────────────────────┤
│ Order Trend Line (existente)                │
├──────────────┬──────────────────────────────┤
│ TopProducts  │ LowStockAlerts (NUEVO)       │
├──────────────┼──────────────────────────────┤
│ RecentOrders │ RecentCustomers (NUEVOS)     │
│ (NUEVO)      │                              │
├──────────────┴──────────────────────────────┤
│ StaffMetrics (NUEVO)  │ QuickActions (NUEVO)│
├─────────────────────────────────────────────┤
│ VentasPeriodo (existente)   │ ConfigSection  │
└─────────────────────────────────────────────┘
```

**Rationale**: Reutiliza todos los componentes existentes. Agrega los nuevos sin romper nada. Layout responsive: 2 columnas en desktop, 1 columna en mobile.

### Decision 4: Sidebar + Router redirect

**Context**: Sidebar apunta a `/admin/dashboard` (legacy), no a `/admin` (nuevo). La ruta `/admin/metricas` no tiene componente.

**Decision**:
1. Sidebar: cambiar `/admin/dashboard` → `/admin` en `menuConfig.admin`
2. Router: agregar redirect `/admin/dashboard` → `/admin`
3. Router: eliminar la ruta `/admin/metricas` (o redirigir a `/admin`)
4. La vieja `DashboardPage` queda accesible vía `/old-dashboard` si se necesita

**Rationale**: Un solo dashboard profesional. El viejo era placeholder con "en construcción". No tiene sentido mantener dos.

### Decision 5: DateRangeFilter via Zustand + query params

**Context**: El filtro de período debe actualizar todos los componentes del dashboard.

**Decision**: Crear `useDashboardPeriod` hook que:
- Lee el período de `searchParams` (?periodo=30d)
- Soporta: `today`, `7d`, `30d`, `custom`
- Expone el período actual + setter que actualiza URL
- Cada hook de datos (`useAdminMetrics`, etc.) recibe el período como parametro de query

**Rationale**: URL-based state permite compartir enlaces, es bookmarkeable, y no requiere store global. Los queries de TanStack Query se cachean por período automáticamente.

### Decision 6: Components reutilizan patrones existentes

**Context**: Todos los componentes nuevos siguen Feature-Sliced Design.

**Decision**: Cada componente nuevo:
- Usa su propio hook TanStack Query (ej: `useAdminLowStock`, `useAdminRecentOrders`)
- Renderiza skeleton mientras carga
- Maneja estado vacío y error
- Sigue el mismo patrón visual que `TopProductosTable`

**Nuevos hooks:**
- `useAdminLowStock.ts` → `GET /api/v1/admin/dashboard/low-stock`
- `useAdminRecentOrders.ts` → `GET /api/v1/admin/dashboard/recent-orders`
- `useAdminRecentCustomers.ts` → `GET /api/v1/admin/dashboard/recent-customers`
- `useAdminStaffMetrics.ts` → `GET /api/v1/admin/dashboard/staff-metrics`

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Query performance**: low-stock y recent-orders pueden ser lentos con miles de registros | Agregar índices en `producto.stock_cantidad`, `pedido.creado_en`, `usuario.creado_en`. Limitar a TOP 10. |
| **KPI trends inconsistency**: El período anterior puede no tener datos (ej: sistema nuevo) | Default a 0% change si no hay data previa. Mostrar "—" si no hay suficiente histórico. |
| **Dashboard demasiado largo**: Múltiples secciones pueden requerir scroll excesivo | Layout de 2 columnas en desktop. Secciones colapsables en mobile. |
| **Rotura de sidebar**: STOCK y PEDIDOS roles también usan `/admin/dashboard` | Mantener redirect de `/admin/dashboard` → `/admin`. El nuevo dashboard también sirve para esos roles (con data filtrada si hace falta). |
| **Doble fetch**: AdminDashboardPage carga métricas + los nuevos componentes cargan sus propios datos | Aceptable por ahora. Cada fetch es pequeño y paralelo. Optimizar con batch endpoint en futuro. |

## Migration Plan

1. Backend: agregar `dashboard_router.py`, modificar `router.py` con tendencias, registrar en `main.py`
2. Frontend: crear hooks + componentes nuevos
3. Frontend: modificar `AdminDashboardPage` para integrar todo
4. Sidebar: cambiar ruta `/admin/dashboard` → `/admin`
5. Router: agregar redirect `/admin/dashboard` → `/admin`
6. Test y verify

Rollback: revertir commit, o mantener sidebar apuntando al viejo `/admin/dashboard` si algo falla.

## Open Questions

- ¿Los roles STOCK y PEDIDOS deberían ver el mismo dashboard profesional o uno simplificado? → Por ahora mismo dashboard para todos, solo cambia lo que pueden hacer (ej: STOCK no ve métricas de staff).
