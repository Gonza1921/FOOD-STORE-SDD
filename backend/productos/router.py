"""Router — HTTP endpoints for Producto CRUD (7 endpoints)

Tasks 5.1-5.7:
- POST   /api/v1/productos                      (Task 5.1) — Create producto
- GET    /api/v1/productos                      (Task 5.2) — List productos (paginated, admin)
- GET    /api/v1/productos/{id}                 (Task 5.3) — Get producto detail (admin)
- PUT    /api/v1/productos/{id}                 (Task 5.4) — Update producto (Replace All M2M)
- PATCH  /api/v1/productos/{id}/stock          (Task 5.5) — Update stock only
- DELETE /api/v1/productos/{id}                (Task 5.6) — Soft delete producto
- GET    /api/v1/productos/publico/catalogo    (Task 5.7) — Public catalog (no auth, filtered)

All endpoints use:
- UnitOfWork for atomic transactions
- ProductoService for business logic
- RBAC via require_role (except Task 5.7)
- Pydantic models for validation and serialization
- Decimal precision for prices
"""

from typing import Optional
from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Path,
    Body,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_async_session
from backend.core.dependencies import require_role
from backend.models.usuario import Usuario
from .schemas import (
    ProductoCreate,
    ProductoUpdate,
    ProductoOut,
    ProductoOutList,
    ProductoOutPublic,
    ProductoOutPublicList,
)
from .service import ProductoService

# ============================================================================
# Router Setup
# ============================================================================

router = APIRouter(prefix="/api/v1/productos", tags=["Productos"])


async def get_service(
    session: AsyncSession = Depends(get_async_session),
) -> ProductoService:
    """Dependency to inject ProductoService with current session"""
    return ProductoService(session)


# ============================================================================
# TASK 5.1: POST /api/v1/productos — Create producto
# ============================================================================


