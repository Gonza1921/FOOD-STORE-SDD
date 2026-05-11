"""Pytest configuration and fixtures"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from backend.core.database import SessionLocal


@pytest.fixture
def client():
    """Provide a test client for the FastAPI app"""
    from backend.main import app
    return TestClient(app)


@pytest.fixture
def db_session():
    """Provide a database session for tests"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
