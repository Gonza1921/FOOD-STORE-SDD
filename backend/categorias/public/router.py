"""Public category endpoints — no authentication required."""

from fastapi import APIRouter

from backend.categorias.schemas import CategoriaDetailOut, CategoriaPublicOut
from backend.categorias.service import CategoriaService

router = APIRouter(prefix="/api/v1/categorias/publicas", tags=["categorias-publicas"])


@router.get(
    "",
    response_model=list[CategoriaPublicOut],
)
async def list_categorias_publicas():
    """List all non-deleted categories with product counts (no auth)."""
    service = CategoriaService()
    return await service.list_publicas()


@router.get(
    "/{slug}",
    response_model=CategoriaDetailOut,
)
async def get_categoria_publica(slug: str):
    """Get category detail with subcategories and products (no auth)."""
    service = CategoriaService()
    return await service.get_public_detail(slug)
