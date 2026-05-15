"""Pydantic schemas for the profile API — request validation and response serialization.

Request schemas use snake_case field names (Python convention).
Response schemas use ``serialization_alias`` to emit camelCase in JSON.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class PerfilResponse(BaseModel):
    """Public profile data returned to the authenticated user."""

    id: int
    nombre: str
    apellido: str
    email: str
    telefono: Optional[str] = None
    creado_en: datetime = Field(serialization_alias="creadoEn")

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class PerfilUpdateRequest(BaseModel):
    """Payload for ``PUT /api/v1/usuarios/perfil``.

    Only ``nombre``, ``apellido``, and ``telefono`` are editable.
    ``email`` is intentionally excluded — it is the immutable identifier.
    """

    nombre: Optional[str] = Field(None, min_length=1, max_length=50)
    apellido: Optional[str] = Field(None, min_length=1, max_length=50)
    telefono: Optional[str] = Field(None, max_length=20)


class CambiarContrasenaRequest(BaseModel):
    """Payload for ``POST /api/v1/usuarios/perfil/cambiar-contrasena``."""

    contrasena_actual: str = Field(..., alias="contrasenaActual", min_length=1)
    nueva_contrasena: str = Field(..., alias="nuevaContrasena", min_length=8, max_length=128)

    model_config = {"populate_by_name": True}
