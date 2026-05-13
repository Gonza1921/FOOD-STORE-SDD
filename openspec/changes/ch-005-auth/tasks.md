# Tasks: ch-005-auth

## 1. Backend — Fixes y correcciones

- [x] 1.1 Fix timezone en `auth/repository.py`: cambiar `datetime.now(timezone.utc)` → `datetime.utcnow()` en revoke_refresh_token y revoke_all_user_tokens
- [x] 1.2 Verificar que `core/security.py` JWT exp use timezone-aware (OK para JWT, validar que funciona correctamente)
- [x] 1.3 Verificar schemas Pydantic: RegisterRequest, LoginRequest, RefreshRequest, LogoutRequest, AuthResponse, UserResponse

## 2. Backend — Tests (backend/tests/)

- [x] 2.1 Verificar y corregir tests en `test_auth_service.py`
- [x] 2.2 Verificar y corregir tests en `test_auth_router.py`
- [x] 2.3 Verificar y corregir tests en `test_auth_schemas.py`
- [x] 2.4 Ejecutar suite completa de tests backend: `pytest backend/tests/ -v`

## 3. Backend — Verificación E2E de endpoints

- [x] 3.1 Verificar POST /api/v1/auth/register: registro exitoso (201), email duplicado (409), password débil (422)
- [x] 3.2 Verificar POST /api/v1/auth/login: login exitoso (200), credenciales inválidas (401)
- [x] 3.3 Verificar POST /api/v1/auth/refresh: refresh exitoso (200), replay attack detection (401)
- [x] 3.4 Verificar POST /api/v1/auth/logout: logout exitoso (204), sin auth (401), idempotente
- [x] 3.5 Verificar RBAC: endpoints protegidos con require_role (401 sin token, 403 rol insuficiente)

## 4. Frontend — Verificación

- [x] 4.1 Verificar que authStore (Zustand + persist) funcione: login almacena tokens, logout los limpia
- [x] 4.2 Verificar LoginForm: validación de campos, submit, manejo de errores
- [x] 4.3 Verificar RegisterForm: validación de campos, submit, manejo de errores
- [x] 4.4 Verificar ProtectedRoute: redirect a /login si no auth, redirect a /unauthorized si rol insuficiente
- [x] 4.5 Verificar Axios interceptor: adjunta Bearer token, refresh automático en 401, cola de requests

## 5. Frontend — Tests

- [x] 5.1 Verificar y corregir `LoginForm.test.tsx`
- [x] 5.2 Verificar y corregir `RegisterForm.test.tsx`
- [x] 5.3 Verificar y corregir `ProtectedRoute.test.tsx`
- [x] 5.4 Ejecutar suite de tests frontend: `npm run test` en frontend/

## 6. Code Quality

- [x] 6.1 Ejecutar mypy en backend/auth/ — 0 errores específicos de auth
- [x] 6.2 Ejecutar black en backend/auth/ — formato correcto
- [x] 6.4 TypeScript type-check: `npx tsc --noEmit` en frontend/

## 7. Verificación Final

- [x] 7.1 Cleanup: commits convencionales, push a GitHub
