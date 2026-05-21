# ECOMMERCE TRANSFORMATION STRATEGY — CH-026 to CH-032

## Overview

7 nuevos changes (CH-026 a CH-032) para transformar **FOOD-STORE de panel administrativo a ecommerce profesional**.

**Timeline total**: 50–60 horas durante 4 semanas  
**Effort**: ~200 story points  
**Resultado**: Aplicación ecommerce real con KDS y real-time updates  

---

## 📋 Change Summary

| CH | Nombre | Prioridad | Duración | Complejidad | Bloqueador |
|----|--------|-----------|----------|-------------|-----------|
| **CH-026** | Layout Separation | 🔴 MÁXIMA | 6h | ⭐ Baja | BLOQUEADOR |
| **CH-027** | Navbar & Footer | 🔴 MÁXIMA | 6h | ⭐ Baja | CH-026 |
| **CH-028** | Category Browsing | 🟠 Alta | 6h | ⭐ Baja | CH-026 |
| **CH-029** | Filters & Sorting | 🟠 Alta | 8h | ⭐⭐ Media | CH-028 |
| **CH-030** | KDS (Cocina) | 🟡 Media | 10.5h | ⭐⭐⭐ Alta | CH-022 + CH-023 |
| **CH-031** | Real-Time Tracking | 🟡 Media | 9h | ⭐⭐ Media | CH-023 |
| **CH-032** | Admin Dashboard | 🟡 Media | 11h | ⭐⭐⭐ Alta | CH-026 |
| **TOTAL** | | | **56.5h** | | |

---

## 🎯 Dependency Graph

```
BLOQUEADOR
    ↓
CH-026 (Layout Separation) ← BLOCKING para todas las demás
    ↓
┌───────────────────────────────────────────────────────────┐
│ Parallelizable (después de CH-026)                        │
├───────┬────────────┬────────────┬────────────┬────────────┤
│       │            │            │            │            │
CH-027  CH-028       CH-029       CH-032       CH-022        │
(6h)    (6h)  →      (8h)         (11h)        (2h)          │
         ↓            └─────┬──────┘                          │
        CH-029         (shared backend)                       │
        (8h)                │                                 │
                            └─→ CH-023 (WebSocket)           │
                                 (4h)                         │
                                 ↓                            │
                      ┌──────────┴──────────┐                │
                      CH-030 (KDS)      CH-031 (Tracking)    │
                      (10.5h)           (9h)                 │
                      └──────────┬──────────┘                │
                                 Fin
```

---

## 📅 Roadmap por Semana

### **Semana 1: Layout & Navigation**

```
Monday    CH-026 (Layout Separation) .......................... 6h
          - Create CustomerLayout, AdminLayout, PublicLayout
          - Update Router.tsx
          - Test role-based routing

Tuesday   CH-027 (Navbar & Footer) ........................... 6h
          - Navbar component (logo, search, categories, cart, profile)
          - Footer component
          - Responsive design (mobile hamburger)
          
          Start CH-023 Backend WebSocket (parallel) ............ 2h

Wednesday Finish CH-027 testing, start CH-028 ................. 6h

SEMANA 1 TOTAL: 12h ecommerce (CH-026 + CH-027) + 2h backend setup
```

### **Semana 2: Discovery & Browsing**

```
Monday    CH-028 (Category Browsing) .......................... 6h
          - Categories page
          - Category detail page with subcategories
          - Breadcrumb navigation
          - Backend: add slug field

Tuesday   CH-029 (Filters & Sorting) .......................... 8h
          - Price range slider
          - Allergen/dietary checkboxes
          - Sort dropdown
          - Filter options endpoint
          - URL state sync

Wednesday Finish Ch-029 testing
          Start CH-023 WebSocket (backend) .................... 2h

SEMANA 2 TOTAL: 14h ecommerce (CH-028 + CH-029) + 2h backend
```

