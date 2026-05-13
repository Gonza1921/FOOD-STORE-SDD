## Why

Auth (CH-005) es el cuello de botella del proyecto — sin autenticación funcionando, los Sprints 3 (pedidos) y 4 (pagos/admin) están completamente bloqueados. Ya existe código backend y frontend de auth desarrollado durante CH-004/CH-007, pero tiene issues conocidos (timezone, validación de schemas) y nunca se validó E2E. Este change completa, corrige y verifica todo el sistema de auth para desbloquear el resto del roadmap.

## What Changes

- Corregir issues de timezone en `auth/service.py` y `core/repository.py` (datetime timezone-aware vs naive)
- Verificar y corregir schemas Pydantic de auth si hay discrepancias
- Verificar que los 4 endpoints REST funcionen: register, login, refresh, logout
- Verificar frontend: LoginForm, RegisterForm, AuthProvider, ProtectedRoute, interceptor Axios
- Agregar tests faltantes si es necesario
- Verificación E2E: registro → login → refresh → logout → rutas protegidas
- Sincronizar specs delta con las specs principales en `openspec/specs/auth/`

## Capabilities

### New Capabilities
- `auth`: Sistema completo de autenticación con registro de usuarios, login JWT (access token 30min + refresh token 7d con rotación), logout con revocación, rate limiting (5 intentos/15min), y RBAC (ADMIN, STOCK, PEDIDOS, CLIENT)

### Modified Capabilities
- (ninguna — auth es capability nueva)

## Impact

- `backend/auth/` — router, service, schemas, repository (correcciones menores)
- `backend/core/dependencies.py` — get_current_user, require_role (verificar funcionamiento)
- `backend/core/repository.py` — timezone fix en BaseRepository
- `frontend/src/features/auth/` — componentes, hooks, store (verificar)
- `frontend/src/app/Router.tsx` — rutas protegidas/públicas (verificar)
- `openspec/specs/auth/spec.md` — spec principal de auth
