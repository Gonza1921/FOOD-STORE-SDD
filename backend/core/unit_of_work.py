"""Unit of Work pattern — atomic transaction management for async SQLAlchemy.

Encapsulates a database session and one or more repositories so that
all operations inside the ``async with`` block share the same transaction.

Usage::

    # 1. Register repositories on the UoW (typically at module init)
    class UsuarioRepository(BaseRepository[Usuario]):
        ...

    # 2. Use in a service / endpoint
    async with UnitOfWork() as uow:
        uow.register("usuarios", UsuarioRepository, Usuario)
        user = await uow.usuarios.get_by_id(1)
        user = await uow.usuarios.update(1, {"nombre": "Nuevo nombre"})
    # commit automático al salir del bloque (o rollback si hay error)
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import AsyncSessionLocal
from backend.core.repository import BaseRepository


class UnitOfWork:
    """Async context manager that provides an atomic transaction scope.

    Typical flow::

        async with UnitOfWork() as uow:
            uow.register("usuarios", UsuarioRepository, Usuario)
            usuario = await uow.usuarios.get_by_id(1)
            await uow.usuarios.update(1, {"nombre": "Actualizado"})
        # ← commit automático

    If any operation raises an exception, the transaction is rolled back
    and the exception propagates to the caller.
    """

    def __init__(self, session_factory=AsyncSessionLocal):
        """
        Args:
            session_factory: A callable that returns a new ``AsyncSession``.
                             Defaults to ``AsyncSessionLocal``.
        """
        self._session_factory = session_factory
        self.session: Optional[AsyncSession] = None
        # Registered repo CLASSES (name → (repo_class, model_class))
        self._repo_classes: dict[str, tuple[type[BaseRepository], type]] = {}
        # Instantiated repo INSTANCES (populated on __aenter__)
        self._repos: dict[str, BaseRepository] = {}

    # ------------------------------------------------------------------
    # Context manager protocol
    # ------------------------------------------------------------------

    async def __aenter__(self) -> "UnitOfWork":
        """Create a new session and instantiate all registered repositories."""
        self.session = self._session_factory()
        for name, (repo_class, model_class) in self._repo_classes.items():
            self._repos[name] = repo_class(self.session, model_class)  # type: ignore[arg-type]
        return self

    async def __aexit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[object],
    ) -> None:
        """Commit on success, rollback on exception, then close the session."""
        try:
            if exc_type is None:
                await self.session.commit()  # type: ignore[union-attr]
            else:
                await self.session.rollback()  # type: ignore[union-attr]
        finally:
            await self.session.close()  # type: ignore[union-attr]

    # ------------------------------------------------------------------
    # Repository registration
    # ------------------------------------------------------------------

    def register(
        self,
        name: str,
        repo_class: type[BaseRepository],
        model_class: type,
    ) -> BaseRepository:
        """Register a repository class for a given domain model.

        The repository will be instantiated on ``__aenter__`` with the
        UoW's session so that all operations share the same transaction.

        Args:
            name: Short alias used to access the repo (e.g. ``"usuarios"``).
            repo_class: A subclass of ``BaseRepository``.
            model_class: The SQLModel class this repository manages.

        Returns:
            The instantiated repository instance.

        NOTE: Must be called **inside** ``async with UnitOfWork() as uow:``
        so the session is already available. All service code follows this
        pattern (register inside the context block).
        """
        self._repo_classes[name] = (repo_class, model_class)
        # If we are already inside the context, instantiate immediately
        if self.session is not None:
            repo = repo_class(self.session, model_class)  # type: ignore[arg-type]
            self._repos[name] = repo
            return repo
        raise RuntimeError(
            "UnitOfWork.register() must be called inside the async context "
            "manager (after 'async with UnitOfWork() as uow:')"
        )

    # ------------------------------------------------------------------
    # Dynamic repository access
    # ------------------------------------------------------------------

    def __getattr__(self, name: str) -> BaseRepository:
        """Allow natural access like ``uow.productos.get_by_id(...)``."""
        try:
            return self._repos[name]
        except KeyError:
            raise AttributeError(
                f"'{type(self).__name__}' object has no repository registered "
                f"as '{name}'. Registered: {list(self._repos.keys())}"
            )
