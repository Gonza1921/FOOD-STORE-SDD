"""Auth module — registration, login, token refresh, and logout.

This module follows the feature-first convention:
- ``router.py``: FastAPI route handlers
- ``schemas.py``: Pydantic request/response models
- ``service.py``: Business logic layer
- ``repository.py``: Data access layer (inherits ``BaseRepository``)

Phase 1 scaffolding — endpoints will be added in subsequent phases.
"""

# Public API — will be populated as the module grows
# from .schemas import RegisterRequest, LoginRequest, RefreshRequest, LogoutRequest, AuthResponse
# from .service import AuthService
# from .router import router as auth_router
