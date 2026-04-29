"""Database connection and session management"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

from backend.core.config import settings

logger = logging.getLogger(__name__)


# Create engine
engine = create_engine(
    settings.database_url,
    echo=settings.environment == "development",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_session() -> Session:
    """
    Dependency injection function for getting database sessions.

    Usage in FastAPI routes:
        async def my_endpoint(session: Session = Depends(get_session)):
            ...

    Yields:
        Session: Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_health() -> bool:
    """
    Check database connectivity and health.

    Returns:
        True if database is reachable and healthy, False otherwise
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Database health check passed")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False


def create_all_tables():
    """
    Create all database tables from SQLModel metadata.

    Note: This is a placeholder. In production, use Alembic for migrations.
    """
    # Import all models to ensure they are registered
    logger.info("Database tables creation placeholder")
