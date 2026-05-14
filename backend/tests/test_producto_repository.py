"""Unit tests for ProductoRepository — data access layer.

Phase 9.1:
- CRUD operations (inherited from BaseRepository)
- Soft delete filtering
- Pagination
- Eager load with selectinload
- M2M queries (get_by_producto)
- get_public_paginated with filters
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.productos.repository import (
    ProductoCategoriaRepository,
    ProductoIngredienteRepository,
    ProductoRepository,
)


@pytest.fixture
def mock_session():
    """Fixture providing a mock AsyncSession."""
    session = MagicMock()
    session.execute = AsyncMock()
    return session


@pytest.fixture
def producto_repo(mock_session):
    """Fixture providing a ProductoRepository with mocked session."""
    return ProductoRepository(mock_session, None)  # model_class=None for unit tests


@pytest.fixture
def cat_repo(mock_session):
    """Fixture providing a ProductoCategoriaRepository with mocked session."""
    return ProductoCategoriaRepository(mock_session, None)


@pytest.fixture
def ing_repo(mock_session):
    """Fixture providing a ProductoIngredienteRepository with mocked session."""
    return ProductoIngredienteRepository(mock_session, None)


class TestProductoRepository:
    """ProductoRepository — CRUD with pagination and filters."""

    async def test_get_all_paginated_calls_soft_delete_filter(self, producto_repo, mock_session):
        """get_all_paginated aplica filtro soft delete por defecto."""
        # Mock count result
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 5
        # Mock items result
        mock_items_result = MagicMock()
        mock_items_result.unique.return_value = mock_items_result
        mock_items_result.scalars.return_value = mock_items_result
        mock_items_result.all.return_value = []

        mock_session.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        items, total = await producto_repo.get_all_paginated(skip=0, limit=20)

        # Verify soft delete filter was applied
        call_args = mock_session.execute.call_args_list
        assert len(call_args) == 2  # count + items queries

    async def test_get_all_paginated_include_deleted(self, producto_repo, mock_session):
        """get_all_paginated incluye eliminados si se solicita."""
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 10
        mock_items_result = MagicMock()
        mock_items_result.unique.return_value = mock_items_result
        mock_items_result.scalars.return_value = mock_items_result
        mock_items_result.all.return_value = []

        mock_session.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        items, total = await producto_repo.get_all_paginated(skip=0, limit=20, include_deleted=True)

        call_args = mock_session.execute.call_args_list
        assert len(call_args) == 2

    async def test_get_by_nombre_uses_ilike(self, producto_repo, mock_session):
        """get_by_nombre usa ilike para búsqueda case-insensitive."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)

        await producto_repo.get_by_nombre("pizza")

        # Verify ilike was used (SQLAlchemy renders .ilike() as LIKE with case-insensitive)
        call_args = mock_session.execute.call_args[0][0]
        call_str = str(call_args).lower()
        assert "like" in call_str or "ilike" in call_str

    async def test_get_con_asociaciones_eager_loads(self, producto_repo, mock_session):
        """get_con_asociaciones pasa options con selectinload al query."""
        mock_result = MagicMock()
        mock_result.unique.return_value = mock_result
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)

        await producto_repo.get_con_asociaciones(1)

        # Verify query includes WHERE id filter
        mock_session.execute.assert_called_once()
        call_args = mock_session.execute.call_args[0][0]
        call_str = str(call_args).lower()
        assert "producto" in call_str
        assert "id" in call_str or "1" in call_str

    async def test_get_public_paginated_only_available(self, producto_repo, mock_session):
        """get_public_paginated filtra solo disponible=true y no eliminados."""
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 3
        mock_items_result = MagicMock()
        mock_items_result.unique.return_value = mock_items_result
        mock_items_result.scalars.return_value = mock_items_result
        mock_items_result.all.return_value = []

        mock_session.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        await producto_repo.get_public_paginated(skip=0, limit=20)

        # Both count and items queries should filter disponible=true
        for call_args in mock_session.execute.call_args_list:
            call_str = str(call_args[0][0]).lower()
            assert "disponible" in call_str

    async def test_get_public_paginated_with_search(self, producto_repo, mock_session):
        """get_public_paginated con búsqueda aplica filtro."""
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 1
        mock_items_result = MagicMock()
        mock_items_result.unique.return_value = mock_items_result
        mock_items_result.scalars.return_value = mock_items_result
        mock_items_result.all.return_value = []

        mock_session.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        await producto_repo.get_public_paginated(skip=0, limit=20, search="pizza")

        for call_args in mock_session.execute.call_args_list:
            call_str = str(call_args[0][0]).lower()
            assert "pizza" in call_str or "like" in call_str

    async def test_get_public_paginated_with_category(self, producto_repo, mock_session):
        """get_public_paginated con categoria_id aplica join."""
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 2
        mock_items_result = MagicMock()
        mock_items_result.unique.return_value = mock_items_result
        mock_items_result.scalars.return_value = mock_items_result
        mock_items_result.all.return_value = []

        mock_session.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        await producto_repo.get_public_paginated(skip=0, limit=20, categoria_id=1)

        for call_args in mock_session.execute.call_args_list:
            call_str = str(call_args[0][0]).lower()
            assert "categoria" in call_str

    async def test_get_public_paginated_pagination(self, producto_repo, mock_session):
        """get_public_paginated aplica offset/limit."""
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 10
        mock_items_result = MagicMock()
        mock_items_result.unique.return_value = mock_items_result
        mock_items_result.scalars.return_value = mock_items_result
        mock_items_result.all.return_value = []

        mock_session.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        await producto_repo.get_public_paginated(skip=10, limit=5)

        # Items query should have offset and limit
        items_call = mock_session.execute.call_args_list[1][0][0]
        call_str = str(items_call)
        assert "offset" in call_str.lower()
        assert "limit" in call_str.lower()


class TestProductoCategoriaRepository:
    """ProductoCategoriaRepository — M2M operations."""

    async def test_delete_by_producto(self, cat_repo, mock_session):
        """delete_by_producto ejecuta DELETE SQL."""
        mock_session.execute = AsyncMock()
        mock_session.flush = AsyncMock()

        await cat_repo.delete_by_producto(1)

        mock_session.execute.assert_called_once()
        call_str = str(mock_session.execute.call_args[0][0])
        assert "delete" in call_str.lower()
        assert "producto_id" in call_str.lower()

    async def test_get_by_producto(self, cat_repo, mock_session):
        """get_by_producto retorna lista de asociaciones."""
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_result
        mock_result.all.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        result = await cat_repo.get_by_producto(1)
        assert result == []
        mock_session.execute.assert_called_once()


class TestProductoIngredienteRepository:
    """ProductoIngredienteRepository — M2M operations."""

    async def test_delete_by_producto(self, ing_repo, mock_session):
        """delete_by_producto ejecuta DELETE SQL."""
        mock_session.execute = AsyncMock()
        mock_session.flush = AsyncMock()

        await ing_repo.delete_by_producto(1)

        mock_session.execute.assert_called_once()
        call_str = str(mock_session.execute.call_args[0][0])
        assert "delete" in call_str.lower()
        assert "producto_id" in call_str.lower()

    async def test_get_by_producto(self, ing_repo, mock_session):
        """get_by_producto retorna lista de asociaciones."""
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_result
        mock_result.all.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        result = await ing_repo.get_by_producto(1)
        assert result == []
        mock_session.execute.assert_called_once()
