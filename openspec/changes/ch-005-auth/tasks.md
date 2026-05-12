## 1. Configuración

- [ ] 1.1 Agregar `JWT_REFRESH_TOKEN_EXPIRE_DAYS=7` a `backend/core/config.py` como setting con Field(default=7)
- [ ] 1.2 Agregar `jwt_refresh_token_expire_days` a `backend/.env.example` con valor por defecto 7
- [ ] 1.3 Agregar `REFRESH_TOKEN_EXPIRE_DAYS=7` a `frontend/.env.example` (documentación)

## 2. Backend — Repository (capa datos)

- [ ] 2.1 Crear `backend/auth/repository.py` con `AuthRepository(BaseRepository)` que herede de BaseRepository[Usuario] y exponga:
  - `find_by_email(email: str) → Usuario | None`
  - `create_refresh_token(usuario_id: int, token_hash: str, expires_at: datetime) → RefreshToken`
  - `find_refresh_token(token_hash: str) → RefreshToken | None`
  - `revoke_refresh_token(token: RefreshToken) → None`
  - `revoke_all_user_tokens(usuario_id: int) → None`

## 3. Backend — Schemas (Pydantic)

- [ ] 3.1 Crear `backend/auth/schemas.py` con:
  - `RegisterRequest`: nombre, apellido, email (EmailStr), password (min_length=8, max_length=128)
  - `LoginRequest`: email (EmailStr), password
  - `RefreshRequest`: refreshToken (str)
  - `LogoutRequest`: refreshToken (str)
  - `UserResponse`: id, nombre, email, roles (list[str])
  - `AuthResponse`: accessToken, refreshToken, user (UserResponse)

## 4. Backend — Service (lógica de negocio)

- [ ] 4.1 Crear `backend/auth/service.py` con `AuthService` y métodos:
  - `register(request: RegisterRequest) → AuthResponse`: validar email único, hashear password, crear usuario + asignar rol CLIENT via UnitOfWork, generar tokens, retornar AuthResponse
  - `login(request: LoginRequest) → AuthResponse`: buscar email, verificar password, generar tokens, persistir refresh, retornar AuthResponse
  - `refresh(request: RefreshRequest) → AuthResponse`: validar hash, detectar replay, rotar tokens
  - `logout(request: LogoutRequest) → None`: revocar refresh token
  - Helpers privados: `_generate_tokens(usuario) → dict`, `_hash_token(token) → str`

## 5. Backend — Router (endpoints HTTP)

- [ ] 5.1 Crear `backend/auth/router.py` con 4 endpoints:
  - `POST /register` → `AuthService.register()` → 201 Created
  - `POST /login` → `AuthService.login()` con `@limiter.limit("5/15minutes")` → 200 OK
  - `POST /refresh` → `AuthService.refresh()` → 200 OK
  - `POST /logout` → `AuthService.logout()` (requiere `Depends(get_current_user)`) → 204 No Content
- [ ] 5.2 Registrar `auth_router` en `backend/main.py` con prefijo `/api/v1/auth` y tags=["auth"]

## 6. Frontend — Axios Interceptor

- [ ] 6.1 Crear/actualizar `frontend/src/shared/api/axios.ts` con:
  - Instancia Axios con baseURL desde `VITE_API_BASE_URL`
  - Request interceptor: leer accessToken de `useAuthStore.getState()`, adjuntar header Authorization
  - Response interceptor: en 401, intentar refresh con cola de requests pendientes, actualizar authStore, reintentar
  - Si refresh falla: ejecutar `useAuthStore.getState().logout()`, redirigir a /login
  - Prevenir refreshes concurrentes usando flag + cola de pendientes

## 7. Frontend — Auth Components

- [ ] 7.1 Implementar `frontend/src/features/auth/components/RegisterForm.tsx`:
  - Campos: nombre, apellido, email, password, confirmar password
  - Validación client-side (email formato, password min 8 chars, passwords coinciden)
  - Submit: POST a /api/v1/auth/register via axios
  - Éxito: llamar `authStore.login(tokens, user)`, redirigir a ruta anterior o /
  - Error: mostrar mensaje de error (email duplicado, validación)
- [ ] 7.2 Reemplazar `frontend/src/features/auth/components/LoginForm.tsx` (stub actual):
  - Campos: email, password
  - Submit: POST a /api/v1/auth/login via axios
  - Éxito: llamar `authStore.login(tokens, user)`, redirigir a ruta anterior o /
  - Error: mostrar "Credenciales inválidas" (genérico)

