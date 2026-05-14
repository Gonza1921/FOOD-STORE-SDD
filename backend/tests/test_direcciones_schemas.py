"""Tests for DireccionEntrega Pydantic schemas — validation and serialization."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from backend.direcciones.schemas import (
    DireccionCreate,
    DireccionOut,
    DireccionSetPrincipal,
    DireccionUpdate,
)


class TestDireccionCreate:
    """Validation tests for address creation schema."""

    def test_valid_full(self):
        """All fields with valid values pass validation."""
        data = DireccionCreate(
            alias="Casa",
            linea1="Av. Siempre Viva 123",
            linea2="Piso 5 B",
            ciudad="Buenos Aires",
            provincia="CABA",
            codigo_postal="1426",
            referencia="Cerca del obelisco",
            es_principal=True,
        )
        assert data.alias == "Casa"
        assert data.linea1 == "Av. Siempre Viva 123"
        assert data.linea2 == "Piso 5 B"
        assert data.ciudad == "Buenos Aires"
        assert data.provincia == "CABA"
        assert data.codigo_postal == "1426"
        assert data.referencia == "Cerca del obelisco"
        assert data.es_principal is True

    def test_valid_minimal(self):
        """Only required fields."""
        data = DireccionCreate(
            linea1="Calle Falsa 123",
            ciudad="La Plata",
            provincia="Buenos Aires",
            codigo_postal="1900",
        )
        assert data.linea1 == "Calle Falsa 123"
        assert data.alias is None
        assert data.es_principal is False

    def test_blank_linea1_fails(self):
        """linea1 cannot be empty."""
        with pytest.raises(ValidationError):
            DireccionCreate(
                linea1="",
                ciudad="La Plata",
                provincia="Buenos Aires",
                codigo_postal="1900",
            )

    def test_codigo_postal_max_length(self):
        """codigo_postal max 10 chars."""
        with pytest.raises(ValidationError):
            DireccionCreate(
                linea1="Calle 123",
                ciudad="La Plata",
                provincia="Buenos Aires",
                codigo_postal="A" * 20,
            )

    def test_alias_max_length(self):
        """alias max 50 chars."""
        with pytest.raises(ValidationError):
            DireccionCreate(
                alias="A" * 60,
                linea1="Calle 123",
                ciudad="La Plata",
                provincia="Buenos Aires",
                codigo_postal="1900",
            )


class TestDireccionUpdate:
    """Validation tests for address update schema."""

    def test_valid_partial(self):
        """Partial update with just one field."""
        data = DireccionUpdate(alias="Trabajo")
        assert data.alias == "Trabajo"
        assert data.linea1 is None

    def test_empty_update_is_valid(self):
        """All fields optional — empty update is valid."""
        data = DireccionUpdate()
        assert data.model_dump(exclude_unset=True) == {}

    def test_es_principal_can_be_false(self):
        """es_principal can be explicitly set to False."""
        data = DireccionUpdate(es_principal=False)
        assert data.es_principal is False


class TestDireccionSetPrincipal:
    """Validation tests for set-principal schema."""

    def test_default_is_true(self):
        """Default es_principal should be True."""
        data = DireccionSetPrincipal()
        assert data.es_principal is True


class TestDireccionOut:
    """Serialization tests for address response schema."""

    def test_from_attributes(self):
        """DireccionOut can be created from a dict (simulates ORM)."""
        now = datetime.now()
        data = DireccionOut(
            id=1,
            usuario_id=42,
            alias="Casa",
            linea1="Av. Siempre Viva 123",
            linea2=None,
            ciudad="Buenos Aires",
            provincia="CABA",
            codigo_postal="1426",
            referencia=None,
            es_principal=True,
            creado_en=now,
            actualizado_en=now,
        )
        assert data.id == 1
        assert data.usuario_id == 42
        assert data.alias == "Casa"
        assert data.es_principal is True
