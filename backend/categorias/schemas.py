from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CategoriaCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=200)
    parent_id: Optional[int] = Field(None)


class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=200)
    parent_id: Optional[int] = None


class CategoriaOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    parent_id: Optional[int] = None
    creado_en: datetime
    actualizado_en: datetime
    model_config = {"from_attributes": True}


class CategoriaTree(CategoriaOut):
    nivel: int = 0
    children: list["CategoriaTree"] = []
