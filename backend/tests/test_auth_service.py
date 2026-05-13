"""Unit tests for AuthService — business logic layer.

Task 11.1-11.4:
- 11.1: AuthService.register — success + email duplicate
- 11.2: AuthService.login — success + invalid credentials
- 11.3: AuthService.refresh — rotation + replay attack + expiration
- 11.4: AuthService.logout — revoke + idempotent

Uses unittest.mock to isolate AuthService from database and UnitOfWork.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.auth.schemas import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
)
from backend.auth.service import AuthService
from backend.core.exceptions import APIError, ConflictError, UnauthorizedError


# ===========================================================================
# Fixtures
# ===========================================================================


@pytest.fixture
def mock_uow():
    """Fixture that returns a mock UnitOfWork context manager.

    The mock_uow itself is an AsyncMock that returns a mock session.
    The mock also provides attribute access for registered repos
    (e.g., ``mock_uow.auth`` returns the AuthRepository mock).
    """
    mock = MagicMock()
    mock.__aenter__ = AsyncMock(return_value=mock)
    mock.__aexit__ = AsyncMock(return_value=None)
    mock.session = MagicMock()
    # When a repo is registered, store it as an attribute
    mock.register = MagicMock(side_effect=lambda name, cls, model: mock._repos.get(name))
    mock._repos = {}
    return mock


@pytest.fixture
def mock_repo():
    """Fixture that returns a mock AuthRepository with all required methods."""
    repo = MagicMock()
    repo.find_by_email = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    repo.get_by_id = AsyncMock()
    repo.assign_role = AsyncMock()
    repo.create_refresh_token = AsyncMock()
    repo.find_refresh_token = AsyncMock()
    repo.revoke_refresh_token = AsyncMock()
    repo.revoke_all_user_tokens = AsyncMock()
    return repo


@pytest.fixture
def auth_service():
    """Fixture providing a fresh AuthService instance."""
    return AuthService()


# ===========================================================================
# Task 11.1: AuthService.register tests
# ===========================================================================


class TestRegister:
    """Task 11.1 — AuthService.register tests."""

    @patch("backend.auth.service.UnitOfWork")
    async def test_register_success_assigns_client_role(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Register exitso asigna rol CLIENT."""
        # Arrange
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_instance.session = MagicMock()
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.create.return_value = MagicMock(
            id=1, nombre="Juan", apellido="Pérez", email="juan@example.com"
        )
        mock_repo.find_by_email.return_value = None

        request = RegisterRequest(
            nombre="Juan",
            apellido="Pérez",
            email="juan@example.com",
            password="SecurePass1!",
        )

        # Act
        response = await auth_service.register(request)

        # Assert
        assert response.user.nombre == "Juan"
        assert response.user.email == "juan@example.com"
        assert "CLIENT" in response.user.roles
        assert response.access_token is not None
        assert response.refresh_token is not None

        # Verify assign_role was called with CLIENT
        mock_repo.assign_role.assert_called_once()
        call_args = mock_repo.assign_role.call_args[0]
        assert call_args[1] == "CLIENT"  # rol_codigo

    @patch("backend.auth.service.UnitOfWork")
    async def test_register_duplicate_email_raises_conflict(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Email duplicado lanza ConflictError."""
        # Arrange
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        # Simulate existing user
        mock_repo.find_by_email.return_value = MagicMock(id=1, email="juan@example.com")

        request = RegisterRequest(
            nombre="Juan",
            apellido="Pérez",
            email="juan@example.com",
            password="SecurePass1!",
        )

        # Act & Assert
        with pytest.raises(ConflictError) as exc_info:
            await auth_service.register(request)
        assert "ya está registrado" in str(exc_info.value).lower()


# ===========================================================================
# Task 11.2: AuthService.login tests
# ===========================================================================


class TestLogin:
    """Task 11.2 — AuthService.login tests."""

    @patch("backend.auth.service.UnitOfWork")
    async def test_login_success_returns_tokens(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Login exitoso retorna tokens."""
        # Arrange
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        # Create a mock user with roles
        mock_role = MagicMock()
        mock_role.codigo = "CLIENT"
        mock_user = MagicMock(
            id=1,
            nombre="Juan",
            apellido="Pérez",
            email="juan@example.com",
            password_hash="$2b$12$hashedpassword",
            roles=[mock_role],
        )
        mock_repo.find_by_email.return_value = mock_user

        # Mock password verification to return True
        with patch("backend.auth.service.verify_password", return_value=True):
            request = LoginRequest(email="juan@example.com", password="SecurePass1!")
            response = await auth_service.login(request)

        # Assert
        assert response.access_token is not None
        assert response.refresh_token is not None
        assert response.user.email == "juan@example.com"
        assert "CLIENT" in response.user.roles

    @patch("backend.auth.service.UnitOfWork")
    async def test_login_invalid_email_raises_unauthorized(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Email inexistente lanza UnauthorizedError (mensaje genérico)."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_by_email.return_value = None

        request = LoginRequest(email="noexiste@example.com", password="pass123!")
        with pytest.raises(UnauthorizedError) as exc_info:
            await auth_service.login(request)
        assert "Credenciales inválidas" in str(exc_info.value)

    @patch("backend.auth.service.UnitOfWork")
    async def test_login_wrong_password_raises_unauthorized(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Contraseña incorrecta lanza UnauthorizedError (mensaje genérico idéntico)."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_user = MagicMock(
            password_hash="$2b$12$hashed",
        )
        mock_repo.find_by_email.return_value = mock_user

        # Mock verify_password to return False (wrong password)
        with patch("backend.auth.service.verify_password", return_value=False):
            request = LoginRequest(email="juan@example.com", password="wrongpass!")
            with pytest.raises(UnauthorizedError) as exc_info:
                await auth_service.login(request)
            assert "Credenciales inválidas" in str(exc_info.value)


# ===========================================================================
# Task 11.3: AuthService.refresh tests
# ===========================================================================


class TestRefresh:
    """Task 11.3 — AuthService.refresh tests."""

    @patch("backend.auth.service.UnitOfWork")
    async def test_refresh_rotation_creates_new_token(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Rotación: token anterior revocado, nuevo token creado."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        # Existing valid token
        stored_token = MagicMock(
            revoked_at=None,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            usuario_id=1,
        )
        mock_repo.find_refresh_token.return_value = stored_token

        # Mock user
        mock_role = MagicMock()
        mock_role.codigo = "CLIENT"
        mock_user = MagicMock(id=1, nombre="Juan", email="juan@example.com", roles=[mock_role])
        mock_repo.get_by_id.return_value = mock_user

        with patch("backend.auth.service.hash_token", return_value="hashed-token"):
            with patch("backend.auth.service.create_refresh_token", return_value="new-raw-token"):
                request = RefreshRequest(refresh_token="valid-token")
                response = await auth_service.refresh(request)

        # Verify old token was revoked
        mock_repo.revoke_refresh_token.assert_called_once_with(stored_token)
        # Verify new token was created
        mock_repo.create_refresh_token.assert_called_once()
        assert response.refresh_token == "new-raw-token"

    @patch("backend.auth.service.UnitOfWork")
    async def test_refresh_replay_detection_revokes_all(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Replay attack: revoca todos los tokens del usuario."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        # Token already revoked (replay attack)
        stored_token = MagicMock(
            revoked_at=datetime.now(timezone.utc) - timedelta(hours=1),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            usuario_id=1,
        )
        mock_repo.find_refresh_token.return_value = stored_token

        with patch("backend.auth.service.hash_token", return_value="hashed-token"):
            request = RefreshRequest(refresh_token="replayed-token")
            with pytest.raises(APIError) as exc_info:
                await auth_service.refresh(request)

        # Verify all user tokens were revoked
        mock_repo.revoke_all_user_tokens.assert_called_once_with(1)
        assert exc_info.value.error_code == "SESSION_COMPROMISED"

    @patch("backend.auth.service.UnitOfWork")
    async def test_refresh_expired_token_raises_unauthorized(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Token expirado lanza UnauthorizedError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        # Expired token
        stored_token = MagicMock(
            revoked_at=None,
            expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
            usuario_id=1,
        )
        mock_repo.find_refresh_token.return_value = stored_token

        with patch("backend.auth.service.hash_token", return_value="hashed-token"):
            request = RefreshRequest(refresh_token="expired-token")
            with pytest.raises(UnauthorizedError) as exc_info:
                await auth_service.refresh(request)
        assert "expirado" in str(exc_info.value).lower()

    @patch("backend.auth.service.UnitOfWork")
    async def test_refresh_invalid_token_raises_unauthorized(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Token inválido lanza UnauthorizedError."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_refresh_token.return_value = None

        with patch("backend.auth.service.hash_token", return_value="unknown-hash"):
            request = RefreshRequest(refresh_token="invalid-token")
            with pytest.raises(UnauthorizedError) as exc_info:
                await auth_service.refresh(request)
        assert "inválido" in str(exc_info.value).lower()


# ===========================================================================
# Task 11.4: AuthService.logout tests
# ===========================================================================


class TestLogout:
    """Task 11.4 — AuthService.logout tests."""

    @patch("backend.auth.service.UnitOfWork")
    async def test_logout_revokes_token(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Logout exitoso revoca token."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        stored_token = MagicMock(revoked_at=None)
        mock_repo.find_refresh_token.return_value = stored_token

        with patch("backend.auth.service.hash_token", return_value="hashed"):
            request = LogoutRequest(refresh_token="valid-token")
            await auth_service.logout(request)

        mock_repo.revoke_refresh_token.assert_called_once_with(stored_token)

    @patch("backend.auth.service.UnitOfWork")
    async def test_logout_already_revoked_is_idempotent(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Logout con token ya revocado es idempotente (no lanza error)."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        # Token already revoked
        stored_token = MagicMock(revoked_at=datetime.now(timezone.utc))
        mock_repo.find_refresh_token.return_value = stored_token

        with patch("backend.auth.service.hash_token", return_value="hashed"):
            request = LogoutRequest(refresh_token="already-revoked")
            # Should not raise any error
            await auth_service.logout(request)

        # Should NOT call revoke again (already revoked)
        mock_repo.revoke_refresh_token.assert_not_called()

    @patch("backend.auth.service.UnitOfWork")
    async def test_logout_nonexistent_token_is_idempotent(
        self, mock_uow_class, auth_service, mock_repo
    ):
        """Logout con token inexistente es idempotente."""
        mock_uow_instance = MagicMock()
        mock_uow_instance.__aenter__ = AsyncMock(return_value=mock_uow_instance)
        mock_uow_instance.__aexit__ = AsyncMock(return_value=None)
        mock_uow_instance.register = MagicMock(return_value=mock_repo)
        mock_uow_class.return_value = mock_uow_instance

        mock_repo.find_refresh_token.return_value = None

        with patch("backend.auth.service.hash_token", return_value="missing"):
            request = LogoutRequest(refresh_token="non-existent")
            await auth_service.logout(request)

        # No operation should occur
        mock_repo.revoke_refresh_token.assert_not_called()
