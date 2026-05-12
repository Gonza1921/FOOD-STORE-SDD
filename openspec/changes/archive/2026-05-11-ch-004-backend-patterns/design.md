# Design: CH-004 — Backend Patterns & Frontend Stores

## Context

FOOD-STORE tiene actualmente:

- **Backend**: Modelos SQLModel completos (ch-002-database), core configurado (config.py, database.py, security.py), excepciones definidas (exceptions.py) pero:
  - No existe BaseRepository — cada módulo tendría que repetir CRUD
  - No existe UnitOfWork — no hay transacciones atómicas multi-entidad
  - No existe get_current_user ni require_role como dependencias FastAPI
  - El error handler RFC 7807 existe pero es incompleto (devuelve dict, no Pydantic, sin catch-all)

- **Frontend**: Estructura FSD completa (ch-003-frontend), stores Zustand placeholder mínimos:
  - authStore: solo `token: string | null` + `setToken`, sin persist
  - cartStore: solo `cartOpen: boolean` + `toggleCart`, sin items reales
  - No existen paymentStore ni uiStore

Este change construye la capa de infraestructura que todos los módulos funcionales (auth, productos, pedidos, pagos) van a usar.

---

## Goals / Non-Goals

**Goals:**
- BaseRepository[T] genérico con CRUD completo y filtrado automático de soft delete
- UnitOfWork async context manager con commit/rollback automático
- Dependencia `get_current_user`: extrae JWT, decodifica, retorna Usuario
- Dependencia `require_role(roles)`: factory que verifica roles y lanza 403
- Error handler RFC 7807 completo: catch-all, content-type header, serialización Pydantic
- authStore completo con persistencia en localStorage: token, user, roles, login/logout
- cartStore completo con persistencia: items, cantidades, personalización, totales
- paymentStore nuevo (transitorio, sin persist): checkoutStep, preferenceId, status
- uiStore nuevo con persistencia parcial (solo theme): sidebar, toasts

**Non-Goals:**
- NO implementar módulos funcionales (auth, productos, pedidos, pagos) — eso es para cambios futuros
- NO modificar modelos SQLModel existentes
- NO modificar la estructura FSD del frontend
- NO agregar nuevas dependencias externas

---

## Decisions

### DEC-001: BaseRepository como clase genérica con TypeVar

**Decisión**: Implementar `BaseRepository[T: SQLModel]` como clase abstracta genérica en `backend/core/repository.py`.

**Rationale**:
- TypeVar permite tipado fuerte sin perder flexibilidad
- Cada repositorio concreto hereda y agrega métodos específicos
- Filtrado automático de soft delete en get_by_id y list_all (por defecto)
- Métodos: get_by_id, list_all, count, create, update, soft_delete, hard_delete

**Alternativa considerada**: Funciones sueltas por entidad — descartado por duplicación de código.

### DEC-002: UnitOfWork como async context manager

**Decisión**: Implementar `UnitOfWork` en `backend/core/unit_of_work.py` usando `AsyncSession` de SQLAlchemy.

**Rationale**:
- `async with UnitOfWork() as uow:` es el patrón estándar en FastAPI asíncrono
- Expone repositorios como atributos (`uow.productos`, `uow.pedidos`)
- Commit automático al salir sin excepciones; rollback si hay error
- Los repositorios se registran via `register_repository(name, repo_class)`

**Flujo**:
```
async with UnitOfWork(db_session) as uow:
    usuario = await uow.usuarios.get_by_id(user_id)
    await uow.usuarios.update(user_id, {"nombre": "nuevo"})
# ← commit automático aquí si no hubo error
```

### DEC-003: Dependencias FastAPI en un solo archivo

**Decisión**: Agrupar `get_current_user` y `require_role` en `backend/core/dependencies.py`.

**Rationale**:
- Un solo archivo de dependencias es fácil de mantener y documentar
- `get_current_user` usa `Depends(oauth2_scheme)` de FastAPI + security.py existente
- `require_role` es una factory que retorna una función que FastAPI usa como dependencia
- Separación clara: security.py tiene las funciones criptográficas, dependencies.py tiene los inyectores

### DEC-004: Stores en features/ en lugar de shared/stores/

**Decisión**: Cada store vive en su feature correspondiente (`features/auth/store.ts`, `features/cart/store.ts`) y se crean los nuevos en `features/payment/store.ts` y `features/ui/store.ts`.

