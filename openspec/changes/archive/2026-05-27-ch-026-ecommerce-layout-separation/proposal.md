# CH-026: Ecommerce Layout Separation — Split Customer & Admin UI

## Executive Summary

FOOD-STORE currently uses a **shared `AppLayout` component** for both customers and admin users, causing a critical UX problem: customers see an admin sidebar after login. This change separates layouts into:

1. **`CustomerLayout`** — Navbar + Footer (ecommerce-style, no sidebar)
2. **`AdminLayout`** — Sidebar + Dashboard (admin-only)
3. **`PublicLayout`** — No auth required (home, catalog, product detail)

This is the **BLOCKING change** — all other ecommerce improvements (CH-027 to CH-032) depend on it.

## Problem Statement

- **Current state**: All authenticated routes use `AppLayout` (sidebar design)
- **Customer impact**: After login, customer sees admin sidebar (confusing UX)
- **Admin impact**: Dashboard works but looks like a customer-facing feature
- **Architectural issue**: Layout logic is mixed with role logic in one component

## Solution

Create three separate layout wrappers:

```
PublicLayout (no auth)
    ↓
CustomerLayout (role: CLIENT) — Navbar + Footer, no sidebar
    ↓
AdminLayout (roles: ADMIN, STOCK, PEDIDOS) — Sidebar + top nav
```

Update `Router.tsx` to wrap routes with appropriate layout based on role.

## Scope

✅ **Include**:
- Create `CustomerLayout` component
- Create `AdminLayout` component  
- Refactor `AppLayout` → `PublicLayout` (home page, login, register)
- Update `Router.tsx` to use new layouts
- Move Navbar/Header to `CustomerLayout` (separate from sidebar)
- Ensure role guards work correctly per layout

❌ **Exclude**:
- Creating navbar design (that's CH-027)
- Navigation items (that's CH-027)
- Admin sidebar design improvements (that's CH-032)

## Dependencies

| Change | Dependency | Reason |
|--------|-----------|--------|
| **CH-027** | CH-026 | Navbar created, needs layout foundation |
| **CH-028** | CH-026 | Categories browsing needs CustomerLayout |
| **CH-029** | CH-026 | Filters need CustomerLayout |
| **CH-030** | CH-026 + CH-023 | KDS needs AdminLayout structure |
| **CH-031** | CH-026 | Order tracking in CustomerLayout |
| **CH-032** | CH-026 | Admin dashboard in AdminLayout |

**Blocks**: All other changes. **Must go first.**

## Technical Approach

### Architecture Changes

```
src/widgets/Layout/
├── PublicLayout.tsx      (NEW) — for public pages
├── CustomerLayout.tsx    (NEW) — for CLIENT customers
├── AdminLayout.tsx       (NEW) — for ADMIN/STOCK/PEDIDOS
├── AppLayout.tsx         (DELETE or DEPRECATED)
├── Header/               (existing navbar)
├── Sidebar/              (existing admin sidebar)
└── Footer.tsx            (NEW) — customer footer
```

### Router Changes

**Current (broken)**:
```tsx
<Route element={<AppLayout />}>  // All routes share same layout
  <Route path="/admin/dashboard" ... />
  <Route path="/carrito" ... />
  <Route path="/mis-pedidos" ... />
</Route>
```

**New (correct)**:
```tsx
// PUBLIC routes (no auth)
<Route element={<PublicLayout />}>
  <Route path="/" ... />
  <Route path="/catalogo" ... />
  <Route path="/productos/:id" ... />
</Route>

// CUSTOMER routes (auth + CLIENT role)
<Route element={<CustomerLayout />}>
  <Route path="/carrito" ... />
  <Route path="/checkout" ... />
  <Route path="/mis-pedidos" ... />
  <Route path="/mi-perfil" ... />
</Route>

// ADMIN routes (auth + ADMIN/STOCK/PEDIDOS roles)
<Route element={<AdminLayout />}>
  <Route path="/admin/dashboard" ... />
  <Route path="/admin/usuarios" ... />
  <Route path="/admin/productos" ... />
</Route>
```

### Backend Changes

**No backend changes required** — layout is purely frontend.

## Effort Estimate

- **Frontend development**: 4 hours
  - Create 3 layout components: 1h
  - Update Router.tsx: 1h
  - Test layout switching on login: 1h
  - Visual validation (responsive): 1h

- **Testing**: 2 hours
  - Manual testing: login as CLIENT → CustomerLayout ✓
  - Manual testing: login as ADMIN → AdminLayout ✓
  - Manual testing: public pages → PublicLayout ✓
  - Edge cases (token expiry, role change)

**Total**: 6 hours (can be parallel with CH-023 WebSocket backend work)

## Acceptance Criteria

- [ ] `CustomerLayout` renders without sidebar
- [ ] `AdminLayout` renders with sidebar
- [ ] `PublicLayout` renders with no auth footer
- [ ] LOGIN as CLIENT → customer sees `CustomerLayout`
- [ ] LOGIN as ADMIN → admin sees `AdminLayout` with sidebar
- [ ] LOGOUT → public layout shown
- [ ] All existing routes still work (no 404s)
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] No console errors or warnings

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Route conflicts | LOW | MEDIUM | Use layout nesting instead of prefix mixing |
| Token loss on layout change | LOW | MEDIUM | Keep auth provider at App level (above Router) |
| Sidebar bleeding into customer view | MEDIUM | LOW | Use CSS isolation or Outlet carefully |
| Mobile layout breaks | MEDIUM | LOW | Test on real devices with Tailwind responsive |

## Timeline

- **Start**: After CH-025 (KDS) is reviewed and approved
- **Duration**: 6 hours (1 day with testing)
- **Delivery**: Clean feature branch, 3 commits (one per layout)
- **Merge to main**: When all 3 layouts are tested and approved

## Next Steps (After This Change)

Once CH-026 is merged:

1. **CH-027** — Add navbar component to `CustomerLayout` (logo, search, categories, cart button)
2. **CH-028** — Add category browsing in navbar
3. **CH-029** — Add product filters
4. **CH-030 + CH-031** — WebSocket for real-time updates
5. **CH-032** — Improve admin dashboard metrics and UX

---

**Change Owner**: Frontend team  
**Status**: 🟡 Planning  
**Created**: 2026-05-21  
**Last Updated**: 2026-05-21
