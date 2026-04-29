## Why

The FOOD-STORE e-commerce platform needs a robust, production-ready backend foundation to support all subsequent features (authentication, database management, API endpoints). FastAPI with SQLModel and PostgreSQL provides type-safe, async-capable development with automatic API documentation. Establishing core configuration, security utilities, middleware, and database setup now prevents technical debt and ensures consistent patterns across the entire backend.

## What Changes

- Install FastAPI, SQLModel, Uvicorn, Pydantic, PostgreSQL driver, and supporting dependencies into a `requirements.txt`
- Create `main.py` with FastAPI application initialized
- Implement middleware stack: CORS (localhost:5173 frontend support), rate limiting, RFC 7807 error response formatting, and request/response logging
- Create `core/` module with three foundational components:
  - `core/config.py`: Centralized environment variables (DATABASE_URL, SECRET_KEY, JWT expiration, CORS origins, etc.)
  - `core/security.py`: JWT utilities for token creation and validation
  - `core/database.py`: SQLAlchemy async session setup and database utilities
- Add basic `/health` check endpoint for deployment verification
- Ensure FastAPI auto-documentation endpoints (`/docs`, `/redoc`) are accessible

## Capabilities

### New Capabilities
- `fastapi-app-initialization`: FastAPI application setup with middleware stack, error handling, and automatic OpenAPI documentation
- `core-configuration-module`: Centralized environment and application configuration through `core/config.py`
- `jwt-security-utilities`: JWT token generation and validation functions for future authentication features
- `database-connection-setup`: Async SQLAlchemy session management and database connection pool initialization
- `cors-middleware-configuration`: Cross-origin resource sharing configuration to support frontend development
- `error-response-formatting`: RFC 7807 problem detail response format for standardized error handling
- `health-check-endpoint`: Basic health check endpoint for monitoring and deployment verification

### Modified Capabilities
<!-- No existing capabilities are being modified at the spec level -->

## Impact

- **Dependencies**: Adds FastAPI, SQLModel, Uvicorn, Pydantic, psycopg2-async, python-jose[cryptography], python-multipart, and related utilities
- **Backend Structure**: Establishes the root directory structure (backend/, core/, models/, services/, routers/, tests/)
- **Environment**: Requires `.env` file with DATABASE_URL, SECRET_KEY, and other configuration variables
- **Port**: Backend runs on `localhost:8000` by default (configurable via environment)
- **Frontend Integration**: CORS configuration must match frontend development URL (`http://localhost:5173`)
- **Future Features**: Unblocks CH-002 (database migrations), CH-003 (user authentication), and all subsequent backend changes
