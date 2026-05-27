## Context

FOOD-STORE currently uses a single `AppLayout` component for ALL authenticated routes. This layout renders a glass sidebar with navigation items for both customers and admin roles, plus a topbar with user info and cart. The problem is that **customers (CLIENT role) see an admin-oriented sidebar** after login, which is confusing and unprofessional for an ecommerce experience.

The current architecture:
- **Router.tsx**: All protected routes wrapped in `<Route element={<AppLayout />}>`
- **AppLayout.tsx**: Single layout with glass sidebar + topbar + `<Outlet />`
- **Sidebar.tsx**: Renders ALL role-based nav items (cliente + admin + stock + pedidos) in one sidebar
- **Public routes** (/login, /registro, /catalogo, /productos/:id) have NO layout wrapper

This change is the **blocking dependency** for CH-027 through CH-032 — all ecommerce improvements require proper layout separation.

## Goals / Non-Goals

**Goals:**
- Create `PublicLayout` — minimal wrapper for public-facing pages (no auth required)
- Create `CustomerLayout` — navbar-style layout for CLIENT users (no sidebar, clean ecommerce UX)
- Create `AdminLayout` — sidebar + topbar for admin/staff users (same as current AppLayout)
- Refactor `Router.tsx` to route users to correct layout based on auth status and role
- Keep `Sidebar.tsx` only rendered inside `AdminLayout`
- Keep auth provider, stores, and global state at App level (above Router)
- All existing routes must continue working without 404s or regressions

