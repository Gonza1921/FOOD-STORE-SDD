# CH-032: Professional Admin Dashboard — Metrics & Analytics

## Executive Summary

Create a **comprehensive admin dashboard** showing KPIs and analytics:

- **Revenue metrics** (total sales, daily/weekly/monthly trends)
- **Order analytics** (pending, completed, cancelled, avg delivery time)
- **Customer insights** (new registrations, active users, repeat customers)
- **Product performance** (best sellers, low stock alerts)
- **Staff metrics** (kitchen efficiency, delivery times)
- **Alerts & actions** (low stock, overdue orders, new customers)

This is the **final ecommerce transformation change** — completes the admin UX.

## Problem Statement

- **Current state**: Admin dashboard has routes but minimal UI/metrics
- **Admin pain**: "I don't know my sales numbers or operational health"
- **Missing feature**: Metrics are critical for business decisions

## Solution

Create a **multi-section dashboard** with:

1. **KPI cards** (total revenue, orders, customers)
2. **Charts** (sales trends, order status distribution, popular items)
3. **Tables** (recent orders, low stock alerts, top customers)
4. **Quick actions** (approve/cancel orders, restock products, manage users)

## Scope

✅ **Include**:
- KPI cards (revenue, orders, customers, avg ticket)
- Sales chart (last 7/30 days)
- Order status distribution pie chart
- Top 10 products by sales
- Low stock alerts
- Recent orders table
- Recent customers table
- Staff efficiency (kitchen times)
- Quick action buttons (manage, view details)
- Date range filters (today, this week, this month, custom)
- Responsive design

❌ **Exclude**:
- Advanced BI (future)
- Custom report builder (future)
- Email exports (future)
- Role-based dashboard customization (future)

## Dependencies

| Change | Dependency | Reason |
|--------|-----------|--------|
| **CH-026** | REQUIRED | Uses AdminLayout |
| **CH-023** | Optional | Real-time metrics update |
| **All others** | Optional | Complete context |

## Technical Approach

### Backend Endpoints

**New/Enhanced endpoints**:

```
GET /api/v1/admin/dashboard/metrics
  {
    "total_revenue": 15234.50,
    "total_orders": 342,
    "total_customers": 156,
    "avg_order_value": 44.51,
    "new_customers_today": 3,
    "pending_orders": 5,
    "avg_delivery_time_minutes": 35
  }

GET /api/v1/admin/dashboard/sales?period=7d
  [
    { "date": "2026-05-21", "sales": 1234.50, "orders": 12 },
    { "date": "2026-05-20", "sales": 892.30, "orders": 8 },
    ...
  ]

GET /api/v1/admin/dashboard/order-status-distribution
  {
    "PENDIENTE": 5,
    "CONFIRMADO": 3,
    "EN_PREPARACION": 2,
    "LISTO": 1,
    "EN_CAMINO": 0,
    "ENTREGADO": 325,
    "CANCELADO": 6
  }

GET /api/v1/admin/dashboard/top-products?limit=10
  [
    { "id": 1, "nombre": "Pizza Margherita", "vendidos": 45, "ingresos": 450 },
    ...
  ]

GET /api/v1/admin/dashboard/low-stock
  [
    { "id": 5, "nombre": "Leche", "stock": 2, "minimo": 10 },
    ...
  ]

GET /api/v1/admin/dashboard/recent-orders
  [
    { "id": 1234, "cliente": "Juan", "total": 45.50, "estado": "EN_CAMINO", "creado": "2026-05-21T14:30:00Z" },
    ...
  ]

GET /api/v1/admin/dashboard/staff-metrics?periodo=7d
  {
    "avg_prep_time_minutes": 18,
    "orders_completed": 150,
    "peak_hours": [12, 13, 19, 20]
  }
```

### Frontend Components

```
frontend/src/features/admin/
├── pages/
│   └── AdminDashboardPage.tsx
├── components/
│   ├── KpiCards.tsx             (revenue, orders, customers, ticket)
│   ├── SalesChart.tsx           (recharts line chart)
│   ├── OrderStatusChart.tsx     (pie chart)
│   ├── TopProductsTable.tsx     (best sellers)
│   ├── LowStockAlerts.tsx       (alerts table)
│   ├── RecentOrdersTable.tsx    (last 10 orders)
│   ├── StaffMetrics.tsx         (kitchen efficiency)
│   ├── DateRangeFilter.tsx      (period selector)
│   └── QuickActions.tsx         (buttons for common actions)
├── hooks/
│   └── useDashboardMetrics.ts   (fetch all data)
└── store.ts                     (Zustand for dashboard state)
```

### Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD                    Period: [Últimos 30d ▼] │
├────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐  │
│ │ Ingresos   │ │ Pedidos    │ │ Clientes   │ │ Ticket   │  │
│ │ $15,234.50 │ │ 342        │ │ 156        │ │ $44.51   │  │
│ │ ↑ 12%      │ │ ↓ 5%       │ │ ↑ 8%       │ │ ↑ 3%     │  │
│ └────────────┘ └────────────┘ └────────────┘ └──────────┘  │
├────────────────────────────────────────────────────────────┤
│ Ventas (últimos 7 días)     │ Estados de Pedidos           │
│ [Line Chart]                │ [Pie Chart]                  │
│                             │ ✓ Entregados: 325 (95%)      │
│                             │ ⏳ En Camino: 8 (2%)         │
│                             │ 🔨 Preparando: 2 (1%)        │
│                             │ ⚠️ Cancelados: 6 (2%)        │
├────────────────────────────────────────────────────────────┤
│ Mejores Productos           │ Alerta de Stock Bajo         │
│ 1. Pizza Margherita (45)    │ 🔴 Leche (2/10) [Reabastecer]│
│ 2. Burrito (38)             │ 🔴 Queso (1/5) [Reabastecer] │
│ 3. Ensalada (32)            │ 🟡 Pan (8/15) [Soon]         │
├────────────────────────────────────────────────────────────┤
│ Órdenes Recientes           │ Métricas de Cocina           │
│ #1234 Juan - $45.50 - ✓ En Camino  │ Tiempo promedio: 18 min    │
│ #1233 María - $32.00 - 🔨 Preparando│ Órdenes hoy: 42            │
│ #1232 Pedro - $28.75 - ✓ Entregado │ Hora pico: 13:00           │
└────────────────────────────────────────────────────────────┘
```

### Data Fetching

```typescript
// src/features/admin/hooks/useDashboardMetrics.ts

export function useDashboardMetrics(period: string) {
  const { data: metrics } = useTanStackQuery(
    ['admin-metrics', period],
    () => axios.get(`/api/v1/admin/dashboard/metrics?period=${period}`)
  );
  
  const { data: sales } = useTanStackQuery(
    ['admin-sales', period],
    () => axios.get(`/api/v1/admin/dashboard/sales?period=${period}`)
  );
  
  const { data: statusDist } = useTanStackQuery(
    ['admin-order-status', period],
    () => axios.get(`/api/v1/admin/dashboard/order-status-distribution`)
  );
  
  const { data: topProducts } = useTanStackQuery(
    ['admin-top-products', period],
    () => axios.get(`/api/v1/admin/dashboard/top-products?limit=10`)
  );
  
  const { data: lowStock } = useTanStackQuery(
    ['admin-low-stock'],
    () => axios.get(`/api/v1/admin/dashboard/low-stock`)
  );
  
  const { data: recentOrders } = useTanStackQuery(
    ['admin-recent-orders', period],
    () => axios.get(`/api/v1/admin/dashboard/recent-orders`)
  );
  
  return {
    metrics,
    sales,
    statusDist,
    topProducts,
    lowStock,
    recentOrders,
    isLoading: [metrics, sales, statusDist, topProducts, lowStock, recentOrders]
      .some(d => d.isLoading)
  };
}
```

### Charts with Recharts

```tsx
// SalesChart.tsx
function SalesChart({ data }) {
  return (
    <LineChart width={500} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="sales" stroke="#8884d8" />
      <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
    </LineChart>
  );
}

// OrderStatusChart.tsx
function OrderStatusChart({ data }) {
  return (
    <PieChart width={400} height={300}>
      <Pie data={data} dataKey="value" label />
      <Tooltip />
    </PieChart>
  );
}
```

## Effort Estimate

- **Backend endpoints**: 4 hours
  - Metrics endpoint: 1h
  - Sales chart data: 1h
  - Analytics queries (status, products, stock): 2h

- **Frontend dashboard**: 5 hours
  - KPI cards: 0.5h
  - Charts (sales, status): 1.5h
  - Tables (products, stock, orders): 2h
  - Date filters + responsive: 1h

- **Testing & performance**: 2 hours

**Total**: 11 hours

## Acceptance Criteria

- [ ] Dashboard loads without errors
- [ ] KPI cards show correct values
- [ ] Sales chart displays trend correctly
- [ ] Order status pie chart is accurate
- [ ] Top products table sorts correctly
- [ ] Low stock alerts display with action buttons
- [ ] Date range filter works (today, 7d, 30d, custom)
- [ ] Metrics update when filters change
- [ ] Responsive design on mobile/tablet
- [ ] Performance: dashboard loads in < 2 seconds
- [ ] No console errors
- [ ] Role guard enforces ADMIN access only

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Query performance (1000s of orders) | MEDIUM | MEDIUM | Add database indexes, cache aggregates |
| Charts slow with large datasets | LOW | LOW | Limit chart to last 90 days, pagination |
| Metrics cache stale | MEDIUM | LOW | Refresh on page focus, show last-updated time |
| Mobile dashboard cramped | MEDIUM | LOW | Stack cards vertically, hide non-critical charts |

## Timeline

- **Start**: After CH-026 is merged
- **Duration**: 11 hours (final change)
- **Delivery**: Feature branch, 2 commits (backend + frontend)
- **Merge**: When all metrics tested and performant

## Backend Development Notes

**Database optimization**:
- Add indexes on `pedidos.created_at`, `pedidos.estado`, `productos.vendidos`
- Consider materialized views for aggregates (daily sales, order counts)

**Caching strategy**:
- Cache dashboard metrics for 5 minutes (update on POST order/payment)
- Cache sales chart for 1 hour
- Cache top products for 24 hours

## Next Steps (After This Change)

1. **Testing suite** for entire ecommerce transformation (CH-026 to CH-032)
2. **Performance optimization** (database, caching, lazy loading)
3. **Deployment** to staging, then production
4. **Documentation** update for new features

---

**Change Owner**: Full-stack team + DevOps  
**Status**: 🟡 Planning  
**Created**: 2026-05-21  
**Last Updated**: 2026-05-21
