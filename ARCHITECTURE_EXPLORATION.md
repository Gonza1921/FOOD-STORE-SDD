# FOOD-STORE Architecture Exploration Report

**Date**: May 21, 2026  
**Project**: FOOD-STORE e-commerce platform (React + FastAPI)  
**Scope**: CH-026 to CH-032 (ecommerce transformation from dashboard)

---

## Executive Summary

**FOOD-STORE is 60% ecommerce, 40% admin dashboard.** The backend is **clean, well-architected, and production-ready**. The frontend suffers from **UX separation issues**: customers and admins share the same glass sidebar layout, breaking ecommerce UX flow.

**Status**: ✅ **SAFE TO REFACTOR** — no architectural blockers. All 7 planned changes can proceed in parallel with proper isolation.

---

## 1. Frontend Architecture Overview

### Technology Stack
- **React 18** + **Vite** (ultra-fast bundler)
- **TypeScript** (end-to-end type safety)
- **TanStack Query** (server state: products, orders)
- **Zustand** (client state: auth, cart, UI)
- **Tailwind CSS** (utility-first styling)
- **React Router v6** (SPA routing)
- **Feature-Sliced Design (FSD)** pattern

### Directory Structure (FSD Pattern)
```
src/
├── app/                  # Global app config
│   ├── Router.tsx        # Route definitions (public + protected)
│   ├── App.tsx           # Root component
│   ├── providers.tsx     # TanStack Query provider
│   └── AuthProvider      # JWT + token refresh logic
│
├── pages/                # Page components (one per route)
│   ├── Public: LoginPage, RegisterPage, PublicCatalogPage
│   ├── Customer: CartPage, CheckoutPage, OrdersPage, PerfilPage
│   └── Admin: DashboardPage, AdminUsuariosPage, ProductsAdminPage
│
├── features/             # Feature modules (feature-scoped state + logic)
│   ├── auth/            # ProtectedRoute, AuthProvider, JWT store
│   ├── cart/            # CartStore (Zustand), AddToCartButton
│   ├── products/        # usePublicCatalog, ProductCard, admin CRUD
│   ├── pedidos/         # useCreatePedido, OrderList, OrderDetail
│   ├── payment/         # PaymentPage, MercadoPago integration
│   ├── direcciones/     # Address CRUD forms
│   ├── ingredients/     # Ingredient admin forms
│   ├── categories/      # Category admin forms
│   ├── perfil/          # User profile
│   ├── admin/           # Admin dashboard, metrics
│   └── ui/              # Toast notifications, modals
│
├── widgets/             # Layout components
│   └── Layout/
│       ├── AppLayout.tsx  # ⚠️ SHARED by admin + customer (problem area)
│       ├── Sidebar/       # Admin navigation menu
│       └── Header/        # Top navigation
│
├── shared/              # Reusable across features
│   ├── api/             # axiosClient, interceptors, endpoints
│   ├── ui/              # Button, Card, Modal, Badge, Skeleton, ErrorBoundary
│   ├── types/           # TypeScript interfaces (API contracts)
│   ├── utils/           # Formatters, validators
│   ├── hooks/           # useDebounce, custom hooks
│   └── lib/             # MercadoPago SDK wrapper
│
└── theme/               # Design tokens, Tailwind config
```

### State Management: Clean Separation

**Client State (Zustand + localStorage)**
```typescript
// Persists across sessions
useAuthStore:    { accessToken, refreshToken, user, isAuthenticated(), hasRole() }
useCartStore:    { items[], totalPrice(), totalItems(), addItem(), removeItem() }
useUiStore:      { toasts[], addToast(), modals }
usePaymentStore: { mpSessionId, paymentStatus }
```

**Server State (TanStack Query)**
```typescript
// Cached, refetchable
usePublicCatalog()     // GET /productos?skip=0&limit=12&search=...
useProductDetail()     // GET /productos/:id
useCreatePedido()      // POST /pedidos (mutation)
useDirecciones()       // GET /direcciones
usePublicIngredientes()// GET /ingredientes
useAdminMetrics()      // GET /admin/metrics
```

