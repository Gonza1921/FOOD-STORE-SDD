## Context

The FOOD-STORE backend needs a foundation that is production-ready, type-safe, and scalable. The stack chosen is:
- **Framework**: FastAPI (async, type-hinted, built-in OpenAPI/Swagger)
- **ORM**: SQLModel (combines SQLAlchemy + Pydantic, type-safe)
- **Database**: PostgreSQL with async driver (psycopg2-async)
- **Authentication**: JWT tokens (python-jose library)
- **API Style**: RESTful with RFC 7807 error responses

The backend must support frontend development (CORS), provide automatic API documentation, handle errors gracefully, and establish patterns for configuration, security, and data access that subsequent changes will extend.

## Goals / Non-Goals

**Goals:**
- Establish a minimal FastAPI application that starts successfully and serves the base URL
- Implement middleware stack (CORS, rate limiting, error formatting, logging)
- Create centralized configuration via `core/config.py` to manage environment variables
- Set up async SQLAlchemy session management for database connections
- Provide JWT security utilities for future authentication endpoints
- Enable automatic API documentation at `/docs` and `/redoc`
- Create a `/health` endpoint for deployment health checks
- Establish the directory structure and import patterns that subsequent backend features will follow

**Non-Goals:**
- Authentication endpoints (handled in CH-003: User Authentication)
- Database models or migrations (handled in CH-002: Database Migrations)
- API endpoints for business logic (handled in subsequent changes)
- WebSocket support (out of scope for MVP)
- GraphQL support (REST-first approach)
- Multi-region deployment or advanced caching (handled in production ops later)

## Decisions

### Decision 1: FastAPI over Django/Flask

**Rationale**: FastAPI offers async-first design, built-in OpenAPI documentation generation, and type hints as first-class citizens. This reduces boilerplate and catches errors at development time.

**Alternative Considered**: Django REST Framework is more mature but adds more overhead for an e-commerce MVP. Flask is too minimalist and requires more third-party choices.

**Consequence**: Developers need knowledge of async/await patterns; libraries must support async.

---

### Decision 2: SQLModel for ORM/Data Validation

**Rationale**: SQLModel combines SQLAlchemy (mature ORM) with Pydantic (validation), allowing models to be used for both database operations and API request/response validation. Single source of truth reduces duplication.

**Alternative Considered**: Using SQLAlchemy + separate Pydantic models creates duplication. Using only Pydantic models removes database flexibility.

**Consequence**: Developers must understand the hybrid nature (database models that double as validators).

---

### Decision 3: Async Database Access

**Rationale**: FastAPI is async-native; using blocking database drivers negates the performance advantage. Async driver (psycopg2-async or asyncpg) keeps the entire stack non-blocking.

**Alternative Considered**: Blocking driver (psycopg2 sync) is simpler but creates a bottleneck.

**Consequence**: Query complexity increases; connection pooling must be async-aware.

---

### Decision 4: Environment Variables via Pydantic Settings

**Rationale**: Pydantic Settings in `core/config.py` provides type validation, defaults, and clear documentation of required variables. Easier to test and maintain than raw `os.getenv()`.

**Alternative Considered**: Using `python-dotenv` alone loses type safety.

**Consequence**: Configuration is strongly typed but requires explicit model definition.

---

### Decision 5: Middleware Order: CORS → Rate Limit → Logging → Error Formatting

**Rationale**:
- CORS first ensures browser preflight requests don't trigger rate limiting
- Rate limiting early prevents abuse from hitting business logic
- Logging captures all requests after filtering
- Error formatting happens last to ensure consistency

**Alternative Considered**: Error formatting first (middleware stack order), but this can interfere with route-level error handlers.

**Consequence**: Some errors may be rate-limited before reaching the error formatter, which is acceptable.

---

### Decision 6: RFC 7807 Error Response Format

**Rationale**: RFC 7807 provides a standardized error response format (type, title, status, detail) that frontend can reliably parse and display. Better than ad-hoc error payloads.

**Alternative Considered**: JSON:API error format (more complex but extensible). Simple error objects (less structure).

**Consequence**: All error handlers must be updated to use RFC 7807 format.

---

### Decision 7: JWT for Stateless Authentication

**Rationale**: JWTs allow stateless authentication without session storage, scaling horizontally. Token stored in HTTP-only cookies or headers.

**Alternative Considered**: Session-based auth (simpler but requires session storage); OAuth2 (overkill for MVP).

**Consequence**: Token expiration is critical; refresh tokens needed for user experience.

---

### Decision 8: Directory Structure

```
backend/
├── main.py                # FastAPI application entry point
├── requirements.txt       # Pinned dependencies
├── .env.example          # Example environment variables
├── core/
│   ├── __init__.py
│   ├── config.py         # Pydantic settings
│   ├── security.py       # JWT utilities
│   ├── database.py       # SQLAlchemy async session setup
│   └── exceptions.py     # Custom exception classes
├── models/
│   ├── __init__.py
│   └── base.py           # SQLModel base classes
├── services/             # Business logic (added in later changes)
├── routers/              # API endpoint groups (added in later changes)
├── middleware/           # Custom middleware classes
└── tests/                # Test files (added as features grow)
```

**Rationale**: Clear separation of concerns; models/services/routers follow industry conventions.

**Consequence**: Import paths must be carefully managed to avoid circular imports.

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Async complexity causes bugs** | Thorough testing of async patterns; code reviews focus on race conditions and task cancellation. Use `pytest-asyncio` with proper fixture setup. |
| **Database connection pool exhaustion** | Set reasonable pool_size and max_overflow; monitor connection usage in staging. Implement connection health checks. |
| **JWT secret key leaked** | Never commit `.env` or secrets; use environment variables in production. Rotate secrets periodically. Store in secrets manager (AWS Secrets, etc.). |
| **CORS misconfiguration allows unauthorized access** | CORS only restricts browser requests, not API clients. Additional auth middleware required (handled in CH-003). |
| **Rate limiting too aggressive** | Set sensible defaults; make configurable. Monitor for false positives. |
| **Unhandled exceptions crash the app** | Implement global exception handler middleware; test error paths thoroughly. |

---

## Migration Plan

1. **Create the backend folder structure** (task 1)
2. **Create requirements.txt** (task 2) with all dependencies pinned
3. **Implement core modules** (tasks 3-5): config, security, database
4. **Create main.py** (task 6) with FastAPI app and middleware
5. **Add health check endpoint** (task 7)
6. **Test locally** (task 8): `uvicorn main:app --reload` on port 8000
7. **Verify documentation** (task 9): `/docs` and `/redoc` accessible
8. **Commit** (task 10) with conventional commits message format

**Rollback Strategy**: If critical issues arise before CH-001 is merged:
- Revert all changes: `git revert <commit>`
- Or reset to CH-000 state if needed
- No data migration needed (no database changes yet)

---

## Open Questions

1. **Secrets management**: Should we use AWS Secrets Manager, HashiCorp Vault, or environment variables? *(Decision: Defer to deployment phase; use env vars for MVP)*
2. **Rate limiting strategy**: Should we rate limit per IP, per user, or both? *(Decision: Per IP globally; per user after CH-003 auth)*
3. **Logging format and destination**: Should we log to file, stdout, or external service? *(Decision: stdout for local dev; configure in deployment)*
4. **Database connection pool size**: Should it be 5, 10, or 20? *(Decision: Start with 10, monitor and tune)*
5. **HTTPS enforcement**: Should we force HTTPS in production? *(Decision: Yes, but via reverse proxy/load balancer, not FastAPI)*
