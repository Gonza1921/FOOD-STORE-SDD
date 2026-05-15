"""Unit tests for UsuarioService — profile business logic layer.

Tests:
- get_perfil — returns current user data
- update_perfil — updates allowed fields, ignores email
- cambiar_contrasena — validates current password, updates hash, revokes tokens

Uses unittest.mock to isolate UsuarioService from database and UnitOfWork.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.core.exceptions import APIError
from backend.models.usuario import Usuario
from backend.usuarios.schemas import (
    CambiarContrasenaRequest,
    PerfilUpdateRequest,
)
from backend.usuarios.service import UsuarioService


# ===========================================================================
# Fixtures
# ===========================================================================


@pytest.fixture
def mock_uow():
    """Fixture that returns a mock UnitOfWork context manager."""
    mock = MagicMock()
    mock.__aenter__ = AsyncMock(return_value=mock)
    mock.__aexit__ = AsyncMock(return_value=None)
    mock.session = MagicMock()
    mock.register = MagicMock(side_effect=lambda name, cls, model: mock._repos.get(name))
    mock._repos = {}
    return mock


@pytest.fixture
def mock_repo():
    """Fixture that returns a mock UsuarioRepository."""
    repo = MagicMock()
    repo.update = AsyncMock()
    repo.revoke_all_user_tokens = AsyncMock()
    return repo


@pytest.fixture
def sample_user():
    """Fixture that returns a sample authenticated user."""
    return Usuario(
        id=1,
        nombre="Juan",
        apellido="Pérez",
        email="juan@example.com",
        password_hash="$2b$12$dummyhashdummyhashdummyhashdummyhashdummyhashdu",
        telefono="+541112345678",
        roles=[],
    )


# ===========================================================================
# Tests: get_perfil
# ===========================================================================


class TestGetPerfil:
    """Tests for UsuarioService.get_perfil."""

    async def test_returns_current_user_data(self, sample_user):
        """Should return PerfilResponse with current user data."""
        service = UsuarioService()
        result = await service.get_perfil(sample_user)

        assert result.id == sample_user.id
        assert result.nombre == sample_user.nombre
        assert result.apellido == sample_user.apellido
        assert result.email == sample_user.email
        assert result.telefono == sample_user.telefono
        assert result.creado_en == sample_user.creado_en


# ===========================================================================
# Tests: update_perfil
# ===========================================================================


class TestUpdatePerfil:
    """Tests for UsuarioService.update_perfil."""

    async def test_updates_allowed_fields(self, mock_uow, mock_repo, sample_user):
        """Should update nombre, apellido, telefono."""
        mock_uow._repos["usuarios"] = mock_repo

        updated_user = Usuario(
            id=1,
            nombre="Juan Carlos",
            apellido="Pérez López",
            email="juan@example.com",
            telefono="+5491123456789",
            password_hash=sample_user.password_hash,
            roles=[],
        )
        mock_repo.update.return_value = updated_user

        with patch("backend.usuarios.service.UnitOfWork", return_value=mock_uow):
            service = UsuarioService()
            request = PerfilUpdateRequest(
                nombre="Juan Carlos",
                apellido="Pérez López",
                telefono="+5491123456789",
            )
            result = await service.update_perfil(sample_user, request)

        assert result.nombre == "Juan Carlos"
        assert result.apellido == "Pérez López"
        assert result.telefono == "+5491123456789"
        assert result.email == "juan@example.com"  # email unchanged
        mock_repo.update.assert_called_once_with(1, {
            "nombre": "Juan Carlos",
            "apellido": "Pérez López",
            "telefono": "+5491123456789",
        })

    async def test_empty_update_returns_current(self, sample_user):
        """Should return current data if no fields to update."""
        service = UsuarioService()
        request = PerfilUpdateRequest()  # all None
        result = await service.update_perfil(sample_user, request)

        assert result.nombre == sample_user.nombre
        assert result.email == sample_user.email


# ===========================================================================
# Tests: cambiar_contrasena
# ===========================================================================


class TestCambiarContrasena:
    """Tests for UsuarioService.cambiar_contrasena."""

    async def test_changes_password_successfully(self, mock_uow, mock_repo, sample_user):
        """Should update password hash and revoke all tokens."""
        mock_uow._repos["usuarios"] = mock_repo

        with (
            patch("backend.usuarios.service.UnitOfWork", return_value=mock_uow),
            patch("backend.usuarios.service.verify_password", return_value=True),
            patch("backend.usuarios.service.get_password_hash", return_value="new_hash"),
        ):
            service = UsuarioService()
            request = CambiarContrasenaRequest(
                contrasena_actual="old_pass",
                nueva_contrasena="new_pass_123",
            )
            result = await service.cambiar_contrasena(sample_user, request)

        assert result["message"] == "Contraseña actualizada correctamente"
        mock_repo.update.assert_called_once_with(1, {"password_hash": "new_hash"})
        mock_repo.revoke_all_user_tokens.assert_called_once_with(1)

    async def test_wrong_current_password_raises_error(self, sample_user):
        """Should raise 400 error when current password is wrong."""
        with patch("backend.usuarios.service.verify_password", return_value=False):
            service = UsuarioService()
            request = CambiarContrasenaRequest(
                contrasena_actual="wrong_pass",
                nueva_contrasena="new_pass_123",
            )

            with pytest.raises(APIError) as exc:
                await service.cambiar_contrasena(sample_user, request)

            assert exc.value.status_code == 400
            assert exc.value.error_code == "INVALID_PASSWORD"