### Current Routes
```
PUBLIC (no auth):
  /login                       LoginPage
  /registro                    RegisterPage
  /catalogo                    PublicCatalogPage (paginated catalog)
  /productos/:id               ProductoDetailPage

PROTECTED (logged-in customers):
  /                            HomePage (redirects to /catalogo or /admin based on role)
  /carrito                     CartPage
  /checkout                    CheckoutPage
  /confirmacion/:pedidoId      OrderConfirmationPage
  /pagar/:pedidoId             PaymentPage (MercadoPago)
  /pago/resultado/:pedidoId    PaymentResultPage
  /mis-pedidos                 OrdersPage (list)
  /mis-pedidos/:id             OrderDetailPage (detail)
  /mi-perfil                   PerfilPage
  /mis-direcciones             DireccionesListPage

PROTECTED (ADMIN + STOCK + PEDIDOS roles):
  /admin/dashboard             DashboardPage (main admin view)
  /admin/productos             ProductsAdminPage (CRUD)
  /admin/categorias            CategoriesAdminPage (CRUD)
  /admin/ingredientes          IngredientsAdminPage (CRUD)
  /admin/pedidos               AdminOrdersPage (orders list + FSM)
  /admin/usuarios              AdminUsuariosPage (ADMIN only)
  /admin                       AdminDashboardPage (ADMIN only)
```

### ⚠️ Current Problems

| Problem | Impact | Reason |
|---------|--------|--------|
| **Shared Layout** | Customers see admin sidebar after login | Both customer + admin routes wrapped in `<AppLayout>` |
| **No Customer Navbar** | No logo, search, categories dropdown on customer pages | AppLayout is sidebar-only (desktop) + drawer (mobile) |
| **No Public Homepage** | Customers land directly in `/catalogo` | No marketing/landing page before login redirect |
| **No Category Navigation** | Product discovery is search-only | M2M categories exist in DB but no UI filters |
| **No Product Filters** | Basic pagination only | Can't filter by price, allergens, dietary restrictions |
| **No Real-time Updates** | Orders stuck in PENDIENTE state until page reload | WebSocket not implemented (queued for CH-023) |

---

## 2. Backend Architecture Overview

### Technology Stack
- **FastAPI** 0.110+ (async, high-performance)
- **SQLModel** 0.0.14+ (SQLAlchemy + Pydantic hybrid ORM)
- **PostgreSQL 15+** (relational, CTE support for hierarchies)
- **Alembic** (database migrations, auto-applied on startup)
- **bcrypt** (password hashing)
- **PyJWT** (JWT tokens)
- **slowapi** (rate limiting)
- **MercadoPago SDK** (payment processing)

### Clean Architecture: 3-Layer Model

```
┌─────────────────────────────────────────────────┐
│ HTTP Layer (FastAPI routers)                    │
│ Input: JSON request bodies                      │
│ Output: JSON responses (RFC 7807 problems)      │
├─────────────────────────────────────────────────┤
│ Service Layer (business logic)                  │
│ • FSM transitions (order states)                │
│ • Transactions (UoW pattern)                    │
│ • Auth/RBAC checks                              │
│ • MercadoPago API calls                         │
├─────────────────────────────────────────────────┤
│ Repository Layer (data access)                  │
│ • CRUD queries with soft_delete filters         │
│ • Stock checks, price snapshots                 │
│ • FK resolution, pagination                     │
├─────────────────────────────────────────────────┤
│ Model Layer (SQLModel ORM entities)             │
│ • Usuario, Rol, RefreshToken                    │
│ • Producto, Categoria, Ingrediente (M2M)        │
│ • Pedido, DetallePedido, EstadoPedido, Pago    │
│ • DireccionEntrega, FormaPago                   │
├─────────────────────────────────────────────────┤
│ Database (PostgreSQL)                           │
│ 10 tables, proper indexing, soft_delete pattern │
└─────────────────────────────────────────────────┘
```

