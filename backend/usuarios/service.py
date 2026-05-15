"""Business logic layer for user profile operations.

Each method is self-contained — it creates its own ``UnitOfWork`` with
a ``UsuarioRepository`` so the caller (router) only needs to pass request
data and handle the response.
"""

from backend.core.exceptions import APIError
from backend.core.security import get_password_hash, verify_password
from backend.core.unit_of_work import UnitOfWork
from backend.models.usuario import Usuario
from backend.usuarios.repository import UsuarioRepository
from backend.usuarios.schemas import (
    CambiarContrasenaRequest,
    PerfilResponse,
    PerfilUpdateRequest,
)


class UsuarioService:
    """Profile service — view, edit, change password."""

    async def get_perfil(self, current_user: Usuario) -> PerfilResponse:
        """Return the profile data for the authenticated user.

        Args:
            current_user: The authenticated user from JWT.

        Returns:
            A ``PerfilResponse`` with the user's data.
        """
        return PerfilResponse(
            id=current_user.id,
            nombre=current_user.nombre,
            apellido=current_user.apellido,
            email=current_user.email,
            telefono=current_user.telefono,
            creado_en=current_user.creado_en,
        )

    async def update_perfil(
        self,
        current_user: Usuario,
        request: PerfilUpdateRequest,
    ) -> PerfilResponse:
        """Update the authenticated user's profile data.

        Only ``nombre``, ``apellido``, and ``telefono`` can be updated.
        ``email`` is immutable (the user identifier).
        ``contrasena`` is changed via a dedicated endpoint.

        Args:
            current_user: The authenticated user from JWT.
            request: The fields to update.

        Returns:
            The updated ``PerfilResponse``.
        """
        update_data = request.model_dump(exclude_none=True)
        if not update_data:
            # Nothing to update — return current profile
            return await self.get_perfil(current_user)

        async with UnitOfWork() as uow:
            repo = uow.register("usuarios", UsuarioRepository, Usuario)
            updated = await repo.update(current_user.id, update_data)

        return PerfilResponse(
            id=updated.id,
            nombre=updated.nombre,
            apellido=updated.apellido,
            email=updated.email,
            telefono=updated.telefono,
            creado_en=updated.creado_en,
        )

    async def cambiar_contrasena(
        self,
        current_user: Usuario,
        request: CambiarContrasenaRequest,
    ) -> dict[str, str]:
        """Change the user's password.

        Validates the current password before updating. On success, all
        existing refresh tokens are revoked to force the user to re-login.

        Args:
            current_user: The authenticated user from JWT.
            request: Current and new password.

        Raises:
            APIError: If the current password is incorrect.
            ValidationError: If the new password doesn't meet requirements.

        Returns:
            A success message dict.
        """
        # 1. Verify current password
        if not verify_password(request.contrasena_actual, current_user.password_hash):
            raise APIError(
                message="Contraseña actual incorrecta",
                status_code=400,
                error_code="INVALID_PASSWORD",
            )

        # 2. Hash new password and update in transaction
        new_hash = get_password_hash(request.nueva_contrasena)

        async with UnitOfWork() as uow:
            repo = uow.register("usuarios", UsuarioRepository, Usuario)
            await repo.update(current_user.id, {"password_hash": new_hash})
            # 3. Invalidate all existing sessions
            await repo.revoke_all_user_tokens(current_user.id)

        return {"message": "Contraseña actualizada correctamente"}
