# Proposal — ch-004-backend-patterns

## What Changes

Implementa los patrones base de infraestructura del backend (BaseRepository[T] genérico, UnitOfWork, dependencias FastAPI de autenticación y roles) y los stores de estado del cliente en el frontend (authStore, cartStore, paymentStore, uiStore con persistencia).

---

## Why

FOOD-STORE necesita una base sólida y consistente sobre la cual construir todos los módulos funcionales:

- **Backend**: Sin BaseRepository, cada módulo repetiría CRUD. Sin UnitOfWork, las transacciones multi-tabla (crear pedido, procesar pago) no serían atómicas. Sin `get_current_user` y `require_role`, no hay autenticación ni autorización real.
- **Frontend**: Los stores actuales son placeholders mínimos sin persistencia. Necesitamos stores completos con persistencia en localStorage para que el carrito, la auth y las preferencias sobrevivan a recargas y cierres de sesión.

---

## Objetivo

Establecer los patrones arquitectónicos fundamentales que usarán todos los módulos del sistema: capa de acceso a datos genérica, transacciones atómicas, autenticación JWT, autorización RBAC, y stores del cliente robustos.

---

## Alcance

Este change incluirá:

### Backend (US-000d)
- `BaseRepository[T]` genérico: get_by_id, list_all, count, create, update, soft_delete, hard_delete
- `UnitOfWork` como context manager async con commit/rollback automático
- Dependencia `get_current_user`: extrae JWT del header, decodifica, retorna usuario
- Dependencia `require_role(roles)`: verifica roles del usuario, lanza 403
- Mejora del error handler RFC 7807: catch-all para excepciones no manejadas, content-type header

### Frontend (US-000e)
- `authStore`: accessToken, refreshToken, user, isAuthenticated, login/logout/updateTokens, persist
- `cartStore`: items con productoId, cantidad, personalización, addItem/removeItem/updateQuantity/clearCart, persist
- `paymentStore`: checkoutStep, preferenceId, paymentStatus, sin persist (transitorio)
- `uiStore`: theme, sidebarOpen, toasts, persist selectivo solo para theme

---

## Historias de Usuario Relacionadas

- **US-000d**: Implementación de patrones base (BaseRepository, Unit of Work, dependencias FastAPI)
- **US-000e**: Configuración de los stores de Zustand (authStore, cartStore, paymentStore, uiStore)

---

## Dependencias

- ✅ **ch-002-database** (necesita SessionLocal y modelos SQLModel)
- ✅ **ch-003-frontend** (necesita estructura FSD y dependencias instaladas)

Ambas completadas.

---

## Riesgos

- Bajo: los stores actuales del frontend (auth, cart, products) necesitan ser reemplazados o refactorizados
- Medio: UnitOfWork requiere coordinación con el session management existente en `database.py`

---

## Complejidad Estimada

Media (3 puntos). Principalmente código nuevo con interfaces bien definidas.
