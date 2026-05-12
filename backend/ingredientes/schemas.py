from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class IngredienteCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=200)
    es_alergeno: bool = False


class IngredienteUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=200)
    es_alergeno: Optional[bool] = None


class IngredienteOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    es_alergeno: bool
    creado_en: datetime
    actualizado_en: datetime
    model_config = {"from_attributes": True}