## 8. Frontend — useAuth Hook

- [ ] 8.1 Reemplazar `frontend/src/features/auth/hooks/useAuth.ts` (stub actual):
  - Retornar { user, isAuthenticated, hasRole, login, logout, isLoading, error }
  - Leer de `useAuthStore` (Zustand)
  - `hasRole(role: string) → boolean`: verificar si user.roles incluye el rol
  - `login(tokens, user)`: wrapper que llama `authStore.login(tokens, user)`
  - `logout()`: llamar POST /api/v1/auth/logout, luego `authStore.logout()`

## 9. Frontend — AuthProvider y Route Guards

- [ ] 9.1 Crear `frontend/src/app/providers/AuthProvider.tsx`:
  - Componente que envuelve la app y expone contexto de autenticación
  - En montaje: verificar si hay accessToken en authStore (sesión previa persistida)
- [ ] 9.2 Crear `frontend/src/features/auth/components/ProtectedRoute.tsx`:
  - Props: `roles?: string[]` (opcional, si se requiere rol específico), `redirectTo?: string` (default /login)
  - Si no autenticado: redirigir a /login con return URL
  - Si autenticado y requiere roles: verificar `hasRole`, si no cumple mostrar página 403
  - Si autenticado y sin restricción de rol: renderizar children

## 10. Frontend — Páginas y Routing

- [ ] 10.1 Crear `frontend/src/pages/LoginPage.tsx`: renderiza LoginForm, diseño responsivo
- [ ] 10.2 Crear `frontend/src/pages/RegisterPage.tsx`: renderiza RegisterForm, diseño responsivo
- [ ] 10.3 Crear `frontend/src/pages/UnauthorizedPage.tsx`: página 403 "Acceso denegado"
- [ ] 10.4 Actualizar router (react-router-dom) con:
  - Ruta pública: `/login` → LoginPage (redirect a / si ya autenticado)
  - Ruta pública: `/registro` → RegisterPage (redirect a / si ya autenticado)
  - Rutas privadas: `/perfil`, `/carrito`, `/admin/*`, `/pedidos/*` envueltas en ProtectedRoute
  - Ruta 403: `/acceso-denegado` → UnauthorizedPage

## 11. Testing — Backend

- [ ] 11.1 Escribir tests unitarios para `AuthService.register`:
  - Registro exitoso asigna rol CLIENT
  - Email duplicado lanza ConflictError
- [ ] 11.2 Escribir tests unitarios para `AuthService.login`:
  - Login exitoso retorna tokens
  - Credenciales inválidas lanzan UnauthorizedError (mismo error para email inexistente y contraseña incorrecta)
- [ ] 11.3 Escribir tests unitarios para `AuthService.refresh`:
  - Rotación: token anterior revocado, nuevo token creado
  - Replay attack: revoca todos los tokens del usuario
  - Token expirado lanza UnauthorizedError
- [ ] 11.4 Escribir tests unitarios para `AuthService.logout`:
  - Logout exitoso revoca token
  - Logout con token ya revocado es idempotente (204)
- [ ] 11.5 Escribir tests de integración para endpoints:
  - POST /api/v1/auth/register → 201 + verificar persistencia
  - POST /api/v1/auth/login → 200 + verificar tokens válidos
  - POST /api/v1/auth/refresh → 200 + verificar rotación
  - POST /api/v1/auth/logout → 204 + verificar token revocado
  - Ruta protegida sin token → 401
  - Ruta con rol insuficiente → 403

## 12. Testing — Frontend

- [ ] 12.1 Escribir tests para `LoginForm`: renderizado, validación, submit
- [ ] 12.2 Escribir tests para `RegisterForm`: renderizado, validación, submit, confirmación de password
- [ ] 12.3 Escribir tests para `ProtectedRoute`: redirección sin auth, render con auth, 403 con rol insuficiente
- [ ] 12.4 Escribir tests para Axios interceptor: adjuntar token, refresh automático en 401

## 13. Documentación

- [ ] 13.1 Agregar changelog entry en `docs/CHANGES.md` para CH-005
- [ ] 13.2 Verificar que `docs/Integrador.txt` refleje los endpoints de auth implementados
