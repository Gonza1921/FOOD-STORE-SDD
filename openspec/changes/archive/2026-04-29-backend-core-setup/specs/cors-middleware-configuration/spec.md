## ADDED Requirements

### Requirement: CORS middleware configuration
The system SHALL implement CORS (Cross-Origin Resource Sharing) middleware that allows requests from configured origins. Default CORS_ORIGINS MUST include `http://localhost:5173` for frontend development. CORS configuration MUST be independent of other middleware and allow preflight requests.

#### Scenario: CORS allows requests from permitted origin
- **WHEN** a browser requests from `http://localhost:5173` with an Origin header
- **THEN** the response includes CORS headers allowing the request

#### Scenario: CORS rejects requests from unpermitted origin
- **WHEN** a browser requests from an origin not in CORS_ORIGINS
- **THEN** the response does not include CORS headers (browser blocks the request)

#### Scenario: CORS allows preflight requests
- **WHEN** a browser sends an OPTIONS preflight request from a permitted origin
- **THEN** the application responds with 200 and appropriate CORS headers

#### Scenario: CORS configuration is loaded from environment
- **WHEN** the application starts with CORS_ORIGINS environment variable set to `http://localhost:5173,https://example.com`
- **THEN** both origins are permitted

### Requirement: CORS credentials support
The system SHALL support credentials (cookies, authentication headers) in CORS requests when configured to do so. Credentials support MUST be configurable per origin.

#### Scenario: Credentials are sent in CORS requests
- **WHEN** a request includes credentials and the origin permits it
- **THEN** the response includes the Access-Control-Allow-Credentials header
