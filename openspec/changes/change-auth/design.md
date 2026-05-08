# Design — change-auth

## Arquitectura

El sistema utilizará arquitectura en capas:

- Router Layer
- Service Layer
- Repository Layer
- Database Layer

---

## Backend

### Componentes

- auth_router
- auth_service
- user_repository
- jwt_utils
- password_utils

---

## Frontend

### Componentes

- authStore (Zustand)
- login page
- register page
- route guards
- axios interceptor

---

## Seguridad

- JWT access tokens
- Refresh tokens persistidos
- bcrypt para hashing
- Middleware de autorización

---

## Flujo

1. Usuario inicia sesión
2. Backend valida credenciales
3. Backend genera tokens
4. Frontend guarda sesión
5. Requests utilizan Authorization header

---

## Riesgos

- Expiración incorrecta de tokens
- Reutilización de refresh token
- Fugas de secretos JWT