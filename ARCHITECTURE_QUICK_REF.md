# FOOD-STORE Architecture: Quick Reference

## Project Status
- **Type**: E-commerce platform (food delivery)
- **Completeness**: 60% ecommerce, 40% admin dashboard
- **Architecture Quality**: ⭐⭐⭐⭐⭐ (CLEAN, no blockers)
- **Production Readiness**: ⭐⭐⭐⭐ (solid, needs ecommerce UX polish)

## Stack at a Glance

### Frontend
```
React 18 + Vite + TypeScript
├─ Routing: React Router v6 (protected routes via ProtectedRoute HOC)
├─ Client State: Zustand (auth, cart, ui, payment stores)
├─ Server State: TanStack Query (products, orders, metrics)
├─ UI: Tailwind CSS (Material Design 3 color system)
├─ Architecture: Feature-Sliced Design (FSD)
└─ Pages: 25+ (public catalog, checkout, orders, admin panels)
```

### Backend
```
FastAPI 0.110+ + SQLModel + PostgreSQL 15+
├─ Routing: 11 router modules (auth, usuarios, productos, pedidos, pagos, etc.)
├─ Architecture: 3-layer (Router → Service → Repository → Model)
├─ Auth: JWT + refresh tokens + bcrypt + rate limiting
├─ Database: 10 tables with soft deletes, M2M relationships, FSM
├─ Integration: MercadoPago SDK for payments
└─ Admin: Metrics, config, user management endpoints
```

## Critical Paths (Flows That Work)

### Public User Journey
```
1. Visit /catalogo (public catalog, no auth)
2. View product detail (/productos/:id)
3. Add to cart (Zustand)
4. /login → POST /auth/login (JWT)
5. /checkout → POST /pedidos (order + detalle + address snapshot)
6. /pagar/:pedidoId → POST /pagos (MercadoPago preference)
7. Payment gateway → return to /pago/resultado
8. Success → order in PENDIENTE state
```

### Admin Workflows
```
1. /login with ADMIN/STOCK/PEDIDOS role
2. /admin/productos (CRUD products)
3. /admin/categorias (category hierarchy)
4. /admin/ingredientes (allergens)
5. /admin/pedidos (order FSM transitions)
6. /admin/usuarios (ADMIN only)
7. /admin/metrics (sales dashboard)
```

## What's Working Well ✅

| Component | Status | Notes |
|-----------|--------|-------|
| JWT Auth | ✅ | Login, refresh, logout with token rotation |
| RBAC | ✅ | 4 roles (ADMIN, STOCK, PEDIDOS, CLIENT) |
| Cart | ✅ | Zustand + localStorage, price snapshots |
| Checkout | ✅ | Forms, address selection, payment method |
| Orders | ✅ | FSM (PENDIENTE → CONFIRMADO → ... → ENTREGADO) |
| Payments | ✅ | MercadoPago webhook integration (IPN) |
| Product CRUD | ✅ | M2M categories/ingredients, soft delete |
| Database | ✅ | Schema solid, migrations auto-applied |

## What's Missing ❌

| Feature | Gap | Effort | CH |
|---------|-----|--------|-----|
| Customer Layout | No navbar/footer, shared sidebar | 4h | CH-026 |
| Product Filters | Only search, no price/allergen filters | 6h | CH-029 |
| Category Nav | No sidebar category browsing | 4h | CH-028 |
| Real-time Updates | Orders stuck until refresh (no WebSocket) | 6-8h | CH-031 |
| Kitchen Display | No staff order queue | 8-10h | CH-030 |
| Admin Metrics | Routes exist, UI incomplete | 8h | CH-032 |

## Architecture Layers

### Frontend (FSD)
```
app/                      ← Global setup (Router, Auth, Providers)
pages/                    ← Page components (one per route)
features/                 ← Feature modules (auth, cart, products, orders)
  ├─ feature/
  │  ├─ api/             ← API hooks (useQuery/useMutation)
  │  ├─ components/      ← Feature-specific UI components
  │  ├─ hooks/           ← Custom React hooks
  │  ├─ store.ts         ← Zustand store (if client state needed)
  │  └─ index.ts         ← Public exports
  └─ [auth, cart, products, pedidos, payment, etc.]
widgets/                  ← Layout components (AppLayout, Sidebar, Header)
shared/                   ← Reusable across features (Button, Card, etc.)
  ├─ api/                ← axiosClient, interceptors, endpoints
  ├─ ui/                 ← Shared components
  ├─ types/              ← TypeScript interfaces
  ├─ utils/              ← Helpers (formatters, validators)
  └─ lib/                ← External integrations (MercadoPago)
```