### **Semana 3: Real-Time Operations**

```
Monday    CH-023 (WebSocket Infrastructure) FINISH ........... 2h
          - Pub/sub manager
          - Order update broadcasting
          - Auth validation
          
          CH-030 (KDS — Kitchen Display) START .............. 5h
          - Kanban board layout
          - Order cards
          - WebSocket listener

Tuesday   CH-030 CONTINUE ..................................... 5.5h
          - Action buttons (start, mark ready)
          - Urgency indicator
          - Connection status
          - Responsive design

Wednesday CH-031 (Real-Time Order Tracking) ................... 9h
          - Order timeline
          - WebSocket integration
          - ETA calculation
          - Fallback polling
          - Mobile layout

SEMANA 3 TOTAL: 21.5h (CH-023 + CH-030 + CH-031)
```

### **Semana 4: Admin & Finalization**

```
Monday    CH-032 (Admin Dashboard) ............................ 6h
          - KPI cards
          - Backend endpoints (metrics, sales, status)

Tuesday   CH-032 CONTINUE .................................... 5h
          - Charts (recharts)
          - Tables (products, orders, stock)
          - Date filters

Wednesday Testing, bug fixes, documentation .................. 4h
          - Integration testing (CH-026 → CH-032)
          - Performance validation
          - Mobile responsiveness
          - Staging deployment

SEMANA 4 TOTAL: 15h (CH-032 + testing)
```

**GRAN TOTAL: 62.5 horas = 4 semanas (15.6 h/semana)**

---

## 🏗️ Arquitectura (High-Level)

### Frontend (React + Vite)

```
src/
├── app/
│   └── Router.tsx (with 3 layout types)
├── pages/
│   ├── PublicHome.tsx
│   ├── PublicCatalog.tsx
│   ├── CategoriesPage.tsx
│   ├── OrderTrackingPage.tsx
│   └── CocinaDisplayPage.tsx
├── features/
│   ├── products/          (filters, sorting)
│   ├── categories/        (browsing)
│   ├── kds/              (kitchen display)
│   ├── orders/           (tracking)
│   └── admin/            (dashboard)
└── widgets/
    ├── Layout/
    │   ├── CustomerLayout.tsx (NEW)
    │   ├── AdminLayout.tsx (NEW)
    │   ├── PublicLayout.tsx (NEW)
    │   ├── Navbar/
    │   └── Footer/ (NEW)
```

### Backend (FastAPI)

```
backend/
├── main.py
├── core/
│   ├── database.py
│   ├── pubsub.py (NEW — Pub/Sub manager)
│   └── websocket.py (NEW)
├── routers/
│   └── admin/
│       └── metrics_router.py (NEW)
├── cocina/ (NEW — Kitchen module)
│   ├── router.py (WebSocket endpoint)
│   └── service.py
└── migrations/ (NEW timestamp fields)
```

---

## 🔐 Security & Auth

### Role-Based Access

```
CLIENTE (Customer)
├── Public routes (catalog, home)
├── Cart, checkout, payment
├── My orders, profile, addresses
└── Real-time order tracking

COCINERO (Kitchen Staff)
├── KDS page (full-screen)
├── Order queue (real-time)
├── Mark items done, order ready
└── (No customer data access)

ADMIN / STOCK / PEDIDOS (Staff)
├── Dashboard + metrics
├── Product management
├── Order management
├── User management
└── Configuration
```

### WebSocket Auth

```
connection.handshake.auth.token (JWT)
  ↓
Validate token, extract user.id + roles
  ↓
If COCINERO: subscribe to order channel
If CLIENT: subscribe to personal order channel
  ↓
Reject if unauthorized (403 before upgrade)
```

---

## 📊 Database Changes

### New Fields (CH-028, CH-031)

