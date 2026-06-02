# Specification: RBAC Cocinero Setup

## ADDED Requirements

### Requirement: COCINA role exists in database
The system SHALL maintain a `Rol` record with semantic key `codigo = 'COCINA'` representing the kitchen chef actor. This role SHALL be created idempotently by Alembic migration and SHALL persist across database upgrades.

#### Scenario: COCINA role created successfully
- **WHEN** Alembic migration `add_cocina_role` is executed
- **THEN** table `Rol` contains row with `codigo='COCINA'`, `nombre='Cocinero'`, `descripcion` containing kitchen responsibilities
- **AND** running migration again produces no errors (idempotent)

#### Scenario: COCINA role persists across restarts
- **WHEN** application restarts after migration
- **THEN** SELECT * FROM rol WHERE codigo='COCINA' returns exactly 1 row
- **AND** role is available for assignment to users

### Requirement: Cocinero user created in seed with correct role assignment
The system SHALL seed a development user `cocina@foodstore.com` with password `Test123456!` (development only) and assign it the `COCINA` role via `usuario_rol` M:M table.

#### Scenario: Seed user created with COCINA role
- **WHEN** Alembic migration `add_cocina_role` upgrade is executed
- **THEN** table `usuario` contains row with `email='cocina@foodstore.com'`, `nombre='Cocinero'`, `activo=true`
- **AND** table `usuario_rol` contains M:M record linking user to `COCINA` role
- **AND** user password is hashed using bcrypt (not plaintext)

#### Scenario: Seed is idempotent
- **WHEN** migration is executed twice on same database
- **THEN** second execution completes without errors
- **AND** user count remains 1 (no duplicate created)
- **AND** usuario_rol records remain 1 (no duplicate role assignment)

### Requirement: JWT token for COCINA user includes role in payload
The system SHALL generate JWT access tokens for `cocina@foodstore.com` user with `roles` claim as array containing `"COCINA"`.

#### Scenario: Login with COCINA user returns valid token
- **WHEN** POST /api/v1/auth/login with `email='cocina@foodstore.com'`, `password='Test123456!'`
- **THEN** response is 200 with `{ access_token, refresh_token, token_type: 'bearer' }`
- **AND** decoded `access_token` JWT payload contains `roles: ["COCINA"]`
- **AND** `sub` claim equals `cocina@foodstore.com`

#### Scenario: Middleware can validate COCINA role
- **WHEN** authenticated request includes token with `roles: ["COCINA"]`
- **AND** endpoint decorated with `@require_role("COCINA")`
- **THEN** middleware allows request to proceed
- **AND** removing `COCINA` from `roles` array → middleware returns 403 Forbidden

### Requirement: COCINA role has appropriate RBAC permissions
The system SHALL define RBAC permissions for `COCINA` role limiting actions to kitchen preparation operations only. Cocinero SHALL read pedidos, transition within EN_PREPARACIÓN phase, but SHALL NOT create, cancel, or approve payments.

#### Scenario: COCINA role permits reading pedidos
- **WHEN** authenticated as COCINA user making GET /api/v1/pedidos
- **THEN** response is 200 with list of pedidos visible to all roles
- **AND** response includes only CONFIRMADO, EN_PREPARACIÓN, EN_CAMINO, ENTREGADO pedidos (not PENDIENTE/CANCELADO by filtering logic, if applied)

#### Scenario: COCINA role permits state transitions only within PREPARACIÓN
- **WHEN** authenticated as COCINA user making POST /api/v1/pedidos/{id}/transicion with `new_state='EN_PREPARACIÓN'` (from CONFIRMADO)
- **THEN** response is 200 with pedido state changed to EN_PREPARACIÓN
- **AND** HistorialEstadoPedido records the transition by user with role COCINA
- **AND** WHEN making same request with `new_state='CANCELADO'` → 403 Forbidden (outside PREPARACIÓN phase)

#### Scenario: COCINA role cannot create pedidos
- **WHEN** authenticated as COCINA user making POST /api/v1/pedidos with order data
- **THEN** response is 403 Forbidden
- **AND** error message indicates insufficient permissions

### Requirement: Migration is backward compatible and reversible
The system SHALL ensure Alembic migration can be downgraded cleanly, removing COCINA role and user without orphaned records.

#### Scenario: Migration can be reversed
- **WHEN** `alembic downgrade -1` executed after upgrade
- **THEN** `Rol` table no longer contains `codigo='COCINA'`
- **AND** `usuario` table no longer contains `email='cocina@foodstore.com'`
- **AND** `usuario_rol` contains no references to deleted user
- **AND** downgrade succeeds without constraint violations

#### Scenario: Database state is identical before and after downgrade
- **WHEN** migration upgraded then downgraded
- **THEN** SELECT COUNT(*) FROM rol equals same as before migration (except COCINA added/removed)
- **AND** no orphaned foreign key records exist

