## ADDED Requirements

### Requirement: Layout separation by user role and auth status

The system SHALL provide three distinct layout wrappers based on authentication status and user role:

1. **PublicLayout** — for unauthenticated public pages
2. **CustomerLayout** — for authenticated CLIENT users
3. **AdminLayout** — for authenticated users with ADMIN, STOCK, or PEDIDOS roles

#### Scenario: Unauthenticated user visits public page
- **WHEN** an unauthenticated user navigates to `/catalogo` or `/productos/:id`
- **THEN** the PublicLayout SHALL render without requiring authentication

#### Scenario: CLIENT user sees CustomerLayout after login
- **WHEN** a user with CLIENT role logs in and is redirected to any customer route
- **THEN** the CustomerLayout SHALL render without the admin sidebar
- **AND** the admin sidebar SHALL NOT be present in the DOM

#### Scenario: ADMIN user sees AdminLayout after login
- **WHEN** a user with ADMIN role logs in and navigates to `/admin/dashboard`
- **THEN** the AdminLayout SHALL render with the glass sidebar and topbar

#### Scenario: STOCK user sees AdminLayout
- **WHEN** a user with only STOCK role logs in and navigates to `/admin/productos`
- **THEN** the AdminLayout SHALL render with the sidebar showing stock-relevant navigation

#### Scenario: PEDIDOS user sees AdminLayout
- **WHEN** a user with only PEDIDOS role logs in and navigates to `/admin/pedidos`
- **THEN** the AdminLayout SHALL render with the sidebar showing order-relevant navigation

---

### Requirement: PublicLayout provides consistent public page wrapper

PublicLayout SHALL render a minimal wrapper for public-facing pages without authentication or role checks.

#### Scenario: PublicLayout renders children
- **WHEN** PublicLayout wraps a public route
- **THEN** it SHALL render the child route content via `<Outlet />`

---

### Requirement: CustomerLayout provides clean customer wrapper

CustomerLayout SHALL render a clean wrapper for CLIENT-accessible routes without the admin sidebar.

#### Scenario: CustomerLayout renders without sidebar
- **WHEN** CustomerLayout renders for a CLIENT route
- **THEN** the layout SHALL render child content via `<Outlet />`
- **AND** the admin Sidebar component SHALL NOT be rendered

#### Scenario: Multiple customer routes work under CustomerLayout
- **WHEN** a CLIENT user navigates between `/carrito`, `/checkout`, `/mis-pedidos`, and `/mi-perfil`
- **THEN** all routes SHALL render correctly under CustomerLayout without 404 errors

---

### Requirement: AdminLayout provides sidebar + topbar for staff

AdminLayout SHALL render the glass sidebar and topbar for authenticated staff users (ADMIN, STOCK, PEDIDOS), preserving the current AppLayout behavior.

#### Scenario: AdminLayout renders sidebar and topbar
- **WHEN** AdminLayout renders for an admin route
- **THEN** the Sidebar SHALL be rendered on the left
- **AND** the topbar SHALL be rendered at the top of the main content area
- **AND** the child route content SHALL render via `<Outlet />` in the main area

#### Scenario: AdminLayout topbar shows correct route title
- **WHEN** an admin user navigates to `/admin/usuarios`
- **THEN** the topbar SHALL display the title "Usuarios"

#### Scenario: AdminLayout preserves cart icon in topbar
- **WHEN** the admin topbar renders
- **THEN** the cart icon with item count badge SHALL be visible
- **AND** clicking the cart icon SHALL navigate to `/carrito`

---

### Requirement: ProtectedRoute wraps layouts, not individual routes

The ProtectedRoute component SHALL wrap layout routes so that all nested child routes inherit the auth/role protection.

#### Scenario: ProtectedRoute guards all customer routes
- **WHEN** an unauthenticated user tries to access `/carrito`
- **THEN** they SHALL be redirected to `/login`

#### Scenario: ProtectedRoute with role guards all admin routes
- **WHEN** a CLIENT user tries to access `/admin/dashboard`
- **THEN** they SHALL be redirected to `/acceso-denegado`

---

### Requirement: All existing routes remain functional

All currently working routes SHALL continue to function after the layout refactor, returning the same page content.

#### Scenario: KDS Cocina page renders full-screen without layout
- **WHEN** a user with COCINA role navigates to `/cocina`
- **THEN** the CocinaPage SHALL render full-screen without any layout wrapper (Public, Customer, or Admin)

#### Scenario: Auth pages have no layout wrapper
- **WHEN** a user navigates to `/login`, `/registro`, or `/acceso-denegado`
- **THEN** these pages SHALL render without PublicLayout, CustomerLayout, or AdminLayout

#### Scenario: 404 catch-all still works
- **WHEN** a user navigates to a non-existent path like `/no-existe`
- **THEN** the 404 page SHALL render correctly

---

### Requirement: Route `/` resolves correctly for all user states

The root path `/` SHALL resolve to the correct page based on authentication and role.

#### Scenario: Unauthenticated user visits `/`
- **WHEN** an unauthenticated user visits `/`
- **THEN** they SHALL see the HomePage under PublicLayout

#### Scenario: Authenticated CLIENT visits `/`
- **WHEN** an authenticated CLIENT user visits `/`
- **THEN** they SHALL see the HomePage under CustomerLayout

#### Scenario: Admin user visits `/`
- **WHEN** an authenticated ADMIN user visits `/`
- **THEN** they SHALL be redirected to `/admin/dashboard`
