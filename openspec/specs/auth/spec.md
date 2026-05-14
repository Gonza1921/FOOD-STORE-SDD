## Purpose

Sistema de autenticación y autorización para FOOD STORE. Cubre registro de usuarios, login con JWT (access token 30min + refresh token 7d con rotación), logout con revocación, rate limiting (5 intentos/15min en login), detección de replay attacks, y RBAC (ADMIN, STOCK, PEDIDOS, CLIENT). Incluye frontend con formularios, route guards, interceptor Axios con refresh automático, y sesión persistente via localStorage.

## Requirements

### Requirement: Registro de cliente (US-001)

El sistema SHALL permitir a un usuario no registrado crear una cuenta cliente mediante `POST /api/v1/auth/register`.

**Request body** (RegisterRequest):
```json
{
  "nombre": "string (max 50 chars, required)",
  "apellido": "string (max 50 chars, required)",
  "email": "string (email válido, max 254 chars, required)",
  "password": "string (min 8 chars, max 128 chars, required)"
}
```

**Response 201** (AuthResponse):
```json
{
  "accessToken": "string (JWT, 30 min)",
  "refreshToken": "string (UUID v4, 7 días)",
  "user": {
    "id": 1,
    "nombre": "string",
    "email": "string",
    "roles": ["CLIENT"]
  }
}
```

**Error responses** (RFC 7807):
| Status | Error Code | Condición |
|--------|-----------|-----------|
| 409 | CONFLICT | Email ya registrado |
| 422 | VALIDATION_ERROR | Campos inválidos o incompletos |

#### Scenario: Registro exitoso con rol CLIENT
- **WHEN** un usuario no registrado envía POST /api/v1/auth/register con nombre, apellido, email válido y password >= 8 caracteres
- **THEN** el sistema retorna 201 Created
- **AND** la respuesta incluye accessToken, refreshToken y objeto user con id, nombre, email, roles=["CLIENT"]
- **AND** la contraseña se almacena hasheada con bcrypt (cost factor >= 10)
- **AND** el rol CLIENT se asigna automáticamente (nunca desde el request)

#### Scenario: Registro con email duplicado
- **WHEN** un usuario intenta registrarse con un email que ya existe en la BD
- **THEN** el sistema retorna 409 Conflict con error_code "CONFLICT" y detail "El email ya está registrado"

#### Scenario: Registro con contraseña débil
- **WHEN** un usuario envía register con password de menos de 8 caracteres
- **THEN** el sistema retorna 422 Unprocessable Entity con error_code "VALIDATION_ERROR"

---

### Requirement: Inicio de sesión (US-002)

El sistema SHALL autenticar usuarios mediante `POST /api/v1/auth/login` con rate limiting.

**Request body** (LoginRequest):
```json
{
  "email": "string (email válido, required)",
  "password": "string (required)"
}
```

**Response 200** (AuthResponse):
```json
{
  "accessToken": "string (JWT, 30 min)",
  "refreshToken": "string (UUID v4, 7 días)",
  "user": {
    "id": 1,
    "nombre": "string",
    "email": "string",
    "roles": ["CLIENT"]
  }
}
```

**Error responses**:
| Status | Error Code | Condición |
|--------|-----------|-----------|
| 401 | UNAUTHORIZED | Credenciales inválidas (mensaje genérico) |
| 429 | RATE_LIMITED | Excedido límite de intentos (5 en 15 min) |

#### Scenario: Login exitoso con credenciales válidas
- **WHEN** un usuario registrado envía POST /api/v1/auth/login con email y contraseña correctos
- **THEN** el sistema retorna 200 OK
- **AND** la respuesta incluye accessToken (JWT con exp 30 min, claims: sub=userId, email, roles)
- **AND** la respuesta incluye refreshToken (UUID v4 opaco)
- **AND** el refreshToken se persiste en BD con hash SHA-256 y expires_at = now + 7 días

#### Scenario: Login con credenciales inválidas (no diferenciar)
- **WHEN** un usuario envía login con email que no existe
- **THEN** el sistema retorna 401 Unauthorized con detail "Credenciales inválidas"
- **AND** la respuesta NO revela si el email existe o la contraseña es incorrecta

#### Scenario: Login con contraseña incorrecta (mismo error)
- **WHEN** un usuario registrado envía login con email correcto y contraseña incorrecta
- **THEN** el sistema retorna 401 Unauthorized con el MISMO mensaje "Credenciales inválidas"
- **AND** no hay diferencia en la respuesta vs. email inexistente

#### Scenario: Rate limiting en login
- **WHEN** se exceden 5 intentos de login fallidos desde la misma IP en una ventana de 15 minutos
- **THEN** el sistema retorna 429 Too Many Requests
- **AND** el mensaje indica "Demasiados intentos. Intente nuevamente en X minutos."
- **AND** las credenciales correctas también son rechazadas hasta que expire la ventana

---

### Requirement: Refresh de token (US-003)

El sistema SHALL rotar tokens mediante `POST /api/v1/auth/refresh` con detección de replay.

**Request body** (RefreshRequest):
```json
{
  "refreshToken": "string (UUID v4, required)"
}
```

**Response 200** (AuthResponse):
```json
{
  "accessToken": "string (nuevo JWT, 30 min)",
  "refreshToken": "string (nuevo UUID v4, 7 días)",
  "user": {
    "id": 1,
    "nombre": "string",
    "email": "string",
    "roles": ["CLIENT"]
  }
}
```

