## ADDED Requirements

### Requirement: Health check endpoint
The system SHALL provide a GET endpoint at `/health` that returns the health status of the application. Health check MUST include: status (ok/degraded/error), timestamp of the check, and database connectivity status. Response MUST return HTTP 200 if application is healthy, 503 if degraded or error.

#### Scenario: Health check returns healthy status
- **WHEN** a GET request is sent to `/health` with database connected
- **THEN** the response returns 200 with `{"status": "ok", "timestamp": "2026-04-28T...", "database": "connected"}`

#### Scenario: Health check detects database unavailable
- **WHEN** a GET request is sent to `/health` with database disconnected
- **THEN** the response returns 503 with `{"status": "error", "timestamp": "2026-04-28T...", "database": "disconnected"}`

#### Scenario: Health check includes timestamp
- **WHEN** a GET request is sent to `/health`
- **THEN** the response includes a valid ISO 8601 timestamp

### Requirement: Health check documentation
The system SHALL include the `/health` endpoint in OpenAPI documentation. Documentation MUST show the endpoint signature, response format, and possible status codes.

#### Scenario: Health endpoint appears in OpenAPI docs
- **WHEN** a user views `http://localhost:8000/docs`
- **THEN** the `/health` endpoint is listed and documented with response schema