```sql
-- Categorias table
ALTER TABLE categoria ADD COLUMN slug VARCHAR(255) UNIQUE;

-- Productos table
-- (already has: en_stock, precio, alergenos via M2M)

-- Pedidos table
ALTER TABLE pedido ADD COLUMN confirmado_en DATETIME;
ALTER TABLE pedido ADD COLUMN en_preparacion_en DATETIME;
ALTER TABLE pedido ADD COLUMN listo_en DATETIME;
ALTER TABLE pedido ADD COLUMN en_camino_en DATETIME;
ALTER TABLE pedido ADD COLUMN entregado_en DATETIME;
ALTER TABLE pedido ADD COLUMN estimated_ready_at DATETIME;
ALTER TABLE pedido ADD COLUMN estimated_delivered_at DATETIME;
```

### New Indexes

```sql
CREATE INDEX idx_pedidos_created_at ON pedido(creado_en);
CREATE INDEX idx_pedidos_estado ON pedido(estado);
CREATE INDEX idx_productos_en_stock ON producto(en_stock);
```

---

## 🧪 Testing Strategy

### Unit Tests

```
Frontend:
- useProductFilters (Zustand store)
- useOrderTracking (WebSocket + API)
- useKdsWebSocket (connection mgmt)
- calculateETA function
- formatPrice utility

Backend:
- metrics aggregation (sales, orders)
- WebSocket auth validation
- Pub/Sub manager
- Filter query builder
```

### Integration Tests

```
- CH-026: Layout switching on login/logout
- CH-027: Navbar search + cart updates
- CH-028: Category filtering + sorting
- CH-029: Multi-filter combinations
- CH-030: KDS order creation → display
- CH-031: Order state updates via WebSocket
- CH-032: Dashboard metrics accuracy
```

### E2E Tests (Playwright)

```
Customer Journey:
1. Login as CLIENT
2. See CustomerLayout (no sidebar)
3. Browse categories
4. Filter products
5. Add to cart
6. Checkout
7. See order on tracking page
8. Real-time status updates

Admin Journey:
1. Login as ADMIN
2. See AdminLayout + dashboard
3. View KPIs, charts
4. Check low stock alerts
5. View recent orders

Kitchen Journey:
1. Login as COCINERO
2. See KDS page
3. WebSocket updates
4. Mark items done
5. Mark order ready
```

---

## 🚀 Deployment Strategy

### Staging

```
Week 4 Wednesday:
- Deploy CH-026 to staging (layout swap only)
- Test all routes: no 404s, proper auth
- Responsive testing (iPhone, Android, tablet, desktop)
```

### Production

```
Week 5:
1. Merge CH-026 to main
2. Wait 24h, monitor logs
3. Merge CH-027 to main
4. Merge CH-028 + CH-029 together
5. Merge CH-023 (WebSocket) + CH-030 + CH-031 together
6. Merge CH-032 last
7. Full QA cycle + user acceptance
```

### Rollback Plan

```
If critical issue in CH-026:
  - Revert Router.tsx to old AppLayout
  - Users can still access dashboard (fallback)
  - No data loss

If WebSocket fails (CH-023 + CH-030/031):
  - Fallback polling works automatically
  - UI shows "fallback mode" indicator
```

---

## 📈 Success Metrics

### Technical KPIs

- [ ] Zero 404s on ecommerce routes
- [ ] Dashboard loads in < 2 seconds
- [ ] WebSocket connects in < 1 second
- [ ] Filters respond in < 500ms
- [ ] Mobile UX: Core Web Vitals all green

### Business KPIs

- [ ] Conversion rate (add to cart → checkout)
- [ ] Average order value
- [ ] Customer retention (repeat orders)
- [ ] Kitchen efficiency (avg prep time)
- [ ] Order fulfillment time

---

