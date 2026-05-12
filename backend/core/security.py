"""Security utilities for JWT and password management"""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

from .config import settings


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token with optional custom expiration time.

    Args:
        data: Dictionary containing token claims (typically {"sub": user_id})
        expires_delta: Optional timedelta for custom expiration. If None, uses config default.

    Returns:
        Encoded JWT token string

    Raises:
        ValueError: If data is invalid
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.jwt_access_token_expire_minutes
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm="HS256",
    )

    return encoded_jwt


def verify_token(token: str) -> dict[str, Any]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string to verify

    Returns:
        Decoded token payload as dictionary

    Raises:
        JWTError: If token is invalid, expired, or tampered with
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=["HS256"],
        )
        return payload
    except JWTError as e:
        raise JWTError(f"Token verification failed: {str(e)}") from e


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password string

    Raises:
        ValueError: If password is invalid
    """
    if not password:
        raise ValueError("Password cannot be empty")

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a bcrypt hash.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Bcrypt hash to verify against

    Returns:
        True if password matches, False otherwise
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_refresh_token() -> str:
    """Generate a cryptographically random refresh token (UUID v4).

    The returned token is opaque — it contains no user information.
    Only its SHA-256 hash is stored in the database for lookup.

    Returns:
        A UUID v4 string (e.g. ``"550e8400-e29b-41d4-a716-446655440000"``).
    """
    return str(uuid.uuid4())


def hash_token(token: str) -> str:
    """Create a SHA-256 hash of a token for secure storage.

    Args:
        token: The raw token string to hash.

    Returns:
        Hex-encoded SHA-256 digest (64 characters).

    Example:
        ``hash_token("my-token")`` → ``"73475cb40a568e8da8a045ced110137e...``
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
