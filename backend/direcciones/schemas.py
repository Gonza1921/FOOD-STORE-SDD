"""Pydantic schemas for DireccionEntrega CRUD"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DireccionCreate(BaseModel):
    """Schema for creating a new delivery address"""

    alias: Optional[str] = Field(None, max_length=50, description="Ej: Casa, Trabajo")
    linea1: str = Field(..., min_length=1, max_length=200, description="Calle y número")
    linea2: Optional[str] = Field(None, max_length=200, description="Piso, depto")
    ciudad: str = Field(..., min_length=1, max_length=50)
    provincia: str = Field(..., min_length=1, max_length=50)
    codigo_postal: str = Field(..., min_length=1, max_length=10)
    referencia: Optional[str] = Field(None, max_length=200, description="Punto de referencia")
    es_principal: bool = Field(False, description="Marcar como dirección principal")


class DireccionUpdate(BaseModel):
    """Schema for updating an existing delivery address"""

    alias: Optional[str] = Field(None, max_length=50)
    linea1: Optional[str] = Field(None, min_length=1, max_length=200)
    linea2: Optional[str] = Field(None, max_length=200)
    ciudad: Optional[str] = Field(None, min_length=1, max_length=50)
    provincia: Optional[str] = Field(None, min_length=1, max_length=50)
    codigo_postal: Optional[str] = Field(None, min_length=1, max_length=10)
    referencia: Optional[str] = Field(None, max_length=200)
    es_principal: Optional[bool] = Field(None)


class DireccionOut(BaseModel):
    """Schema for address response (excludes deleted_at)"""

    id: int
    usuario_id: int
    alias: Optional[str] = None
    linea1: str
    linea2: Optional[str] = None
    ciudad: str
    provincia: str
    codigo_postal: str
    referencia: Optional[str] = None
    es_principal: bool
    creado_en: datetime
    actualizado_en: datetime
    model_config = {"from_attributes": True}


class DireccionSetPrincipal(BaseModel):
    """Schema for setting/unsetting primary address"""

    es_principal: bool = Field(True)
