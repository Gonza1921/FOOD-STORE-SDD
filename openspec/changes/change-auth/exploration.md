# Exploration: change-auth (Autenticación)

**Date**: 2026-05-08  
**Status**: Complete — Ready for Proposal  
**Effort Estimate**: 10-12 hours (with parallelization)

---

## 1. Current State

### Backend Authentication Infrastructure (50% READY)

#### ✅ Existing — Core Utilities
- `backend/core/security.py`: JWT creation/verification, bcrypt hashing/verification
- `backend/core/config.py`: Settings with Pydantic v2, JWT config (30 min default)
- `backend/core/exceptions.py`: UnauthorizedError (401), ForbiddenError (403), base APIError
- `backend/core/database.py`: SQLAlchemy engine, SessionLocal factory, get_session() DI
- `backend/main.py`: slowapi Limiter, CORS middleware, request logging middleware

#### ❌ Missing — Core Components
- **Models**: Usuario, RefreshToken, Rol, UsuarioRol (none exist)
- **Routers**: /api/v1/auth/login, /register, /refresh, /logout, /me (none exist)
- **Schemas**: LoginRequest, RegisterRequest, TokenResponse, UserResponse (none exist)
- **Services**: Auth service logic (login, register, refresh, logout)
- **Repositories**: UsuarioRepository, RefreshTokenRepository
- **Dependencies**: get_current_user(), require_role() (none exist)
- **Unit of Work**: UoW pattern for transactions (not implemented)
- **Migrations**: Alembic migrations for tables (none exist)

### Frontend Authentication State (0% — GREENFIELD)

Frontend directory empty except `.gitkeep` and `.env.example`. No React components, stores, hooks, or interceptors.

### Database Schema (DOCUMENTED NOT CREATED)

Schema is fully specified in `docs/Integrador.txt` and `docs/Descripcion.txt`:
- Usuario: id, email, password_hash, nombre, apellido, eliminado_en, creado_en, actualizado_en
- RefreshToken: id, usuario_id, token, expires_at, revoked_at
- Rol: id, codigo (ADMIN, STOCK, PEDIDOS, CLIENT)
- UsuarioRol: usuario_id, rol_id (M2M composite key)
- Soft delete with eliminado_en TIMESTAMPTZ

---

## 2. Affected Areas

| Path | Type | Status | Impact |
|------|------|--------|--------|
| `backend/models/usuario.py` | NEW | ❌ | Usuario, RefreshToken, Rol, UsuarioRol models |
| `backend/schemas/auth.py` | NEW | ❌ | Pydantic schemas for requests/responses |
| `backend/routers/auth.py` | NEW | ❌ | /auth/login, /register, /refresh, /logout, /me |
| `backend/services/auth.py` | NEW | ❌ | Business logic for auth flows |
| `backend/repositories/usuario.py` | NEW | ❌ | CRUD for Usuario, RefreshToken |
| `backend/core/dependencies.py` | NEW | ❌ | get_current_user(), require_role() |
| `backend/core/uow.py` | NEW | ❌ | Unit of Work transaction pattern |
| `backend/core/security.py` | MODIFY | ✅ | Already 70% complete; add refresh logic |
| `backend/main.py` | MODIFY | ⚠️ | Register routers, configure rate limiter |
| `backend/migrations/` | NEW | ❌ | Alembic migrations + seed data |
| `frontend/src/stores/authStore.ts` | NEW | ❌ | Zustand: accessToken, usuario, isAuthenticated |
| `frontend/src/hooks/useAuth.ts` | NEW | ❌ | Login, logout, refresh hooks |
| `frontend/src/features/auth/` | NEW | ❌ | LoginForm, RegisterForm, ProtectedRoute |
| `frontend/src/shared/axios.ts` | NEW | ❌ | Axios instance + JWT interceptor |

---

## 3. Approaches

### Approach 1: Backend-First, Atomic
Build entire backend first, then frontend.

**Pros**: Backend independent and testeable  
**Cons**: Frontend blocked waiting; large monolithic task (~6-8h backend alone)  
**Complexity**: HIGH  
**Parallelizable**: NO

### Approach 2: Layered + Incremental ⭐ RECOMMENDED
Build backend layer-by-layer across 4 incremental sprints with parallel frontend work after Sprint 2.

**Sprint 1** (2-3h): Models + Migrations + Dependencies
- Create Usuario, RefreshToken, Rol, UsuarioRol models
- Create Alembic migrations
- Create get_current_user(), require_role() dependencies
- ✓ Validates: Models compile, migrations run

