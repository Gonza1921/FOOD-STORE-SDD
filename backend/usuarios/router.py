"""FastAPI router for user profile endpoints.

All endpoints are mounted at ``/api/v1/usuarios/`` when included in ``main.py``.
"""

from fastapi import APIRouter, Depends

from backend.core.dependencies import get_current_user
from backend.models.usuario import Usuario
from backend.usuarios.schemas import (
    CambiarContrasenaRequest,
    PerfilResponse,
    PerfilUpdateRequest,
)
from backend.usuarios.service import UsuarioService

router = APIRouter(prefix="/api/v1/usuarios", tags=["usuarios"])


@router.get(
    "/perfil",
    response_model=PerfilResponse,
    summary="Get own profile",
)
async def get_perfil(
    current_user: Usuario = Depends(get_current_user),
):
    """Return the profile data of the authenticated user.

    Includes: nombre, apellido, email, telefono, and registration date.
    """
    service = UsuarioService()
    return await service.get_perfil(current_user)


@router.put(
    "/perfil",
    response_model=PerfilResponse,
    summary="Update own profile",
)
async def update_perfil(
    request: PerfilUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
):
    """Update the profile of the authenticated user.

    Only ``nombre``, ``apellido`` and ``telefono`` can be modified.
    ``email`` is immutable (user identifier).
    """
    service = UsuarioService()
    return await service.update_perfil(current_user, request)


@router.post(
    "/perfil/cambiar-contrasena",
    summary="Change password",
)
async def cambiar_contrasena(
    request: CambiarContrasenaRequest,
    current_user: Usuario = Depends(get_current_user),
):
    """Change the authenticated user's password.

    Requires the **current password** for verification. On success,
    all existing refresh tokens are revoked, forcing a new login.
    """
    service = UsuarioService()
    return await service.cambiar_contrasena(current_user, request)
