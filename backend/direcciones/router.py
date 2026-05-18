"""FastAPI router for delivery address CRUD — ownership-protected endpoints.

All endpoints require authentication. Users can only interact with their own
addresses (ownership enforced at service layer).

Endpoints:
- GET    /api/v1/direcciones         — List user's addresses
- GET    /api/v1/direcciones/{id}    — Get one address (own)
- POST   /api/v1/direcciones         — Create new address
- PUT    /api/v1/direcciones/{id}    — Update address (own)
- PATCH  /api/v1/direcciones/{id}/principal — Set as primary
- DELETE /api/v1/direcciones/{id}    — Soft delete (own)
"""

from fastapi import APIRouter, Depends, status

from backend.core.dependencies import get_current_user
from backend.direcciones.schemas import (
    DireccionCreate,
    DireccionOut,
    DireccionSetPrincipal,
    DireccionUpdate,
)
from backend.direcciones.service import DireccionService
from backend.models.usuario import Usuario

router = APIRouter(prefix="/api/v1/direcciones", tags=["Direcciones"])


@router.get(
    "",
    response_model=list[DireccionOut],
    summary="Listar mis direcciones",
)
async def list_direcciones(
    current_user: Usuario = Depends(get_current_user),
):
    """List all (non-deleted) addresses for the authenticated user."""
    service = DireccionService()
    return await service.list_by_usuario(current_user)


@router.get(
    "/{id}",
    response_model=DireccionOut,
    summary="Obtener una dirección",
)
async def get_direccion(
    id: int,
    current_user: Usuario = Depends(get_current_user),
):
    """Get a specific address (must belong to the authenticated user)."""
    service = DireccionService()
    return await service.get_by_id(id, current_user)


@router.post(
    "",
    response_model=DireccionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva dirección",
)
async def create_direccion(
    data: DireccionCreate,
    current_user: Usuario = Depends(get_current_user),
):
    """Create a new delivery address.

    The first address is automatically set as primary.
    If es_principal=True, any existing primary is unset first.
    """
    service = DireccionService()
    return await service.create(data, current_user)


@router.put(
    "/{id}",
    response_model=DireccionOut,
    summary="Actualizar una dirección",
)
async def update_direccion(
    id: int,
    data: DireccionUpdate,
    current_user: Usuario = Depends(get_current_user),
):
    """Update an existing address (must belong to the authenticated user)."""
    service = DireccionService()
    return await service.update(id, data, current_user)


@router.patch(
    "/{id}/principal",
    response_model=DireccionOut,
    summary="Marcar/desmarcar dirección como principal",
)
async def set_principal(
    id: int,
    data: DireccionSetPrincipal,
    current_user: Usuario = Depends(get_current_user),
):
    """Set or unset an address as the primary delivery address.

    Setting a new primary automatically unsets the previous one.
    """
    service = DireccionService()
    return await service.set_principal(id, data, current_user)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una dirección (soft delete)",
)
async def delete_direccion(
    id: int,
    current_user: Usuario = Depends(get_current_user),
):
    """Soft delete an address (must belong to the authenticated user)."""
    service = DireccionService()
    await service.delete(id, current_user)
