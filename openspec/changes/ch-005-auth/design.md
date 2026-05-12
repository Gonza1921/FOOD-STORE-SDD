## Context

Food Store no tiene autenticación funcional. Los patrones base fueron implementados en CH-004:
- `get_current_user` y `require_role` en `backend/core/dependencies.py` (definidos, sin uso)
- `BaseRepository[T]` en `backend/core/repository.py`
- `UnitOfWork` en `backend/core/unit_of_work.py`
- RFC 7807 handlers en `backend/main.py`
- `authStore` en `frontend/src/features/auth/store.ts` (Zustand persist, sin endpoints)
- `LoginForm.tsx` y `useAuth.ts` como stubs vacíos

Los modelos de BD (Usuario, Rol, UsuarioRol, RefreshToken) existen desde CH-002. **No se requieren migraciones**.

## Goals / Non-Goals

**Goals:**
- Backend endpoints funcionales para register, login, refresh, logout con rate limiting
- Frontend RegisterForm + LoginForm conectados a la API
- Interceptor Axios que adjunte access token y refresque automáticamente en 401
- Route guards por rol (CLIENT, ADMIN, STOCK, PEDIDOS)
- Páginas `/login` y `/registro` con redirección post-auth

**Non-Goals:**
- CRUD de roles (US-005) — se implementa en cambio separado de administración
- Recuperación de contraseña — no está en backlog actual
- OAuth2 social (Google, GitHub) — backlog futuro

## Decisions

### 1. Módulo `backend/auth/` propio (vs. splat en routers/)

**Decisión**: Crear `backend/auth/router.py`, `schemas.py`, `service.py`, `repository.py`
**Rationale**: Sigue el patrón feature-first ya definido (un módulo por dominio). Auth tiene lógica de negocio no trivial (rotación de refresh tokens, rate limiting) que justifica su propio service/repository.
**Alternativa**: Poner todo en `routers/auth.py` — rechazado porque mezcla capas.

### 2. Refresh token rotation con detección de replay

**Decisión**: Al usar un refresh token: (1) verificar hash en BD, (2) revocarlo (revoked_at = now), (3) emitir nuevo par. Si el token ya fue revocado → revocar TODOS los tokens del usuario (replay attack).
**Rationale**: RFC 6749 recomendación de rotación. Previene token leakage persistente.
**Trade-off**: Costo de 2 writes + 1 read por refresh, aceptable para la frecuencia del endpoint.

### 3. Rate limiting con slowapi en login

**Decisión**: Usar decorador `@limiter.limit("5/15minutes")` sobre el endpoint de login.
**Rationale**: slowapi ya es dependencia del proyecto (instalado en CH-000a). Sin Redis adicional (in-memory es suficiente para single-instance).
**Trade-off**: Rate limit se pierde al reiniciar servidor (in-memory). Aceptable para MVP.

### 4. Axios interceptor con refresh automático

**Decisión**: Interceptor de response que, en 401, intenta refresh con el token almacenado, actualiza authStore, y reintenta la request original. Cola de requests fallidas para evitar refresh concurrentes.
**Rationale**: Experiencia transparente para el usuario. El patrón de cola evita múltiples refreshes simultáneos.
**Trade-off**: Complejidad media en el interceptor. Alternativa: redirigir a login en 401 — peor UX.

### 5. Route guards con React component wrapper

**Decisión**: Componente `<ProtectedRoute roles={["ADMIN"]}>` que envuelve rutas privadas. Usa `useAuth().hasRole()` del authStore.
**Rationale**: Sigue el patrón de react-router-dom v6 con layout routes. No requiere estado adicional.
**Alternativa**: Middleware en el router — react-router-dom v6 no soporta guards declarativos fuera de componentes.

## Risks / Trade-offs

| Risk | Mitigación |
|------|-----------|
| Token replay race condition (2 requests con mismo refresh token) | La detección de replay es atómica: el primer request revoca, el segundo detecta revoked_at != null |
| Rate limit in-memory perdido al reiniciar | Aceptable para dev; producción requeriría Redis |
| Access token stateless no se puede revocar individualmente | Policy: expiración 30min. Para revocación forzada, rotar SECRET_KEY (invalida todos) |
| Error de red en refresh deja al usuario sin sesión | Interceptor redirige a login si refresh falla; authStore se limpia |

## Backend Architecture

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

Flujo por capas:

Router (auth/router.py)
  ↓  valida schemas Pydantic
Service (auth/service.py)
  ↓  orquesta lógica de negocio
Repository (auth/repository.py)  ← hereda de BaseRepository[Usuario/RefreshToken]
  ↓
Model (models/usuario.py)
```

### Flujo de Registro (atómico con UnitOfWork)

```
RegisterRequest(username, email, password)
  │
  ├→ 1. Validar email único (AuthRepository.find_by_email)
  ├→ 2. Hashear password (bcrypt)
  ├→ 3. Crear Usuario (BaseRepository.create) + asignar rol CLIENT via UnitOfWork
  ├→ 4. Generar access token (30m) + refresh token (7d, UUID v4)
  ├→ 5. Persistir RefreshToken (hash SHA-256 del UUID)
  └→ 6. Retornar AuthResponse { accessToken, refreshToken, user }
