## ADDED Requirements

### Requirement: Async database session management
The system SHALL provide an async SQLAlchemy session factory that creates database sessions with connection pooling. Connection pool MUST have configurable pool_size and max_overflow parameters. Sessions MUST be properly cleaned up after use.

#### Scenario: Database session is created
- **WHEN** `get_session()` is called
- **THEN** an async SQLAlchemy session is returned

#### Scenario: Database session is cleaned up
- **WHEN** a session is used in an async context manager
- **THEN** the session is properly closed after the context exits

#### Scenario: Connection pool is configured
- **WHEN** the application starts
- **THEN** the connection pool is initialized with pool_size=10 and max_overflow=20

### Requirement: Database engine initialization
The system SHALL initialize a SQLAlchemy async engine connected to the PostgreSQL database specified in DATABASE_URL. The engine MUST use an async driver (psycopg2-async or asyncpg).

#### Scenario: Database engine connects to PostgreSQL
- **WHEN** the application starts with a valid DATABASE_URL pointing to PostgreSQL
- **THEN** the engine is created without error

#### Scenario: Database engine rejects invalid connection
- **WHEN** the application starts with an invalid DATABASE_URL
- **THEN** an error is logged or raised on first connection attempt

### Requirement: Database health check
The system SHALL provide a function to verify database connectivity. Health check MUST return success if a simple query executes within a timeout period. Health check MUST return failure if database is unreachable.

#### Scenario: Database is healthy
- **WHEN** `check_database_health()` is called with a reachable database
- **THEN** the function returns True

#### Scenario: Database is unreachable
- **WHEN** `check_database_health()` is called with an unreachable database
- **THEN** the function returns False
