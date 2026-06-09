"""Main FastAPI application initialization and configuration"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Import all models to register them with SQLModel.metadata BEFORE routers load
# This ensures FK resolution works (e.g., forma_pago.codigo in Pedido model)
from backend import models  # noqa: F401

from backend.core.config import settings
from backend.core.database import check_database_health
from backend.core.exceptions import APIError, PriceConflictError
from backend.core.rate_limit import limiter
from backend.auth.router import router as auth_router
from backend.categorias.router import router as categorias_router
from backend.categorias.public.router import router as categorias_publicas_router
from backend.ingredientes.router import router as ingredientes_router
from backend.productos.router import router as productos_router
from backend.pedidos.router import router as pedidos_router
from backend.direcciones.router import router as direcciones_router
from backend.pagos.router import router as pagos_router
from backend.usuarios.router import router as usuarios_router
from backend.admin.router import router as admin_router
from backend.admin.usuarios_router import router as admin_usuarios_router
from backend.admin.metrics_router import router as admin_metrics_router
from backend.admin.config_router import router as admin_config_router
from backend.admin.analytics_router import router as admin_analytics_router
from backend.cocina.router import router as cocina_router
from backend.routers import health

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.environment == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def run_alembic_migrations():
    """Run Alembic migrations on startup"""
    try:
        from alembic.config import Config
        from alembic.command import upgrade
        
        alembic_cfg = Config("backend/alembic.ini")
        upgrade(alembic_cfg, "head")
        logger.info("✓ Alembic migrations applied successfully")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to run Alembic migrations: {e}")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting FOOD-STORE backend application")
    
    # Run database migrations
    migrations_ok = run_alembic_migrations()
    
    # Check database health
    db_health = check_database_health()
    if not db_health:
        logger.warning("Database is not reachable on startup")
    elif not migrations_ok:
        logger.warning("Migrations failed, but application started")
    else:
        logger.info("✓ Database ready and migrations applied")
    
    yield

    # Shutdown
    logger.info("Shutting down FOOD-STORE backend application")


# Create FastAPI application
app = FastAPI(
    title="FOOD-STORE API",
    description="Backend API for FOOD-STORE e-commerce platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# Configure CORS middleware
cors_origins = settings.cors_origins_list
if settings.environment == "development":
    cors_origins.append("http://localhost:8000")
    cors_origins.append("http://127.0.0.1:8000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page-Count"],
)

# Wire rate limiter into app state (required by slowapi middleware)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Request/Response logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests and responses"""
    start_time = time.time()
    request.state.start_time = start_time

    response = await call_next(request)

    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Duration: {process_time:.3f}s"
    )

    response.headers["X-Process-Time"] = str(process_time)
    return response


# ---------------------------------------------------------------------------
# Exception handlers (RFC 7807 — Problem Details for HTTP APIs)
# ---------------------------------------------------------------------------

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    """Handle ``APIError`` exceptions with RFC 7807 ``application/problem+json`` response.

    Returns a structured problem detail object that includes a machine-readable
    error code in addition to the standard RFC 7807 fields.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": f"https://example.com/errors/{exc.error_code.lower()}",
            "title": exc.error_code.replace("_", " ").title(),
            "status": exc.status_code,
            "detail": exc.message,
            "instance": str(request.url),
            "error_code": exc.error_code,
            "timestamp": time.time(),
            "details": exc.details or None,
        },
        headers={"Content-Type": "application/problem+json"},
    )


@app.exception_handler(PriceConflictError)
async def price_conflict_handler(request: Request, exc: PriceConflictError):
    """Handle PriceConflictError with structured 409 response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": "https://foodstore.internal/errors/price-conflict",
            "title": exc.message,
            "status": exc.status_code,
            "detail": "Uno o más productos cambiaron de precio",
            "productos": exc.details.get("productos", []),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unexpected exceptions.

    In production, the original error details are hidden to avoid leaking
    internal information. The full traceback is still logged server-side.
    """
    logger.exception("Unhandled exception: %s", exc)

    # Hide stack trace details in production
    if settings.environment == "production":
        detail = "An unexpected internal error occurred"
    else:
        detail = str(exc) if str(exc) else "An unexpected internal error occurred"

    return JSONResponse(
        status_code=500,
        content={
            "type": "https://example.com/errors/internal_server_error",
            "title": "Internal Server Error",
            "status": 500,
            "detail": detail,
            "instance": str(request.url),
            "error_code": "INTERNAL_SERVER_ERROR",
            "timestamp": time.time(),
        },
        headers={"Content-Type": "application/problem+json"},
    )


# Register routers
app.include_router(cocina_router)
app.include_router(health.router, tags=["health"])
app.include_router(auth_router)
app.include_router(categorias_router)
app.include_router(categorias_publicas_router)
app.include_router(ingredientes_router)
app.include_router(productos_router)
app.include_router(pedidos_router)
app.include_router(direcciones_router)
app.include_router(pagos_router)
app.include_router(usuarios_router)
app.include_router(admin_router)
app.include_router(admin_usuarios_router)
app.include_router(admin_metrics_router)
app.include_router(admin_config_router)
app.include_router(admin_analytics_router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "FOOD-STORE API",
        "version": "0.1.0",
        "environment": settings.environment,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
    )
