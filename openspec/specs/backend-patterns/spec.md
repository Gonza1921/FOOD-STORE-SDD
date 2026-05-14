# Spec: CH-004 — Backend Patterns & Frontend Stores

## Overview

Este spec cubre dos capacidades: (1) patrones de infraestructura del backend necesarios para todos los módulos funcionales, y (2) stores de estado del cliente en el frontend con persistencia.

---

## ADDED Requirements

### Capability: Backend Infrastructure Patterns

#### Requirement: BaseRepository[T] generic CRUD

The system SHALL provide a generic `BaseRepository[T]` class parameterized with a SQLModel type that implements standard CRUD operations.

**Scenarios:**

##### Scenario: Get by ID returns entity
- **WHEN** calling `get_by_id(id)` with an existing ID
- **THEN** it SHALL return the entity
- **AND** it SHALL exclude entities where `eliminado_en IS NOT NULL`

##### Scenario: Get by ID returns None for non-existent
- **WHEN** calling `get_by_id(id)` with a non-existent ID
- **THEN** it SHALL return `None`

##### Scenario: List all with pagination
- **WHEN** calling `list_all(skip=S, limit=L)`
- **THEN** it SHALL return at most L entities starting from offset S
- **AND** it SHALL exclude soft-deleted entities by default

##### Scenario: Count returns total
- **WHEN** calling `count(filters)` with optional filters
- **THEN** it SHALL return the total number of matching entities

##### Scenario: Create persists entity
- **WHEN** calling `create(obj)` with a valid entity
- **THEN** the entity SHALL be added to the session
- **AND** a flush SHALL be executed to obtain the generated ID

##### Scenario: Update modifies fields
- **WHEN** calling `update(id, data)` with valid fields
- **THEN** the entity SHALL be updated with the provided data
- **AND** a flush SHALL be executed

##### Scenario: Soft delete sets timestamp
- **WHEN** calling `soft_delete(id)`
- **THEN** the entity's `eliminado_en` SHALL be set to current timestamp

##### Scenario: Hard delete removes record
- **WHEN** calling `hard_delete(id)`
- **THEN** the entity SHALL be permanently removed from the database

#### Requirement: UnitOfWork atomic transactions

The system SHALL provide a `UnitOfWork` async context manager that guarantees atomic multi-entity transactions.

**Scenarios:**

##### Scenario: Commit on success
- **WHEN** all operations inside `async with UnitOfWork() as uow:` complete without error
- **THEN** the transaction SHALL be committed automatically

##### Scenario: Rollback on exception
- **WHEN** any operation inside `async with UnitOfWork() as uow:` raises an exception
- **THEN** the transaction SHALL be rolled back automatically
- **AND** the exception SHALL propagate to the caller

##### Scenario: Repository access via attribute
- **WHEN** a repository is registered as `uow.register("productos", ProductoRepository)`
- **THEN** it SHALL be accessible as `uow.productos`
- **AND** it SHALL use the UoW's session

#### Requirement: get_current_user dependency

The system SHALL provide a FastAPI dependency `get_current_user` that extracts the JWT from the Authorization header, validates it, and returns the authenticated user.

**Scenarios:**

##### Scenario: Valid token returns user
- **WHEN** a request includes a valid JWT in `Authorization: Bearer <token>`
- **THEN** the dependency SHALL decode the token
- **AND** SHALL return the corresponding `Usuario` from the database

##### Scenario: Invalid token returns 401
- **WHEN** a request includes an expired or malformed JWT
- **THEN** the dependency SHALL raise HTTP 401 Unauthorized

##### Scenario: Missing token returns 401
- **WHEN** a request has no Authorization header
- **THEN** the dependency SHALL raise HTTP 401 Unauthorized

#### Requirement: require_role dependency factory

The system SHALL provide a `require_role(roles: list[str])` factory that returns a FastAPI dependency which verifies the authenticated user has at least one of the specified roles.

**Scenarios:**

##### Scenario: User has required role
- **WHEN** a user with role ADMIN accesses an endpoint with `require_role(["ADMIN"])`
- **THEN** the dependency SHALL pass without error

##### Scenario: User lacks required role
- **WHEN** a user with role CLIENT accesses an endpoint with `require_role(["ADMIN"])`
- **THEN** the dependency SHALL raise HTTP 403 Forbidden

##### Scenario: Multi-role OR logic
- **WHEN** a user with role STOCK accesses an endpoint with `require_role(["ADMIN", "STOCK"])`
- **THEN** the dependency SHALL pass without error