**Sprint 2** (3-4h): Login + Refresh (Core Flow)
- Create UsuarioRepository, RefreshTokenRepository, Unit of Work
- Create LoginRequest, TokenResponse schemas
- Create auth.service (login, refresh logic)
- Create POST /auth/login, POST /auth/refresh routers
- ✓ Validates: Login testeable end-to-end via Postman

**Sprint 3** (2-3h): Register + Logout
- Create RegisterRequest, UserResponse schemas
- Create auth.service (register, logout logic)
- Create POST /auth/register, /logout, GET /auth/me routers
- Add rate limiting to /login
- ✓ Validates: Full auth lifecycle complete

**[PARALLEL] Sprint 4A** (3-4h): Frontend Stores + Interceptor
- Create Zustand authStore
- Create Axios + JWT interceptor
- Create useAuth() hook
- ✓ Validates: Can call backend endpoints with tokens

**Sprint 4B** (4-5h): Frontend UI
- Create LoginForm, RegisterForm, ProtectedRoute
- Integrate error handling (401 → refresh → retry)
- Create logout button
- ✓ Validates: Full user flow works

**Pros**: Incremental; backend testeable independently; frontend can start after Sprint 2; parallel work possible; each sprint has clear acceptance criteria  
**Cons**: Requires coordination; frontend depends on backend  
**Complexity**: MEDIUM  
**Parallelizable**: YES (after Sprint 2 complete)

### Approach 3: Mock-First + Progressive
Frontend uses mock auth service; UI built independently; swap mock → real when backend ready.

**Pros**: Frontend not blocked; UI development independent; smooth integration  
**Cons**: Mock code maintenance; risk of divergence; false confidence  
**Complexity**: MEDIUM  
**Parallelizable**: YES (fully parallel)

---

## 4. Recommendation

**✅ Use Approach 2 (Layered + Incremental)**

**Why**:
1. **Realistic**: Both backend and frontend need building; incremental keeps both productive
2. **Risk mitigation**: Each sprint has clear acceptance criteria
3. **Early validation**: Login testeable by Sprint 2 end
4. **Parallelizable**: Frontend can work independently after Sprint 2/3
5. **Clear dependencies**: Each sprint builds on previous (no rework)
6. **Testeable**: Unit tests per layer before advancing

**Effort Timeline**:
- Backend total: ~7-10 hours across 3 sprints
- Frontend total: ~7-9 hours across 2 sprints
- **Critical path (with parallelization): ~10-12 hours** (not 16-18 sequential)

---

## 5. Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Alembic migrations not idempotent | ⚠️ MEDIUM | Test migrations locally; use IF NOT EXISTS patterns |
| JWT secret exposure via .env commit | 🔴 HIGH | Enforce .gitignore; pre-commit hooks |
| Refresh token replay attack (RN-AU05) | ⚠️ MEDIUM | Track token version; timestamp comparison for reuse detection |
| Rate limiting IP spoofing | ⚠️ LOW | Only applies to login; acceptable for MVP |
| Soft delete queries forget IS NULL | ⚠️ MEDIUM | Create `get_active()` helper method in repositories |
| Password validation unclear | ⚠️ LOW | Keep bcrypt simple; UI enforces 8+ chars minimum |
| Frontend-Zustand circular dependencies | ⚠️ MEDIUM | Store logic in store; hooks only subscribe (no business logic) |

---

## 6. Key Decisions

1. **JWT Algorithm**: HS256 (symmetric, configured)
2. **Access Token TTL**: 30 minutes (configured)
3. **Refresh Token TTL**: 7 days (per spec)
4. **Refresh Token Storage**: Database (opaque UUID, not JWT)
5. **Refresh Token Rotation**: Yes (revoke old, issue new on each use)
6. **Rate Limiting**: 5 attempts per 15 min per IP on login
7. **Soft Delete Pattern**: eliminado_en TIMESTAMPTZ (preserve audit trail)
8. **RBAC Roles**: ADMIN, STOCK, PEDIDOS, CLIENT (4 fixed roles)
9. **Frontend State**: Zustand (client state) + TanStack Query (server state)
10. **Axios Interceptor**: Auto-attach access token; auto-refresh on 401

---

## 7. Ready for Proposal

✅ **YES — Exploration complete, ready to propose**

**Validation**:
- Current state is clear (backend 50%, frontend 0%)
- Requirements documented (specs in docs/)
- Stack validated (FastAPI, React, all dependencies)
- Approach is feasible with realistic estimates
- No unknown unknowns

**Next Step**: Create proposal with Sprint breakdown and move to spec phase.

---

**Exploration completed by**: SDD Explorer Agent  
**Date**: 2026-05-08  
**Status**: Ready for Proposal Phase