```

### Flujo de Login con Rate Limiting

```
LoginRequest(email, password)
  │
  ├→ [Rate limit: 5/15min por IP] ← slowapi decorator
  ├→ 1. Buscar usuario por email (find_by_email)
  ├→ 2. Verificar password (verify_password)
  ├→    ├→ Falso: error 401 genérico ("Credenciales inválidas")
  ├→    └→ True: generar tokens, persistir refresh, retornar AuthResponse
  └→ Error 429 si rate limit excedido
```

### Flujo de Refresh con Rotación

```
RefreshRequest(refreshToken)
  │
  ├→ 1. Calcular hash SHA-256 del token
  ├→ 2. Buscar RefreshToken por hash
  ├→ 3. ¿Revocado?
  │     ├→ Sí → DETECTAR REPLAY:
  │     │      ├→ Revocar TODOS los refresh tokens del usuario
  │     │      └→ Error 401 "Sesión comprometida"
  │     └→ No → Continuar
  ├→ 4. ¿Expirado? → Error 401 "Token expirado"
  ├→ 5. Revocar token actual (revoked_at = now)
  ├→ 6. Generar nuevo par access + refresh
  ├→ 7. Persistir nuevo RefreshToken
  └→ 8. Retornar AuthResponse
```

### Flujo de Logout

```
LogoutRequest(refreshToken)  [Requiere auth: Bearer access token]
  │
  ├→ 1. Buscar RefreshToken por hash
  ├→ 2. Revocar (revoked_at = now)
  └→ 3. Retornar 204 No Content
```

### Flujo de Protección de Rutas (backend)

```
Request a /api/v1/admin/dashboard
  │
  ├→ 1. get_current_user valida JWT access token
  │     ├→ Token faltante → 401
  │     ├→ Token inválido/expirado → 401
  │     └→ Token OK → extraer Usuario
  ├→ 2. require_role(["ADMIN"]) verifica roles
  │     ├→ Sin rol suficiente → 403
  │     └→ OK → ejecutar handler
  └→ 3. Handler ejecuta lógica de negocio
```

## Frontend Architecture

```
FSD Capas:

pages/
├── LoginPage.tsx          → usa LoginForm + authStore
├── RegisterPage.tsx       → usa RegisterForm + authStore
└── DashboardPage.tsx      → envuelto en ProtectedRoute (futuro)

features/auth/
├── components/
│   ├── LoginForm.tsx       ← reemplazar stub actual
│   ├── RegisterForm.tsx    ← nuevo
│   └── index.ts
├── hooks/
│   ├── useAuth.ts          ← reemplazar stub actual
│   └── index.ts
└── store.ts                ← ya implementado (Zustand persist)

app/
├── providers/
│   └── AuthProvider.tsx    ← nuevo: provee auth context + route guards
├── router.tsx              ← actualizar con rutas /login, /registro, ProtectedRoute
└── main.tsx

shared/
├── api/
│   └── axios.ts            ← nuevo/actualizar: interceptor con refresh
└── types/
    └── auth.ts             ← interfaces AuthResponse, LoginRequest, RegisterRequest
```

### Flujo de AuthProvider

```
<AuthProvider>
  │
  ├→ 1. Al montar: leer authStore (persistido de sesión anterior)
  ├→ 2. Si hay accessToken → asumir autenticado
  ├→ 3. Exponer:
  │     ├→ useAuth() → { user, isAuthenticated, hasRole, login, logout, isLoading }
  │     └→ <ProtectedRoute roles={...}> → redirige a /login si no autenticado
  └→ 4. Route guards:
        ├→ /login, /registro → público (redirect si ya autenticado)
        ├→ / → público (catálogo)
        └→ /dashboard, /cart, /orders, /admin → privado (requiere auth + roles)
```

### Interceptor Axios

```
Request Interceptor:
  ├→ Leer accessToken de authStore.getState()
  ├→ Si existe → header "Authorization: Bearer <token>"
  └→ Pasar al handler

Response Interceptor (401 handling):
  ├→ ¿Error 401 AND no es endpoint de auth?
  │   ├→ ¿Refresh en progreso?
  │   │   ├→ Sí → encolar request pendiente
  │   │   └→ No → iniciar refresh con refreshToken
  │   │         ├→ Éxito → actualizar authStore (updateTokens), reintentar request
  │   │         └→ Falla → authStore.logout(), redirigir a /login
  │   └→ No → propagar error
  └→ Otros errores → propagar
```

## Schema Changes

**Ninguno.** Todos los modelos existen desde CH-002:
- `usuario` — con campos: id, email, password_hash, nombre, apellido, creado_en, actualizado_en, deleted_at
- `rol` — con codigo (PK), nombre, descripcion
- `usuario_rol` — con usuario_id, rol_codigo, asignado_en, asignado_por_id
- `refresh_token` — con id, usuario_id, token_hash (SHA-256 unique), expires_at, revoked_at, creado_en

## Open Questions

- ¿Refresh token como cookie httpOnly vs response body? Decisión: response body (más simple para SPA con Zustand; cookie httpOnly no es accesible desde JS). En producción futura se puede migrar a cookie + CSRF.
- ¿Debemos agregar `JWT_REFRESH_TOKEN_EXPIRE_DAYS=7` a `.env.example`? Sí, se agrega.
