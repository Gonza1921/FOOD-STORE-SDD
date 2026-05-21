"""Pytest configuration and fixtures

Fixtures:
- ``client`` — ``TestClient`` as context manager (shared event loop)
- ``db_session`` — synchronous SQLAlchemy session
- ``cleanup_async_pool`` (autouse) — disposes async engine connections
  before each test to prevent ``ProactorEventLoop`` conflicts with
  ``asyncpg`` on Windows.
"""

import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from backend.core.database import SessionLocal, async_engine

# Disable rate limiting in tests — slowapi's 3-registrations/hour limit
# causes rapid false positives when running the full test suite.
from backend.core.rate_limit import limiter, limiter_register, limiter_pedidos

limiter.enabled = False
limiter_register.enabled = False
limiter_pedidos.enabled = False


@pytest.fixture(autouse=True)
def cleanup_async_pool():
    """Dispose async engine connections before each test.

    On Windows, ``asyncpg`` connections are tied to the event loop that
    created them.  When a previous test finishes, its event loop is closed
    but the connection-pool keeps the connections.  The next test that
    tries to use the pool crashes with ``RuntimeError: Event loop is
    closed``.

    We call ``await async_engine.dispose()`` from a temporary event loop
    to properly close all pooled connections.
    """
    if async_engine is not None:
        try:
            loop = asyncio.new_event_loop()
            loop.run_until_complete(async_engine.dispose())
            loop.close()
        except Exception:
            pass  # best-effort cleanup
    yield


@pytest.fixture
def client():
    """Provide a test client for the FastAPI app (context-managed).

    Uses ``with TestClient(app) as client`` so all HTTP requests share
    the same ``anyio`` portal (and event loop). Without the context
    manager, each request creates a *new* event loop, and ``asyncpg``
    connections from the previous loop become unreusable.
    """
    from backend.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture
def db_session():
    """Provide a database session for tests"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
