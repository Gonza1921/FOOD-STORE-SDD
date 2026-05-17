"""Shared rate limiter instances for the entire application.

Extracted to its own module so that ``main.py`` (for middleware wiring)
and individual routers (for ``@limiter.limit(...)`` decorators) can share
the **same** ``Limiter`` instances without circular imports.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.core.security import verify_token

limiter = Limiter(key_func=get_remote_address)


def _get_user_id_or_ip(request) -> str:
    """Extract user ID from JWT for per-user rate limiting.

    Falls back to IP address if token is missing or invalid.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            payload = verify_token(token)
            user_id = payload.get("sub")
            if user_id:
                return str(user_id)
        except Exception:
            pass
    return get_remote_address(request)


limiter_register = Limiter(key_func=get_remote_address)
limiter_pedidos = Limiter(key_func=_get_user_id_or_ip)