@router.post(
    "",
    response_model=ProductoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo producto",
)
async def create_producto(
    producto_data: ProductoCreate,
    service: ProductoService = Depends(get_service),
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """
    Crear nuevo producto con categorías e ingredientes.

    Requiere rol: STOCK o ADMIN

    Validaciones en service:
    - nombre: required, non-empty, 1-200 chars
    - precio_base: > 0 (Decimal)
    - stock_cantidad: >= 0
    - categoria_id: debe existir y no estar eliminado
    - categorias: todas deben existir
    - ingredientes: todas deben existir

    Responde: ProductoOut con id asignado + timestamps

    Errores:
    - 400 Bad Request: Validación fallida (precio <= 0, stock < 0, etc)
    - 409 Conflict: Categoría o ingrediente no existe
    - 500 Internal Server Error: Error inesperado
    """
    try:
        # Preparar datos
        producto_dict = {
            "nombre": producto_data.nombre,
            "descripcion": producto_data.descripcion,
            "precio_base": producto_data.precio_base,
            "stock_cantidad": producto_data.stock_cantidad,
            "disponible": producto_data.disponible,
            "categoria_id": producto_data.categoria_id,
        }

        # Categorías: incluir categoria_id principal + adicionales
        categorias = list(
            set([producto_data.categoria_id] + (producto_data.categorias or []))
        )
        ingredientes = producto_data.ingredientes or []

        # Crear en service (maneja transacción)
        producto = await service.create(producto_dict, categorias, ingredientes)

        # Recargar con asociaciones eager-loaded
        producto_out = await service.get_by_id(producto.id)
        return ProductoOut.model_validate(producto_out)

    except ValueError as e:
        status_code, error_dict = service.map_error_to_response(e)
        raise HTTPException(status_code=status_code, detail=error_dict["detail"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        )


# ============================================================================
# TASK 5.2: GET /api/v1/productos — List productos (paginated)
# ============================================================================


@router.get(
    "",
    response_model=ProductoOutList,
    summary="Listar productos (paginado)",
)
async def get_productos(
    skip: int = Query(0, ge=0, description="Offset para paginación"),
    limit: int = Query(100, gt=0, le=1000, description="Limit para paginación (max 1000)"),
    include_deleted: bool = Query(
        False, description="Incluir productos eliminados (admin only)"
    ),
    service: ProductoService = Depends(get_service),
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOutList:
    """
    Listar todos los productos con paginación.

    Requiere rol: STOCK o ADMIN

    Query params:
    - skip: offset (default 0)
    - limit: page size (default 100, max 1000)
    - include_deleted: bool (default False) — admin puede ver eliminados

    Responde: ProductoOutList con items paginados + metadata (total, page, total_pages)

    Errores:
    - 400 Bad Request: skip/limit inválidos
    - 500 Internal Server Error: Error inesperado
    """
    try:
        items, total = await service.get_all_paginated(skip, limit, include_deleted)

        return ProductoOutList(
            items=[ProductoOut.model_validate(item) for item in items],
            total=total,
            skip=skip,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        )


# ============================================================================
# TASK 5.3: GET /api/v1/productos/{id} — Get producto detail
# ============================================================================


@router.get(
    "/{producto_id}",
    response_model=ProductoOut,
    summary="Obtener detalle de producto",
)
async def get_producto(
    producto_id: int = Path(..., gt=0, description="ID del producto"),
    service: ProductoService = Depends(get_service),
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """
    Obtener detalles completos de un producto específico (admin).

    Requiere rol: STOCK o ADMIN

    Path params:
    - producto_id: int > 0

    Responde: ProductoOut con todas las asociaciones eager-loaded

    Errores:
    - 404 Not Found: Producto no existe o está eliminado
    - 500 Internal Server Error: Error inesperado
    """
    try:
        producto = await service.get_by_id(producto_id)

        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado",
            )

        return ProductoOut.model_validate(producto)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        )


# ============================================================================
# TASK 5.4: PUT /api/v1/productos/{id} — Update producto
# ============================================================================


@router.put(
    "/{producto_id}",
    response_model=ProductoOut,
    summary="Actualizar producto",
)
async def update_producto(
    producto_id: int = Path(..., gt=0, description="ID del producto"),
    producto_data: ProductoUpdate = Body(...),
    service: ProductoService = Depends(get_service),
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """
    Actualizar producto (Replace All M2M strategy).

    Requiere rol: STOCK o ADMIN

    Path params:
    - producto_id: int > 0

    Body: ProductoUpdate (todos campos opcionales)

    M2M Strategy (Replace All):
    - Si se proporciona categorias: DELETE old + INSERT new (atomic)
    - Si se proporciona ingredientes: DELETE old + INSERT new (atomic)
    - Si no se proporciona: se mantienen asociaciones existentes

    Responde: ProductoOut actualizado

    Errores:
    - 400 Bad Request: Validación fallida (precio <= 0, etc)
    - 404 Not Found: Producto no existe
    - 409 Conflict: Categoría/ingrediente no existe
    - 500 Internal Server Error: Error inesperado
    """
    try:
        # Preparar dict con solo campos presentes
        producto_dict = {}
        if producto_data.nombre is not None:
            producto_dict["nombre"] = producto_data.nombre
        if producto_data.descripcion is not None:
            producto_dict["descripcion"] = producto_data.descripcion
        if producto_data.precio_base is not None:
            producto_dict["precio_base"] = producto_data.precio_base
        if producto_data.disponible is not None:
            producto_dict["disponible"] = producto_data.disponible

        # Update en service (M2M handled by service)
        producto = await service.update(
            producto_id,
            producto_dict,
            categorias=producto_data.categorias,
            ingredientes=producto_data.ingredientes,
        )

        # Recargar con asociaciones
        producto_out = await service.get_by_id(producto.id)
        return ProductoOut.model_validate(producto_out)

    except ValueError as e:
        status_code, error_dict = service.map_error_to_response(e)
        raise HTTPException(status_code=status_code, detail=error_dict["detail"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        )


# ============================================================================
# TASK 5.5: PATCH /api/v1/productos/{id}/stock — Update stock
# ============================================================================


@router.patch(
    "/{producto_id}/stock",
    response_model=ProductoOut,
    summary="Actualizar stock de producto",
)
async def update_stock(
    producto_id: int = Path(..., gt=0, description="ID del producto"),
    stock_request: dict = Body(..., example={"nueva_cantidad": 100}),
    service: ProductoService = Depends(get_service),
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """
    Actualizar stock de un producto (endpoint separado).

    Requiere rol: STOCK o ADMIN

    Path params:
    - producto_id: int > 0

    Body:
    - nueva_cantidad: int >= 0

    Validación pessimistic:
    - Se valida que nueva_cantidad >= 0 ANTES de realizar UPDATE
    - Si validación falla: 400 Bad Request

    Responde: ProductoOut con stock actualizado

    Errores:
    - 400 Bad Request: Stock < 0 o inválido
    - 404 Not Found: Producto no existe
    - 500 Internal Server Error: Error inesperado
    """
    try:
        nueva_cantidad = stock_request.get("nueva_cantidad")
        if nueva_cantidad is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campo 'nueva_cantidad' requerido",
            )

        producto = await service.update_stock(producto_id, nueva_cantidad)

        producto_out = await service.get_by_id(producto.id)
        return ProductoOut.model_validate(producto_out)

    except ValueError as e:
        status_code, error_dict = service.map_error_to_response(e)
        raise HTTPException(status_code=status_code, detail=error_dict["detail"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        )


# ============================================================================
# TASK 5.6: DELETE /api/v1/productos/{id} — Soft delete
# ============================================================================


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar producto",
)
async def delete_producto(
    producto_id: int = Path(..., gt=0, description="ID del producto"),
    service: ProductoService = Depends(get_service),
    current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> None:
    """
    Soft delete de un producto (set deleted_at = NOW()).

    Requiere rol: ADMIN (solo)

    Path params:
    - producto_id: int > 0

    Operación:
    - Llama service.delete(producto_id)
    - Internamente: setea deleted_at = NOW() (soft delete)
    - Todas las queries futuras filtran deleted_at IS NULL

    Responde: 204 No Content (sin body)

    Errores:
    - 404 Not Found: Producto no existe
    - 500 Internal Server Error: Error inesperado
    """
    try:
        await service.delete(producto_id)

    except ValueError as e:
        status_code, error_dict = service.map_error_to_response(e)
        raise HTTPException(status_code=status_code, detail=error_dict["detail"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        )


# ============================================================================
# TASK 5.7: GET /api/v1/productos/publico/catalogo — Public catalog
# ============================================================================


@router.get(
    "/publico/catalogo",
    response_model=ProductoOutPublicList,
    summary="Catálogo público de productos",
)
async def get_catalogo_publico(
    skip: int = Query(0, ge=0, description="Offset para paginación"),
    limit: int = Query(100, gt=0, le=1000, description="Limit para paginación (max 1000)"),
    search: Optional[str] = Query(None, max_length=200, description="Buscar en nombre/descripción"),
    categoria_id: Optional[int] = Query(None, gt=0, description="Filtrar por categoría"),
    service: ProductoService = Depends(get_service),
) -> ProductoOutPublicList:
    """
    Obtener catálogo público de productos (SIN autenticación).

    Sin autenticación requerida — cualquiera puede acceder.

    Query params:
    - skip: offset (default 0)
    - limit: page size (default 100, max 1000)
    - search: opcional, busca en nombre + descripción (case-insensitive)
    - categoria_id: opcional, filtra por categoría ID

    Filtros automáticos (aplicados por service):
    - disponible = true (MUST)
    - deleted_at IS NULL (MUST)

    Responde: ProductoOutPublicList
    - items: list[ProductoOutPublic] (excluye stock_cantidad, timestamps, admin fields)
    - total: total de registros sin paginación
    - page, total_pages: computed properties

    Errores:
    - 400 Bad Request: skip/limit/search inválidos
    - 500 Internal Server Error: Error inesperado
    """
    try:
        items, total = await service.get_public_paginated(
            skip=skip,
            limit=limit,
            search=search,
            categoria_id=categoria_id,
        )

        return ProductoOutPublicList(
            items=[ProductoOutPublic.model_validate(item) for item in items],
            total=total,
            skip=skip,
            limit=limit,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        )


__all__ = ["router"]