**Error responses**:
| Status | Error Code | Condición |
|--------|-----------|-----------|
| 401 | UNAUTHORIZED | Token expirado o inválido |
| 401 | SESSION_COMPROMISED | Replay attack detectado (todos los tokens revocados) |

#### Scenario: Refresh exitoso con rotación
- **WHEN** un usuario envía POST /api/v1/auth/refresh con un refreshToken válido y no expirado
- **THEN** el sistema retorna 200 OK
- **AND** el refreshToken anterior se marca como revocado (revoked_at = now)
- **AND** se genera un nuevo accessToken (nuevo JWT) y un nuevo refreshToken (nuevo UUID v4 con exp +7 días)
- **AND** el nuevo refreshToken se persiste en BD

#### Scenario: Refresh con token expirado
- **WHEN** un usuario envía refresh con un token cuya expires_at ya pasó
- **THEN** el sistema retorna 401 Unauthorized con error_code "UNAUTHORIZED"
- **AND** el usuario debe re-autenticarse via login

#### Scenario: Refresh con token ya utilizado (replay attack)
- **WHEN** un usuario envía un refreshToken que ya fue revocado (reutilizado)
- **THEN** el sistema detecta replay attack
- **AND** revoca TODOS los refreshTokens activos del usuario (revoked_at = now)
- **AND** retorna 401 Unauthorized con error_code "SESSION_COMPROMISED"
- **AND** el usuario debe re-autenticarse via login

---

### Requirement: Cierre de sesión (US-004)

El sistema SHALL permitir a un usuario autenticado cerrar su sesión mediante `POST /api/v1/auth/logout`.

**Request body** (LogoutRequest):
```json
{
  "refreshToken": "string (UUID v4, required)"
}
```

**Auth**: Requiere Bearer access token en header. Si falta → 401.

**Response**: 204 No Content (sin body).

#### Scenario: Logout exitoso
- **WHEN** un usuario autenticado envía POST /api/v1/auth/logout con un refreshToken válido
- **THEN** el sistema retorna 204 No Content
- **AND** el refreshToken se marca como revocado (revoked_at = now)
- **AND** el accessToken sigue siendo válido hasta su expiración natural (stateless)

#### Scenario: Logout sin autenticación
- **WHEN** un request a POST /api/v1/auth/logout no incluye header Authorization Bearer
- **THEN** el sistema retorna 401 Unauthorized

#### Scenario: Logout con token ya revocado
- **WHEN** un usuario envía logout con un refreshToken que ya fue revocado
- **THEN** el sistema retorna 204 No Content (idempotente — el estado final es el mismo)

---

### Requirement: Protección de rutas por rol (US-006)

El sistema SHALL proteger endpoints según el rol del usuario autenticado.

**Mecanismo**: Dependencias FastAPI `get_current_user` + `require_role` en backend; componente `<ProtectedRoute>` en frontend.

#### Scenario: Request sin token a ruta protegida
- **WHEN** un request sin header Authorization accede a cualquier endpoint que requiera autenticación
- **THEN** el sistema retorna 401 Unauthorized con error_code "UNAUTHORIZED"

#### Scenario: Token válido con rol insuficiente
- **WHEN** un usuario autenticado con rol CLIENT accede a un endpoint que requiere ADMIN
- **THEN** el sistema retorna 403 Forbidden con error_code "FORBIDDEN"
- **AND** el mensaje indica los roles requeridos

#### Scenario: Rutas públicas no requieren autenticación
- **WHEN** un request sin token accede a GET /api/v1/products, POST /api/v1/auth/login, o POST /api/v1/auth/register
- **THEN** el sistema procesa el request normalmente (no retorna 401)

#### Scenario: Frontend redirige a login en ruta protegida sin auth
- **WHEN** un usuario no autenticado navega a /perfil o /carrito (rutas que requieren auth)
- **THEN** el frontend redirige a /login
- **AND** después del login exitoso, redirige a la ruta original

#### Scenario: Frontend muestra 403 en ruta con rol insuficiente
- **WHEN** un usuario autenticado sin rol ADMIN navega a /admin
- **THEN** el frontend muestra página de "Acceso denegado" (403) con mensaje de rol requerido

---

### Requirement: Interceptor Axios con refresh automático

El frontend SHALL interceptar requests HTTP para adjuntar el token de acceso y manejar 401 con refresh automático.

#### Scenario: Access token adjunto automáticamente
- **WHEN** un componente realiza una request GET autenticada
- **THEN** el interceptor agrega header "Authorization: Bearer <accessToken>" automáticamente
- **AND** si no hay accessToken, la request se envía sin header

#### Scenario: Refresh automático en 401 y reintento
- **WHEN** una request autenticada recibe respuesta 401 (token expirado)
- **THEN** el interceptor intentiona refresh con el refreshToken almacenado
- **AND** si el refresh es exitoso, actualiza authStore.updateTokens(nuevosTokens)
- **AND** reintenta la request original con el nuevo accessToken
- **AND** si el refresh falla, ejecuta authStore.logout() y redirige a /login

#### Scenario: Prevenir refreshes concurrentes
- **WHEN** múltiples requests reciben 401 simultáneamente
- **THEN** solo una solicitud de refresh se realiza a la vez
- **AND** las requests fallidas se encolan y reintentan después del refresh exitoso
