"""Shared rate limiter instance for the entire application.

Extracted to its own module so that ``main.py`` (for middleware wiring)
and individual routers (for ``@limiter.limit(...)`` decorators) can share
the **same** ``Limiter`` instance without circular imports.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
