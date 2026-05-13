## Context

El sistema de autenticación fue implementado parcialmente como parte de CH-004 (patrones base) y work in progress durante cambios anteriores. El código backend y frontend existe pero nunca fue validado formalmente E2E ni pasado por todo el pipeline SDD. Hay issues conocidos de timezone (datetimes timezone-aware vs naive) que pueden causar errores en producción con TIMESTAMP WITHOUT TIME ZONE en PostgreSQL.

Este change completa, corrige y valida todo el sistema de auth para desbloquear Sprints 3 y 4.

## Goals / Non-Goals

**Goals:**
- Corregir issues de timezone en `auth/repository.py` y `core/security.py`
- Verificar que los 4 endpoints REST andan: register, login, refresh, logout
- Verificar frontend: LoginForm, RegisterForm, ProtectedRoute, interceptor Axios
- Verificar RBAC: ADMIN, STOCK, PEDIDOS, CLIENT
- Validar rate limiting en login (5 intentos/15min)
- Verificar tests backend existentes y corregir si fallan
- Verificar tests frontend existentes y corregir si fallan
- Verificación E2E manual del flujo completo

**Non-Goals:**
- NO rediseñar la arquitectura auth existente (ya es correcta: JWT dual-token + rotación)
- NO agregar nuevos endpoints (register, login, refresh, logout cubren el spec)
- NO migrar a otro esquema de autenticación (OAuth2 social, etc.)
- NO cambiar modelos de BD (Usuario, RefreshToken, Rol ya existen)

## Decisions

### Timezone: datetime.utcnow() vs datetime.now(timezone.utc)

| Ubicación | Original | Problema | Fix |
|-----------|----------|----------|-----|
| `auth/repository.py:127` | `datetime.now(timezone.utc)` | Timezone-aware en columna TIMESTAMP WITHOUT TIME ZONE → `revoked_at` | `datetime.utcnow()` |
| `auth/repository.py:146` | `datetime.now(timezone.utc)` | Timezone-aware en columna TIMESTAMP WITHOUT TIME ZONE → bulk revoke | `datetime.utcnow()` |
| `core/security.py:34,36` | `datetime.now(timezone.utc)` | JWT exp es UNIX timestamp (OK) | No tocar — JWT usa epoch |
| `auth/service.py:153,230` | `datetime.utcnow()` | ✅ Correcto para TIMESTAMP WITHOUT TIME ZONE | No tocar |

**Decisión**: Unificar UTC naive para operaciones de BD. JWT `exp` es UNIX timestamp y siempre se interpreta en UTC, no necesita cambio.

### Arquitectura de Capas (ya implementada, se valida)

```
Browser → React (Axios interceptor) → FastAPI Router → AuthService → UnitOfWork → AuthRepository → PostgreSQL
                                                             │
                                                    create_access_token()  (JWT)
                                                    create_refresh_token() (UUID v4)
                                                    hash_token()           (SHA-256)
```

**Por qué JWT dual-token**: Access token stateless (30min) permite escalar horizontalmente sin sesiones compartidas. Refresh token stateful (7d) con rotación y detección de replay provee seguridad adicional (RFC 6749 recomendado).

**Por qué SHA-256 para refresh tokens**: Nunca almacenar el raw token en BD. Solo el hash. Si la BD se compromete, los refresh tokens no pueden ser reutilizados.

### Frontend: Auth State Management

```
Zustand authStore ─── localStorage (persist: accessToken, refreshToken, user)
      │
      ├── Axios interceptor → adjunta Bearer token
      ├── AuthProvider → provee contexto de auth a toda la app
      ├── ProtectedRoute → redirect a /login si no auth
      └── useAuth hook → acceso a user, login(), logout()
```

