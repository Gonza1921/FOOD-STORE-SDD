# admin-dashboard Specification

## Purpose
TBD - created by archiving change ch-032-admin-dashboard-professional. Update Purpose after archive.
## Requirements
### Requirement: Admin can view revenue KPI cards

The system SHALL display key performance indicator cards at the top of the dashboard showing: total revenue, total orders, total customers, and average ticket value. Each card SHALL show the current value, a trend indicator (up/down percentage vs previous period), and a label.

#### Scenario: Dashboard loads with all KPI values

- **WHEN** an ADMIN user navigates to the dashboard
- **THEN** the system displays KPI cards for "Ingresos", "Pedidos", "Clientes", and "Ticket Promedio"
- **AND** each card shows the current numeric value
- **AND** each card shows a trend arrow (↑ or ↓) with percentage change

#### Scenario: KPI card shows loading skeleton

- **WHEN** the dashboard data is still loading
- **THEN** each KPI card SHALL display a skeleton/placeholder animation
- **AND** no numeric values SHALL appear until data is available

#### Scenario: Backend returns error for metrics

- **WHEN** the metrics endpoint returns a 5xx error
- **THEN** the KPI cards SHALL display "Error al cargar" or fallback to "--"
- **AND** a toast notification SHALL show the error message

### Requirement: Admin can view sales trend chart

The system SHALL render a line chart showing sales and order volume over a configurable period (last 7 days, last 30 days, or custom range). The chart SHALL have two lines: "Ventas" (revenue) and "Órdenes" (order count), with a date X-axis.

#### Scenario: Sales chart loads with 7-day data

- **WHEN** the admin selects "Últimos 7 días" filter
- **THEN** the chart SHALL display 7 data points, one per day
- **AND** each point shows total sales and order count for that day
- **AND** the X-axis labels show dates in "DD/MM" format

#### Scenario: Sales chart shows tooltip on hover

- **WHEN** the admin hovers over a data point on the chart
- **THEN** a tooltip SHALL appear with: date, total sales (formatted as ARS), and order count
- **AND** the tooltip SHALL disappear when the cursor leaves the point

#### Scenario: Custom date range selection

- **WHEN** the admin selects a custom date range via date pickers
- **THEN** the chart SHALL update to show data for the selected range
- **AND** the chart SHALL adjust its granularity (daily for <31 days, weekly for 31-90 days, monthly for >90 days)

### Requirement: Admin can view order status distribution

The system SHALL display a pie chart showing the distribution of orders by status (PENDIENTE, CONFIRMADO, EN_PREPARACIÓN, LISTO, EN_CAMINO, ENTREGADO, CANCELADO), with percentage labels and a color-coded legend.

#### Scenario: Order status pie chart loads

- **WHEN** the dashboard loads
- **THEN** the system displays a pie chart with slices for each order status
- **AND** each slice shows the percentage of total orders
- **AND** a legend maps colors to status names
- **AND** hovering a slice shows exact count and status name

#### Scenario: Empty order data

- **WHEN** there are no orders in the system
- **THEN** the pie chart SHALL display a "Sin datos" message
- **AND** no chart slices SHALL render

### Requirement: Admin can view top products table

The system SHALL display a table of the top 10 best-selling products ranked by quantity sold, showing: rank, product name, quantity sold, and revenue generated.

#### Scenario: Top products table loads

- **WHEN** the dashboard loads
- **THEN** the system displays a table with columns: "#", "Producto", "Vendidos", "Ingresos"
- **AND** rows are sorted by quantity sold descending
- **AND** each row shows the correct product data

#### Scenario: Admin clicks product to view details

- **WHEN** the admin clicks a product name in the table
- **THEN** the system navigates to the product detail/edit page for that product

### Requirement: Admin can view low stock alerts

The system SHALL display a table of products with stock below their configured minimum threshold, with color-coded severity (red for critically low, yellow for approaching minimum) and a "Reabastecer" action button.

#### Scenario: Low stock alerts display with products below threshold

- **WHEN** the dashboard loads and there are products with stock < minimum
- **THEN** the system SHALL display each product with: name, current stock, minimum threshold
- **AND** products at or below 50% of minimum SHALL show red background
- **AND** products between 50-100% of minimum SHALL show yellow background
- **AND** each row has a "Reabastecer" button

#### Scenario: No low stock products

- **WHEN** all products have stock above their minimum threshold
- **THEN** the low stock section SHALL display "No hay productos con stock bajo" with a checkmark icon

