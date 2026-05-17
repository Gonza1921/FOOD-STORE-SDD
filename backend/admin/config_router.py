"""Router for system configuration endpoints — clave-valor editable by ADMIN"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlmodel import select

from backend.core.dependencies import require_role
from backend.core.unit_of_work import UnitOfWork
from backend.models.configuracion import Configuracion
from backend.models.usuario import Usuario

router = APIRouter(prefix="/api/v1/admin/configuracion", tags=["Admin Configuración"])


# ── Schemas ─────────────────────────────────────────────────────


class ConfiguracionItem(BaseModel):
    """Single configuration entry in responses"""

    clave: str = Field(..., description="Configuration key")
    valor: str = Field(..., description="Current value")
    descripcion: Optional[str] = Field(None, description="Human-readable description")
    actualizado_en: Optional[str] = Field(None, description="ISO timestamp of last update")


class ConfiguracionResponse(BaseModel):
    """GET /api/v1/admin/configuracion response"""

    configuraciones: list[ConfiguracionItem]


class UpdateConfigItem(BaseModel):
    """Single item in the PUT body"""

    clave: str = Field(..., min_length=1, description="Configuration key to update")
    valor: str = Field(default="", description="New value to set")
    descripcion: Optional[str] = Field(None, description="Optional description for new keys")


# ── Endpoints ───────────────────────────────────────────────────


@router.get("", response_model=ConfiguracionResponse)
async def get_configuracion(
    current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> ConfiguracionResponse:
    """Obtener toda la configuración del sistema.

    Requiere rol: ADMIN
    """
    async with UnitOfWork() as uow:
        result = await uow.session.execute(select(Configuracion))
        configs = result.scalars().all()
        return ConfiguracionResponse(
            configuraciones=[
                ConfiguracionItem(
                    clave=c.clave,
                    valor=c.valor,
                    descripcion=c.descripcion,
                    actualizado_en=c.actualizado_en.isoformat() if c.actualizado_en else None,
                )
                for c in configs
            ]
        )


@router.put("")
async def update_configuracion(
    config_data: list[UpdateConfigItem],
    current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> dict:
    """Actualizar una o más configuraciones del sistema.

    Recibe un array de {clave, valor}.
    Si la clave no existe, la crea automáticamente.
    Requiere rol: ADMIN
    """
    async with UnitOfWork() as uow:
        for item in config_data:
            stmt = select(Configuracion).where(Configuracion.clave == item.clave)
            result = await uow.session.execute(stmt)
            config = result.scalar_one_or_none()

            if config:
                config.valor = item.valor
                config.actualizado_en = datetime.utcnow()
                uow.session.add(config)
            else:
                nueva = Configuracion(
                    clave=item.clave,
                    valor=item.valor,
                    descripcion=item.descripcion or "",
                )
                uow.session.add(nueva)

    return {"message": "Configuración actualizada correctamente"}
