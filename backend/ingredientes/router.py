from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.core.dependencies import require_role
from backend.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteOut,
    IngredienteUpdate,
)
from backend.ingredientes.service import IngredienteService

router = APIRouter(prefix="/api/v1/ingredientes", tags=["ingredientes"])


@router.get(
    "/",
    response_model=list[IngredienteOut],
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def list_ingredientes(
    es_alergeno: Optional[bool] = Query(None, alias="es_alergeno"),
):
    service = IngredienteService()
    return await service.list(es_alergeno=es_alergeno)


@router.get(
    "/publico",
    response_model=list[IngredienteOut],
    summary="Listar ingredientes (público, solo alérgenos)",
)
async def list_ingredientes_publico(
    es_alergeno: Optional[bool] = Query(True, alias="es_alergeno"),
):
    """Listar ingredientes (público, sin autenticación).
    
    Por defecto solo retorna alérgenos (es_alergeno=true).
    """
    service = IngredienteService()
    return await service.list(es_alergeno=es_alergeno)


@router.get(
    "/{id}",
    response_model=IngredienteOut,
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def get_ingrediente(id: int):
    service = IngredienteService()
    return await service.get_by_id(id)


@router.post(
    "/",
    response_model=IngredienteOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def create_ingrediente(data: IngredienteCreate):
    service = IngredienteService()
    return await service.create(data)


@router.put(
    "/{id}",
    response_model=IngredienteOut,
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def update_ingrediente(id: int, data: IngredienteUpdate):
    service = IngredienteService()
    return await service.update(id, data)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def delete_ingrediente(id: int):
    service = IngredienteService()
    await service.delete(id)
