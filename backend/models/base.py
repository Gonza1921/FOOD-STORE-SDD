"""Base models for API responses"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """RFC 7807 Problem Details for HTTP APIs compliant error response"""

    type: str = Field(
        default="about:blank",
        description="URI identifying the problem type",
    )
    title: str = Field(
        ...,
        description="Short human-readable summary of the problem",
    )
    status: int = Field(
        ...,
        description="HTTP status code",
    )
    detail: str = Field(
        ...,
        description="Human-readable explanation of the problem",
    )
    instance: Optional[str] = Field(
        default=None,
        description="URI identifying the specific occurrence",
    )
    error_code: Optional[str] = Field(
        default=None,
        description="Machine-readable error code",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the error occurred",
    )
    details: Optional[dict[str, Any]] = Field(
        default=None,
        description="Additional error details",
    )

    class Config:
        """Pydantic config"""

        json_schema_extra = {
            "example": {
                "type": "https://example.com/validation-error",
                "title": "Validation Error",
                "status": 422,
                "detail": "Invalid input provided",
                "error_code": "VALIDATION_ERROR",
                "timestamp": "2026-04-28T12:00:00Z",
                "details": {"field": "Email format is invalid"},
            }
        }


class HealthResponse(BaseModel):
    """Health check response model"""

    status: str = Field(
        ...,
        description="Health status (ok, degraded, error)",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of the health check",
    )
    database: Optional[bool] = Field(
        default=None,
        description="Database connectivity status",
    )

    class Config:
        """Pydantic config"""

        json_schema_extra = {
            "example": {
                "status": "ok",
                "timestamp": "2026-04-28T12:00:00Z",
                "database": True,
            }
        }
