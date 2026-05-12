"""Database connection and session management"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel

from backend.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Synchronous engine & session (existing)
# ---------------------------------------------------------------------------

engine = create_engine(
    settings.database_url,
    echo=settings.environment == "development",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ---------------------------------------------------------------------------
# Asynchronous engine & session (for BaseRepository / async endpoints)
# ---------------------------------------------------------------------------

async_engine = create_async_engine(
    settings.async_database_url,
    echo=settings.environment == "development",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
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


async def get_async_session() -> AsyncSession:
    """
    Dependency injection function for getting async database sessions.

    Usage in FastAPI routes:
        async def my_endpoint(session: AsyncSession = Depends(get_async_session)):
            ...

    Yields:
        AsyncSession: Async database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


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
    from backend import models  # noqa: F401
    
    SQLModel.metadata.create_all(engine)
    logger.info("All tables created")


def get_metadata():
    """
    Get SQLModel metadata for Alembic.
    
    Used by Alembic's env.py for autogenerate.
    """
    from backend import models  # noqa: F401
    
    return SQLModel.metadata
