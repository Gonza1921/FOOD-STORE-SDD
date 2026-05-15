## ADDED Requirements

### Requirement: User can view own profile
The system SHALL allow authenticated users to view their personal profile data.

#### Scenario: View own profile successfully
- **WHEN** the user sends a GET request to `/api/v1/usuarios/perfil` with a valid JWT
- **THEN** the response SHALL return HTTP 200 with the user's: nombre, apellido, email, telefono, fecha de registro (creado_en)

#### Scenario: Unauthenticated user cannot view profile
- **WHEN** a request without JWT is sent to GET `/api/v1/usuarios/perfil`
- **THEN** the response SHALL be HTTP 401 Unauthorized

### Requirement: User can edit own profile
The system SHALL allow authenticated users to update their nombre, apellido, and telefono.

#### Scenario: Edit profile successfully
- **WHEN** the user sends a PUT request to `/api/v1/usuarios/perfil` with valid `nombre`, `apellido`, and/or `telefono`
- **THEN** the response SHALL return HTTP 200 with the updated user data

#### Scenario: Email cannot be changed
- **WHEN** the user sends a PUT request to `/api/v1/usuarios/perfil` attempting to change `email`
- **THEN** the system SHALL ignore the email field (no actualiza)

#### Scenario: Invalid phone format
- **WHEN** the user sends a PUT request with an invalid `telefono` format
- **THEN** the system SHALL return HTTP 422 with validation error

### Requirement: User can change password
The system SHALL allow authenticated users to change their password by providing the current password and a new password.

#### Scenario: Change password successfully
- **WHEN** the user sends POST to `/api/v1/usuarios/perfil/cambiar-contrasena` with valid `contrasena_actual` and `nueva_contrasena` (min 8 chars)
- **THEN** the system SHALL update the password hash
- **AND** invalidate ALL existing refresh tokens for that user
- **AND** return HTTP 200 with success message

#### Scenario: Wrong current password
- **WHEN** the user sends POST to `/api/v1/usuarios/perfil/cambiar-contrasena` with incorrect `contrasena_actual`
- **THEN** the system SHALL return HTTP 400 with error "Contraseña actual incorrecta"

#### Scenario: New password too short
- **WHEN** the user sends POST to `/api/v1/usuarios/perfil/cambiar-contrasena` with `nueva_contrasena` shorter than 8 characters
- **THEN** the system SHALL return HTTP 422 with validation error
