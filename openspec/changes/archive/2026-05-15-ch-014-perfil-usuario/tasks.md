# CH-014: Perfil de Usuario — Tareas

## 1. Setup

- [x] 1.1 Crear estructura `backend/usuarios/` con router, service, schemas, repository
- [x] 1.2 Agregar campo `telefono` al modelo Usuario + migración Alembic
- [x] 1.3 Crear estructura frontend `features/perfil/` con componentes y hooks
- [x] 1.4 Registrar router de usuarios en `backend/main.py`

## 2. Backend — Endpoints de Perfil

- [x] 2.1 Implementar `GET /api/v1/usuarios/perfil` — obtener datos del usuario autenticado
- [x] 2.2 Implementar `PUT /api/v1/usuarios/perfil` — actualizar nombre, apellido, teléfono
- [x] 2.3 Implementar `POST /api/v1/usuarios/perfil/cambiar-contrasena` — cambio con validación + invalidación de refresh tokens

## 3. Frontend — Página de Perfil

- [x] 3.1 Crear hook `usePerfil` con TanStack Query (GET + PUT)
- [x] 3.2 Crear hook `useCambiarContrasena` con TanStack Query (POST)
- [x] 3.3 Crear `PerfilPage` con formulario de datos personales
- [x] 3.4 Crear formulario de cambio de contraseña
- [x] 3.5 Agregar ruta `/mi-perfil` en Router.tsx y export desde pages/index

## 4. Tests

- [x] 4.1 Tests unitarios backend: service de perfil
- [x] 4.2 Tests de integración: endpoints de perfil
- [x] 4.3 Ejecutar `pnpm type-check` — sin errores nuevos (los 6 existentes son del módulo pagos, pre-CH-014)

## 5. Verificación

- [x] 5.1 Verificar flujo completo: login → /mi-perfil → ver datos → editar → cambiar contraseña → relogin
