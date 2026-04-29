"""Tests for configuration module"""

import os
import pytest
from pydantic import ValidationError

from backend.core.config import Settings, settings


def test_settings_loads_from_env():
    """Test that settings loads from environment variables"""
    assert settings.database_url is not None
    assert settings.secret_key is not None
    assert len(settings.secret_key) >= 32


def test_settings_secret_key_validation():
    """Test that SECRET_KEY must be at least 32 characters"""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            database_url="postgresql://user:pass@localhost/db",
            secret_key="short",
        )
    assert "at least 32 characters" in str(exc_info.value).lower()


def test_settings_database_url_validation():
    """Test that DATABASE_URL must be PostgreSQL format"""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            database_url="mysql://user:pass@localhost/db",
            secret_key="a" * 32,
        )
    assert "postgresql" in str(exc_info.value).lower()


def test_settings_cors_origins_list():
    """Test that CORS_ORIGINS are parsed correctly"""
    cors_list = settings.cors_origins_list
    assert isinstance(cors_list, list)
    assert len(cors_list) > 0
    assert all(isinstance(origin, str) for origin in cors_list)


def test_settings_environment_default():
    """Test that ENVIRONMENT has default value"""
    assert settings.environment in ["development", "production"]


def test_settings_jwt_expiration_default():
    """Test that JWT_ACCESS_TOKEN_EXPIRE_MINUTES has default value"""
    assert settings.jwt_access_token_expire_minutes > 0
