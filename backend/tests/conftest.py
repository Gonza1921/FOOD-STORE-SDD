"""Pytest configuration and fixtures"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Provide a test client for the FastAPI app"""
    from backend.main import app
    return TestClient(app)
