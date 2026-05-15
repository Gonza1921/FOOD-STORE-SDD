"""Profile module — view and edit personal data, change password.

This module follows the feature-first convention:
- ``router.py``: FastAPI route handlers
- ``schemas.py``: Pydantic request/response models
- ``service.py``: Business logic layer
- ``repository.py``: Data access layer (inherits ``BaseRepository``)
"""

from .repository import UsuarioRepository
from .router import router as usuarios_router
from .schemas import (
    CambiarContrasenaRequest,
    PerfilResponse,
    PerfilUpdateRequest,
)
from .service import UsuarioService

__all__ = [
    "UsuarioRepository",
    "UsuarioService",
    "usuarios_router",
    "PerfilResponse",
    "PerfilUpdateRequest",
    "CambiarContrasenaRequest",
]