**Non-Goals:**
- Designing the customer navbar visual (that's CH-027)
- Adding footer content or links (that's CH-027)
- Improving admin sidebar design (that's CH-032)
- Adding new routes or pages
- Backend changes of any kind
- CSS theme changes beyond layout structure

## Decisions

### Decision 1: Three separate layout components instead of role-switching inside one

**Option A (selected)**: Three independent layout components (`PublicLayout`, `CustomerLayout`, `AdminLayout`) selected by Router based on route group.

**Option B**: Single `AppLayout` that checks user role internally and conditionally renders sidebar vs navbar.

**Why A wins**: Cleaner separation of concerns, each layout is independently testable, Router becomes the source of truth for which layout renders, and future changes (CH-027 navbar, CH-032 admin improvements) can target specific layouts without touching others. Option B would create a monolithic component with complex conditional logic that grows harder to maintain.

### Decision 2: PublicLayout wraps public pages (home, catalog, product detail)

**Rationale**: Currently `/catalogo`, `/productos/:id`, and `/` (home) have no layout at all. A `PublicLayout` provides a consistent wrapper for these pages, making it easy to add a public navbar and footer later (CH-027). It renders `<Outlet />` with basic structure.

### Decision 3: CustomerLayout renders without Sidebar

**Rationale**: CLIENT users don't need the admin sidebar. The `CustomerLayout` will be a clean wrapper with an `<Outlet />` — the CH-027 change will add the customer navbar and footer inside it.

### Decision 4: AdminLayout is the CURRENT AppLayout (renamed)

**Rationale**: The existing `AppLayout` with its glass sidebar + topbar is exactly what admin/staff users need. Rather than rewriting it, we rename and refactor it to `AdminLayout`, keeping its behavior intact. This minimizes risk of regressions.

### Decision 5: Use React Router's `<Outlet />` nesting pattern

**Rationale**: React Router's layout routes pattern (`<Route element={<Layout />}>`) uses `<Outlet />` to render child routes. This is the idiomatic React Router v6 approach and aligns with the current codebase pattern.

## Architecture

### Component Tree After Change

```
<AuthProvider>         ← stays at App level
  <Routes>
    │
    ├── PUBLIC ROUTES
    │   └── <PublicLayout>       ← minimal wrapper, no auth check
    │       └── <Outlet />
    │           ├── /catalogo
    │           └── /productos/:id
    │
    ├── CUSTOMER ROUTES (CLIENT role)
    │   └── <ProtectedRoute>
    │       └── <CustomerLayout>  ← clean wrapper, no sidebar
    │           └── <Outlet />
    │               ├── /carrito
    │               ├── /checkout
    │               ├── /mis-pedidos
    │               ├── /mi-perfil
    │               ├── /mis-direcciones
    │               └── /pagar/:pedidoId
    │
    ├── ADMIN ROUTES (ADMIN/STOCK/PEDIDOS roles)
    │   └── <ProtectedRoute roles={...}>
    │       └── <AdminLayout>     ← sidebar + topbar (current AppLayout)
    │           └── <Outlet />
    │               ├── /admin/dashboard
    │               ├── /admin/usuarios
    │               ├── /admin/productos
    │               ├── /admin/categorias
    │               ├── /admin/ingredientes
    │               ├── /admin/pedidos
    │               └── /dashboard (legacy redirect)
    │
    ├── KDS COCINA (full-screen, no layout)
    │   └── <ProtectedRoute roles={['COCINA','PEDIDOS','ADMIN']}>
    │       └── <CocinaPage />
    │
    └── AUTH PAGES (no layout)
        ├── /login
        ├── /registro
        └── /acceso-denegado
  </Routes>
</AuthProvider>
```

### File Changes

```
src/widgets/Layout/
├── AppLayout.tsx          → RENAMED to AdminLayout.tsx (with minor refinements)
├── AdminLayout.tsx        ← NEW (from AppLayout, adapted)
├── CustomerLayout.tsx     ← NEW (clean wrapper)
├── PublicLayout.tsx       ← NEW (minimal wrapper)
├── AppLayout.js           ← DELETE (compiled artifact, outdated)
├── Header/                ← stays
├── Sidebar/               ← stays, only used by AdminLayout
└── Footer.tsx             ← NOT YET (CH-027)

src/app/
└── Router.tsx             ← UPDATED (use new layouts)
```

### Router.tsx — New Route Structure

```tsx
// PUBLIC routes — no auth required
<Route element={<PublicLayout />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/catalogo" element={<PublicCatalogPage />} />
  <Route path="/productos/:id" element={<ProductoDetailPage />} />
</Route>

// AUTH pages — no layout
<Route path="/login" element={<LoginPage />} />
<Route path="/registro" element={<RegisterPage />} />
<Route path="/acceso-denegado" element={<UnauthorizedPage />} />

// KDS Cocina — full screen, no layout
<Route path="/cocina" element={
  <ProtectedRoute roles={['COCINA','PEDIDOS','ADMIN']}>
    <CocinaPage />
  </ProtectedRoute>
} />

// CUSTOMER routes — CLIENT role
<Route element={
  <ProtectedRoute>
    <CustomerLayout />
  </ProtectedRoute>
}>
  <Route path="/carrito" element={<CartPage />} />
  <Route path="/checkout" element={<CheckoutPage />} />
  <Route path="/mi-perfil" element={<PerfilPage />} />
  <Route path="/mis-pedidos" element={<OrdersPage />} />
  <Route path="/mis-pedidos/:id" element={<OrderDetailPage />} />
  <Route path="/mis-direcciones" element={<DireccionesListPage />} />
  <Route path="/mis-direcciones/nueva" element={<DireccionesListPage />} />
  <Route path="/pagar/:pedidoId" element={<PaymentPage />} />
  <Route path="/confirmacion/:pedidoId" element={<OrderConfirmationPage />} />
  <Route path="/pago/resultado/:pedidoId" element={<PaymentResultPage />} />
</Route>

// ADMIN routes — staff roles
<Route element={
  <ProtectedRoute roles={['ADMIN','STOCK','PEDIDOS']}>
    <AdminLayout />
  </ProtectedRoute>
}>
  <Route path="/" element={<Navigate to="/admin/dashboard" />} />
  <Route path="/admin/dashboard" element={<DashboardPage />} />
  <Route path="/dashboard" element={<Navigate to="/admin/dashboard" />} />
  <Route path="/admin" element={<AdminDashboardPage />} />
  <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
  <Route path="/admin/productos" element={<ProductsAdminPage />} />
  <Route path="/admin/categorias" element={<CategoriesAdminPage />} />
  <Route path="/admin/ingredientes" element={<IngredientsAdminPage />} />
  <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
</Route>
```

### Layout Component Specifications

**PublicLayout.tsx:**
- Minimal wrapper, no auth check
- Renders `<main><Outlet /></main>` with basic className
- No sidebar, no navbar, no footer (these will come in CH-027)
- Used for: home, catalog, product detail pages

**CustomerLayout.tsx:**
- Auth required (via ProtectedRoute wrapping)
- Clean wrapper with `<Outlet />`
- No sidebar, no topbar with admin elements
- Will contain customer navbar + footer in CH-027
- For now: just structural wrapper with basic styling

**AdminLayout.tsx:**
- Auth + role check required (via ProtectedRoute)
- **Identical behavior to current AppLayout** (glass sidebar + topbar)
- Sidebar still renders with role-based menu items
- Route titles map stays the same
- Keeps cart icon, user info, logout

## Migration Plan

### Step 1: Create PublicLayout.tsx
- Simple component rendering `<main className="..."><Outlet /></main>`
- No auth, no sidebar, no state

### Step 2: Create CustomerLayout.tsx
- Clean wrapper with `<Outlet />`
- No sidebar, no admin topbar
- Minimal: just structural div + Outlet

### Step 3: Create AdminLayout.tsx
- Copy current AppLayout.tsx content
- Rename component to `AdminLayout`
- Keep all sidebar + topbar behavior exactly as-is
- Route titles stay the same

### Step 4: Delete AppLayout.js (compiled artifact)
- The `.js` file is a compiled version of the `.tsx`
- Safe to remove since `.tsx` is the source

### Step 5: Update Router.tsx
- Restructure routes as per the new architecture
- Each route group gets its own layout wrapper
- ProtectedRoute wraps the layout, not individual routes (where possible)

### Step 6: Verify no regressions
- Login as CLIENT → should see CustomerLayout (no sidebar)
- Login as ADMIN → should see AdminLayout (with sidebar)
- Login as STOCK → should see AdminLayout (with sidebar)
- Login as PEDIDOS → should see AdminLayout (with sidebar)
- Unauthenticated → public routes work
- All existing paths return correct components

### Rollback Strategy
- All changes are additive (new files) + one file modified (Router.tsx)
- Rollback: `git checkout -- src/app/Router.tsx && git clean -f src/widgets/Layout/`
- Original AppLayout.tsx is preserved until final verification

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Route ordering conflicts | LOW | HIGH | Public routes FIRST, customer routes MIDDLE, admin routes LAST. Test path `/` resolution. |
| ProtectedRoute wrapping layout affects all children equally | LOW | MEDIUM | Each layout route group has its own ProtectedRoute. Nested routes inherit. |
| Sidebar bleeding into CustomerLayout | LOW | MEDIUM | AdminLayout is the ONLY component that renders Sidebar. No conditional inclusion. |
| Home page `/` needs different behavior per role | MEDIUM | HIGH | Root (`/`) must be duplicated: one in PublicLayout for guests, one in AdminLayout for staff. ProtectedRoute handles redirect. |
| AppLayout.js stale artifact causes confusion | LOW | LOW | Delete it. It's a compiled JS output from the TSX source. |
| Customer routes currently inside AppLayout — moving them out could break auth | LOW | MEDIUM | Keep ProtectedRoute wrapping CustomerLayout. AuthProvider stays at App level. |

## Open Questions

- Should the root `/` route redirect CLIENT users to `/catalogo`? That's a UX decision for CH-027 or later. For now, `/` in CustomerLayout will render the HomePage component.
