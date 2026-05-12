from typing import Optional

from backend.categorias.repository import CategoriaRepository
from backend.categorias.schemas import CategoriaCreate, CategoriaOut, CategoriaUpdate
from backend.core.exceptions import ConflictError, NotFoundError
from backend.core.unit_of_work import UnitOfWork
from backend.models.categoria import Categoria


class CategoriaService:

    async def list(self) -> list[CategoriaOut]:
        async with UnitOfWork() as uow:
            repo = uow.register("categorias", CategoriaRepository, Categoria)
            rows = await repo.get_tree()
            categorias = []
            for row in rows:
                categorias.append(CategoriaOut(
                    id=row[0],
                    nombre=row[1],
                    descripcion=row[2],
                    parent_id=row[3],
                    creado_en=row[4],
                    actualizado_en=row[5],
                ))
        return categorias

    async def get_by_id(self, id: int) -> CategoriaOut:
        async with UnitOfWork() as uow:
            repo = uow.register("categorias", CategoriaRepository, Categoria)
            obj = await repo.get_by_id(id)
            if not obj:
                raise NotFoundError(f"Categoría con id {id} no encontrada")
        return CategoriaOut.model_validate(obj)

    async def create(self, data: CategoriaCreate) -> CategoriaOut:
        async with UnitOfWork() as uow:
            repo = uow.register("categorias", CategoriaRepository, Categoria)

            existing = await repo.find_by_nombre_and_parent(data.nombre, data.parent_id)
            if existing:
                raise ConflictError(
                    f"Ya existe una categoría con nombre '{data.nombre}' en este nivel"
                )

            if data.parent_id is not None:
                parent = await repo.get_by_id(data.parent_id)
                if not parent:
                    raise NotFoundError(
                        f"Categoría padre con id {data.parent_id} no encontrada"
                    )

            categoria = Categoria(
                nombre=data.nombre,
                descripcion=data.descripcion,
                parent_id=data.parent_id,
            )
            obj = await repo.create(categoria)
        return CategoriaOut.model_validate(obj)

    async def update(self, id: int, data: CategoriaUpdate) -> CategoriaOut:
        async with UnitOfWork() as uow:
            repo = uow.register("categorias", CategoriaRepository, Categoria)

            obj = await repo.get_by_id(id)
            if not obj:
                raise NotFoundError(f"Categoría con id {id} no encontrada")

            update_data = data.model_dump(exclude_unset=True)

            if "nombre" in update_data and update_data["nombre"] != obj.nombre:
                existing = await repo.find_by_nombre_and_parent(
                    update_data["nombre"],
                    update_data.get("parent_id", obj.parent_id),
                )
                if existing and existing.id != id:
                    raise ConflictError(
                        f"Ya existe una categoría con nombre '{update_data['nombre']}' en este nivel"
                    )
            elif "nombre" in update_data and update_data["nombre"] == obj.nombre:
                del update_data["nombre"]

            if "parent_id" in update_data:
                new_parent = update_data["parent_id"]
                if new_parent is not None and new_parent != obj.parent_id:
                    if new_parent == id:
                        raise ConflictError("Una categoría no puede ser su propio padre")
                    descendants = await repo.get_descendant_ids(id)
                    if new_parent in descendants:
                        raise ConflictError(
                            "Una categoría no puede moverse a un descendiente suyo"
                        )
                    parent = await repo.get_by_id(new_parent)
                    if not parent:
                        raise NotFoundError(
                            f"Categoría padre con id {new_parent} no encontrada"
                        )
                elif new_parent is None:
                    pass

            for field, value in update_data.items():
                setattr(obj, field, value)

            repo.session.add(obj)
            await repo.session.flush()
            await repo.session.refresh(obj)
        return CategoriaOut.model_validate(obj)

    async def delete(self, id: int) -> None:
        async with UnitOfWork() as uow:
            repo = uow.register("categorias", CategoriaRepository, Categoria)

            obj = await repo.get_by_id(id)
            if not obj:
                raise NotFoundError(f"Categoría con id {id} no encontrada")

            if await repo.has_active_products(id):
                raise ConflictError(
                    f"No se puede eliminar la categoría con id {id}: tiene productos asociados"
                )

            new_parent = obj.parent_id
            await repo.reassign_children(id, new_parent)
            await repo.soft_delete(id)