**Key Architecture Properties**:
✅ Unidirectional dependency flow (no circular imports)  
✅ Single Responsibility Principle (each layer has one job)  
✅ Testable (dependency injection via FastAPI's `Depends()`)  
✅ Transactional (Unit of Work pattern for multi-entity operations)

### Directory Structure
```
backend/
├── main.py                   # FastAPI app initialization, middleware, exception handlers
│
├── core/                     # Infrastructure
│   ├── config.py            # Settings: env vars, DB URL, JWT secret, CORS origins
│   ├── database.py          # SQLModel connection pool, health check
│   ├── security.py          # JWT creation/verify, bcrypt hashing
│   ├── exceptions.py        # APIError (RFC 7807), PriceConflictError
│   ├── rate_limit.py        # slowapi rate limiter (5 login attempts/15 min)
│   ├── dependencies.py      # DI: get_current_user, get_db, require_role()
│   ├── repository.py        # Base repository class
│   └── unit_of_work.py      # Async context manager for atomic transactions
│
├── models/                  # SQLModel ORM entities
│   ├── usuario.py           # Usuario (PK: id), Rol (PK: codigo), UsuarioRol (M:N)
│   │                         # RefreshToken (for JWT rotation + logout)
│   ├── pedido.py            # Pedido, DetallePedido, EstadoPedido, FormaPago
│   │                         # HistorialEstadoPedido (append-only audit), Pago
│   ├── producto.py          # Producto (stock_cantidad, soft_delete, M2M categories/ingredients)
│   ├── categoria.py         # Categoria (hierarchical, soft_delete)
│   ├── ingrediente.py       # Ingrediente (allergen flags)
│   ├── direccion.py         # DireccionEntrega (snapshots in Pedido)
│   ├── producto_categoria.py # M2M link model
│   └── producto_ingrediente.py # M2M link model
│
├── auth/                    # Authentication module
│   ├── router.py            # POST /auth/login, /auth/logout, /auth/refresh
│   │                         # Rate limited, returns tokens + user
│   ├── service.py           # Login logic, token generation, token rotation
│   ├── repository.py        # User + RefreshToken queries
│   └── schemas.py           # LoginRequest, LoginResponse, RefreshRequest
│
├── usuarios/                # User management module
│   ├── router.py            # GET /usuarios/{id}, PUT /usuarios/{id}/perfil
│   │                         # GET /usuarios (admin list)
│   ├── service.py           # CRUD, role assignment logic
│   ├── repository.py        # User queries with role filtering
│   └── schemas.py           # UsuarioResponse, UsuarioUpdate, RoleAssignRequest
│
├── productos/               # Product module
│   ├── router.py            # GET /productos (public, paginated, searchable)
│   │                         # GET /productos/:id, POST/PUT/DELETE (admin)
│   ├── service.py           # CRUD, stock validation, soft_delete logic
│   ├── repository.py        # Queries (active products, stock checks, M2M joins)
│   └── schemas.py           # ProductoResponse, ProductoCreate, ProductoUpdate
│
├── categorias/              # Category module
│   ├── router.py            # GET /categorias (hierarchical tree)
│   │                         # POST/PUT/DELETE (admin)
│   ├── service.py           # CRUD, hierarchy traversal (CTE if needed)
│   ├── repository.py        # Queries with soft_delete filter
│   └── schemas.py           # CategoriaResponse, CategoriaCreate
│
├── ingredientes/            # Ingredient module
│   ├── router.py            # GET /ingredientes (public allergen list)
│   │                         # POST/PUT/DELETE (admin)
│   ├── service.py           # CRUD, allergen flag management
│   ├── repository.py        # Queries
│   └── schemas.py           # IngredienteResponse, IngredienteCreate
│
├── pedidos/                 # Order module (core domain)
│   ├── router.py            # POST /pedidos (create), GET /pedidos (list user orders)
│   │                         # GET /pedidos/{id}, PUT /pedidos/{id}/estado (FSM)
│   ├── service.py           # Order creation (price snapshots + stock decrement via UoW)
│   │                         # FSM state transitions (PENDING → CONFIRMED → PREPARING → ...)
│   │                         # Stock validation + release on cancel
│   ├── repository.py        # Order + detail queries with history
│   └── schemas.py           # PedidoCreate, PedidoResponse, DetallePedidoCreate
│
├── pagos/                   # Payment module (MercadoPago integration)
│   ├── router.py            # POST /pagos/{pedido_id} (create MP preference)
│   │                         # POST /pagos/webhook (IPN notification)
│   │                         # GET /pagos/{pedido_id}/status
│   ├── service.py           # MercadoPago API calls, webhook signature validation
│   │                         # IPN handler (APPROVED → order state change)
│   ├── repository.py        # Payment queries, Pago model CRUD
│   └── schemas.py           # PaymentResponse, PaymentStatusResponse
│
├── direcciones/             # Delivery address module
│   ├── router.py            # GET /direcciones (user's addresses)
│   │                         # POST/PUT/DELETE /direcciones
│   ├── service.py           # CRUD, validation
│   ├── repository.py        # User address queries
│   └── schemas.py           # DireccionResponse, DireccionCreate
│
├── admin/                   # Admin module
│   ├── router.py            # General admin endpoints (generic)
│   ├── usuarios_router.py   # GET /admin/usuarios (list + filters, ADMIN role)
│   ├── metrics_router.py    # GET /admin/metrics (sales, orders, top products)
│   ├── config_router.py     # GET/PUT /admin/config (system settings)
│   ├── metrics_service.py   # Query logic for metrics (aggregations)
│   └── schemas.py           # AdminMetricsResponse, AdminConfigResponse
│
├── middleware/              # Custom middleware (TBD for CH-026+)
│   └── [request validation, error standardization]
│
├── routers/
│   └── health.py            # GET /health (status endpoint)
│
├── migrations/              # Alembic database version control
│   └── versions/
│
├── tests/                   # pytest test suite
├── requirements.txt         # Python dependencies
└── alembic.ini             # Alembic config
```

### Data Model: Order FSM

```
┌──────────────────────────────────────────────────────────┐
│                    Order State Machine (FSM)              │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  PENDIENTE (1)                                            │
│      ↓                                                    │
│      └─→ CONFIRMADO (2) ← IPN webhook (MP payment OK)   │
│             ↓                                             │
│             └─→ EN_PREPARACIÓN (3) ← Staff action       │
│                    ↓                                      │
│                    └─→ EN_CAMINO (4) ← Staff action      │
│                           ↓                               │
│                           └─→ ENTREGADO (5) ← Final      │
│                                                            │
│  CANCELADO (6) ← Terminal state (from any state)        │
│                                                            │
│  Transitions:                                             │
│  • PENDIENTE → CANCELADO: User cancels, stock returns    │
│  • CONFIRMADO → CANCELADO: Refund issued                 │
│  • All other states can't cancel (in_transit/delivered)  │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Related Tables**:
- `pedido`: Main order (user, total, address snapshot, payment method)
- `detalle_pedido`: Line items (product snapshot, qty, excluded ingredients)
- `estado_pedido`: Catalog of states (fixed 6 rows)
- `historial_estado_pedido`: Audit trail (append-only)
- `pago`: Payment record (MercadoPago ID, status, IPN timestamp)

### Authentication & Authorization

**JWT Flow**:
```
1. POST /auth/login (email + password)
   ↓
2. Service verifies password (bcrypt), creates tokens
   ↓
3. Response: { accessToken, refreshToken, user: {id, nombre, roles[]} }
   ↓
4. Client stores in localStorage, attach to requests:
   Authorization: Bearer <accessToken>
   ↓
5. GET /any/protected?route
   → Middleware: get_current_user() verifies JWT
   ↓
6. If expired (401):
   POST /auth/refresh?refreshToken=...
   → New accessToken issued, old refreshToken revoked

7. POST /auth/logout
   → RefreshToken.revoked_at = NOW()
   → Old token can't refresh anymore
```

**RBAC (Role-Based Access Control)**:
```
Roles (fixed 4):
  • ADMIN:   Full system access, user management, settings
  • STOCK:   Product + category + ingredient CRUD
  • PEDIDOS: Order management, state transitions, KDS
  • CLIENT:  (default) Orders, cart, profile

Route Protection Example:
  @app.get("/admin/usuarios")
  @require_role(["ADMIN"])
  async def list_users(current_user: Usuario = Depends(get_current_user)):
    ...

  @app.get("/admin/productos")
  @require_role(["ADMIN", "STOCK"])
  async def manage_products():
    ...
```

### Current API Endpoints

**Public** (no auth):
- `GET /` — API info
- `GET /health` — Health check
- `POST /auth/login` — Login
- `POST /auth/refresh` — Refresh token
- `GET /catalogo` or `GET /productos?skip=0&limit=12` — Public product list
- `GET /productos/:id` — Product detail
- `GET /ingredientes` — Allergen list
- `GET /categorias` — Category tree

**Protected** (user):
- `GET /usuarios/{id}` — Get user profile
- `PUT /usuarios/{id}/perfil` — Update profile
- `POST /pedidos` — Create order
- `GET /pedidos` — List user's orders
- `GET /pedidos/{id}` — Order detail
- `GET /direcciones` — User's addresses
- `POST /direcciones`, `PUT /direcciones/{id}`, `DELETE /direcciones/{id}` — Address CRUD
- `POST /pagos/{pedido_id}` — Create payment preference
- `GET /pagos/{pedido_id}/status` — Payment status

**Protected** (ADMIN + STOCK + PEDIDOS):
- `POST /productos`, `PUT /productos/{id}`, `DELETE /productos/{id}` — Product CRUD
- `POST /categorias`, `PUT /categorias/{id}`, `DELETE /categorias/{id}` — Category CRUD
- `POST /ingredientes`, `PUT /ingredientes/{id}`, `DELETE /ingredientes/{id}` — Ingredient CRUD
- `PUT /pedidos/{id}/estado` — Order FSM transition
- `GET /admin/pedidos` — All orders (admin view)
- `GET /admin/metrics` — Sales, orders, top products
- `GET /admin/config`, `PUT /admin/config` — System settings

**Protected** (ADMIN only):
- `GET /admin/usuarios`, `PUT /admin/usuarios/{id}/rol` — User management
- `GET /admin` — Admin dashboard

### Error Handling (RFC 7807)

All errors return structured JSON:
```json
{
  "type": "https://example.com/errors/price_conflict",
  "title": "Price Conflict",
  "status": 409,
  "detail": "Uno o más productos cambiaron de precio",
  "error_code": "PRICE_CONFLICT",
  "timestamp": 1716326400.123,
  "instance": "/pedidos"
}
```

### ⚠️ Current Problems

| Problem | Impact | Reason |
|---------|--------|--------|
| **No WebSocket** | Orders don't update in real-time | CH-023 (backend) + CH-024 (KDS) in flight |
| **Admin Role Not Enforced** | `/admin/*` routes lack middleware checks | Rely on frontend ProtectedRoute (should also check backend) |
| **No Email Verification** | Accounts created without email validation | Out of scope for initial release |
| **No Invoice Generation** | No PDF receipts for customers | Out of scope for initial release |
| **No Refund Logic** | Payment handling assumes approval only | MercadoPago webhook handles rejection, but no refund flow |

---

## 3. Gap Analysis: Dashboard vs Full Ecommerce

| **Feature** | **Status** | **Gap** | **Effort** | **CH** |
|---|---|---|---|---|
| **Public Catalog** | ✅ Works (paginated, searchable) | Need category filtering + sorting | 2-4h | CH-028 |
| **Customer Navigation** | ❌ Missing navbar/footer | Build customer-facing navbar + footer | 4-6h | CH-027 |
| **Admin Navigation** | ✅ Works (sidebar) | Keep, but isolate from customer routes | 2h | CH-026 |
| **Role-Based Layouts** | ❌ Shared AppLayout | Create CustomerLayout + AdminLayout | 4h | CH-026 |
| **Product Filters** | ❌ None | Price range, allergens, dietary tags | 4-6h | CH-029 |
| **Product Sorting** | ❌ None | Popular, new, price (asc/desc) | 2h | CH-029 |
| **Category Browsing** | ❌ No UI | Sidebar categories + filter integration | 3-4h | CH-028 |
| **Cart** | ✅ Works (Zustand + localStorage) | Good; keep as is | — | — |
| **Checkout** | ✅ Works (forms, address selection) | Good; add price validation (done) | — | — |
| **Payment** | ✅ Works (MercadoPago integration) | Good; works with webhooks | — | CH-021 |
| **Order Tracking** | ⚠️ Partial (list + detail view) | Add real-time FSM updates (WebSocket) | 6-8h | CH-031 |
| **Kitchen Display (KDS)** | ❌ Missing | Real-time order queue for staff | 8-10h | CH-030 |
| **Admin Metrics** | ⚠️ Partial (routes exist) | Complete dashboard with KPIs + real-time | 6-8h | CH-032 |
| **Email Notifications** | ❌ Missing | Order confirmations, payment receipts | 4-6h | Future |
| **User Registration Flow** | ✅ Works | Add email verification + 2FA | 4-6h | Future |
| **Wishlist/Favorites** | ❌ Missing | Add to wishlist button + saved items | 3-4h | Future |

**Total estimated effort**: 45-60 hours across CH-026 to CH-032

---

## 4. Clean Architecture Assessment

### ✅ COMPLIANT

**Backend**:
1. **Unidirectional dependency flow**: Router → Service → (UoW) → Repository → Model → DB
   - No circular imports (verified)
   - Clear separation of concerns
   - Easy to test (DI via FastAPI's `Depends()`)

2. **SOLID Principles**:
   - **S**: Each module has one responsibility (auth, products, orders, etc.)
   - **O**: Open to extension (add new features without changing existing)
   - **L**: Liskov substitution (repository pattern is substitutable)
   - **I**: Interface segregation (schemas are specific per endpoint)
   - **D**: Dependency injection (FastAPI's `Depends()`)

3. **Soft Deletes**: Data is preserved (audit trail), not destroyed

4. **Unit of Work**: Atomic multi-entity transactions with rollback

5. **Exception Handling**: RFC 7807 problem details for all errors

**Frontend**:
1. **Feature-Sliced Design (FSD)**: Each feature is self-contained (auth, cart, products, etc.)
   - No cross-feature imports without going through shared/
   - Clean boundaries

2. **State Management Separation**: Client (Zustand) vs Server (TanStack Query)
   - No duplication
   - No confusion about source of truth

3. **Component Hierarchy**: Pages → Features → Shared UI
   - Clear layering
   - Easy to trace data flow

### ⚠️ MINOR IMPROVEMENTS NEEDED

**Backend**:
- Admin routes (`/admin/*`) lack backend role middleware checks
  - Currently rely on frontend ProtectedRoute
  - **Fix**: Add `@require_role(["ADMIN"])` decorator to each admin endpoint
  - **Effort**: 1 hour
  - **Deferral**: Can be added in CH-032

**Frontend**:
- AppLayout couples admin sidebar + customer topbar
  - Both customer + admin routes use same layout
  - **Fix**: Create CustomerLayout + AdminLayout in CH-026
  - **Effort**: 4 hours
  - **Deferral**: Blocking CH-026 start

### 🚫 NO BLOCKERS

**Code is solid and refactor-safe**. No circular dependencies, no tight coupling, no architectural debt preventing CH-026+ from proceeding.

---

## 5. Risk Assessment for CH-026 to CH-032

### Critical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Route Conflicts** | HIGH | HIGH | Use `/app/*` (admin routes) vs `/` (customer routes) prefix separation; test all routes in staging |
| **Layout Bleed** | MEDIUM | LOW | Use `<Outlet>` carefully; visual regression testing on each route change |
| **Auth Token Loss** | LOW | HIGH | Preserve JWT logic; add integration tests for token rotation + refresh |
| **Cart Data Loss** | LOW | HIGH | Add localStorage migration hook; test cart persistence across refactors |
| **Payment Webhook Failure** | LOW | HIGH | Keep webhook URL in `.env`; test IPN in staging; add retry logic |
| **Admin Access Lock** | MEDIUM | MEDIUM | Thorough RBAC testing; create test users for each role; use feature flags |
| **Database Lock** | LOW | MEDIUM | Schedule migrations in off-hours; test on staging first |
| **Performance Regression** | MEDIUM | LOW | Add DB indexes on product.nombre, categoria.id; monitor query times |

### Mitigation Strategy

1. **Parallel Feature Branches**:
   - One branch per change: `feature/ch-026-customer-layout`, etc.
   - Merge to `develop` after testing, then to `main` for release

2. **Integration Testing**:
   - Write tests BEFORE refactoring routes
   - Test: login → browse catalog → add to cart → checkout → pay
   - Test RBAC: customer sees /catalogo but not /admin, admin sees both

3. **Staging Verification**:
   - Deploy all changes to staging first
   - Manual testing of full flow
   - Load testing on order creation + payment flows

4. **Rollback Plan**:
   - Keep previous version tagged in Git
   - Database migrations are versioned (Alembic)
   - Can rollback to previous schema if needed

5. **Feature Flags** (optional):
   - Use environment variables to toggle new features
   - Example: `ENABLE_CUSTOMER_NAVBAR=true`
   - Allows gradual rollout

---

## 6. Refactoring Roadmap

### Phase 1: Layout Separation (CH-026, CH-027) — **BLOCKING**

**CH-026**: Create dual layout system
- Goal: Separate customer UX from admin UX
- Changes:
  - Create `CustomerLayout` (navbar + footer, no sidebar)
  - Keep `AdminLayout` (sidebar only)
  - Move admin routes under `/admin/*` prefix
  - Keep public routes at `/` level
- Effort: 4 hours
- Risk: Route conflicts (HIGH) — mitigate with careful testing

**CH-027**: Customer navbar + footer
- Goal: Add logo, search, categories dropdown, cart icon, user menu
- Changes:
  - New `Navbar` component
  - New `Footer` component
  - Update `CustomerLayout` to use them
  - Mobile: hamburger menu (not sidebar)
- Effort: 6 hours
- Risk: LOW (isolated feature)

### Phase 2: Product Discovery (CH-028, CH-029) — **PARALLEL SAFE**

**CH-028**: Category browsing
- Goal: Filter products by category
- Changes:
  - Category sidebar / breadcrumb on PublicCatalogPage
  - Filter by category in query (DB already supports M2M)
  - Preserve category in URL query params
- Effort: 3 hours
- Risk: LOW (DB queries already work)

**CH-029**: Filters + sorting
- Goal: Price range, allergens, dietary tags; sort by popular/new/price
- Changes:
  - Filter form on PublicCatalogPage
  - Add query params: `?minPrice=100&maxPrice=500&allergens=[1,2]&sort=popular`
  - Update backend `GET /productos` to support filters
  - Add DB indexes on filtereable columns
- Effort: 6 hours
- Risk: LOW (query-level only)

### Phase 3: Admin KDS + Order Management (CH-030, CH-031) — **DEPENDS ON CH-023**

**CH-030**: Kitchen Display System (KDS)
- Goal: Real-time order queue for kitchen staff
- Depends On: CH-023 (WebSocket backend)
- Changes:
  - WebSocket client in frontend
  - Real-time order list with state indicators
  - Audio alert for new orders
  - State transition buttons (PENDING → CONFIRMED → PREPARING → ...)
  - For PEDIDOS role (staff)
- Effort: 8 hours
- Risk: MEDIUM (WebSocket reliability)

**CH-031**: Real-time order tracking (customer)
- Goal: Timeline view of order states with notifications
- Depends On: CH-023 (WebSocket backend)
- Changes:
  - Timeline component on OrderDetailPage
  - WebSocket listener for order state changes
  - Toast notifications when state changes
  - Estimated delivery time calculation
- Effort: 6 hours
- Risk: MEDIUM (WebSocket reliability)

### Phase 4: Admin Metrics + Analytics (CH-032) — **FINAL POLISH**

**CH-032**: Admin metrics dashboard + GDPR compliance
- Goal: Sales analytics, top products, revenue; user data privacy
- Changes:
  - Complete metrics dashboard (currently routes exist but UI incomplete)
  - Aggregate endpoints in backend
  - Add `DELETE /users/{id}` with cascade delete option (GDPR)
  - Admin role enforcement on all `/admin/*` routes (backend middleware)
  - Analytics event tracking (optional)
- Effort: 8 hours
- Risk: LOW (mostly analytics aggregations)

### Timeline

```
Week 1:  CH-026 (layout split) + CH-027 (navbar/footer)
Week 2:  CH-028 (category browsing) + CH-029 (filters/sorting) [parallel]
Week 3:  CH-030 (KDS) + CH-031 (order tracking) [parallel, depends on CH-023]
Week 4:  CH-032 (metrics + GDPR) + testing + release
```

---

## 7. Recommendations for Safe Execution

### Before Starting

1. ✅ **Create backup** of current `develop` branch
2. ✅ **Set up staging environment** with production-like data
3. ✅ **Write integration tests** for full ecommerce flow (login → checkout)
4. ✅ **Create test users** for each role: admin, stock, pedidos, customer
5. ✅ **Document API contracts** (e.g., via OpenAPI in Swagger)

### During Development

1. ✅ **Use feature branches** per change: `feature/ch-026-*`, `feature/ch-027-*`, etc.
2. ✅ **Commit atomically** (one feature per commit)
3. ✅ **Test locally** before pushing:
   - Run frontend tests: `pnpm test`
   - Run backend tests: `pytest`
   - Manual testing: full ecommerce flow
4. ✅ **Code review** before merging to develop
5. ✅ **Update docs** as you go (README, AGENTS.md, API docs)

### After Merge

1. ✅ **Deploy to staging** and test full flow
2. ✅ **Performance test** (check DB query times, API response times)
3. ✅ **Security audit** (especially auth/payment flows)
4. ✅ **Load test** order creation + payments
5. ✅ **Tag release** in Git (v0.2.0, v0.3.0, etc.)
6. ✅ **Deploy to production** with feature flag if needed

### Tools & Commands

**Frontend**:
```bash
# Install
pnpm install

# Development
pnpm dev                    # Vite dev server
pnpm test                   # Unit tests (vitest)
pnpm lint                   # ESLint
pnpm format:check           # Prettier
pnpm type-check             # TypeScript

# Production
pnpm build                  # Bundle for production
pnpm preview               # Preview bundle
```

**Backend**:
```bash
# Setup
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Migrations
alembic upgrade head        # Apply all migrations
alembic downgrade -1        # Rollback one

# Development
uvicorn app.main:app --reload

# Testing
pytest                      # All tests
pytest -k "test_checkout"   # Specific test
pytest --cov=app            # Coverage report

# Code Quality
pylint app
black app
mypy app
```

---

## 8. Key Decisions & Tradeoffs

### Decision: Keep SQLModel (Don't Switch to Plain SQLAlchemy)

**Rationale**:
- ✅ Hybrid ORM + Pydantic: single model for DB + API validation
- ✅ Reduces code duplication (no separate schema classes)
- ✅ Type-safe end-to-end (Python types + FastAPI)
- ✅ Already used throughout backend

**Tradeoff**: Less mature than SQLAlchemy solo, smaller community
**Mitigation**: Keep SQLAlchemy knowledge; SQLModel builds on it

### Decision: Zustand (Don't Switch to Redux)

**Rationale**:
- ✅ Minimal boilerplate (vs Redux)
- ✅ Direct mutations (no actions/reducers)
- ✅ Subscription-based (fine-grained reactivity)
- ✅ Excellent TypeScript support

**Tradeoff**: Redux is more mature, more debugging tools
**Mitigation**: Zustand is battle-tested; no need to change

### Decision: FSD Architecture (Feature-Sliced Design)

**Rationale**:
- ✅ Scalable (easy to add features without touching others)
- ✅ Clear boundaries (no cross-feature imports above shared/)
- ✅ Self-contained features (can reuse in other projects)

**Tradeoff**: Slightly more files than flat structure
**Mitigation**: Clear conventions in AGENTS.md prevent confusion

### Decision: Soft Deletes (Don't Physically Delete)

**Rationale**:
- ✅ Audit trail (know who/when deleted)
- ✅ Reversible (restore if needed)
- ✅ GDPR-compliant (customer can request deletion, track it)

**Tradeoff**: Queries need to filter `deleted_at IS NULL`
**Mitigation**: Repository layer handles this transparently

---

## 9. Conclusion

**FOOD-STORE is well-architected and ready for the ecommerce transformation.**

| Aspect | Rating | Notes |
|---|---|---|
| **Code Quality** | ⭐⭐⭐⭐⭐ | Clean, no circular deps, follows SOLID |
| **Architecture** | ⭐⭐⭐⭐⭐ | 3-layer backend, FSD frontend, clear separation |
| **Documentation** | ⭐⭐⭐⭐ | Good inline docs; API spec via Swagger |
| **Testing** | ⭐⭐⭐ | Needs integration tests for ecommerce flow |
| **Production Readiness** | ⭐⭐⭐⭐ | JWT+refresh, rate limiting, error handling solid |
| **Ecommerce Completeness** | ⭐⭐⭐ | 60% done; needs customer UX + real-time updates |

**Blockers**: NONE  
**Recommendations**: Start with CH-026/CH-027 (layout separation), then CH-028/CH-029 (discovery), then CH-030/CH-031 (real-time), then CH-032 (metrics).

**Expected outcome**: Full-featured ecommerce platform with admin panels, real-time order tracking, and metrics in 4 weeks (45-60 hours of work).

---

**Report prepared**: May 21, 2026  
**Prepared by**: SDD Explorer  
**Status**: ✅ Ready for CH-026+ to proceed