#### Requirement: RFC 7807 error handling

The system SHALL provide complete RFC 7807 Problem Details error responses for all HTTP errors.

**Scenarios:**

##### Scenario: APIError returns RFC 7807 format
- **WHEN** an `APIError` is raised in any endpoint
- **THEN** the response SHALL have `Content-Type: application/problem+json`
- **AND** the body SHALL contain valid `ErrorResponse` fields: `type`, `title`, `status`, `detail`, `error_code`, `timestamp`

##### Scenario: Catch-all for unhandled exceptions
- **WHEN** an unhandled exception occurs (e.g., `ValueError`, `KeyError`)
- **THEN** the response SHALL be HTTP 500 with RFC 7807 format
- **AND** the response SHALL NOT expose internal stack traces

### Capability: Frontend Zustand Stores

#### Requirement: authStore

The system SHALL provide an `authStore` (Zustand) with authentication state, actions, and localStorage persistence.

**Scenarios:**

##### Scenario: Login stores tokens and user
- **WHEN** `login(tokens, user)` is called
- **THEN** `accessToken`, `refreshToken`, and `user` SHALL be set
- **AND** `isAuthenticated` SHALL return `true`

##### Scenario: Logout clears auth state
- **WHEN** `logout()` is called
- **THEN** `accessToken` and `refreshToken` SHALL be cleared
- **AND** `user` SHALL be set to null
- **AND** `isAuthenticated` SHALL return `false`

##### Scenario: State persists in localStorage
- **WHEN** the page is refreshed
- **THEN** the auth store SHALL hydrate from localStorage
- **AND** `isAuthenticated` SHALL reflect the persisted state

##### Scenario: hasRole selector
- **WHEN** `hasRole("ADMIN")` is called
- **THEN** it SHALL return `true` if the user's roles include "ADMIN"
- **AND** SHALL return `false` otherwise

#### Requirement: cartStore

The system SHALL provide a `cartStore` (Zustand) with shopping cart state, actions, and localStorage persistence.

**Scenarios:**

##### Scenario: Add item to cart
- **WHEN** `addItem(productoId, nombre, precio, cantidad, imagen, personalizacion)` is called
- **THEN** the item SHALL be added to the items array
- **AND** if the item already exists, the quantity SHALL be incremented (not duplicated)

##### Scenario: Remove item from cart
- **WHEN** `removeItem(productoId)` is called
- **THEN** the item SHALL be removed from the items array
- **AND** `totalItems()` SHALL reflect the removal

##### Scenario: Update quantity
- **WHEN** `updateQuantity(productoId, cantidad)` is called with a valid quantity >= 1
- **THEN** the item's quantity SHALL be updated
- **AND** `totalPrice()` SHALL recalculate

##### Scenario: Clear cart
- **WHEN** `clearCart()` is called
- **THEN** all items SHALL be removed
- **AND** `totalItems()` SHALL return 0

##### Scenario: Cart persists across sessions
- **WHEN** the browser is closed and reopened
- **THEN** the cart SHALL restore from localStorage
- **AND** all items SHALL be available

#### Requirement: paymentStore

The system SHALL provide a `paymentStore` (Zustand) with transient payment flow state.

**Scenarios:**

##### Scenario: Start checkout sets step
- **WHEN** `startCheckout(pedidoId)` is called
- **THEN** `checkoutStep` SHALL be set to a non-initial value
- **AND** the state SHALL NOT be persisted to localStorage

##### Scenario: Reset payment clears state
- **WHEN** `resetPayment()` is called
- **THEN** all payment state fields SHALL return to defaults

#### Requirement: uiStore

The system SHALL provide a `uiStore` (Zustand) with UI preference state and partial persistence.

**Scenarios:**

##### Scenario: Theme toggles
- **WHEN** `toggleTheme()` is called
- **THEN** `theme` SHALL switch between 'light' and 'dark'
- **AND** the theme preference SHALL persist in localStorage

##### Scenario: Sidebar toggles
- **WHEN** `toggleSidebar()` is called
- **THEN** `sidebarOpen` SHALL be toggled
- **AND** sidebar state SHALL NOT be persisted

##### Scenario: Toast management
- **WHEN** `addToast(toast)` is called
- **THEN** the toast SHALL be added to the toasts array
- **WHEN** `removeToast(id)` is called
- **THEN** the toast SHALL be removed
- **AND** toasts SHALL NOT be persisted
