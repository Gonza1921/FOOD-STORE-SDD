"""Unit tests for DireccionService — business logic with ownership enforcement.

Tests:
- create direccion (ownership, first-address auto principal)
- list_by_usuario (scoped to user)
- get_by_id (ownership-checked, other user blocked)
- update (ownership-checked, change principal)
- delete (ownership-checked, soft delete)

Uses unittest.mock to isolate DireccionService from database and UnitOfWork.
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.core.exceptions import NotFoundError
from backend.direcciones.schemas import DireccionCreate, DireccionUpdate
from backend.direcciones.service import DireccionService


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
    repo.find_by_usuario = AsyncMock(return_value=[])
    repo.find_by_usuario_and_id = AsyncMock(return_value=None)
    repo.find_principal = AsyncMock(return_value=None)
    repo.unset_principal = AsyncMock()
    repo.create = AsyncMock()
    repo.soft_delete = AsyncMock()
    return repo


@pytest.fixture
def direccion_service():
    return DireccionService()


def _make_mock_user(id: int = 1) -> MagicMock:
    return MagicMock(id=id, nombre="Test", apellido="User")


def _make_mock_direccion(id: int = 1, usuario_id: int = 1, **kwargs) -> MagicMock:
    defaults = {
        "id": id,
        "usuario_id": usuario_id,
        "alias": "Casa",
        "linea1": "Calle Falsa 123",
        "linea2": None,
        "ciudad": "Buenos Aires",
        "provincia": "CABA",
        "codigo_postal": "1000",
        "referencia": None,
        "es_principal": False,
        "creado_en": datetime.utcnow(),
        "actualizado_en": datetime.utcnow(),
        "deleted_at": None,
    }
    defaults.update(kwargs)
    return MagicMock(**defaults)


# ===========================================================================
# Tests
# ===========================================================================


class TestCreateDireccion:
    """Service.create — ownership and primary flag."""

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_create_direccion(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """Crear dirección exitosamente."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_principal.return_value = _make_mock_direccion(es_principal=True)
        mock_repo.create.return_value = _make_mock_direccion(
            id=1, alias="Trabajo", es_principal=False
        )

        current_user = _make_mock_user(id=1)
        data = DireccionCreate(
            alias="Trabajo",
            linea1="Av. Siempre Viva 742",
            ciudad="Buenos Aires",
            provincia="CABA",
            codigo_postal="1000",
        )

        direccion = await direccion_service.create(data, current_user)

        assert direccion is not None
        assert direccion.alias == "Trabajo"
        mock_repo.create.assert_called_once()

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_create_direccion_first_is_principal(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """Primera dirección del usuario se auto-asigna como principal."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        # No existing principal → first address will be auto-set as principal
        mock_repo.find_principal.return_value = None
        mock_repo.create.return_value = _make_mock_direccion(
            id=1, alias="Casa", es_principal=True
        )

        current_user = _make_mock_user(id=1)
        data = DireccionCreate(
            alias="Casa",
            linea1="Calle 123",
            ciudad="Bs As",
            provincia="CABA",
            codigo_postal="1000",
            es_principal=False,
        )

        direccion = await direccion_service.create(data, current_user)

        assert direccion.es_principal

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_create_direccion_es_principal(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """Crear dirección con es_principal=True desactiva la anterior."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.create.return_value = _make_mock_direccion(
            id=2, alias="Nueva", es_principal=True
        )

        current_user = _make_mock_user(id=1)
        data = DireccionCreate(
            alias="Nueva",
            linea1="Calle 456",
            ciudad="Bs As",
            provincia="CABA",
            codigo_postal="1000",
            es_principal=True,
        )

        await direccion_service.create(data, current_user)

        mock_repo.unset_principal.assert_called_once_with(1)


class TestGetDirecciones:
    """Service.list_by_usuario and get_by_id — ownership."""

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_get_direcciones_by_usuario(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """Listar direcciones del usuario autenticado."""
        now = datetime.utcnow()
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_usuario.return_value = [
            MagicMock(
                id=1, usuario_id=1, alias="Casa", linea1="Calle 123",
                ciudad="Bs As", provincia="CABA", codigo_postal="1000",
                es_principal=True, creado_en=now, actualizado_en=now,
                deleted_at=None, linea2=None, referencia=None,
            )
        ]

        current_user = _make_mock_user(id=1)
        direcciones = await direccion_service.list_by_usuario(current_user)

        assert len(direcciones) == 1
        assert direcciones[0].alias == "Casa"
        mock_repo.find_by_usuario.assert_called_once_with(1)

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_get_direcciones_other_user(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """No puede ver direcciones de otro usuario (vacío ≠ error)."""
        now = datetime.utcnow()
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        # User 1 has addresses, user 2 queries
        mock_repo.find_by_usuario.return_value = []

        current_user = _make_mock_user(id=2)
        direcciones = await direccion_service.list_by_usuario(current_user)

        assert len(direcciones) == 0
        mock_repo.find_by_usuario.assert_called_once_with(2)


class TestUpdateDireccion:
    """Service.update — ownership and principal management."""

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_update_direccion(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """Actualizar dirección exitosamente."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_dir = _make_mock_direccion(id=1, alias="Casa")
        mock_repo.find_by_usuario_and_id = AsyncMock(return_value=mock_dir)

        current_user = _make_mock_user(id=1)
        data = DireccionUpdate(alias="Nuevo Alias")

        direccion = await direccion_service.update(1, data, current_user)

        assert direccion is not None
        assert direccion.alias == "Nuevo Alias"

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_update_direccion_change_principal(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """Cambiar es_principal=True desactiva principal anterior."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_instance.session.add = MagicMock()
        mock_uow_instance.session.flush = AsyncMock()
        mock_uow_instance.session.refresh = AsyncMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_dir = _make_mock_direccion(id=2, alias="Nueva", es_principal=False)
        mock_repo.find_by_usuario_and_id = AsyncMock(return_value=mock_dir)

        current_user = _make_mock_user(id=1)
        data = DireccionUpdate(es_principal=True)

        await direccion_service.update(2, data, current_user)

        mock_repo.unset_principal.assert_called_once_with(1)

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_update_direccion_not_found(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """Dirección inexistente lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_usuario_and_id = AsyncMock(return_value=None)

        current_user = _make_mock_user(id=1)
        data = DireccionUpdate(alias="Nuevo")

        with pytest.raises(NotFoundError) as exc_info:
            await direccion_service.update(999, data, current_user)
        assert "no encontrada" in str(exc_info.value)


class TestDeleteDireccion:
    """Service.delete — ownership and soft delete."""

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_delete_direccion(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """Soft delete exitoso (propietario)."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_dir = _make_mock_direccion(id=1, usuario_id=1)
        mock_repo.find_by_usuario_and_id = AsyncMock(return_value=mock_dir)

        current_user = _make_mock_user(id=1)
        await direccion_service.delete(1, current_user)

        mock_repo.soft_delete.assert_called_once_with(1)

    @patch("backend.direcciones.service.UnitOfWork")
    async def test_delete_other_user_direccion(
        self, mock_uow_class, direccion_service, mock_repo
    ):
        """Eliminar dirección de otro usuario lanza NotFoundError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        # findByUsuarioAndId returns None because it checks ownership
        mock_repo.find_by_usuario_and_id = AsyncMock(return_value=None)

        current_user = _make_mock_user(id=2)  # different user
        with pytest.raises(NotFoundError) as exc_info:
            await direccion_service.delete(1, current_user)
        assert "no encontrada" in str(exc_info.value)
