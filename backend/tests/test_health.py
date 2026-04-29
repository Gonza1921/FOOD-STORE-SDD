"""Tests for health check endpoint"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_check_returns_200():
    """Test that health endpoint returns 200 status"""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_check_response_structure():
    """Test that health endpoint returns correct structure"""
    response = client.get("/health")
    data = response.json()

    assert "status" in data
    assert "timestamp" in data
    assert data["status"] in ["ok", "degraded", "error"]


def test_health_check_has_timestamp():
    """Test that health endpoint includes timestamp"""
    response = client.get("/health")
    data = response.json()

    assert "timestamp" in data
    # Verify it's a valid ISO format timestamp
    assert "T" in data["timestamp"] or isinstance(data["timestamp"], (int, float))


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "FOOD-STORE API"
