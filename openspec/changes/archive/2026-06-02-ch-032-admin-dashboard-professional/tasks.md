# Tasks: CH-032 Admin Dashboard Professional

## 1. Backend — Dashboard Router (low-stock, recent-orders, recent-customers, staff-metrics)

- [x] 1.1 Create `backend/admin/dashboard_router.py` with 4 new endpoints (low-stock, recent-orders, recent-customers, staff-metrics), all requiring ADMIN role
- [x] 1.2 Register `dashboard_router` in `backend/main.py`
- [x] 1.3 Modify `backend/admin/router.py` to add `totalClientes`, `ticketPromedio`, and `tendencias` to the metrics response (with period-over-period comparison)

## 2. Frontend — Hooks for new data

- [x] 2.1 Create `useAdminLowStock.ts` hook (GET /api/v1/admin/dashboard/low-stock)
- [x] 2.2 Create `useAdminRecentOrders.ts` hook (GET /api/v1/admin/dashboard/recent-orders)
- [x] 2.3 Create `useAdminRecentCustomers.ts` hook (GET /api/v1/admin/dashboard/recent-customers)
- [x] 2.4 Create `useAdminStaffMetrics.ts` hook (GET /api/v1/admin/dashboard/staff-metrics)
- [x] 2.5 Create `useDashboardPeriod.ts` hook (URL searchParams-based period filter: today, 7d, 30d, custom)
- [x] 2.6 Update `useAdminMetrics.ts` to accept `period` param and parse new fields (totalClientes, ticketPromedio, tendencias)

## 3. Frontend — New components

- [x] 3.1 Create `LowStockAlerts.tsx` component (table with severity colors + Reabastecer button)
- [x] 3.2 Create `RecentOrdersTable.tsx` component (table with color-coded status badges)
- [x] 3.3 Create `RecentCustomersTable.tsx` component (table with relative dates + order count)
- [x] 3.4 Create `StaffMetrics.tsx` component (average prep time, orders today, peak hours)
- [x] 3.5 Create `DateRangeFilter.tsx` component (today, 7d, 30d, custom with date pickers)
- [x] 3.6 Create `QuickActions.tsx` component (Nuevo Producto, Nuevo Pedido, Gestionar Usuarios, Ver Catálogo)
- [x] 3.7 Create `SalesTrendChart.tsx` component (line chart with dual lines: Ventas + Órdenes)

## 4. Frontend — Integration & Routing

- [x] 4.1 Update `AdminDashboardPage.tsx` to integrate all new components (DateRangeFilter, LowStockAlerts, RecentOrdersTable, RecentCustomersTable, StaffMetrics, QuickActions, SalesTrendChart), update MetricCards to use new KPI fields with trends
- [x] 4.2 Update Sidebar.tsx: change `/admin/dashboard` → `/admin` in admin menuConfig
- [x] 4.3 Update Router.tsx: add redirect from `/admin/dashboard` to `/admin`, remove orphan `/admin/metricas` route

## 5. Verify

- [x] 5.1 Verify all backend endpoints return correct data structure
- [x] 5.2 Verify all frontend components render loading, empty, error, and success states
- [x] 5.3 Verify sidebar redirects to new dashboard
- [x] 5.4 Verify the dashboard renders without console errors
