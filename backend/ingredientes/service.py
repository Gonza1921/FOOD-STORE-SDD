from typing import Optional

from backend.core.exceptions import ConflictError, NotFoundError
from backend.core.unit_of_work import UnitOfWork
from backend.ingredientes.repository import IngredienteRepository
from backend.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteOut,
    IngredienteUpdate,
)
from backend.models.ingrediente import Ingrediente


class IngredienteService:

    async def list(self, es_alergeno: Optional[bool] = None) -> list[IngredienteOut]:
        async with UnitOfWork() as uow:
            repo = uow.register("ingredientes", IngredienteRepository, Ingrediente)
            if es_alergeno is not None:
                objs = await repo.list_by_alergeno(es_alergeno)
            else:
                objs = await repo.get_all()
        return [IngredienteOut.model_validate(o) for o in objs]

    async def get_by_id(self, id: int) -> IngredienteOut:
        async with UnitOfWork() as uow:
            repo = uow.register("ingredientes", IngredienteRepository, Ingrediente)
            obj = await repo.get_by_id(id)
            if not obj:
                raise NotFoundError(f"Ingrediente con id {id} no encontrado")
        return IngredienteOut.model_validate(obj)

    async def create(self, data: IngredienteCreate) -> IngredienteOut:
        async with UnitOfWork() as uow:
            repo = uow.register("ingredientes", IngredienteRepository, Ingrediente)

            existing = await repo.find_by_nombre(data.nombre)
            if existing:
                raise ConflictError(
                    f"Ya existe un ingrediente con nombre '{data.nombre}'"
                )

            ingrediente = Ingrediente(
                nombre=data.nombre,
                descripcion=data.descripcion,
                es_alergeno=data.es_alergeno,
            )
            obj = await repo.create(ingrediente)
        return IngredienteOut.model_validate(obj)

    async def update(self, id: int, data: IngredienteUpdate) -> IngredienteOut:
        async with UnitOfWork() as uow:
            repo = uow.register("ingredientes", IngredienteRepository, Ingrediente)

            obj = await repo.get_by_id(id)
            if not obj:
                raise NotFoundError(f"Ingrediente con id {id} no encontrado")

            update_data = data.model_dump(exclude_unset=True)

            if "nombre" in update_data and update_data["nombre"] != obj.nombre:
                existing = await repo.find_by_nombre(update_data["nombre"])
                if existing:
                    raise ConflictError(
                        f"Ya existe un ingrediente con nombre '{update_data['nombre']}'"
                    )
            elif "nombre" in update_data and update_data["nombre"] == obj.nombre:
                del update_data["nombre"]

            if not update_data:
                return IngredienteOut.model_validate(obj)

            for field, value in update_data.items():
                setattr(obj, field, value)

            repo.session.add(obj)
            await repo.session.flush()
            await repo.session.refresh(obj)
        return IngredienteOut.model_validate(obj)

    async def delete(self, id: int) -> None:
        async with UnitOfWork() as uow:
            repo = uow.register("ingredientes", IngredienteRepository, Ingrediente)

            obj = await repo.get_by_id(id)
            if not obj:
                raise NotFoundError(f"Ingrediente con id {id} no encontrado")

            if await repo.has_active_products(id):
                raise ConflictError(
                    f"No se puede eliminar el ingrediente con id {id}: tiene productos asociados"
                )

            await repo.hard_delete(id)
