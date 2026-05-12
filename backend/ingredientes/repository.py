from typing import Optional

from sqlmodel import select

from backend.core.repository import BaseRepository
from backend.models.producto import Ingrediente, ProductoIngrediente


class IngredienteRepository(BaseRepository[Ingrediente]):

    async def find_by_nombre(self, nombre: str) -> Optional[Ingrediente]:
        statement = select(Ingrediente).where(Ingrediente.nombre == nombre)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def has_active_products(self, ingrediente_id: int) -> bool:
        statement = select(ProductoIngrediente).where(
            ProductoIngrediente.ingrediente_id == ingrediente_id
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none() is not None

    async def list_by_alergeno(self, es_alergeno: bool) -> list[Ingrediente]:
        statement = select(Ingrediente).where(
            Ingrediente.es_alergeno == es_alergeno
        ).order_by(Ingrediente.nombre)
        result = await self.session.execute(statement)
        return list(result.scalars().all())
