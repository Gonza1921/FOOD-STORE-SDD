## 1. Project Structure Setup

- [ ] 1.1 Create `backend/` directory with `__init__.py`
- [ ] 1.2 Create `backend/core/` directory with `__init__.py`
- [ ] 1.3 Create `backend/models/` directory with `__init__.py` and `base.py`
- [ ] 1.4 Create `backend/services/` directory with `__init__.py`
- [ ] 1.5 Create `backend/routers/` directory with `__init__.py`
- [ ] 1.6 Create `backend/middleware/` directory with `__init__.py`
- [ ] 1.7 Create `backend/tests/` directory with `__init__.py` and `conftest.py`
- [ ] 1.8 Create `backend/.env.example` template file with all required environment variable names

## 2. Dependencies and Requirements

- [ ] 2.1 Create `backend/requirements.txt` with FastAPI, Uvicorn, Pydantic, SQLModel, psycopg[binary], python-jose[cryptography], python-multipart, python-dotenv, slowapi (rate limiting)
- [ ] 2.2 Verify all dependencies are pinned to specific versions
- [ ] 2.3 Document minimum Python version requirement (3.10+)

## 3. Core Configuration Module

- [ ] 3.1 Create `backend/core/config.py` with Pydantic BaseSettings class
- [ ] 3.2 Define environment variables: `DATABASE_URL`, `SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS`, `ENVIRONMENT` (dev/prod)
- [ ] 3.3 Add validation for `DATABASE_URL` format (PostgreSQL URL required)
- [ ] 3.4 Add validation for `SECRET_KEY` length (minimum 32 characters)
- [ ] 3.5 Create `backend/core/__init__.py` to export the config instance

## 4. Security Module

- [ ] 4.1 Create `backend/core/security.py` with JWT utilities
- [ ] 4.2 Implement `create_access_token(data: dict, expires_delta: Optional[timedelta] = None)` function
- [ ] 4.3 Implement `verify_token(token: str)` function that decodes and validates JWT
- [ ] 4.4 Implement `get_password_hash(password: str)` function (bcrypt)
- [ ] 4.5 Implement `verify_password(plain_password: str, hashed_password: str)` function

## 5. Database Module

- [ ] 5.1 Create `backend/core/database.py` with SQLAlchemy async session management
- [ ] 5.2 Set up `AsyncSession` engine with connection pooling (pool_size=10, max_overflow=20)
- [ ] 5.3 Create `get_session()` async context manager for dependency injection
- [ ] 5.4 Implement database health check function
- [ ] 5.5 Add `SQLModel.metadata.create_all()` placeholder for future migrations

## 6. Exception Handling

- [ ] 6.1 Create `backend/core/exceptions.py` with custom exception classes
- [ ] 6.2 Implement `APIError` base exception class
- [ ] 6.3 Implement RFC 7807-compliant error response model in `backend/models/base.py`
- [ ] 6.4 Create global exception handler middleware that converts exceptions to RFC 7807 format

## 7. Main Application Setup

- [ ] 7.1 Create `backend/main.py` with FastAPI app initialization
- [ ] 7.2 Add CORS middleware configuration allowing `http://localhost:5173` (and configurable via `CORS_ORIGINS`)
- [ ] 7.3 Add rate limiting middleware using slowapi (e.g., 100 requests per minute globally)
- [ ] 7.4 Add request/response logging middleware (log method, path, status code, response time)
- [ ] 7.5 Add global exception handler middleware for RFC 7807 error formatting
- [ ] 7.6 Configure FastAPI title, description, and version in app metadata

## 8. Health Check Endpoint

- [ ] 8.1 Create `backend/routers/health.py` with `/health` GET endpoint
- [ ] 8.2 Implement health endpoint to return `{"status": "ok", "timestamp": "2026-04-28T..."}` JSON response
- [ ] 8.3 Include database connection check in health endpoint (attempt light query)
- [ ] 8.4 Register health router in `main.py`

## 9. Environment and Testing

- [ ] 9.1 Create `.env` file in `backend/` directory with default values (use `.env.example` as template)
- [ ] 9.2 Create basic test file `backend/tests/test_health.py` to verify `/health` endpoint
- [ ] 9.3 Create `backend/tests/test_config.py` to verify configuration loading from environment

## 10. Local Verification

- [ ] 10.1 Install dependencies: `pip install -r backend/requirements.txt`
- [ ] 10.2 Start the app: `uvicorn backend.main:app --reload --port 8000`
- [ ] 10.3 Verify app starts without errors and listens on port 8000
- [ ] 10.4 Verify OpenAPI documentation accessible at `http://localhost:8000/docs`
- [ ] 10.5 Verify ReDoc documentation accessible at `http://localhost:8000/redoc`
- [ ] 10.6 Verify health check endpoint responds: `GET http://localhost:8000/health` returns 200 with status "ok"
- [ ] 10.7 Verify CORS headers are present in response for requests from `http://localhost:5173`

## 11. Documentation and Commits

- [ ] 11.1 Create `backend/README.md` documenting setup, environment variables, and how to run locally
- [ ] 11.2 Stage all changes: `git add backend/ openspec/changes/backend-core-setup/`
- [ ] 11.3 Create conventional commit: `git commit -m "feat(backend): initialize FastAPI app with core configuration and middleware"`
- [ ] 11.4 Verify commit includes all expected files (no `.env` file committed, only `.env.example`)
- [ ] 11.5 Push to feature branch (if using git flow): `git push origin feature/CH-001-backend-core-setup`
