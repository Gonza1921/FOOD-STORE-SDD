from typing import Optional

from backend.categorias.repository import CategoriaRepository
from backend.categorias.schemas import CategoriaCreate, CategoriaOut, CategoriaUpdate
from backend.core.exceptions import ConflictError, NotFoundError
from backend.core.unit_of_work import UnitOfWork
from backend.models.categoria import Categoria, generar_slug


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
                    slug=row[3],
                    parent_id=row[4],
                    creado_en=row[5],
                    actualizado_en=row[6],
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

            # Generate or use explicit slug
            slug = data.slug if data.slug else generar_slug(data.nombre)
            # Ensure slug uniqueness
            existing_slug = await repo.find_by_slug(slug)
            if existing_slug:
                counter = 1
                while existing_slug:
                    candidate = f"{slug}-{counter}"
                    existing_slug = await repo.find_by_slug(candidate)
                    counter += 1
                slug = candidate

            categoria = Categoria(
                nombre=data.nombre,
                slug=slug,
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

            if "nombre" in update_data:
                if update_data["nombre"] != obj.nombre:
                    existing = await repo.find_by_nombre_and_parent(
                        update_data["nombre"],
                        update_data.get("parent_id", obj.parent_id),
                    )
                    if existing and existing.id != id:
                        raise ConflictError(
                            f"Ya existe una categoría con nombre '{update_data['nombre']}' en este nivel"
                        )
                    # Regenerate slug when name changes (unless slug explicitly provided)
                    if "slug" not in update_data:
                        update_data["slug"] = generar_slug(update_data["nombre"])
                else:
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

    # ── Public methods ──

    async def list_publicas(self) -> list["CategoriaPublicOut"]:
        """List all non-deleted categories with product counts (no auth)."""
        from backend.categorias.schemas import CategoriaPublicOut
        async with UnitOfWork() as uow:
            repo = uow.register("categorias", CategoriaRepository, Categoria)
            categories = await repo.get_all_active()
            result = []
            for cat in categories:
                count = await repo.get_product_count(cat.id)
                result.append(CategoriaPublicOut(
                    id=cat.id,
                    nombre=cat.nombre,
                    slug=cat.slug,
                    descripcion=cat.descripcion,
                    parent_id=cat.parent_id,
                    producto_count=count,
                ))
        return result

    async def get_by_slug(self, slug: str) -> CategoriaOut:
        async with UnitOfWork() as uow:
            repo = uow.register("categorias", CategoriaRepository, Categoria)
            obj = await repo.find_by_slug(slug)
            if not obj:
                raise NotFoundError(f"Categoría con slug '{slug}' no encontrada")
        return CategoriaOut.model_validate(obj)

    async def get_public_detail(self, slug: str) -> "CategoriaDetailOut":
        """Get category detail with subcategories and products (no auth)."""
        from backend.categorias.schemas import CategoriaPublicOut, CategoriaDetailOut
        from backend.productos.schemas import ProductoOutPublic
        from backend.productos.service import ProductoService

        async with UnitOfWork() as uow:
            repo = uow.register("categorias", CategoriaRepository, Categoria)
            obj = await repo.find_by_slug(slug)
            if not obj:
                raise NotFoundError(f"Categoría con slug '{slug}' no encontrada")

            # Get subcategories
            subcats = await repo.get_children(obj.id)
            subcategorias_out = []
            for sub in subcats:
                count = await repo.get_product_count(sub.id)
                subcategorias_out.append(CategoriaPublicOut(
                    id=sub.id,
                    nombre=sub.nombre,
                    slug=sub.slug,
                    descripcion=sub.descripcion,
                    parent_id=sub.parent_id,
                    producto_count=count,
                ))

        # Get products from this category
        productos, _ = await ProductoService().get_public_paginated(
            categoria_id=obj.id
        )
        productos_out = [ProductoOutPublic.model_validate(p) for p in productos]

        return CategoriaDetailOut(
            id=obj.id,
            nombre=obj.nombre,
            slug=obj.slug,
            descripcion=obj.descripcion,
            parent_id=obj.parent_id,
            subcategorias=subcategorias_out,
            productos=productos_out,
        )

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
