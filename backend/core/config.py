"""Configuration module using Pydantic Settings"""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database configuration
    database_url: str = Field(
        ...,
        description="PostgreSQL database URL",
    )

    # Security configuration
    secret_key: str = Field(
        ...,
        description="Secret key for JWT signing (minimum 32 characters)",
    )

    # JWT configuration
    jwt_access_token_expire_minutes: int = Field(
        default=30,
        description="JWT access token expiration time in minutes",
    )
    jwt_refresh_token_expire_days: int = Field(
        default=7,
        description="JWT refresh token expiration time in days",
    )

    # CORS configuration
    cors_origins: str = Field(
        default="http://localhost:5173",
        description="Comma-separated list of allowed CORS origins",
    )

    # Frontend URL (for MercadoPago back_urls redirects)
    frontend_url: str = Field(
        default="http://localhost:5173",
        description="Frontend base URL for MP redirects (back_urls)",
    )

    # Environment
    environment: str = Field(
        default="development",
        description="Application environment (development, production)",
    )

    class Config:
        """Pydantic config"""

        # Look for .env in the backend directory
        env_file = str(Path(__file__).parent.parent / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Allow extra env vars not in model

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate that DATABASE_URL is a valid PostgreSQL URL"""
        if not v.startswith("postgresql://"):
            raise ValueError(
                "DATABASE_URL must be a valid PostgreSQL URL "
                "(e.g., postgresql://user:password@host:port/dbname)"
            )
        return v

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate that SECRET_KEY has minimum length"""
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS into a list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def async_database_url(self) -> str:
        """Derive async-friendly database URL from the sync URL.

        Replaces 'postgresql://' or 'postgresql+psycopg2://' with
        'postgresql+asyncpg://' for use with async sessions.
        """
        return self.database_url.replace(
            "postgresql://", "postgresql+asyncpg://"
        ).replace(
            "postgresql+psycopg2://", "postgresql+asyncpg://"
        )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance (singleton pattern)"""
    return Settings()


# Create singleton instance
settings = get_settings()
