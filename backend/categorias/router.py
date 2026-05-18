from fastapi import APIRouter, Depends, status

from backend.categorias.schemas import CategoriaCreate, CategoriaOut, CategoriaUpdate
from backend.categorias.service import CategoriaService
from backend.core.dependencies import require_role

router = APIRouter(prefix="/api/v1/categorias", tags=["categorias"])


@router.get(
    "",
    response_model=list[CategoriaOut],
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def list_categorias():
    service = CategoriaService()
    return await service.list()


@router.get(
    "/{id}",
    response_model=CategoriaOut,
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def get_categoria(id: int):
    service = CategoriaService()
    return await service.get_by_id(id)


@router.post(
    "",
    response_model=CategoriaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def create_categoria(data: CategoriaCreate):
    service = CategoriaService()
    return await service.create(data)


@router.put(
    "/{id}",
    response_model=CategoriaOut,
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def update_categoria(id: int, data: CategoriaUpdate):
    service = CategoriaService()
    return await service.update(id, data)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(["ADMIN"]))],
)
async def delete_categoria(id: int):
    service = CategoriaService()
    await service.delete(id)