**Rationale**:
- Consistente con FSD: cada feature es autocontenida
- Los stores existentes ya están en features/ — refactorizar a shared/ rompería la arquitectura
- Los stores exportan hooks personalizados desde `features/*/hooks/`

### DEC-005: persist middleware con partialize

**Decisión**: Usar `persist` middleware de Zustand con `partialize` para controlar exactamente qué se persiste.

**Rationale**:
- authStore: persiste accessToken, refreshToken, user (no isLoading, no errores)
- cartStore: persiste items completo (todo el estado)
- paymentStore: sin persist (estado transitorio por sesión)
- uiStore: solo persiste theme (sidebarOpen y toasts son volátiles)
- Claves en localStorage con prefijo `food-store-*`

### DEC-006: Mejora del error handler RFC 7807 existente

**Decisión**: Reemplazar el handler actual en `main.py` que devuelve un dict por uno que use `ErrorResponse` de Pydantic y agregar catch-all.

**Rationale**:
- El modelo `ErrorResponse` ya está definido en `models/base.py` — solo hay que usarlo
- Content-Type: application/problem+json es requerido por RFC 7807
- Catch-all para Exception genéricas evita leaks de stack trace en producción

---

## Architecture Overview

### Backend — Nuevos archivos

```
backend/
├── core/
│   ├── repository.py      ← BaseRepository[T] genérico (NUEVO)
│   ├── unit_of_work.py    ← UnitOfWork context manager (NUEVO)
│   └── dependencies.py    ← get_current_user, require_role (NUEVO)
```

Modificaciones en archivos existentes:
- `backend/main.py` — reemplazar error handler por versión RFC 7807 completa

### Frontend — Archivos a crear/modificar

```
frontend/src/
├── features/
│   ├── auth/
│   │   └── store.ts       ← REWRITE: authStore completo con persist
│   ├── cart/
│   │   └── store.ts       ← REWRITE: cartStore completo con persist
│   ├── payment/
│   │   ├── store.ts       ← NUEVO: paymentStore
│   │   └── index.ts       ← NUEVO: barrel export
│   └── ui/
│       ├── store.ts       ← NUEVO: uiStore
│       └── index.ts       ← NUEVO: barrel export
```

---

## Componentes

### BaseRepository[T]

- **Responsabilidad**: Abstracción genérica de operaciones CRUD para cualquier modelo SQLModel
- **Location**: `backend/core/repository.py`
- **Interface**:
  - `get_by_id(id: int) -> T | None` — busca por PK, excluye soft delete
  - `list_all(skip: int, limit: int, filters: dict) -> list[T]` — listado paginado
  - `count(filters: dict) -> int` — total de registros
  - `create(obj: T) -> T` — crea registro, hace flush
  - `update(id: int, data: dict) -> T` — actualiza campos, hace flush
  - `soft_delete(id: int) -> None` — setea `eliminado_en` = ahora
  - `hard_delete(id: int) -> None` — elimina físicamente

### UnitOfWork

- **Responsabilidad**: Gestión de transacciones atómicas multi-entidad
- **Location**: `backend/core/unit_of_work.py`
- **Interface**:
  - `__aenter__`: crea sesión, inicializa repositorios registrados
  - `__aexit__`: commit si OK, rollback si excepción
  - `register(name, repo_class)`: registra un repositorio disponible como atributo
  - Acceso: `uow.nombre_del_repo.metodo()`

### get_current_user

- **Responsabilidad**: Extrae y valida JWT del header Authorization, retorna Usuario
- **Location**: `backend/core/dependencies.py`
- **Interface**: `async def get_current_user(token: str = Depends(oauth2_scheme)) -> Usuario`
- **Comportamiento**: HTTP 401 si token inválido/expirado, HTTP 401 si usuario no encontrado

### require_role

- **Responsabilidad**: Factory que retorna una dependencia que verifica roles
- **Location**: `backend/core/dependencies.py`
- **Interface**: `def require_role(roles: list[str]) -> Callable`
- **Uso**: `@router.get("/admin", dependencies=[Depends(require_role(["ADMIN"]))])`
- **Comportamiento**: HTTP 403 si el usuario no tiene ninguno de los roles requeridos

### authStore

- **Responsabilidad**: Gestiona estado de autenticación del cliente
- **Location**: `frontend/src/features/auth/store.ts`
- **State**: `{ accessToken, refreshToken, user: { id, nombre, email, roles }, isAuthenticated }`
- **Actions**: `login(tokens, user)`, `logout()`, `updateTokens(tokens)`
- **Selectors**: `isAuthenticated()`, `hasRole(role)`
- **Persist**: localStorage key `food-store-auth`, partialize excluye isLoading

