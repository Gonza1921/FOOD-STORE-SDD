"""Business logic for delivery addresses — ownership, primary address, soft delete"""

from backend.core.exceptions import NotFoundError, ForbiddenError
from backend.core.unit_of_work import UnitOfWork
from backend.direcciones.repository import DireccionRepository
from backend.direcciones.schemas import (
    DireccionCreate,
    DireccionOut,
    DireccionUpdate,
    DireccionSetPrincipal,
)
from backend.models.direccion import DireccionEntrega
from backend.models.usuario import Usuario


class DireccionService:
    """Service layer for DireccionEntrega CRUD with ownership enforcement"""

    # ------------------------------------------------------------------
    # List all addresses for the authenticated user
    # ------------------------------------------------------------------

    async def list_by_usuario(self, current_user: Usuario) -> list[DireccionOut]:
        """Return all non-deleted addresses for the authenticated user."""
        async with UnitOfWork() as uow:
            repo = uow.register("direcciones", DireccionRepository, DireccionEntrega)
            objs = await repo.find_by_usuario(current_user.id)
        return [DireccionOut.model_validate(o) for o in objs]

    # ------------------------------------------------------------------
    # Get a single address (ownership-checked)
    # ------------------------------------------------------------------

    async def get_by_id(
        self, id: int, current_user: Usuario
    ) -> DireccionOut:
        """Return an address only if it belongs to the authenticated user."""
        async with UnitOfWork() as uow:
            repo = uow.register("direcciones", DireccionRepository, DireccionEntrega)
            obj = await repo.find_by_usuario_and_id(id, current_user.id)
            if not obj:
                raise NotFoundError(f"Dirección con id {id} no encontrada")
        return DireccionOut.model_validate(obj)

    # ------------------------------------------------------------------
    # Create a new address
    # ------------------------------------------------------------------

    async def create(
        self, data: DireccionCreate, current_user: Usuario
    ) -> DireccionOut:
        """Create a new address. First address is auto-set as primary."""
        async with UnitOfWork() as uow:
            repo = uow.register("direcciones", DireccionRepository, DireccionEntrega)

            # If this is the first address or es_principal=True, unset existing primary
            if data.es_principal:
                await repo.unset_principal(current_user.id)
            else:
                existing = await repo.find_principal(current_user.id)
                if existing is None:
                    # First address — auto-set as primary
                    data.es_principal = True

            direccion = DireccionEntrega(
                usuario_id=current_user.id,
                alias=data.alias,
                linea1=data.linea1,
                linea2=data.linea2,
                ciudad=data.ciudad,
                provincia=data.provincia,
                codigo_postal=data.codigo_postal,
                referencia=data.referencia,
                es_principal=bool(data.es_principal),
            )
            obj = await repo.create(direccion)
        return DireccionOut.model_validate(obj)

    # ------------------------------------------------------------------
    # Update an existing address (ownership-checked)
    # ------------------------------------------------------------------

    async def update(
        self, id: int, data: DireccionUpdate, current_user: Usuario
    ) -> DireccionOut:
        """Update address fields. Only the owner can update."""
        async with UnitOfWork() as uow:
            repo = uow.register("direcciones", DireccionRepository, DireccionEntrega)

            obj = await repo.find_by_usuario_and_id(id, current_user.id)
            if not obj:
                raise NotFoundError(f"Dirección con id {id} no encontrada")

            update_data = data.model_dump(exclude_unset=True)

            # Handle primary address change
            if "es_principal" in update_data:
                if update_data["es_principal"]:
                    await repo.unset_principal(current_user.id)
                else:
                    # Cannot unset primary without setting another as primary
                    # unless there are other addresses
                    del update_data["es_principal"]

            if not update_data:
                return DireccionOut.model_validate(obj)

            for field, value in update_data.items():
                setattr(obj, field, value)

            repo.session.add(obj)
            await repo.session.flush()
            await repo.session.refresh(obj)
        return DireccionOut.model_validate(obj)

    # ------------------------------------------------------------------
    # Set/unset primary address (standalone endpoint)
    # ------------------------------------------------------------------

    async def set_principal(
        self, id: int, data: DireccionSetPrincipal, current_user: Usuario
    ) -> DireccionOut:
        """Mark an address as primary (unsets any existing primary)."""
        async with UnitOfWork() as uow:
            repo = uow.register("direcciones", DireccionRepository, DireccionEntrega)

            obj = await repo.find_by_usuario_and_id(id, current_user.id)
            if not obj:
                raise NotFoundError(f"Dirección con id {id} no encontrada")

            if data.es_principal:
                await repo.unset_principal(current_user.id)
                obj.es_principal = True
            else:
                obj.es_principal = False

            repo.session.add(obj)
            await repo.session.flush()
            await repo.session.refresh(obj)
        return DireccionOut.model_validate(obj)

    # ------------------------------------------------------------------
    # Soft delete an address (ownership-checked)
    # ------------------------------------------------------------------

    async def delete(self, id: int, current_user: Usuario) -> None:
        """Soft delete an address. Only the owner can delete."""
        async with UnitOfWork() as uow:
            repo = uow.register("direcciones", DireccionRepository, DireccionEntrega)

            obj = await repo.find_by_usuario_and_id(id, current_user.id)
            if not obj:
                raise NotFoundError(f"Dirección con id {id} no encontrada")

            await repo.soft_delete(id)
