"""Generic repository pattern for async SQLAlchemy 2.0 + SQLModel.

Provides BaseRepository[T] — a reusable, type-safe CRUD base class
that all domain repositories should inherit from.

Usage:
    class UsuarioRepository(BaseRepository[Usuario]):
        async def find_by_email(self, email: str) -> Usuario | None:
            statement = select(Usuario).where(Usuario.email == email)
            result = await self.session.execute(statement)
            return result.scalar_one_or_none()
"""

from datetime import datetime, timezone
from typing import Any, Generic, Optional, TypeVar

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, select

from backend.core.exceptions import NotFoundError

# Type variable bound to SQLModel for strong generic typing
ModelType = TypeVar("ModelType", bound=SQLModel)


class BaseRepository(Generic[ModelType]):
    """Generic repository with common CRUD operations.

    Automatically handles:
    - Soft-delete filtering (models with a ``deleted_at`` column)
    - Type-safe returns via the ``ModelType`` generic parameter
    - Async sessions (SQLAlchemy 2.0 style)

    Subclass and add domain-specific query methods.
    """

    def __init__(self, session: AsyncSession, model_class: type[ModelType]) -> None:
        """
        Args:
            session: An active async SQLAlchemy session.
            model_class: The SQLModel class this repository manages.
        """
        self.session = session
        self.model_class = model_class

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _has_soft_delete(self) -> bool:
        """Return True if the model has a ``deleted_at`` column."""
        return hasattr(self.model_class, "deleted_at")

    def _apply_base_filters(self, statement: Any) -> Any:
        """Append ``WHERE deleted_at IS NULL`` when the model supports soft delete."""
        if self._has_soft_delete():
            statement = statement.where(self.model_class.deleted_at.is_(None))  # type: ignore[union-attr]
        return statement

    # ------------------------------------------------------------------
    # CRUD operations
    # ------------------------------------------------------------------

    async def get_by_id(self, id: int) -> Optional[ModelType]:
        """Retrieve a single entity by its primary key.

        Returns ``None`` (not 404) when not found, so the caller /
        service layer can decide how to respond.

        Automatically excludes soft-deleted rows.
        """
        statement = select(self.model_class).where(
            self.model_class.id == id  # type: ignore[union-attr]
        )
        statement = self._apply_base_filters(statement)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[Any] = None,
    ) -> list[ModelType]:
        """Return a paginated list of entities.

        Args:
            skip: Number of records to skip (offset).
            limit: Maximum number of records to return.
            order_by: SQLAlchemy sort expression.
                      Defaults to ``model_class.id`` ascending.

        Returns:
            A list of model instances (empty list when no records match).
        """
        statement = select(self.model_class)
        statement = self._apply_base_filters(statement)

        # Ordering
        if order_by is not None:
            statement = statement.order_by(order_by)
        elif hasattr(self.model_class, "id"):
            statement = statement.order_by(self.model_class.id)  # type: ignore[union-attr]

        statement = statement.offset(skip).limit(limit)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def create(self, obj: ModelType) -> ModelType:
        """Persist a new entity and return it with its generated PK.

        Performs a flush (not commit) so the caller can compose multiple
        operations inside a single transaction (UnitOfWork).
        """
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update(self, id: int, data: dict[str, Any]) -> ModelType:
        """Update an entity by its primary key with the given field values.

        Args:
            id: Primary key of the entity to update.
            data: Dictionary of field names → new values.

        Returns:
            The updated entity.

        Raises:
            NotFoundError: If no entity exists with the given ``id``
                           (or it was soft-deleted).
        """
        obj = await self.get_by_id(id)
        if obj is None:
            raise NotFoundError(
                f"{self.model_class.__name__} with id {id} not found"
            )

        for field, value in data.items():
            setattr(obj, field, value)

        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, id: int) -> None:
        """Remove (or soft-delete) an entity by its primary key.

        - If the model has a ``deleted_at`` column → sets it to the
          current timestamp (soft delete).
        - Otherwise → performs a hard delete.

        Raises:
            NotFoundError: If no entity exists with the given ``id``.
        """
        obj = await self.get_by_id(id)
        if obj is None:
            raise NotFoundError(
                f"{self.model_class.__name__} with id {id} not found"
            )

        if self._has_soft_delete():
            # Soft delete — timestamp instead of removal
            obj.deleted_at = datetime.now(timezone.utc)  # type: ignore[union-attr]
            self.session.add(obj)
        else:
            # Hard delete — physically remove the row
            await self.session.delete(obj)

        await self.session.flush()

    # ------------------------------------------------------------------
    # Convenience: count
    # ------------------------------------------------------------------

    async def count(self) -> int:
        """Return the total number of (non-deleted) entities."""
        statement = select(func.count()).select_from(self.model_class)
        statement = self._apply_base_filters(statement)
        result = await self.session.execute(statement)
        return result.scalar_one()

    # ------------------------------------------------------------------
    # Explicit soft / hard delete helpers
    # ------------------------------------------------------------------

    async def soft_delete(self, id: int) -> None:
        """Explicitly soft-delete an entity (sets ``deleted_at``).

        Raises:
            NotFoundError: Entity not found.
            AttributeError: Model does not have a ``deleted_at`` column.
        """
        if not self._has_soft_delete():
            raise AttributeError(
                f"{self.model_class.__name__} does not support soft delete "
                "(no 'deleted_at' column)"
            )
        await self.delete(id)

    async def hard_delete(self, id: int) -> None:
        """Permanently remove an entity from the database.

        Raises:
            NotFoundError: Entity not found.
        """
        obj = await self.get_by_id(id)
        if obj is None:
            raise NotFoundError(
                f"{self.model_class.__name__} with id {id} not found"
            )
        await self.session.delete(obj)
        await self.session.flush()
