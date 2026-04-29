## ADDED Requirements

### Requirement: FastAPI application initialization
The system SHALL initialize a FastAPI application that listens on the configured port and provides automatic OpenAPI and ReDoc documentation endpoints. The application MUST load configuration from environment variables and initialize all required middleware.

#### Scenario: Application starts successfully
- **WHEN** the application starts via `uvicorn backend.main:app --reload`
- **THEN** the application listens on port 8000 and responds to GET `/` with HTTP 200

#### Scenario: OpenAPI documentation is accessible
- **WHEN** a user navigates to `http://localhost:8000/docs`
- **THEN** the browser displays interactive OpenAPI documentation with all endpoints

#### Scenario: ReDoc documentation is accessible
- **WHEN** a user navigates to `http://localhost:8000/redoc`
- **THEN** the browser displays ReDoc documentation with all endpoints

### Requirement: Middleware stack initialization
The system SHALL initialize a middleware stack in the correct order: CORS → Rate Limiting → Request Logging → Error Formatting. Each middleware MUST be independently configurable.

#### Scenario: Middleware processes requests in order
- **WHEN** a request arrives at the application
- **THEN** middleware processes it in order (CORS first, error formatting last)

#### Scenario: Middleware can be disabled via configuration
- **WHEN** a middleware is disabled in configuration
- **THEN** requests skip that middleware without error
