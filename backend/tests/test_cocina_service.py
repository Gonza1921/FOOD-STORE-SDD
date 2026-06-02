"""Unit tests for CocinaService — business logic layer.

Phase 5.1:
- ``toggle_disponibilidad``: change product availability
- Validation: product exists (or not), soft-deleted, state transitions

Uses unittest.mock to isolate CocinaService from database and UnitOfWork.
Following pattern from ``test_producto_service.py``.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.cocina.service import CocinaService
from backend.core.exceptions import NotFoundError


# ===========================================================================
# Fixtures
# ===========================================================================


@pytest.fixture
def mock_uow():
    """Fixture that returns a mock UnitOfWork context manager.

    Follows the same pattern as test_producto_service mock_uow fixture:
    a MagicMock that supports ``__aenter__`` / ``__aexit__`` and provides
    a ``register`` method returning a mock repository.
    """
    mock = MagicMock()
    mock.__aenter__ = AsyncMock(return_value=mock)
    mock.__aexit__ = AsyncMock(return_value=None)
    mock.session = MagicMock()
    mock.session.add = MagicMock()
    mock.session.flush = AsyncMock()
    mock.session.refresh = AsyncMock()
    mock.register = MagicMock()
    return mock


@pytest.fixture
def mock_repo():
    """Fixture that returns a mock ProductoRepository."""
    repo = MagicMock()
    repo.update = AsyncMock()
    return repo


@pytest.fixture
def cocina_service():
    """Fixture providing a fresh CocinaService instance."""
    return CocinaService()


def _make_producto(id: int = 1, disponible: bool = True, **kwargs) -> MagicMock:
    """Helper to create a consistent mock Producto."""
    defaults = {
        "id": id,
        "nombre": "Pizza Margherita",
        "descripcion": "Pizza clásica",
        "precio_base": 19.99,
        "stock_cantidad": 50,
        "disponible": disponible,
        "categoria_id": 1,
    }
    defaults.update(kwargs)
    return MagicMock(**defaults)


# ===========================================================================
# Phase 5.1: toggle_disponibilidad
# ===========================================================================


class TestToggleDisponibilidad:
    """CocinaService.toggle_disponibilidad — product availability toggling."""

    @patch("backend.cocina.service.UnitOfWork")
    async def test_available_to_not_available(
        self, mock_uow_class, mock_repo, cocina_service
    ):
        """Producto existe y disponible → cambia a no disponible (OK)."""
        # Arrange
        mock_uow = MagicMock()
        mock_uow.__aenter__ = AsyncMock(return_value=mock_uow)
        mock_uow.__aexit__ = AsyncMock(return_value=None)
        mock_uow.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow

        producto_actualizado = _make_producto(id=1, disponible=False)
        mock_repo.update = AsyncMock(return_value=producto_actualizado)

        # Act
        result = await cocina_service.toggle_disponibilidad(1, False)

        # Assert
        assert result is not None
        assert result.id == 1
        assert result.disponible is False
        mock_repo.update.assert_called_once_with(1, {"disponible": False})

    @patch("backend.cocina.service.UnitOfWork")
    async def test_not_available_to_available(
        self, mock_uow_class, mock_repo, cocina_service
    ):
        """Producto existe y no disponible → cambia a disponible (OK)."""
        # Arrange
        mock_uow = MagicMock()
        mock_uow.__aenter__ = AsyncMock(return_value=mock_uow)
        mock_uow.__aexit__ = AsyncMock(return_value=None)
        mock_uow.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow

        producto_actualizado = _make_producto(id=1, disponible=True)
        mock_repo.update = AsyncMock(return_value=producto_actualizado)

        # Act
        result = await cocina_service.toggle_disponibilidad(1, True)

        # Assert
        assert result is not None
        assert result.id == 1
        assert result.disponible is True
        mock_repo.update.assert_called_once_with(1, {"disponible": True})

    @patch("backend.cocina.service.UnitOfWork")
    async def test_product_not_found_raises_404(
        self, mock_uow_class, mock_repo, cocina_service
    ):
        """Producto no existe → raise NotFoundError (404)."""
        # Arrange
        mock_uow = MagicMock()
        mock_uow.__aenter__ = AsyncMock(return_value=mock_uow)
        mock_uow.__aexit__ = AsyncMock(return_value=None)
        mock_uow.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow

        mock_repo.update = AsyncMock(
            side_effect=NotFoundError("Producto con id 999 not found")
        )

        # Act & Assert
        with pytest.raises(NotFoundError) as exc_info:
            await cocina_service.toggle_disponibilidad(999, False)
        assert "999" in str(exc_info.value) or "no encontrado" in str(exc_info.value).lower()

    @patch("backend.cocina.service.UnitOfWork")
    async def test_soft_deleted_product_raises_404(
        self, mock_uow_class, mock_repo, cocina_service
    ):
        """Producto soft-deleted → raise NotFoundError (404)."""
        # Arrange
        mock_uow = MagicMock()
        mock_uow.__aenter__ = AsyncMock(return_value=mock_uow)
        mock_uow.__aexit__ = AsyncMock(return_value=None)
        mock_uow.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow

        # The BaseRepository.update() calls get_by_id() first, which filters
        # out soft-deleted rows. So a soft-deleted producto returns None from
        # get_by_id, and update raises NotFoundError.
        mock_repo.update = AsyncMock(
            side_effect=NotFoundError("Producto con id 1 not found")
        )

        # Act & Assert
        with pytest.raises(NotFoundError) as exc_info:
            await cocina_service.toggle_disponibilidad(1, False)
        assert "not found" in str(exc_info.value).lower()