#### Scenario: Admin clicks Reabastecer

- **WHEN** the admin clicks "Reabastecer" on a low stock alert
- **THEN** the system SHALL navigate to the product edit page with a pre-filled stock increase suggestion

### Requirement: Admin can view recent orders table

The system SHALL display a table of the 10 most recent orders showing: order ID, customer name, total, status (with color-coded badge), creation time, and action buttons (view details, approve/cancel if pending).

#### Scenario: Recent orders table loads

- **WHEN** the dashboard loads
- **THEN** the system displays the 10 most recent orders with columns: "#", "Cliente", "Total", "Estado", "Creado"
- **AND** each status SHALL have a colored badge (PENDIENTE=yellow, CONFIRMADO=blue, ENTREGADO=green, CANCELADO=red)
- **AND** orders are sorted by creation date descending

#### Scenario: Admin clicks view order

- **WHEN** the admin clicks a order ID in the table
- **THEN** the system SHALL navigate to the order detail page for that order

### Requirement: Admin can view recent customers table

The system SHALL display a table of the 10 most recently registered customers showing: name, email, registration date, total orders count, and a "View" action button.

#### Scenario: Recent customers table loads

- **WHEN** the dashboard loads
- **THEN** the system displays the 10 most recent customers
- **AND** each row shows: name, email, registered date (relative like "hace 2 días"), total orders
- **AND** rows are sorted by registration date descending

### Requirement: Admin can view staff/kitchen metrics

The system SHALL display kitchen efficiency metrics: average preparation time (minutes), orders completed today, peak hours chart, and comparison vs previous period.

#### Scenario: Staff metrics load

- **WHEN** the dashboard loads
- **THEN** the system displays: "Tiempo Promedio de Preparación" (in minutes), "Órdenes Completadas Hoy", "Horas Pico" (list of peak hours)
- **AND** average prep time shows a trend arrow vs previous period

#### Scenario: No orders today for staff metrics

- **WHEN** there are no completed orders today
- **THEN** the staff metrics section SHALL display "Sin datos para hoy"
- **AND** all values SHALL show "--"

### Requirement: Admin can filter dashboard by date range

The system SHALL provide a date range filter at the top of the dashboard with options: "Hoy", "Últimos 7 días", "Últimos 30 días", and "Personalizado" (custom date picker). Changing the filter SHALL refresh all data sections.

#### Scenario: Admin selects different period

- **WHEN** the admin changes the date filter from "Últimos 7 días" to "Últimos 30 días"
- **THEN** all dashboard sections SHALL refresh with data for the new period
- **AND** loading states SHALL show during refresh
- **AND** the URL query parameter `?periodo=30d` SHALL update

#### Scenario: Admin selects custom range

- **WHEN** the admin selects "Personalizado"
- **THEN** two date pickers SHALL appear for start and end dates
- **AND** the dashboard SHALL only refresh when the admin clicks "Aplicar"

### Requirement: Admin can perform quick actions

The system SHALL provide a set of quick action buttons for common admin tasks: "Nuevo Producto", "Nuevo Pedido", "Gestionar Usuarios", "Ver Catálogo". Each button SHALL navigate to the corresponding page.

#### Scenario: Quick action buttons display

- **WHEN** the dashboard loads
- **THEN** the system SHALL display action buttons with icons and labels
- **AND** clicking "Nuevo Producto" navigates to `/admin/productos/nuevo`
- **AND** clicking "Gestionar Usuarios" navigates to `/admin/usuarios`
- **AND** clicking "Ver Catálogo" navigates to `/catalogo`

### Requirement: Dashboard enforces ADMIN role access

The system SHALL restrict all dashboard endpoints and the dashboard page to users with the ADMIN role. Non-ADMIN users SHALL receive a 403 error for API endpoints and be redirected from the page.

#### Scenario: Non-ADMIN user tries to access dashboard page

- **WHEN** a user with CLIENT, STOCK, or PEDIDOS role navigates to `/admin/dashboard`
- **THEN** the system SHALL redirect them to their home page
- **AND** SHALL NOT display any dashboard data

#### Scenario: Non-ADMIN user calls dashboard API

- **WHEN** a request is made to any `/api/v1/admin/dashboard/*` endpoint without ADMIN role
- **THEN** the system SHALL return 403 Forbidden
- **AND** the response body SHALL include error code `FORBIDDEN`