### cartStore

- **Responsabilidad**: Gestiona carrito de compras del cliente (client-side only)
- **Location**: `frontend/src/features/cart/store.ts`
- **State**: `{ items: [{ productoId, nombre, precio, cantidad, imagen, personalizacion }] }`
- **Actions**: `addItem(...)`, `removeItem(productoId)`, `updateQuantity(productoId, cantidad)`, `clearCart()`
- **Selectors**: `totalItems()`, `totalPrice()`, `getItem(productoId)`
- **Persist**: localStorage key `food-store-cart`

### paymentStore

- **Responsabilidad**: Gestiona estado transitorio del proceso de pago
- **Location**: `frontend/src/features/payment/store.ts`
- **State**: `{ checkoutStep, preferenceId, paymentStatus, error }`
- **Actions**: `startCheckout(pedidoId)`, `setPreference(preferenceId)`, `updatePaymentStatus(status)`, `resetPayment()`
- **Persist**: No (estado transitorio)

### uiStore

- **Responsabilidad**: Gestiona preferencias de interfaz de usuario
- **Location**: `frontend/src/features/ui/store.ts`
- **State**: `{ theme: 'light' | 'dark', sidebarOpen: boolean, toasts: Toast[] }`
- **Actions**: `toggleTheme()`, `toggleSidebar()`, `addToast(toast)`, `removeToast(id)`
- **Persist**: Solo theme (localStorage key `food-store-ui`)

---

## Data Model

No se crean ni modifican tablas de base de datos en este change.

Los stores de Zustand definen sus tipos localmente:

```typescript
// authStore
interface User {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
}

// cartStore
interface CartItem {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  personalizacion: number[];  // IDs de ingredientes a excluir
}

// uiStore
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
```

---

## Implementation Notes

### Orden de implementación

1. **BaseRepository** — no tiene dependencias de otros componentes
2. **UnitOfWork** — depende de BaseRepository (lo usa internamente)
3. **Error handler** — independiente, mejora código existente
4. **get_current_user + require_role** — depende de security.py (ya existe)
5. **authStore** — replace del placeholder existente
6. **cartStore** — replace del placeholder existente
7. **paymentStore + uiStore** — nuevos, sin dependencias de otros stores

### UnitOfWork — registro de repositorios

Los repositorios se registran en el UoW mediante un decorador o registro explícito:

```python
class UnitOfWork:
    def __init__(self, session_factory):
        self._session_factory = session_factory
        self._repos: dict[str, type] = {}

    def register(self, name: str, repo_class: type[BaseRepository]):
        self._repos[name] = repo_class
```

Cada change futuro que agregue un módulo registrará su repositorio en el UoW.

### get_current_user — integración con security.py

`security.py` ya tiene `create_access_token`, `verify_token`, `hash_password`, `verify_password`. `get_current_user` usará `verify_token` para decodificar el JWT y luego buscará el usuario en BD por el `sub` (user_id) del token.

### RFC 7807 — cambios necesarios en main.py

El handler actual:
```python
@app.exception_handler(APIError)
async def api_error_handler(request, exc):
    return {
        "type": f"https://example.com/errors/{exc.error_code.lower()}",
        ...
    }
```

Debe reemplazarse por:
```python
@app.exception_handler(APIError)
async def api_error_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            title=...,
            status=exc.status_code,
            detail=exc.message,
            ...
        ).model_dump(),
        headers={"Content-Type": "application/problem+json"}
    )
```

Y agregar catch-all para Exception genéricas que oculte stack trace.

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| UnitOfWork registra repos manualmente (no automático) | Aceptable: cada módulo registra su repositorio al inicializarse. Es explícito y fácil de debuguear |
| Los stores actuales (auth, cart) serán reemplazados | Bajo riesgo: los stores actuales son placeholders mínimos sin funcionalidad real. No hay datos de usuario que perder |
| El error handler catch-all podría ocultar errores en desarrollo | El catch-all solo aplica en producción (por env var). En desarrollo se mantiene el stack trace completo |
| `partialize` mal configurado podría persistir datos sensibles | Solo se persisten campos explícitamente listados en cada store. Access token en localStorage es un riesgo aceptado (estándar en SPA) |
