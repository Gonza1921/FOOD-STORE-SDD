"""Unit tests for ProductoService — business logic layer.

Phase 9.2:
- crear_producto (valid/invalid categoria/ingredientes)
- actualizar_producto (M2M Replace All)
- actualizar_stock (pessimistic validation, >= 0)
- eliminar_producto (soft delete)
- obtener_producto (404 handling)
- listar_productos (pagination, soft delete filtering)
- obtener_catalogo_publico (filters, no auth fields)

Uses unittest.mock to isolate ProductoService from database and UnitOfWork.
Following pattern from test_auth_service.py
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.core.exceptions import ConflictError, NotFoundError, ValidationError
from backend.productos.service import ProductoService


# ===========================================================================
# Fixtures
# ===========================================================================


@pytest.fixture
def mock_uow():
    """Fixture that returns a mock UnitOfWork context manager.
    Follows pattern from test_auth_service mock_uow fixture.
    """
    mock = MagicMock()
    mock.__aenter__ = AsyncMock(return_value=mock)
    mock.__aexit__ = AsyncMock(return_value=None)
    mock.session = MagicMock()
    mock.session.add = MagicMock()
    mock.session.flush = AsyncMock()
    mock.session.refresh = AsyncMock()
    mock.session.execute = AsyncMock()
    mock.register = MagicMock()
    return mock


@pytest.fixture
def mock_repo():
    """Fixture that returns a mock ProductoRepository with all required methods."""
    repo = MagicMock()
    repo.get_all_paginated = AsyncMock(return_value=([], 0))
    repo.get_by_id = AsyncMock(return_value=None)
    repo.get_con_asociaciones = AsyncMock(return_value=None)
    repo.get_by_nombre = AsyncMock(return_value=None)
    repo.get_public_paginated = AsyncMock(return_value=([], 0))
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock()
    return repo


@pytest.fixture
def mock_cat_repo():
    """Fixture that returns a mock ProductoCategoriaRepository."""
    repo = MagicMock()
    repo.delete_by_producto = AsyncMock()
    repo.get_by_producto = AsyncMock(return_value=[])
    return repo


@pytest.fixture
def mock_ing_repo():
    """Fixture that returns a mock ProductoIngredienteRepository."""
    repo = MagicMock()
    repo.delete_by_producto = AsyncMock()
    repo.get_by_producto = AsyncMock(return_value=[])
    return repo


@pytest.fixture
def producto_service():
    """Fixture providing a fresh ProductoService instance."""
    return ProductoService()


def _make_mock_producto(id: int = 1, **kwargs) -> MagicMock:
    """Helper to create a consistent mock Producto."""
    defaults = {
        "id": id,
        "nombre": f"Producto {id}",
        "descripcion": "Descripción test",
        "precio_base": 19.99,
        "stock_cantidad": 50,
        "disponible": True,
        "categoria_id": 1,
    }
    defaults.update(kwargs)
    return MagicMock(**defaults)


# ===========================================================================
# Phase 9.2: ProductoService tests
# ===========================================================================


class TestCrearProducto:
    """Service.create — validations and atomic M2M creation."""

    @patch("backend.productos.service.UnitOfWork")
    async def test_crear_producto_success(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Crear producto exitoso con M2M associations."""
        # Arrange
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        # Mock session.execute to return valid categoria/ingrediente for validation
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = MagicMock(id=1)
        mock_uow_instance.session.execute = AsyncMock(return_value=mock_result)

        mock_repo.create.return_value = _make_mock_producto()

        producto_data = {
            "nombre": "Pizza Margherita",
            "descripcion": "Pizza clásica",
            "precio_base": 19.99,
            "stock_cantidad": 50,
            "disponible": True,
            "categoria_id": 1,
        }

        # Act
        producto = await producto_service.create(
            producto_data, categorias=[1, 2], ingredientes=[10, 11]
        )

        # Assert
        assert producto is not None
        assert producto.nombre == "Pizza Margherita"
        mock_uow_instance.session.add.assert_called()
        mock_repo.create.assert_not_called()  # service uses session.add directly

    @patch("backend.productos.service.UnitOfWork")
    async def test_crear_producto_nombre_vacio(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Nombre vacío lanza ValidationError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        producto_data = {
            "nombre": "",
            "precio_base": 19.99,
            "stock_cantidad": 50,
            "categoria_id": 1,
        }

        with pytest.raises(ValidationError) as exc_info:
            await producto_service.create(producto_data)
        assert "nombre" in str(exc_info.value).lower()

    @patch("backend.productos.service.UnitOfWork")
    async def test_crear_producto_precio_invalido(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Precio <= 0 lanza ValidationError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        producto_data = {
            "nombre": "Producto Test",
            "precio_base": 0,
            "stock_cantidad": 10,
            "categoria_id": 1,
        }

        with pytest.raises(ValidationError) as exc_info:
            await producto_service.create(producto_data)
        assert "precio" in str(exc_info.value).lower()

    @patch("backend.productos.service.UnitOfWork")
    async def test_crear_producto_stock_negativo(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Stock negativo lanza ValidationError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        producto_data = {
            "nombre": "Producto Test",
            "precio_base": 10.00,
            "stock_cantidad": -1,
            "categoria_id": 1,
        }

        with pytest.raises(ValidationError) as exc_info:
            await producto_service.create(producto_data)
        assert "stock" in str(exc_info.value).lower() or "negativo" in str(exc_info.value).lower()

    @patch("backend.productos.service.UnitOfWork")
    async def test_crear_producto_categoria_inexistente(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Categoria inexistente en update lanza ConflictError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        # Mock un producto existente para que update() no falle con NotFoundError
        mock_repo.get_by_id = AsyncMock(return_value=MagicMock(id=1, nombre="Test", categoria_id=1))
        # Mock delete_by_producto para que pase la fase DELETE (AsyncMock needed)
        mock_repo.delete_by_producto = AsyncMock()

        # Mock categoria validation: update() primero hace DELETE, luego
        # valida nuevas categorías. Mock: cat 1 ok, cat 2 no existe → ConflictError
        mock_result_valido = MagicMock()
        mock_result_valido.scalar_one_or_none.return_value = MagicMock(id=1)
        mock_result_invalido = MagicMock()
        mock_result_invalido.scalar_one_or_none.return_value = None
        mock_uow_instance.session.execute = AsyncMock(
            side_effect=[mock_result_valido, mock_result_invalido]
        )

        producto_data = {"nombre": "Actualizado", "descripcion": "Nueva descripción"}

        # Act & Assert
        with pytest.raises(ConflictError) as exc_info:
            await producto_service.update(1, producto_data, categorias=[1, 2])
        assert "categoría" in str(exc_info.value).lower() or "categoria" in str(exc_info.value).lower()

    @patch("backend.productos.service.UnitOfWork")
    async def test_actualizar_producto_not_found(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Producto inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(NotFoundError) as exc_info:
            await producto_service.update(999, {"nombre": "Nuevo"})
        assert "no encontrado" in str(exc_info.value).lower()


class TestActualizarStock:
    """Service.update_stock — pessimistic validation."""

    @patch("backend.productos.service.UnitOfWork")
    async def test_update_stock_success(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Update stock exitoso."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_producto = _make_mock_producto(stock_cantidad=30)
        mock_repo.get_by_id = AsyncMock(return_value=mock_producto)

        # Act
        producto = await producto_service.update_stock(1, 100)

        # Assert - service sets stock to 100 on the producto object
        assert producto.stock_cantidad == 100
        mock_repo.get_by_id.assert_called_once_with(1)

    @patch("backend.productos.service.UnitOfWork")
    async def test_update_stock_negativo(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Stock negativo lanza ValidationError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_producto = _make_mock_producto()
        mock_repo.get_by_id = AsyncMock(return_value=mock_producto)

        with pytest.raises(ValidationError) as exc_info:
            await producto_service.update_stock(1, -5)
        assert "negativo" in str(exc_info.value).lower() or "stock" in str(exc_info.value).lower()

    @patch("backend.productos.service.UnitOfWork")
    async def test_update_stock_producto_not_found(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Producto inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(NotFoundError) as exc_info:
            await producto_service.update_stock(999, 50)
        assert "no encontrado" in str(exc_info.value).lower()


class TestEliminarProducto:
    """Service.delete — soft delete."""

    @patch("backend.productos.service.UnitOfWork")
    async def test_eliminar_producto_success(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Soft delete exitoso."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_producto = _make_mock_producto()
        mock_repo.get_by_id = AsyncMock(return_value=mock_producto)

        result = await producto_service.delete(1)
        assert result is True
        mock_repo.delete.assert_called_once_with(1)

    @patch("backend.productos.service.UnitOfWork")
    async def test_eliminar_producto_not_found(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Producto inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(NotFoundError) as exc_info:
            await producto_service.delete(999)
        assert "no encontrado" in str(exc_info.value).lower()


class TestObtenerProducto:
    """Service.get_by_id and get_all_paginated."""

    @patch("backend.productos.service.UnitOfWork")
    async def test_obtener_producto_found(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Producto existente retorna el producto."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_producto = _make_mock_producto(id=42)
        mock_repo.get_con_asociaciones = AsyncMock(return_value=mock_producto)

        producto = await producto_service.get_by_id(42)
        assert producto is not None
        assert producto.id == 42
        mock_repo.get_con_asociaciones.assert_called_once_with(42)

    @patch("backend.productos.service.UnitOfWork")
    async def test_obtener_producto_not_found(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Producto inexistente retorna None."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_con_asociaciones = AsyncMock(return_value=None)

        producto = await producto_service.get_by_id(999)
        assert producto is None

    @patch("backend.productos.service.UnitOfWork")
    async def test_listar_productos_paginado(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Listar productos con paginación."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_items = [_make_mock_producto(id=1), _make_mock_producto(id=2)]
        mock_repo.get_all_paginated = AsyncMock(return_value=(mock_items, 2))

        items, total = await producto_service.get_all_paginated(skip=0, limit=20)
        assert len(items) == 2
        assert total == 2
        mock_repo.get_all_paginated.assert_called_once_with(0, 20, False)


class TestCatalogoPublico:
    """Service.get_public_paginated — public catalog filters."""

    @patch("backend.productos.service.UnitOfWork")
    async def test_catalogo_publico_filtros(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Catálogo público con filtros de búsqueda y categoría."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_items = [_make_mock_producto(id=1, nombre="Pizza")]
        mock_repo.get_public_paginated = AsyncMock(return_value=(mock_items, 1))

        items, total = await producto_service.get_public_paginated(
            skip=0, limit=20, search="pizza", categoria_id=1
        )
        assert len(items) == 1
        assert total == 1
        mock_repo.get_public_paginated.assert_called_once_with(0, 20, "pizza", 1, None)

    @patch("backend.productos.service.UnitOfWork")
    async def test_catalogo_publico_sin_resultados(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Catálogo público sin resultados retorna listas vacías."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_public_paginated = AsyncMock(return_value=([], 0))

        items, total = await producto_service.get_public_paginated(
            skip=0, limit=20, search="xyz", categoria_id=None
        )
        assert len(items) == 0
        assert total == 0


class TestDecrementStock:
    """Service.decrement_stock — for order confirmation."""

    @patch("backend.productos.service.UnitOfWork")
    async def test_decrement_stock_success(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Decrementar stock exitoso."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_producto = _make_mock_producto(stock_cantidad=50)
        mock_repo.get_by_id = AsyncMock(return_value=mock_producto)

        result = await producto_service.decrement_stock(1, 10)
        assert result is True

    @patch("backend.productos.service.UnitOfWork")
    async def test_decrement_stock_insufficient(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Stock insuficiente lanza ConflictError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_producto = _make_mock_producto(stock_cantidad=5)
        mock_repo.get_by_id = AsyncMock(return_value=mock_producto)

        with pytest.raises(ConflictError) as exc_info:
            await producto_service.decrement_stock(1, 10)
        assert "insuficiente" in str(exc_info.value).lower()

    @patch("backend.productos.service.UnitOfWork")
    async def test_decrement_stock_cantidad_negativa(
        self, mock_uow_class, producto_service, mock_repo
    ):
        """Cantidad negativa lanza ValidationError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_producto = _make_mock_producto()
        mock_repo.get_by_id = AsyncMock(return_value=mock_producto)

        with pytest.raises(ValidationError) as exc_info:
            await producto_service.decrement_stock(1, -5)
        assert "no puede ser negativa" in str(exc_info.value).lower()
