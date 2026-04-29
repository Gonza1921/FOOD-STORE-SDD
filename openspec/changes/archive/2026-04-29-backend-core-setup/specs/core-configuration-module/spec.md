## ADDED Requirements

### Requirement: Environment variable management
The system SHALL load all configuration from environment variables using Pydantic Settings with type validation. Required variables include DATABASE_URL, SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRE_MINUTES, CORS_ORIGINS, and ENVIRONMENT. Invalid values MUST raise validation errors on startup.

#### Scenario: Configuration loads from .env file
- **WHEN** the application starts with a valid `.env` file
- **THEN** all environment variables are loaded without error

#### Scenario: Configuration validates SECRET_KEY length
- **WHEN** the application starts with SECRET_KEY shorter than 32 characters
- **THEN** the application raises a validation error and exits

#### Scenario: Configuration validates DATABASE_URL format
- **WHEN** the application starts with an invalid DATABASE_URL (not a valid PostgreSQL URL)
- **THEN** the application raises a validation error and exits

#### Scenario: Configuration provides defaults for optional values
- **WHEN** optional environment variables are not set
- **THEN** the application uses sensible defaults (e.g., ENVIRONMENT="development")

### Requirement: Configuration access throughout application
The system SHALL provide a singleton configuration instance that is accessible throughout the application via dependency injection. Configuration MUST be immutable at runtime.

#### Scenario: Configuration is accessible as a dependency
- **WHEN** a route or service requests the configuration
- **THEN** it receives the configuration instance without error

#### Scenario: Configuration changes are prevented
- **WHEN** code attempts to modify a configuration value at runtime
- **THEN** the configuration remains unchanged (immutable)
