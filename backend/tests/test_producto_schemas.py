"""Unit tests for Producto Pydantic schemas — validation and serialization.

Phase 9.3:
- ProductoCreate validators (precio >= 0, stock >= 0, nombre required, descripcion max 500)
- ProductoUpdate partial validators
- PatchStockRequest validation
- ProductoOut / ProductoOutPublic serialization
"""

from decimal import Decimal

import pytest
from pydantic import ValidationError

from backend.productos.schemas import (
    CategoriaRef,
    IngredienteRef,
    PatchStockRequest,
    ProductoCreate,
    ProductoOut,
    ProductoOutList,
    ProductoOutPublic,
    ProductoOutPublicList,
    ProductoUpdate,
)


# ===========================================================================
# ProductoCreate validation tests
# ===========================================================================


class TestProductoCreate:
    """Validation rules for POST /api/v1/productos."""

    def test_create_valid(self):
        """ProductoCreate válido pasa validación."""
        data = ProductoCreate(
            nombre="Pizza Margherita",
            descripcion="Pizza clásica",
            precio_base=Decimal("19.99"),
            stock_cantidad=50,
            disponible=True,
            categoria_id=1,
            categorias=[1, 2],
            ingredientes=[10, 11],
        )
        assert data.nombre == "Pizza Margherita"
        assert data.precio_base == Decimal("19.99")
        assert data.stock_cantidad == 50
        assert data.disponible is True
        assert data.categoria_id == 1
        assert data.categorias == [1, 2]
        assert data.ingredientes == [10, 11]

    def test_create_defaults(self):
        """Valores por defecto correctos."""
        data = ProductoCreate(
            nombre="Producto Simple",
            precio_base=Decimal("10.00"),
            categoria_id=1,
        )
        assert data.stock_cantidad == 0
        assert data.disponible is True
        assert data.categorias == []
        assert data.ingredientes == []
        assert data.descripcion is None

    def test_create_nombre_vacio(self):
        """Nombre vacío rechazado."""
        with pytest.raises(ValidationError) as exc:
            ProductoCreate(
                nombre="",
                precio_base=Decimal("10.00"),
                categoria_id=1,
            )
        assert "nombre" in str(exc.value).lower()

    def test_create_nombre_whitespace_only(self):
        """Nombre solo espacios rechazado."""
        with pytest.raises(ValidationError) as exc:
            ProductoCreate(
                nombre="   ",
                precio_base=Decimal("10.00"),
                categoria_id=1,
            )
        assert "nombre" in str(exc.value).lower()

    def test_create_nombre_muy_largo(self):
        """Nombre > 200 chars rechazado."""
        with pytest.raises(ValidationError):
            ProductoCreate(
                nombre="A" * 201,
                precio_base=Decimal("10.00"),
                categoria_id=1,
            )

    def test_create_precio_cero(self):
        """Precio = 0 rechazado (debe ser > 0)."""
        with pytest.raises(ValidationError) as exc:
            ProductoCreate(
                nombre="Producto",
                precio_base=Decimal("0.00"),
                categoria_id=1,
            )
        assert "precio" in str(exc.value).lower()

    def test_create_precio_negativo(self):
        """Precio < 0 rechazado."""
        with pytest.raises(ValidationError) as exc:
            ProductoCreate(
                nombre="Producto",
                precio_base=Decimal("-5.00"),
                categoria_id=1,
            )
        assert "precio" in str(exc.value).lower()

    def test_create_stock_negativo(self):
        """Stock < 0 rechazado."""
        with pytest.raises(ValidationError) as exc:
            ProductoCreate(
                nombre="Producto",
                precio_base=Decimal("10.00"),
                stock_cantidad=-1,
                categoria_id=1,
            )
        assert "stock" in str(exc.value).lower() or "negativo" in str(exc.value).lower()

    def test_create_descripcion_muy_larga(self):
        """Descripción > 500 chars rechazada."""
        with pytest.raises(ValidationError):
            ProductoCreate(
                nombre="Producto",
                precio_base=Decimal("10.00"),
                descripcion="A" * 501,
                categoria_id=1,
            )

    def test_create_categoria_id_requerido(self):
        """categoria_id es requerido."""
        with pytest.raises(ValidationError):
            ProductoCreate(
                nombre="Producto",
                precio_base=Decimal("10.00"),
            )

    def test_create_categorias_ids_invalidos(self):
        """categorias con IDs inválidos rechazados."""
        with pytest.raises(ValidationError):
            ProductoCreate(
                nombre="Producto",
                precio_base=Decimal("10.00"),
                categoria_id=1,
                categorias=[0, -1],
            )


# ===========================================================================
# ProductoUpdate validation tests
# ===========================================================================