### Backend (3-Layer)
```
main.py                   ← FastAPI app, middleware, exception handlers
core/                     ← Infrastructure
  ├─ config.py           ← Settings (env vars)
  ├─ database.py         ← SQLModel connection
  ├─ security.py         ← JWT, bcrypt
  ├─ dependencies.py     ← DI (get_current_user)
  ├─ unit_of_work.py     ← Atomic transactions
  └─ exceptions.py       ← RFC 7807 errors
models/                   ← ORM entities (one file per domain)
  ├─ usuario.py          ← User, Role, RefreshToken
  ├─ pedido.py           ← Order FSM, payment details
  ├─ producto.py         ← Product with stock
  ├─ categoria.py        ← Categories
  └─ ingrediente.py      ← Ingredients/allergens
[auth, usuarios, productos, pedidos, pagos, admin]/
  ├─ router.py           ← HTTP endpoints
  ├─ service.py          ← Business logic
  ├─ repository.py       ← Data access
  └─ schemas.py          ← Request/response validation
```

## Dependency Flow (Correct ✓)

```
HTTP Request
    ↓
Router.py (input validation via schemas)
    ↓
Service.py (business logic, FSM, transactions)
    ↓
Repository.py (queries, soft_delete filters)
    ↓
Model.py (ORM definitions)
    ↓
PostgreSQL Database

Response: RFC 7807 JSON problem detail or success payload
```

**No circular dependencies. No skipping layers. Unidirectional. ✓**

## Key Decisions

| Decision | Rationale | Tradeoff |
|----------|-----------|----------|
| **Zustand** (not Redux) | Minimal boilerplate, fine-grained reactivity | Smaller community |
| **SQLModel** (not plain SQLAlchemy) | Hybrid ORM + validation, single model | Less mature |
| **FSD** (not flat) | Scalable, clear boundaries, reusable features | More files |
| **Soft Deletes** (not hard delete) | Audit trail, reversible, GDPR-friendly | Query overhead (minimal) |
| **JWT + Refresh** (not session) | Stateless, scales across instances | Token rotation complexity |

## Critical Fixes Needed Before Ch-026+

1. **Create `CustomerLayout`** (navbar + footer, no sidebar)
2. **Move admin routes** to `/admin/*` prefix
3. **Write integration tests** (login → checkout flow)
4. **Test on staging** before touching production

## Timeline (4 Weeks)

```
Week 1  CH-026 (layout split)                    4h
        CH-027 (navbar + footer)                 6h
        ────────────────────────────────────────── 10h subtotal

Week 2  CH-028 (category browsing)               3h
        CH-029 (filters + sorting)                6h
        (can run parallel to Week 1)             ── 9h subtotal

Week 3  CH-030 (KDS, depends on CH-023)         8h
        CH-031 (order tracking, depends on CH-023) 6h
        (parallel, blocked by WebSocket)        ── 14h subtotal

Week 4  CH-032 (metrics + GDPR)                  8h
        Testing, bugfixes, release             ── 8h+ subtotal

        ────────────────────────────────────────── 41-60h total
```

## Commands Quick Ref

**Frontend**:
```bash
pnpm dev                  # Vite dev server (http://localhost:5173)
pnpm test                 # Unit tests
pnpm lint && pnpm format  # Linter + formatter
pnpm build                # Production bundle
```

**Backend**:
```bash
source .venv/bin/activate
uvicorn app.main:app --reload    # Dev server (http://localhost:8000)
pytest                           # Run tests
alembic upgrade head             # Run migrations
python -m mypy app               # Type checking
```

## API Endpoints (High-Level)

**Public**:
- `GET /health` — Status check
- `POST /auth/login` — Login (email + password)
- `GET /productos` — Public product catalog (paginated)
- `GET /productos/:id` — Product detail
- `GET /ingredientes` — Allergen list
- `GET /categorias` — Category tree

**User**:
- `GET /usuarios/{id}` — User profile
- `POST /pedidos` — Create order
- `GET /pedidos` — User's orders
- `GET /direcciones` — User's addresses
- `POST /pagos/{pedidoId}` — Create payment

**Admin** (role-protected):
- `GET /admin/productos` + CRUD — Products (STOCK role)
- `GET /admin/pedidos` — All orders (PEDIDOS role)
- `PUT /pedidos/{id}/estado` — FSM transition (PEDIDOS role)
- `GET /admin/metrics` — Sales dashboard (ADMIN role)
- `GET /admin/usuarios` — Users (ADMIN role)

## Risk Scorecard

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Route conflicts | HIGH | HIGH | Use `/app/*` prefix separation |
| Layout CSS bleed | MEDIUM | LOW | Careful `<Outlet>`, visual testing |
| Auth regression | LOW | HIGH | Preserve JWT logic, integration tests |
| Cart data loss | LOW | HIGH | localStorage migration hook |
| Payment webhook | LOW | HIGH | Keep URL in .env, add retry logic |

**Recommendation**: Start CH-026 (layout split), it's BLOCKING for all others.

---

**Generated**: May 21, 2026  
**For**: CH-026 to CH-032 planning  
**Status**: ✅ Ready for orchestrator review

See `ARCHITECTURE_EXPLORATION.md` for full details.
