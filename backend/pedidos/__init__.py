"""Pedidos module — order management with basic CRUD

This module provides:
- Schemas: Pydantic models for validation and serialization
- Repository: Data access layer with BaseRepository pattern
- Service: Business logic with UnitOfWork for atomicity
- Router: REST endpoints for Pedido CRUD

Architecture follows patterns from: auth, categorias, ingredientes, productos
"""

from .router import router

__all__ = ["router"]