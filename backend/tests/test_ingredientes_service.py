"""Unit tests for IngredienteService — business logic layer.

Tests:
- create ingrediente (valid + duplicate + alergeno)
- list, get_by_id, get_by_id not found
- update, toggle alergeno
- delete (soft delete + has_active_products guard)
- list by alergeno filter

Uses unittest.mock to isolate IngredienteService from database and UnitOfWork.
Following pattern from test_producto_service.py
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.core.exceptions import ConflictError, NotFoundError
from backend.ingredientes.schemas import IngredienteCreate, IngredienteUpdate
from backend.ingredientes.service import IngredienteService

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
    repo.get_all = AsyncMock(return_value=[])
    repo.get_by_id = AsyncMock(return_value=None)
    repo.find_by_nombre = AsyncMock(return_value=None)
    repo.list_by_alergeno = AsyncMock(return_value=[])
    repo.create = AsyncMock()
    repo.has_active_products = AsyncMock(return_value=False)
    repo.hard_delete = AsyncMock()
    return repo


@pytest.fixture
def ingrediente_service():
    return IngredienteService()


def _make_mock_ingrediente(id: int = 1, **kwargs) -> MagicMock:
    defaults = {
        "id": id,
        "nombre": f"Ingrediente {id}",
        "descripcion": f"Descripción {id}",
        "es_alergeno": False,
        "creado_en": datetime.utcnow(),
        "actualizado_en": datetime.utcnow(),
    }
    defaults.update(kwargs)
    return MagicMock(**defaults)


# ===========================================================================
# Tests
# ===========================================================================


class TestCreateIngrediente:
    """Service.create — validations."""

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_create_ingrediente(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Crear ingrediente exitoso."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_nombre.return_value = None
        mock_repo.create.return_value = _make_mock_ingrediente(
            id=1, nombre="Queso", es_alergeno=False
        )

        data = IngredienteCreate(nombre="Queso", descripcion="Queso fresco")

        ingrediente = await ingrediente_service.create(data)

        assert ingrediente.nombre == "Queso"
        assert not ingrediente.es_alergeno
        mock_repo.find_by_nombre.assert_called_once_with("Queso")

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_create_ingrediente_duplicate_name(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Nombre duplicado lanza ConflictError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_nombre.return_value = _make_mock_ingrediente(
            id=1, nombre="Queso"
        )

        data = IngredienteCreate(nombre="Queso")

        with pytest.raises(ConflictError) as exc_info:
            await ingrediente_service.create(data)
        assert "ya existe" in str(exc_info.value).lower()

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_create_ingrediente_alergeno(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Crear ingrediente con es_alergeno=true."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_nombre.return_value = None
        mock_repo.create.return_value = _make_mock_ingrediente(
            id=1, nombre="Maní", es_alergeno=True
        )

        data = IngredienteCreate(nombre="Maní", es_alergeno=True)

        ingrediente = await ingrediente_service.create(data)

        assert ingrediente.nombre == "Maní"
        assert ingrediente.es_alergeno


class TestGetIngredientes:
    """Service.list and get_by_id."""

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_get_all_ingredientes(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Listar todos los ingredientes."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_all.return_value = [
            _make_mock_ingrediente(id=1, nombre="Queso"),
            _make_mock_ingrediente(id=2, nombre="Tomate"),
        ]

        ingredientes = await ingrediente_service.list()

        assert len(ingredientes) == 2
        assert ingredientes[0].nombre == "Queso"
        assert ingredientes[1].nombre == "Tomate"

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_get_ingrediente_by_id(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Obtener ingrediente por ID."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_ing = _make_mock_ingrediente(id=1, nombre="Queso")
        mock_repo.get_by_id = AsyncMock(return_value=mock_ing)

        ingrediente = await ingrediente_service.get_by_id(1)

        assert ingrediente is not None
        assert ingrediente.nombre == "Queso"

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_get_ingrediente_by_id_not_found(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """ID inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(NotFoundError) as exc_info:
            await ingrediente_service.get_by_id(999)
        assert "no encontrado" in str(exc_info.value).lower()

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_get_public_ingredientes(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Listar solo alérgenos (endpoint público)."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.list_by_alergeno.return_value = [
            _make_mock_ingrediente(id=1, nombre="Maní", es_alergeno=True),
        ]

        ingredientes = await ingrediente_service.list(es_alergeno=True)

        assert len(ingredientes) == 1
        assert ingredientes[0].es_alergeno
        mock_repo.list_by_alergeno.assert_called_once_with(True)


class TestUpdateIngrediente:
    """Service.update — validations."""

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_update_ingrediente(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Actualizar nombre de ingrediente."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_ing = _make_mock_ingrediente(id=1, nombre="Viejo")
        mock_repo.get_by_id = AsyncMock(return_value=mock_ing)

        data = IngredienteUpdate(nombre="Nuevo Nombre")

        ingrediente = await ingrediente_service.update(1, data)

        assert ingrediente.nombre == "Nuevo Nombre"

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_update_ingrediente_toggle_alergeno(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Cambiar es_alergeno de False a True."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_ing = _make_mock_ingrediente(id=1, nombre="Leche", es_alergeno=False)
        mock_repo.get_by_id = AsyncMock(return_value=mock_ing)

        data = IngredienteUpdate(es_alergeno=True)

        ingrediente = await ingrediente_service.update(1, data)

        assert ingrediente.es_alergeno

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_update_ingrediente_duplicate_name(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Nombre duplicado en update lanza ConflictError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_ing = _make_mock_ingrediente(id=1, nombre="Original")
        mock_repo.get_by_id = AsyncMock(return_value=mock_ing)
        mock_repo.find_by_nombre.return_value = _make_mock_ingrediente(
            id=2, nombre="Existente"
        )

        data = IngredienteUpdate(nombre="Existente")
        with pytest.raises(ConflictError) as exc_info:
            await ingrediente_service.update(1, data)
        assert "ya existe" in str(exc_info.value).lower()

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_update_ingrediente_not_found(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Ingrediente inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_by_id = AsyncMock(return_value=None)

        data = IngredienteUpdate(nombre="Nuevo")
        with pytest.raises(NotFoundError) as exc_info:
            await ingrediente_service.update(999, data)
        assert "no encontrado" in str(exc_info.value).lower()


class TestDeleteIngrediente:
    """Service.delete — hard delete with guards."""

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_delete_ingrediente(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Eliminar ingrediente sin productos asociados."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_ing = _make_mock_ingrediente(id=1)
        mock_repo.get_by_id = AsyncMock(return_value=mock_ing)
        mock_repo.has_active_products = AsyncMock(return_value=False)

        await ingrediente_service.delete(1)

        mock_repo.hard_delete.assert_called_once_with(1)

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_delete_ingrediente_with_products(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Ingrediente con productos asociados lanza ConflictError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_ing = _make_mock_ingrediente(id=1)
        mock_repo.get_by_id = AsyncMock(return_value=mock_ing)
        mock_repo.has_active_products = AsyncMock(return_value=True)

        with pytest.raises(ConflictError) as exc_info:
            await ingrediente_service.delete(1)
        assert "productos asociados" in str(exc_info.value).lower()

    @patch("backend.ingredientes.service.UnitOfWork")
    async def test_delete_ingrediente_not_found(
        self, mock_uow_class, ingrediente_service, mock_repo
    ):
        """Ingrediente inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(NotFoundError) as exc_info:
            await ingrediente_service.delete(999)
        assert "no encontrado" in str(exc_info.value).lower()
