from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from backend.core.dependencies import require_role
from backend.core.unit_of_work import UnitOfWork
from backend.models.usuario import Usuario, Rol, UsuarioRol

router = APIRouter(prefix="/admin/usuarios", tags=["Admin Usuarios"])


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class UsuarioCreate(BaseModel):
    email: EmailStr
    nombre: str
    password: str
    roles: list[str] = ["CLIENT"]


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    roles: Optional[list[str]] = None


class UsuarioResponse(BaseModel):
    id: int
    email: str
    nombre: str
    roles: list[str]
    eliminado_en: Optional[datetime] = None
    creado_en: datetime

    class Config:
        from_attributes = True


class RolesResponse(BaseModel):
    id: int
    codigo: str
    nombre: str


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[UsuarioResponse])
async def listar_usuarios(
    current_user: Usuario = Depends(require_role(["ADMIN"])),
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
):
    """Listar todos los usuarios con paginación y búsqueda opcional"""
    async with UnitOfWork() as uow:
        query = select(Usuario).options(selectinload(Usuario.roles)).where(
            Usuario.eliminado_en == None  # noqa: E711
        )

        if search:
            query = query.where(Usuario.nombre.ilike(f"%{search}%"))

        # Total sin paginar
        total = await uow.session.scalar(
            select(func.count()).select_from(query.subquery())
        )

        # Con paginación
        query = query.offset((page - 1) * limit).limit(limit)
        result = await uow.session.execute(query)
        usuarios = result.scalars().all()

    return [
        UsuarioResponse(
            id=u.id,
            email=u.email,
            nombre=u.nombre,
            roles=[r.codigo for r in u.roles],
            eliminado_en=u.eliminado_en,
            creado_en=u.creado_en,
        )
        for u in usuarios
    ]


@router.get("/roles", response_model=list[RolesResponse])
async def listar_roles(
    current_user: Usuario = Depends(require_role(["ADMIN"])),
):
    """Listar todos los roles disponibles"""
    async with UnitOfWork() as uow:
        result = await uow.session.execute(select(Rol))
        roles = result.scalars().all()

    return [RolesResponse(id=r.id, codigo=r.codigo, nombre=r.nombre) for r in roles]


@router.get("/{usuario_id}", response_model=UsuarioResponse)
async def get_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(require_role(["ADMIN"])),
):
    """Obtener un usuario específico"""
    async with UnitOfWork() as uow:
        usuario = await uow.session.get(Usuario, usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        await uow.session.refresh(usuario, ["roles"])

    return UsuarioResponse(
        id=usuario.id,
        email=usuario.email,
        nombre=usuario.nombre,
        roles=[r.codigo for r in usuario.roles],
        eliminado_en=usuario.eliminado_en,
        creado_en=usuario.creado_en,
    )


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def crear_usuario(
    data: UsuarioCreate,
    current_user: Usuario = Depends(require_role(["ADMIN"])),
):
    """Crear un nuevo usuario"""
    from backend.auth.repository import UsuarioRepository

    async with UnitOfWork() as uow:
        repo = UsuarioRepository(uow.session)
        existing = await repo.find_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email ya está en uso",
            )

        # Buscar roles en BD
        result = await uow.session.execute(
            select(Rol).where(Rol.codigo.in_(data.roles))
        )
        roles_db = result.scalars().all()
        if len(roles_db) != len(data.roles):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uno o más roles inválidos",
            )

        # Crear usuario
        import bcrypt
        hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

        nuevo_usuario = Usuario(
            email=data.email,
            nombre=data.nombre,
            password_hash=hashed,
        )
        uow.session.add(nuevo_usuario)
        await uow.session.flush()

        # Asignar roles
        for rol in roles_db:
            usuario_rol = UsuarioRol(usuario_id=nuevo_usuario.id, rol_id=rol.id)
            uow.session.add(usuario_rol)

        await uow.session.refresh(nuevo_usuario, ["roles"])

    return UsuarioResponse(
        id=nuevo_usuario.id,
        email=nuevo_usuario.email,
        nombre=nuevo_usuario.nombre,
        roles=[r.codigo for r in nuevo_usuario.roles],
        eliminado_en=nuevo_usuario.eliminado_en,
        creado_en=nuevo_usuario.creado_en,
    )


@router.patch("/{usuario_id}", response_model=UsuarioResponse)
async def actualizar_usuario(
    usuario_id: int,
    data: UsuarioUpdate,
    current_user: Usuario = Depends(require_role(["ADMIN"])),
):
    """Actualizar un usuario (nombre, email, roles)"""
    async with UnitOfWork() as uow:
        usuario = await uow.session.get(Usuario, usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        # Actualizar nombre
        if data.nombre is not None:
            usuario.nombre = data.nombre

        # Actualizar email
        if data.email is not None:
            # Verificar que no exista otro usuario con ese email
            existing = await uow.session.execute(
                select(Usuario).where(
                    Usuario.email == data.email,
                    Usuario.id != usuario_id,
                    Usuario.eliminado_en == None,  # noqa: E711
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El email ya está en uso por otro usuario",
                )
            usuario.email = data.email

        # Actualizar roles
        if data.roles is not None:
            # Validar que ADMIN no pueda quitarse el rol ADMIN a sí mismo
            if usuario_id == current_user.id and "ADMIN" not in data.roles:
                # Verificar que hay otros admins
                admin_count = await uow.session.scalar(
                    select(func.count(Usuario.id))
                    .select_from(Usuario)
                    .join(UsuarioRol)
                    .join(Rol)
                    .where(Rol.codigo == "ADMIN")
                    .where(Usuario.eliminado_en == None)  # noqa: E711
                )
                if admin_count <= 1:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No puedes quitarte el rol ADMIN siendo el único administrador",
                    )

            # Buscar roles en BD
            result = await uow.session.execute(
                select(Rol).where(Rol.codigo.in_(data.roles))
            )
            roles_db = result.scalars().all()
            if len(roles_db) != len(data.roles):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uno o más roles inválidos",
                )

            # Eliminar roles actuales
            await uow.session.execute(
                UsuarioRol.delete().where(UsuarioRol.usuario_id == usuario_id)
            )

            # Agregar nuevos roles
            for rol in roles_db:
                usuario_rol = UsuarioRol(usuario_id=usuario_id, rol_id=rol.id)
                uow.session.add(usuario_rol)

        await uow.session.refresh(usuario, ["roles"])

    return UsuarioResponse(
        id=usuario.id,
        email=usuario.email,
        nombre=usuario.nombre,
        roles=[r.codigo for r in usuario.roles],
        eliminado_en=usuario.eliminado_en,
        creado_en=usuario.creado_en,
    )


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(require_role(["ADMIN"])),
):
    """Eliminar usuario (soft delete)"""
    async with UnitOfWork() as uow:
        usuario = await uow.session.get(Usuario, usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        # No permitir eliminarse a sí mismo
        if usuario_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminarte a ti mismo",
            )

        # Soft delete
        usuario.eliminado_en = datetime.utcnow()
        uow.session.add(usuario)
        # UoW auto-commits on exit

    return None
