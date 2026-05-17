"""Unit tests for CategoriaService — business logic layer.

Tests:
- create categoria (root + with parent)
- duplicate name validation
- invalid parent
- list, get_by_id, get_by_id not found
- update with cycle validation
- soft delete + has_active_products guard

Uses unittest.mock to isolate CategoriaService from database and UnitOfWork.
Following pattern from test_producto_service.py
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.categorias.schemas import CategoriaCreate, CategoriaUpdate
from backend.categorias.service import CategoriaService
from backend.core.exceptions import ConflictError, NotFoundError

from datetime import datetime


# ===========================================================================
# Fixtures
# ===========================================================================


@pytest.fixture
def mock_uow():
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
    repo = MagicMock()
    repo.get_tree = AsyncMock(return_value=[])
    repo.get_by_id = AsyncMock(return_value=None)
    repo.find_by_nombre_and_parent = AsyncMock(return_value=None)
    repo.get_children_count = AsyncMock(return_value=0)
    repo.get_descendant_ids = AsyncMock(return_value=[])
    repo.has_active_products = AsyncMock(return_value=False)
    repo.create = AsyncMock()
    repo.soft_delete = AsyncMock()
    repo.reassign_children = AsyncMock()
    return repo


@pytest.fixture
def categoria_service():
    return CategoriaService()


def _make_mock_categoria(id: int = 1, **kwargs) -> MagicMock:
    defaults = {
        "id": id,
        "nombre": f"Categoría {id}",
        "descripcion": f"Descripción categoría {id}",
        "parent_id": None,
        "creado_en": datetime.utcnow(),
        "actualizado_en": datetime.utcnow(),
        "deleted_at": None,
    }
    defaults.update(kwargs)
    return MagicMock(**defaults)


# ===========================================================================
# Tests
# ===========================================================================


class TestCreateCategoria:
    """Service.create — validations and hierarchy."""

    @patch("backend.categorias.service.UnitOfWork")
    async def test_create_categoria_root(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Crear categoría raíz (sin parent_id)."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_nombre_and_parent.return_value = None
        mock_repo.create.return_value = _make_mock_categoria(id=1, nombre="Bebidas")

        data = CategoriaCreate(nombre="Bebidas", descripcion="Bebidas en general")

        categoria = await categoria_service.create(data)

        assert categoria.nombre == "Bebidas"
        mock_repo.find_by_nombre_and_parent.assert_called_once_with("Bebidas", None)
        mock_repo.create.assert_called_once()

    @patch("backend.categorias.service.UnitOfWork")
    async def test_create_categoria_with_parent(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Crear categoría hija con parent_id válido."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_nombre_and_parent.return_value = None
        mock_repo.get_by_id.return_value = _make_mock_categoria(id=1, nombre="Bebidas")
        mock_repo.create.return_value = _make_mock_categoria(
            id=2, nombre="Gaseosas", parent_id=1
        )

        data = CategoriaCreate(nombre="Gaseosas", descripcion="Gaseosas", parent_id=1)

        categoria = await categoria_service.create(data)

        assert categoria.nombre == "Gaseosas"
        mock_repo.get_by_id.assert_called_with(1)

    @patch("backend.categorias.service.UnitOfWork")
    async def test_create_categoria_duplicate_name(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Nombre duplicado en mismo nivel lanza ConflictError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_nombre_and_parent.return_value = _make_mock_categoria(
            id=1, nombre="Bebidas"
        )

        data = CategoriaCreate(nombre="Bebidas")

        with pytest.raises(ConflictError) as exc_info:
            await categoria_service.create(data)
        assert "ya existe" in str(exc_info.value).lower()

    @patch("backend.categorias.service.UnitOfWork")
    async def test_create_categoria_invalid_parent(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Parent_id inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_nombre_and_parent.return_value = None
        mock_repo.get_by_id.return_value = None  # parent not found

        data = CategoriaCreate(nombre="Nueva", parent_id=999)

        with pytest.raises(NotFoundError) as exc_info:
            await categoria_service.create(data)
        assert "no encontrada" in str(exc_info.value).lower()


class TestGetCategorias:
    """Service.list and get_by_id."""

    @patch("backend.categorias.service.UnitOfWork")
    async def test_get_all_categorias(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Listar todas las categorías."""
        now = datetime.utcnow()
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_tree.return_value = [
            (1, "Bebidas", "Bebidas", None, now, now, 1),
            (2, "Gaseosas", "Gaseosas", 1, now, now, 2),
        ]

        categorias = await categoria_service.list()

        assert len(categorias) == 2
        assert categorias[0].nombre == "Bebidas"
        assert categorias[1].nombre == "Gaseosas"

    @patch("backend.categorias.service.UnitOfWork")
    async def test_get_categoria_by_id(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Obtener categoría por ID."""
        now = datetime.utcnow()
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_categoria = MagicMock(
            id=1,
            nombre="Bebidas",
            descripcion=None,
            parent_id=None,
            creado_en=now,
            actualizado_en=now,
            deleted_at=None,
        )
        mock_repo.get_by_id = AsyncMock(return_value=mock_categoria)

        categoria = await categoria_service.get_by_id(1)

        assert categoria is not None
        assert categoria.nombre == "Bebidas"

    @patch("backend.categorias.service.UnitOfWork")
    async def test_get_categoria_by_id_not_found(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """ID inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(NotFoundError) as exc_info:
            await categoria_service.get_by_id(999)
        assert "no encontrada" in str(exc_info.value).lower()


class TestUpdateCategoria:
    """Service.update — validations and cycle protection."""

    @patch("backend.categorias.service.UnitOfWork")
    async def test_update_categoria(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Actualizar nombre de categoría."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_categoria = _make_mock_categoria(id=1, nombre="Viejo Nombre")
        mock_repo.get_by_id = AsyncMock(return_value=mock_categoria)

        data = CategoriaUpdate(nombre="Nuevo Nombre")
        categoria = await categoria_service.update(1, data)

        assert categoria.nombre == "Nuevo Nombre"

    @patch("backend.categorias.service.UnitOfWork")
    async def test_update_categoria_no_cycle(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Mover categoría a nuevo padre no debe crear ciclos."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_categoria = _make_mock_categoria(id=1, nombre="Hija", parent_id=5)
        mock_repo.get_by_id = AsyncMock(return_value=mock_categoria)
        mock_repo.get_descendant_ids = AsyncMock(return_value=[3, 4])

        # Cambiar a parent_id=2 (válido, no es descendiente)
        data = CategoriaUpdate(parent_id=2)
        await categoria_service.update(1, data)

        mock_repo.get_descendant_ids.assert_called_once_with(1)

    @patch("backend.categorias.service.UnitOfWork")
    async def test_update_categoria_cycle_detected(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Mover categoría a un descendiente suyo lanza ConflictError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_categoria = _make_mock_categoria(id=1, nombre="Padre")
        mock_repo.get_by_id = AsyncMock(return_value=mock_categoria)
        mock_repo.get_descendant_ids = AsyncMock(return_value=[2, 3, 4])

        # Intentar mover a parent_id=3 (es descendiente)
        data = CategoriaUpdate(parent_id=3)
        with pytest.raises(ConflictError) as exc_info:
            await categoria_service.update(1, data)
        assert "descendiente" in str(exc_info.value).lower()

    @patch("backend.categorias.service.UnitOfWork")
    async def test_update_categoria_self_parent(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Categoría no puede ser su propio padre."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_categoria = _make_mock_categoria(id=1)
        mock_repo.get_by_id = AsyncMock(return_value=mock_categoria)

        data = CategoriaUpdate(parent_id=1)
        with pytest.raises(ConflictError) as exc_info:
            await categoria_service.update(1, data)
        assert "su propio padre" in str(exc_info.value).lower()


class TestDeleteCategoria:
    """Service.delete — soft delete with guards."""

    @patch("backend.categorias.service.UnitOfWork")
    async def test_delete_categoria(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Soft delete exitoso."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_categoria = _make_mock_categoria(id=1, parent_id=None)
        mock_repo.get_by_id = AsyncMock(return_value=mock_categoria)
        mock_repo.has_active_products = AsyncMock(return_value=False)

        await categoria_service.delete(1)

        mock_repo.reassign_children.assert_called_once_with(1, None)
        mock_repo.soft_delete.assert_called_once_with(1)

    @patch("backend.categorias.service.UnitOfWork")
    async def test_delete_categoria_with_products(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Categoría con productos activos lanza ConflictError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_categoria = _make_mock_categoria(id=1)
        mock_repo.get_by_id = AsyncMock(return_value=mock_categoria)
        mock_repo.has_active_products = AsyncMock(return_value=True)

        with pytest.raises(ConflictError) as exc_info:
            await categoria_service.delete(1)
        assert "productos asociados" in str(exc_info.value).lower()

    @patch("backend.categorias.service.UnitOfWork")
    async def test_delete_categoria_not_found(
        self, mock_uow_class, categoria_service, mock_repo
    ):
        """Categoría inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(NotFoundError) as exc_info:
            await categoria_service.delete(999)
        assert "no encontrada" in str(exc_info.value).lower()
