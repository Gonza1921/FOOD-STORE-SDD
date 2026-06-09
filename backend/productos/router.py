"""Router — HTTP endpoints for Producto CRUD (7 endpoints)

Tasks 5.1-5.7:
- POST   /api/v1/productos                      (Task 5.1) — Create producto
- GET    /api/v1/productos                      (Task 5.2) — List productos (paginated, admin)
- GET    /api/v1/productos/publico/catalogo    (Task 5.7) — Public catalog (no auth, filtered)
- GET    /api/v1/productos/{id}                 (Task 5.3) — Get producto detail (admin)
- PUT    /api/v1/productos/{id}                 (Task 5.4) — Update producto (Replace All M2M)
- PATCH  /api/v1/productos/{id}/stock          (Task 5.5) — Update stock only
- DELETE /api/v1/productos/{id}                (Task 5.6) — Soft delete producto

All endpoints use:
- UnitOfWork for atomic transactions
- ProductoService for business logic
- RBAC via require_role (except Task 5.7)
- Pydantic models for validation and serialization
- APIError subclasses for error handling (global RFC 7807 handler)

Architecture: Router → Service (no DI, no session param)
Matches patterns used in: categorias, ingredientes
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, status, File, UploadFile

from backend.core.cloudinary_service import CloudinaryError, CloudinaryService
from backend.core.config import settings
from backend.core.dependencies import require_role
from backend.models.usuario import Usuario
from .schemas import (
    PatchStockRequest,
    ProductoCreate,
    ProductoUpdate,
    ProductoOut,
    ProductoOutList,
    ProductoOutPublic,
    ProductoOutPublicDetail,
    ProductoOutPublicList,
)
from .service import ProductoService

# ============================================================================
# Router Setup
# ============================================================================

router = APIRouter(prefix="/api/v1/productos", tags=["Productos"])


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
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """Crear nuevo producto con categorías e ingredientes.

    Requiere rol: STOCK o ADMIN
    """
    service = ProductoService()

    # Preparar datos
    producto_dict = {
        "nombre": producto_data.nombre,
        "descripcion": producto_data.descripcion,
        "precio_base": producto_data.precio_base,
        "stock_cantidad": producto_data.stock_cantidad,
        "disponible": producto_data.disponible,
        "categoria_id": producto_data.categoria_id,
    }

    # Categorías: incluir categoria_id principal + adicionales (sin duplicados)
    categorias = list(
        set([producto_data.categoria_id] + (producto_data.categorias or []))
    )
    ingredientes = producto_data.ingredientes or []

    # Crear en service (atomic via UnitOfWork)
    producto = await service.create(producto_dict, categorias, ingredientes)

    # Recargar con asociaciones eager-loaded
    producto_out = await service.get_by_id(producto.id)
    return ProductoOut.model_validate(producto_out)


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
    limit: int = Query(
        100, gt=0, le=1000, description="Limit para paginación (max 1000)"
    ),
    include_deleted: bool = Query(
        False, description="Incluir productos eliminados (admin only)"
    ),
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOutList:
    """Listar todos los productos con paginación.

    Requiere rol: STOCK o ADMIN
    """
    service = ProductoService()
    items, total = await service.get_all_paginated(skip, limit, include_deleted)

    return ProductoOutList(
        items=[ProductoOut.model_validate(item) for item in items],
        total=total,
        skip=skip,
        limit=limit,
    )


# ============================================================================
# TASK 5.7: GET /api/v1/productos/publico/catalogo — Public catalog
# NOTE: Defined BEFORE /{producto_id} to avoid route capture
# ============================================================================


@router.get(
    "/publico/catalogo",
    response_model=ProductoOutPublicList,
    summary="Catálogo público de productos",
)
async def get_catalogo_publico(
    skip: int = Query(0, ge=0, description="Offset para paginación"),
    limit: int = Query(
        20, gt=0, le=100, description="Limit para paginación (max 100, default 20)"
    ),
    search: Optional[str] = Query(
        None, max_length=200, description="Buscar en nombre/descripción"
    ),
    categoria_id: Optional[int] = Query(
        None, gt=0, description="Filtrar por categoría"
    ),
    price_min: Optional[int] = Query(
        None, ge=0, description="Precio mínimo en centavos (ej: 1000 = $10.00)"
    ),
    price_max: Optional[int] = Query(
        None, ge=0, description="Precio máximo en centavos (ej: 5000 = $50.00)"
    ),
    sort_by: str = Query(
        "reciente",
        description="Ordenamiento: reciente, nombre_asc, nombre_desc, price_asc, price_desc",
    ),
    excluir_alergenos: Optional[str] = Query(
        None,
        description="Excluir productos que contengan estos ingredientes (CSV de IDs, ej: 1,3,7)",
    ),
) -> ProductoOutPublicList:
    """Obtener catálogo público de productos con filtros y ordenamiento (SIN autenticación).

    Filtros automáticos: disponible=true, deleted_at IS NULL
    """
    # Parse allergen exclusion CSV → list[int] (if feature flag enabled)
    alergenos_ids: Optional[list[int]] = None
    if (
        excluir_alergenos
        and settings.ff_filtro_alergenos
    ):
        try:
            alergenos_ids = [
                int(x.strip()) for x in excluir_alergenos.split(",") if x.strip()
            ]
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="excluir_alergenos debe ser una lista de IDs separados por coma (ej: 1,3,7)",
            )

    service = ProductoService()
    
    try:
        items, total = await service.get_public_paginated(
            skip=skip,
            limit=limit,
            search=search,
            categoria_id=categoria_id,
            price_min=price_min,
            price_max=price_max,
            sort_by=sort_by,
            excluir_alergenos=alergenos_ids,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ProductoOutPublicList(
        items=[ProductoOutPublic.model_validate(item) for item in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{producto_id}/publico",
    response_model=ProductoOutPublicDetail,
    summary="Detalle público de producto",
)
async def get_producto_publico(
    producto_id: int = Path(..., gt=0, description="ID del producto"),
) -> ProductoOutPublicDetail:
    """Obtener detalle público de un producto (SIN autenticación).

    Devuelve producto con categorías e ingredientes incluyendo es_alergeno.
    Si el producto no existe o está eliminado, retorna 404.
    """
    if not settings.ff_catalogo_detalle_publico:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    service = ProductoService()
    producto = await service.get_public_by_id(producto_id)

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return ProductoOutPublicDetail.model_validate(producto)


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
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """Obtener detalles completos de un producto específico (admin).

    Requiere rol: STOCK o ADMIN
    """
    service = ProductoService()
    producto = await service.get_by_id(producto_id)

    return ProductoOut.model_validate(producto)


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
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """Actualizar producto (Replace All M2M strategy).

    Requiere rol: STOCK o ADMIN
    """
    service = ProductoService()

    # Preparar dict con solo campos presentes
    producto_dict: dict[str, Any] = {}
    if producto_data.nombre is not None:
        producto_dict["nombre"] = producto_data.nombre
    if producto_data.descripcion is not None:
        producto_dict["descripcion"] = producto_data.descripcion
    if producto_data.precio_base is not None:
        producto_dict["precio_base"] = producto_data.precio_base
    if producto_data.disponible is not None:
        producto_dict["disponible"] = producto_data.disponible

    # Update en service (M2M handled by service, atomic via UoW)
    producto = await service.update(
        producto_id,
        producto_dict,
        categorias=producto_data.categorias,
        ingredientes=producto_data.ingredientes,
    )

    # Recargar con asociaciones
    producto_out = await service.get_by_id(producto.id)
    return ProductoOut.model_validate(producto_out)


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
    stock_request: PatchStockRequest = Body(...),
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """Actualizar stock de un producto (endpoint separado).

    Requiere rol: STOCK o ADMIN
    Validación pessimistic: nuevo_stock >= 0 (antes del UPDATE)
    """
    service = ProductoService()
    producto = await service.update_stock(producto_id, stock_request.nueva_cantidad)

    producto_out = await service.get_by_id(producto.id)
    return ProductoOut.model_validate(producto_out)


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
    current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> None:
    """Soft delete de un producto (set deleted_at = NOW()).

    Requiere rol: ADMIN (solo)
    """
    service = ProductoService()
    await service.delete(producto_id)


# ============================================================================
# IMAGE ENDPOINT: POST /api/v1/productos/{id}/imagen — Upload/replace image
# ============================================================================


@router.post(
    "/{producto_id}/imagen",
    response_model=ProductoOut,
    status_code=status.HTTP_200_OK,
    summary="Subir o reemplazar imagen de producto",
)
async def upload_producto_imagen(
    producto_id: int = Path(..., gt=0, description="ID del producto"),
    file: UploadFile = File(...),
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """Subir o reemplazar imagen de producto (Cloudinary).

    Requiere rol: STOCK o ADMIN
    Máximo 5MB. Formatos permitidos: jpg, jpeg, png, webp.
    """
    # Validate Cloudinary is configured
    if not CloudinaryService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary no está configurado. Contacte al administrador.",
        )

    # Validate file type
    allowed_mime = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_mime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Tipo de archivo no permitido: {file.content_type}. "
                "Formatos aceptados: jpg, jpeg, png, webp"
            ),
        )

    # Read file bytes and validate size (max 5MB)
    file_bytes = await file.read()
    max_size = 5 * 1024 * 1024  # 5 MB
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="La imagen supera el tamaño máximo de 5MB",
        )

    service = ProductoService()

    # Fetch producto to check existence and get current image URL
    producto = await service.get_by_id(producto_id)
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto {producto_id} no encontrado",
        )

    cloudinary = CloudinaryService()

    # If product already has an image, delete the old one from Cloudinary
    if producto.imagen_url:
        public_id = CloudinaryService.extract_public_id(producto.imagen_url)
        if public_id:
            try:
                await cloudinary.delete_image(public_id)
            except CloudinaryError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Error al eliminar imagen anterior: {exc}",
                )

    # Upload new image
    try:
        url = await cloudinary.upload_image(
            file_bytes,
            public_id=f"producto_{producto_id}",
        )
    except CloudinaryError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al subir imagen: {exc}",
        )

    # Update DB record
    producto = await service.update_imagen_url(producto_id, url)
    producto_out = await service.get_by_id(producto.id)
    return ProductoOut.model_validate(producto_out)


# ============================================================================
# IMAGE ENDPOINT: DELETE /api/v1/productos/{id}/imagen — Remove image
# ============================================================================


@router.delete(
    "/{producto_id}/imagen",
    response_model=ProductoOut,
    summary="Eliminar imagen de producto",
)
async def delete_producto_imagen(
    producto_id: int = Path(..., gt=0, description="ID del producto"),
    current_user: Usuario = Depends(require_role(["STOCK", "ADMIN"])),
) -> ProductoOut:
    """Eliminar imagen de producto (Cloudinary + DB).

    Requiere rol: STOCK o ADMIN
    """
    # Validate Cloudinary is configured
    if not CloudinaryService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary no está configurado. Contacte al administrador.",
        )

    service = ProductoService()

    # Fetch producto to check existence and get current image
    producto = await service.get_by_id(producto_id)
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto {producto_id} no encontrado",
        )

    if not producto.imagen_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El producto no tiene una imagen asociada",
        )

    # Delete from Cloudinary
    cloudinary = CloudinaryService()
    public_id = CloudinaryService.extract_public_id(producto.imagen_url)
    if public_id:
        try:
            await cloudinary.delete_image(public_id)
        except CloudinaryError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error al eliminar imagen: {exc}",
            )

    # Update DB record
    producto = await service.remove_imagen_url(producto_id)
    producto_out = await service.get_by_id(producto.id)
    return ProductoOut.model_validate(producto_out)


__all__ = ["router"]