**Por qué Zustand en lugar de TanStack Query**: Auth state es client state (tokens, usuario logueado), no server state. Nunca debe cachearse ni revalidarse. Zustand con `persist` middleware guarda en localStorage automáticamente.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| JWT sin refresh rotation podría ser robado y reutilizado | Ya implementamos la rotación + detección de replay (revoca todos los tokens del usuario si detecta reuso) |
| Timezone mismatch entre Python y PostgreSQL | Fix unificado: `datetime.utcnow()` para todas las columnas TIMESTAMP sin timezone |
| Rate limiting en login podría autobloquear IPs legítimas en NAT corporativo | 5 intentos/15min es conservador. Se puede ajustar via settings. |
| Refresh token almacenado en localStorage vulnerable a XSS | Mitigación parcial via httpOnly cookies es posible pero requiere cambio mayor. Estado actual es aceptable para MVP. |

## Arquitectura de Componentes

### Backend: Capas

```
┌──────────────────────────────────────────────────────────────┐
│ Router (auth/router.py)                                      │
│  POST /register → 201  │  POST /login → 200                  │
│  POST /refresh → 200   │  POST /logout → 204                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│ Service (auth/service.py)                                    │
│  register() → UnitOfWork → AuthRepository                    │
│  login()    → UnitOfWork → AuthRepository                    │
│  refresh()  → UnitOfWork → AuthRepository                    │
│  logout()   → UnitOfWork → AuthRepository                    │
│                                                              │
│  Helpers: _generate_access_token(), _persist_refresh_token() │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│ Repository (auth/repository.py)                              │
│  find_by_email() │ assign_role() │ create_refresh_token()    │
│  find_refresh_token() │ revoke_refresh_token()               │
│  revoke_all_user_tokens()                                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│ Core (core/security.py + core/dependencies.py)               │
│                                                              │
│  create_access_token()  │ verify_token()                     │
│  get_password_hash()    │ verify_password()                  │
│  create_refresh_token() │ hash_token()                       │
│  get_current_user()     │ require_role()                     │
└──────────────────────────────────────────────────────────────┘
```

### Frontend: Feature-Sliced Design

```
pages/LoginPage.tsx         → features/auth → LoginForm
pages/RegisterPage.tsx      → features/auth → RegisterForm
pages/UnauthorizedPage.tsx  → static 403 page

features/auth/
├── store.ts                → Zustand authStore (persist: localStorage)
├── hooks/useAuth.ts        → hook: { user, login, logout, isAuthenticated }
├── components/
│   ├── AuthProvider.tsx    → React context provider
│   ├── LoginForm.tsx       → Formulario de login
│   ├── RegisterForm.tsx    → Formulario de registro
│   ├── ProtectedRoute.tsx  → Route guard (redirect si no auth)
│   └── PublicRoute.tsx     → Route guard (redirect si auth)
```

### Flujo de Autenticación

```
                            ┌───────────┐
                            │  Browser   │
                            └─────┬─────┘
                                  │ POST /api/v1/auth/register { email, password }
                                  ▼
                            ┌───────────┐
                            │  Router    │
                            └─────┬─────┘
                                  │
                            ┌─────▼─────┐
                            │  Service   │
                            │            │
                            │ 1. Hash pw │  get_password_hash()
                            │ 2. Crear   │  Usuario(nombre, email, pass)
                            │    usuario │
                            │ 3. Asignar │  assign_role(user.id, "CLIENT")
                            │    rol     │
                            │ 4. Token   │  _generate_access_token(user)
                            │    pair    │  + _persist_refresh_token(repo, user.id, raw)
                            └─────┬─────┘
                                  ▼
                            ┌───────────┐
                            │  Response  │  { accessToken, refreshToken, user }
                            │  201/200   │
                            └─────┬─────┘
                                  │
                            ┌─────▼─────┐
                            │  Browser   │
                            │            │
                            │ authStore  │  ← almacena tokens en localStorage
                            │ .setAuth() │
                            └───────────┘
```

### Flujo de Refresh + Replay Detection

```
1. Client envía refreshToken
2. Service hashea: hash_token(refreshToken) → SHA-256
3. AuthRepository.find_refresh_token(hash)
4. ¿revoked_at IS NOT NULL? → REPLAY DETECTED!
   → revoke_all_user_tokens(usuario_id)
   → return 401 SESSION_COMPROMISED
5. ¿expires_at < now? → return 401 UNAUTHORIZED
6. Revocar old token → revoke_refresh_token(stored)
7. Generar nuevo pair → return 200 { accessToken, refreshToken, user }
```
