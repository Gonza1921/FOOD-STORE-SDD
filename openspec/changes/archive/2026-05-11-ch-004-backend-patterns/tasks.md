# Tasks: CH-004 — Backend Patterns & Frontend Stores

## 1. Backend — BaseRepository[T]

- [x] 1.1 Create `backend/core/repository.py` with `BaseRepository[T]` generic class
  - TypeVar bound to SQLModel
  - __init__ receives SQLAlchemy AsyncSession
  - Methods: get_by_id, get_all, create, update, delete, count, soft_delete, hard_delete
  - get_by_id and get_all exclude soft-deleted records by default

## 2. Backend — UnitOfWork

- [x] 2.1 Create `backend/core/unit_of_work.py` with `UnitOfWork` async context manager
  - Implements `__aenter__` and `__aexit__` (async with support)
  - `register(name, repo_class, model_class)` to register repositories
  - Auto commit on success, auto rollback on exception
  - Provides registered repos as attributes (e.g., `uow.productos`)
  - Supports registering repos before OR inside the `async with` block

## 3. Backend — Dependencies (get_current_user + require_role)

- [x] 3.1 Create `backend/core/dependencies.py`
  - `get_current_user`: extracts JWT from `Authorization: Bearer` header via OAuth2PasswordBearer
  - Uses `verify_token` from security.py to decode JWT
  - Fetches Usuario from DB by `sub` claim (user ID)
  - Returns Usuario or raises HTTP 401
  - `require_role(roles: list[str])`: factory function returning a dependency callable
  - Checks user.roles intersection with required roles
  - Raises HTTP 403 Forbidden if no role matches

## 4. Backend — RFC 7807 Error Handler Improvement

- [x] 4.1 Update `backend/main.py` error handler for RFC 7807 compliance
  - Replace current dict-based handler with proper `ErrorResponse` Pydantic model
  - Set `Content-Type: application/problem+json` header
  - Add catch-all exception handler for unhandled exceptions (hide stack trace in production)
  - Ensure all `APIError` subclasses are properly serialized

## 5. Frontend — authStore (replace placeholder)

- [x] 5.1 Rewrite `frontend/src/features/auth/store.ts`
- [x] 6.1 Rewrite `frontend/src/features/cart/store.ts`
- [x] 7.1 Create `frontend/src/features/payment/store.ts`
- [x] 7.2 Create `frontend/src/features/payment/index.ts` barrel export
- [x] 8.1 Create `frontend/src/features/ui/store.ts`
- [x] 8.2 Create `frontend/src/features/ui/index.ts` barrel export
- [x] 9.1 Update `frontend/src/features/index.ts` to include payment and ui features
- [x] 9.2 Verify TypeScript type-check passes: `npm run type-check` → 0 errors
- [x] 9.3 Verify build succeeds: `npm run build` → dist/ created

## Summary

| Phase | Tasks | Duration | Focus |
|-------|-------|----------|-------|
| 1. BaseRepository | 1.1 (1) | 0.5h | Generic CRUD |
| 2. UnitOfWork | 2.1 (1) | 0.5h | Atomic transactions |
| 3. Dependencies | 3.1 (1) | 0.5h | Auth + RBAC injection |
| 4. Error Handler | 4.1 (1) | 0.25h | RFC 7807 compliance |
| 5. authStore | 5.1 (1) | 0.5h | Auth state + persist |
| 6. cartStore | 6.1 (1) | 0.5h | Cart state + persist |
| 7. paymentStore | 7.1–7.2 (2) | 0.25h | Payment flow state |
| 8. uiStore | 8.1–8.2 (2) | 0.25h | UI preferences |
| 9. Integration | 9.1–9.3 (3) | 0.25h | Barrels, verify |
| **TOTAL** | **13 tasks** | **~3.5h** | |
