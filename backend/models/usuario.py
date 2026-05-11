"""User, Role, and Authentication models"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from pydantic import EmailStr


class Rol(SQLModel, table=True):
    """Role catalog - fixed 4 roles for RBAC"""
    
    codigo: str = Field(primary_key=True, max_length=20)  # ADMIN, STOCK, PEDIDOS, CLIENT
    nombre: str = Field(max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=200)


class UsuarioRol(SQLModel, table=True):
    """M:N relationship between Usuario and Rol"""
    
    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    rol_codigo: str = Field(foreign_key="rol.codigo", primary_key=True)
    asignado_en: datetime = Field(default_factory=datetime.utcnow)
    asignado_por_id: Optional[int] = Field(foreign_key="usuario.id", default=None)


class RefreshToken(SQLModel, table=True):
    """Refresh tokens for JWT rotation and secure logout"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    token_hash: str = Field(unique=True, max_length=64, index=True)  # SHA-256
    expires_at: datetime
    revoked_at: Optional[datetime] = Field(default=None)
    creado_en: datetime = Field(default_factory=datetime.utcnow)


class Usuario(SQLModel, table=True):
    """User entity with soft delete and RBAC"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: EmailStr = Field(unique=True, max_length=254, index=True)
    password_hash: str = Field(max_length=60)  # bcrypt cost ≥ 12
    nombre: str = Field(max_length=50)
    apellido: str = Field(max_length=50)
    
    # Audit
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None, index=True)
