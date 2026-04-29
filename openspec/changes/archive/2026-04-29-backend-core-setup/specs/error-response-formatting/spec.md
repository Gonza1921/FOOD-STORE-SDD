## ADDED Requirements

### Requirement: RFC 7807 error response format
The system SHALL format all error responses according to RFC 7807 Problem Details format. Each error response MUST include: type (error category), title (human-readable title), status (HTTP status code), detail (error message), and instance (request path). Responses MUST use application/problem+json content type.

#### Scenario: Validation error returns RFC 7807 format
- **WHEN** a request fails validation (e.g., invalid request body)
- **THEN** the response returns 422 with RFC 7807 format: `{"type": "validation_error", "title": "Validation Error", "status": 422, "detail": "...", "instance": "/api/users"}`

#### Scenario: Not found error returns RFC 7807 format
- **WHEN** a request refers to a non-existent resource
- **THEN** the response returns 404 with RFC 7807 format: `{"type": "not_found", "title": "Not Found", "status": 404, "detail": "...", "instance": "/api/users/999"}`

#### Scenario: Server error returns RFC 7807 format
- **WHEN** an unhandled exception occurs in a route
- **THEN** the response returns 500 with RFC 7807 format: `{"type": "server_error", "title": "Internal Server Error", "status": 500, "detail": "An unexpected error occurred", "instance": "/api/..."}`

### Requirement: Custom exception handling
The system SHALL provide a global exception handler that converts all exceptions to RFC 7807 format. Custom exceptions MUST be mapped to appropriate HTTP status codes and error types.

#### Scenario: Custom exception is converted to RFC 7807
- **WHEN** a route raises a custom exception (e.g., APIError, ResourceNotFoundError)
- **THEN** the exception handler converts it to RFC 7807 format with appropriate status code

#### Scenario: Unhandled exception is caught and formatted
- **WHEN** a route raises an unhandled exception
- **THEN** the global exception handler catches it and returns RFC 7807 format with 500 status