class TestProductoUpdate:
    """Validation rules for PUT /api/v1/productos/{id}."""

    def test_update_empty(self):
        """ProductoUpdate vacío es válido (todos los campos opcionales)."""
        data = ProductoUpdate()
        assert data.nombre is None
        assert data.descripcion is None
        assert data.precio_base is None
        assert data.disponible is None
        assert data.categorias is None
        assert data.ingredientes is None

    def test_update_partial(self):
        """ProductoUpdate con algunos campos."""
        data = ProductoUpdate(nombre="Nuevo Nombre", disponible=False)
        assert data.nombre == "Nuevo Nombre"
        assert data.disponible is False
        assert data.precio_base is None

    def test_update_precio_valido(self):
        """Precio > 0 válido."""
        data = ProductoUpdate(precio_base=Decimal("25.50"))
        assert data.precio_base == Decimal("25.50")

    def test_update_precio_invalido(self):
        """Precio <= 0 en update rechazado."""
        with pytest.raises(ValidationError) as exc:
            ProductoUpdate(precio_base=Decimal("0.00"))
        assert "precio" in str(exc.value).lower()

    def test_update_categorias_list(self):
        """Lista de categorías válida."""
        data = ProductoUpdate(categorias=[1, 2, 3])
        assert data.categorias == [1, 2, 3]

    def test_update_categorias_invalidas(self):
        """IDs de categorías inválidos en update."""
        with pytest.raises(ValidationError):
            ProductoUpdate(categorias=[-1, 0])

    def test_update_nombre_vacio(self):
        """Nombre vacío en update rechazado."""
        with pytest.raises(ValidationError):
            ProductoUpdate(nombre="")


# ===========================================================================
# PatchStockRequest validation tests
# ===========================================================================


class TestPatchStockRequest:
    """Validation rules for PATCH /api/v1/productos/{id}/stock."""

    def test_stock_valido(self):
        """Stock >= 0 válido."""
        data = PatchStockRequest(nueva_cantidad=50)
        assert data.nueva_cantidad == 50

    def test_stock_cero(self):
        """Stock = 0 válido."""
        data = PatchStockRequest(nueva_cantidad=0)
        assert data.nueva_cantidad == 0

    def test_stock_negativo(self):
        """Stock < 0 rechazado."""
        with pytest.raises(ValidationError) as exc:
            PatchStockRequest(nueva_cantidad=-1)
        assert "nueva_cantidad" in str(exc.value)


# ===========================================================================
# Serialization tests
# ===========================================================================


class TestProductoOut:
    """ProductoOut serialization (admin response)."""

    def test_from_attributes(self):
        """ProductoOut serializa desde un ORM mock."""
        from datetime import datetime

        data = ProductoOut(
            id=1,
            nombre="Pizza",
            descripcion="Rica pizza",
            precio_base=Decimal("19.99"),
            stock_cantidad=50,
            disponible=True,
            categorias=[CategoriaRef(id=1, nombre="Pizzas")],
            ingredientes=[IngredienteRef(id=10, nombre="Queso")],
            creado_en=datetime(2026, 1, 1),
            actualizado_en=datetime(2026, 1, 1),
        )
        assert data.model_dump()["id"] == 1
        assert data.model_dump()["precio_base"] == Decimal("19.99")
        assert len(data.categorias) == 1
        assert len(data.ingredientes) == 1


class TestProductoOutPublic:
    """ProductoOutPublic serialization (public catalog, no auth)."""

    def test_excludes_admin_fields(self):
        """ProductoOutPublic NO incluye stock ni timestamps."""
        from datetime import datetime

        public = ProductoOutPublic(
            id=1,
            nombre="Pizza",
            descripcion="Rica",
            precio_base=Decimal("19.99"),
            disponible=True,
            categorias=[],
            ingredientes=[],
        )
        data = public.model_dump()
        assert "stock_cantidad" not in data
        assert "creado_en" not in data
        assert "actualizado_en" not in data


class TestProductoOutList:
    """ProductoOutList pagination response."""

    def test_pagination_properties(self):
        """Propiedades page y total_pages calculadas correctamente."""
        from datetime import datetime

        items = [
            ProductoOut(
                id=1, nombre="P1", descripcion=None,
                precio_base=Decimal("10.00"),
                stock_cantidad=5, disponible=True, categorias=[], ingredientes=[],
                creado_en=datetime(2026, 1, 1), actualizado_en=datetime(2026, 1, 1),
            )
        ]
        response = ProductoOutList(items=items, total=25, skip=0, limit=10)
        assert response.page == 1
        assert response.total_pages == 3  # 25 / 10 = 3 pages (rounded up)

    def test_page_calculation(self):
        """Cálculo de página según skip/limit."""
        response = ProductoOutList(items=[], total=50, skip=20, limit=10)
        assert response.page == 3  # skip=20, limit=10 → page 3


class TestProductoOutPublicList:
    """ProductoOutPublicList pagination for public catalog."""

    def test_public_list_response(self):
        """ProductoOutPublicList serializa items públicos."""
        from datetime import datetime

        items = [
            ProductoOutPublic(
                id=1, nombre="P1", descripcion=None,
                precio_base=Decimal("10.00"),
                disponible=True, categorias=[], ingredientes=[],
            )
        ]
        response = ProductoOutPublicList(items=items, total=1, skip=0, limit=20)
        assert response.page == 1
        assert response.total_pages == 1
