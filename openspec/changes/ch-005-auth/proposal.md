## Why

Sin autenticación, el sistema Food Store no puede distinguir quién realiza cada operación. Los patrones base (get_current_user, require_role, authStore) están implementados pero **nunca conectados** a endpoints reales ni a la UI. Este cambio entrega el sistema completo de autenticación (registro, login, refresh, logout, protección de rutas), desbloqueando todos los dominios posteriores: productos, carrito, pedidos, pagos y admin.

## What Changes

- **Backend**: Nuevo módulo `backend/auth/` con router, schemas, service, repository para 4 endpoints (`POST /api/v1/auth/register`, `/login`, `/refresh`, `/logout`) más rate limiting en login
- **Frontend**: RegisterForm + LoginForm funcionales, hook `useAuth` con llamadas HTTP reales, interceptor Axios para adjuntar/refrescar tokens, route guards por rol, páginas `/login` y `/registro`
- **Config**: Agregar `JWT_REFRESH_TOKEN_EXPIRE_DAYS` a settings; registrar auth router en `main.py`

## Capabilities

### New Capabilities
- `auth`: Sistema completo de autenticación: registro, login, refresh token con rotación, logout con revocación, rate limiting en login, protección de rutas por rol

### Modified Capabilities
- *(ninguno — primera capability del proyecto)*

## Impact

- **Backend**: Crea `backend/auth/` (router, schemas, service, repository); registra en `main.py`; agrega setting `jwt_refresh_token_expire_days`
- **Frontend**: Implementa `features/auth/components/RegisterForm.tsx`; reemplaza stub de `LoginForm.tsx` y `useAuth.ts`; crea Axios interceptor en `shared/api/axios.ts`; crea `pages/LoginPage.tsx` y `pages/RegisterPage.tsx`; crea `app/providers/AuthProvider.tsx` con route guards; agrega rutas en router
- **Base de datos**: Sin migraciones — modelos Usuario, Rol, UsuarioRol, RefreshToken ya existen (CH-002)
- **Dependencias**: `python-jose`, `bcrypt`, `slowapi` ya instalados
- **Config**: `settings.py` + `.env.example` requieren `JWT_REFRESH_TOKEN_EXPIRE_DAYS=7`
- **Riesgo**: Bajo — todo el scaffolding infraestructura está probado en CH-004; los endpoints son lineales (sin FSM)
- **Rollback**: Remover `auth_router` de `main.py` y revertir cambios en frontend
