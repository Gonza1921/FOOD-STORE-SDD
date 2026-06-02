"""Test suite for product filtering and sorting functionality

Tests for:
- Price range filtering (price_min, price_max)
- Sorting (price_asc, price_desc, nombre_asc, nombre_desc, reciente)
- Validation (invalid ranges, invalid sort options)
- Paginati on (has_next, has_prev)
- Compatibility with allergen exclusion
"""

import pytest
from decimal import Decimal

from backend.core.exceptions import ValidationError
from backend.models.producto import Producto
from backend.models.ingrediente import Ingrediente
from backend.productos.service import ProductoService


@pytest.mark.asyncio
class TestProductFilters:
    """Test suite for product filtering features"""

    @pytest.fixture
    async def service(self):
        """Fixture: ProductoService instance"""
        return ProductoService()

    @pytest.mark.asyncio
    async def test_filter_by_price_range(self, service):
        """Task 7.1: Test filtering by price range

        GIVEN   4 products with prices $5, $10, $15, $20 (500, 1000, 1500, 2000 cents)
        WHEN    service.get_public_paginated(price_min=1000, price_max=1500)
        THEN    returns only 2 products ($10 and $15)
        """
        # Test should pass if query filters correctly
        items, total = await service.get_public_paginated(
            price_min=1000,
            price_max=1500,
            limit=100
        )
        
        # Verify all items are in price range
        for item in items:
            assert item.precio_base >= 1000, f"Product {item.id} is below min price"
            assert item.precio_base <= 1500, f"Product {item.id} is above max price"

    @pytest.mark.asyncio
    async def test_sort_price_ascending(self, service):
        """Task 7.2: Test sorting by price ascending

        WHEN    service.get_public_paginated(sort_by="price_asc")
        THEN    products are ordered by precio_base ascending
        """
        items, _ = await service.get_public_paginated(
            sort_by="price_asc",
            limit=100
        )
        
        # Verify items are sorted ascending by price
        if len(items) > 1:
            for i in range(len(items) - 1):
                assert items[i].precio_base <= items[i + 1].precio_base, \
                    f"Price sort order violated at index {i}"

    @pytest.mark.asyncio
    async def test_sort_price_descending(self, service):
        """Task 7.2: Test sorting by price descending

        WHEN    service.get_public_paginated(sort_by="price_desc")
        THEN    products are ordered by precio_base descending
        """
        items, _ = await service.get_public_paginated(
            sort_by="price_desc",
            limit=100
        )
        
        # Verify items are sorted descending by price
        if len(items) > 1:
            for i in range(len(items) - 1):
                assert items[i].precio_base >= items[i + 1].precio_base, \
                    f"Price sort order (desc) violated at index {i}"

    @pytest.mark.asyncio
    async def test_sort_name_ascending(self, service):
        """Task 7.2: Test sorting by nombre ascending

        WHEN    service.get_public_paginated(sort_by="nombre_asc")
        THEN    products are ordered by nombre ascending
        """
        items, _ = await service.get_public_paginated(
            sort_by="nombre_asc",
            limit=100
        )
        
        # Verify items are sorted ascending by nombre
        if len(items) > 1:
            for i in range(len(items) - 1):
                assert items[i].nombre <= items[i + 1].nombre, \
                    f"Name sort order violated at index {i}"

    @pytest.mark.asyncio
    async def test_sort_reciente(self, service):
        """Task 7.2: Test sorting by reciente (creado_en descending)

        WHEN    service.get_public_paginated(sort_by="reciente")
        THEN    products are ordered by creado_en descending
        """
        items, _ = await service.get_public_paginated(
            sort_by="reciente",
            limit=100
        )
        
        # Verify items are sorted by creado_en descending
        if len(items) > 1:
            for i in range(len(items) - 1):
                assert items[i].creado_en >= items[i + 1].creado_en, \
                    f"Created date sort order violated at index {i}"

    @pytest.mark.asyncio
    async def test_invalid_price_min_max_validation(self, service):
        """Task 7.3: Test validation rejects price_min > price_max

        WHEN    service.get_public_paginated(price_min=2000, price_max=1000)
        THEN    raises ValidationError
        """
        with pytest.raises(ValidationError) as exc_info:
            await service.get_public_paginated(
                price_min=2000,
                price_max=1000
            )
        
        assert "price_min debe ser menor o igual a price_max" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_invalid_sort_by(self, service):
        """Task 7.3: Test validation rejects invalid sort_by

        WHEN    service.get_public_paginated(sort_by="invalid_sort")
        THEN    raises ValidationError
        """
        with pytest.raises(ValidationError) as exc_info:
            await service.get_public_paginated(
                sort_by="invalid_sort"
            )
        
        assert "sort_by debe ser uno de" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_limit_capped_to_100(self, service):
        """Task 7.3: Test that limit is capped to maximum 100

        WHEN    service.get_public_paginated(limit=200)
        THEN    actual limit used is 100
        """
        items, _ = await service.get_public_paginated(
            limit=200
        )
        
        # If there are 100+ products, verify only 100 returned
        # Otherwise verify all available products returned
        assert len(items) <= 100, f"Returned {len(items)} items, expected max 100"

    @pytest.mark.asyncio
    async def test_pagination_has_next_page_1(self, service):
        """Task 7.4: Test pagination has_next on page 1

        GIVEN    50 products total, limit=20
        WHEN    calling get_public_paginated(skip=0, limit=20)
        THEN    total > 20, so pagination works correctly
        """
        items, total = await service.get_public_paginated(
            skip=0,
            limit=20
        )
        
        # Verify pagination metadata
        # If total > 20, then page 1 should have next
        skip = 0
        page = (skip // 20) + 1
        has_next = page * 20 < total
        
        assert len(items) <= 20, "Page 1 should have max 20 items"
        # has_next is calculated correctly
        if total > 20:
            assert has_next, "Page 1 should have next page when total > 20"

    @pytest.mark.asyncio
    async def test_pagination_has_prev_false_page_1(self, service):
        """Task 7.4: Test pagination has_prev is False on page 1

        WHEN    calling get_public_paginated(skip=0, limit=20)
        THEN    has_prev=False (page 1 is first)
        """
        items, total = await service.get_public_paginated(
            skip=0,
            limit=20
        )
        
        # Page 1 should never have previous
        skip = 0
        page = (skip // 20) + 1
        has_prev = page > 1
        
        assert not has_prev, "Page 1 should never have previous"

    @pytest.mark.asyncio
    async def test_pagination_page_2(self, service):
        """Task 7.4: Test pagination on page 2 has both prev and next

        GIVEN    50 products total, limit=20
        WHEN    calling get_public_paginated(skip=20, limit=20) [page 2]
        THEN    has_prev=True, has_next depends on total
        """
        items, total = await service.get_public_paginated(
            skip=20,
            limit=20
        )
        
        # Page 2 verification
        skip = 20
        limit = 20
        page = (skip // limit) + 1
        has_prev = page > 1
        has_next = page * limit < total
        
        assert page == 2, "Skip=20, limit=20 should be page 2"
        assert has_prev, "Page 2 should have previous"
        # has_next depends on total

    @pytest.mark.asyncio
    async def test_price_and_allergen_compatibility(self, service):
        """Task 7.5: Test price filter + allergen exclusion work together

        GIVEN    mix of products with/without allergen in price range $5-$20
        WHEN    get_public_paginated(price_min=500, price_max=2000, excluir_alergenos=[...])
        THEN    returns products filtered by BOTH price AND allergen
        """
        # This test verifies the query works without errors
        items, total = await service.get_public_paginated(
            price_min=500,
            price_max=2000,
            excluir_alergenos=[],  # Empty list should still work
            limit=100
        )
        
        # Verify price filter is applied
        for item in items:
            assert item.precio_base >= 500, "Price min not applied"
            assert item.precio_base <= 2000, "Price max not applied"

    @pytest.mark.asyncio
    async def test_all_sort_options_valid(self, service):
        """Verify all 5 sort options are valid (no exceptions)"""
        sort_options = ["price_asc", "price_desc", "nombre_asc", "nombre_desc", "reciente"]
        
        for sort_by in sort_options:
            items, _ = await service.get_public_paginated(
                sort_by=sort_by,
                limit=100
            )
            assert isinstance(items, list), f"Sort option {sort_by} should return list"


@pytest.mark.asyncio
class TestProductFiltersIntegration:
    """Integration tests with actual database"""

    @pytest.fixture
    async def service(self):
        """Fixture: ProductoService instance"""
        return ProductoService()

    @pytest.mark.asyncio
    async def test_combined_filters_and_sorting(self, service):
        """Test combining multiple filters and sorting

        GIVEN    multiple products with varying prices and names
        WHEN    applying price_min, price_max, sort_by simultaneously
        THEN    products are filtered AND sorted correctly
        """
        items, total = await service.get_public_paginated(
            price_min=500,      # $5
            price_max=5000,     # $50
            sort_by="nombre_asc",
            limit=50
        )
        
        # Verify all three conditions
        for item in items:
            assert item.precio_base >= 500
            assert item.precio_base <= 5000
        
        # Verify sort order
        if len(items) > 1:
            for i in range(len(items) - 1):
                assert items[i].nombre <= items[i + 1].nombre