## 🚨 Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Route conflicts on layout switch | MEDIUM | HIGH | Use layout nesting, careful outlet usage, test thoroughly |
| WebSocket connection drops | MEDIUM | HIGH | Fallback polling + auto-reconnect logic |
| Performance degradation | LOW | MEDIUM | Database indexes, query optimization, caching |
| Mobile layout breaks | MEDIUM | MEDIUM | Responsive testing on real devices early |
| Rollout blocks (can't merge) | LOW | HIGH | Feature flags, beta testing, staged rollout |

---

## 📚 Documentation

### For Developers

- [ ] Architecture diagram (layouts, routes, WebSocket)
- [ ] API documentation (new endpoints)
- [ ] Component documentation (Storybook or JSDoc)
- [ ] Database schema (ERD with new fields)
- [ ] Deployment runbook

### For Product/Managers

- [ ] Feature overview (what's new for customers)
- [ ] Timeline (Gantt chart)
- [ ] Risk register
- [ ] Success metrics dashboard

### For Users

- [ ] Release notes
- [ ] Tutorial videos (how to browse, order, track)
- [ ] FAQ (real-time updates, KDS, etc.)

---

## ✅ Approval Checklist

Before starting implementation:

- [ ] Product owner approves all 7 changes
- [ ] Design team approves navbar, KDS, dashboard mockups
- [ ] Backend team confirms WebSocket capacity
- [ ] QA team reviews test strategy
- [ ] DevOps team confirms deployment plan
- [ ] Security team reviews auth + WebSocket handling

---

## 📞 Decision Points

### Q1: CH-023 WebSocket — Server-Sent Events vs WebSocket?

**Current choice**: WebSocket  
**Rationale**: Bidirectional, < 100ms latency, scales with Redis v2  
**If changing to SSE**: Update CH-030, CH-031 slightly

### Q2: CH-029 Filters — Database vs Client-Side?

**Current choice**: Database (backend query optimization)  
**Alternative**: Client-side filtering (simpler but slow with 1000+ products)

### Q3: CH-032 Caching — Database vs Redis?

**Current choice**: Database (no external dep for v1)  
**Alternative**: Redis (faster, but ops complexity)  
**Plan v2**: Migrate to Redis without API changes

### Q4: Deployment Timing — Feature Flags or Direct Merge?

**Current choice**: Direct merge (each change is independent)  
**Alternative**: Feature flags (safer, more control)  
**Recommend**: Direct merge to keep it simple

---

## 📖 Related Documents

- `ARCHITECTURE_EXPLORATION.md` — Full architecture analysis
- `README-KDS-STRATEGY.md` — KDS background (CH-022 to CH-025)
- `ANALISIS_KDS_FEATURE.md` — Detailed KDS feature analysis
- `SESSION_SUMMARY.md` — Previous session notes

---

## 🎓 Key Learnings & Patterns

### Pattern: Layout-Based Routing

```tsx
// Instead of role-based routes spreading across app
// Use layout-based routing:
<Route element={<CustomerLayout />}>
  <Route path="/carrito" ... />
  <Route path="/mis-pedidos" ... />
</Route>

<Route element={<AdminLayout />}>
  <Route path="/admin/*" ... />
</Route>
```

### Pattern: WebSocket with Fallback

```typescript
// Don't fail if WebSocket unavailable
// Graceful degradation:
try {
  ws = new WebSocket(...);
} catch (e) {
  // Fallback to polling
  setInterval(fetchStatus, 5000);
}
```

### Pattern: URL State Sync

```typescript
// Filters → URL params → shareable links
// On mount: hydrate from URL
// On filter change: update URL
// User can copy link and share state
```

---

**PRÓXIMOS PASOS**:

1. ✅ Revisar propuestas (CH-026 a CH-032)
2. ⏳ Aprobación del user (definir orden de implementación)
3. 🚀 Crear specs + design para CH-026 (blocking change)
4. 📋 Crear tasks + begin implementation

---

**Documento creado**: 2026-05-21  
**Status**: 🟡 Planning — Awaiting approval  
**Owner**: Orchestrator + Full-stack team
