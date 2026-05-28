# FOOD-STORE Backend API

A FastAPI-based backend for the FOOD-STORE e-commerce platform.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Robust relational database
- **SQLAlchemy ORM**: Async support for database operations
- **JWT Authentication**: Secure token-based authentication
- **CORS Middleware**: Cross-origin resource sharing support
- **Rate Limiting**: Built-in rate limiting with slowapi
- **Health Checks**: Application and database health endpoints
- **Error Handling**: RFC 7807 compliant error responses
- **Comprehensive Logging**: Request/response logging middleware

## Prerequisites

- Python 3.10+
- PostgreSQL 12+
- pip or conda for package management

## Installation

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Environment Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/foodstore_dev

# Security - Must be at least 32 characters
SECRET_KEY=your-very-long-secret-key-with-at-least-32-characters

# JWT Configuration
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
ENVIRONMENT=development
```

### Required Environment Variables

- **DATABASE_URL**: PostgreSQL connection string (format: `postgresql://user:password@host:port/dbname`)
- **SECRET_KEY**: Secret key for JWT signing (minimum 32 characters)
- **JWT_ACCESS_TOKEN_EXPIRE_MINUTES**: Access token expiration time in minutes (default: 30)
- **CORS_ORIGINS**: Comma-separated list of allowed CORS origins (default: `http://localhost:5173`)
- **ENVIRONMENT**: Application environment - `development` or `production` (default: `development`)

## Running the Application

### Development Mode

```bash
# From the project root (not inside backend/)
uvicorn backend.main:app --reload --port 8000
```

The application will start on `http://localhost:8000`

### Production Mode

```bash
# From the project root (not inside backend/)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the application is running, you can access:

- **Swagger UI (Interactive API docs)**: http://localhost:8000/docs
- **ReDoc (Alternative API docs)**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## Health Check

Check application and database health:

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T12:00:00",
  "database": true
}
```

## Project Structure

```
backend/
├── core/                 # Core utilities
│   ├── config.py        # Configuration management
│   ├── database.py      # Database connection and session management
│   ├── exceptions.py    # Custom exception classes
│   └── security.py      # JWT and password utilities
├── models/              # Data models
│   ├── base.py          # Base models (ErrorResponse, HealthResponse)
│   └── ...              # Domain models
├── routers/             # API route handlers
│   ├── health.py        # Health check endpoints
│   └── ...              # Other routers
├── services/            # Business logic
├── middleware/          # Custom middleware
├── tests/               # Test suite
│   ├── conftest.py      # Pytest configuration
│   ├── test_config.py   # Configuration tests
│   ├── test_health.py   # Health endpoint tests
│   └── ...              # Other tests
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (not committed)
└── .env.example         # Environment variable template
```

## Development

### Running Tests

```bash
pytest -v
```

### Running Tests with Coverage

```bash
pytest --cov=backend tests/
```

### Code Formatting

```bash
black .
isort .
```

### Linting

```bash
flake8 .
```

## Security Considerations

- All configuration is loaded from environment variables
- Passwords are hashed using bcrypt
- JWT tokens are signed with HS256 algorithm
- CORS is configured to allow only specified origins
- HTTPS should be used in production
- Rate limiting is enabled to prevent abuse

## Dependencies

Key dependencies (see `requirements.txt` for full list):

- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **pydantic**: Data validation
- **sqlalchemy**: ORM with async support
- **sqlmodel**: Combines SQLAlchemy and Pydantic
- **python-jose**: JWT handling
- **bcrypt**: Password hashing
- **slowapi**: Rate limiting
- **psycopg**: PostgreSQL adapter

## Product Filtering API (CH-029)

### Overview

The public product catalog endpoint now supports advanced filtering, sorting, and pagination to enable efficient product discovery.

### Endpoint: GET /api/v1/productos/publico/catalogo

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | int | 0 | Offset for pagination (0-indexed) |
| `limit` | int | 20 | Items per page (max 100) |
| `precio_min` | int | - | Minimum price in cents (e.g., 1000 = $10.00) |
| `precio_max` | int | - | Maximum price in cents (e.g., 5000 = $50.00) |
| `sort_by` | enum | reciente | Sort option: `reciente`, `price_asc`, `price_desc`, `nombre_asc`, `nombre_desc` |
| `search` | string | - | Search term (filters by nombre or descripción) |
| `categoria_id` | int | - | Filter by category ID |
| `excluir_alergenos` | string | - | CSV of allergen IDs to exclude (e.g., "1,3,5") |

#### Response Format

```json
{
  "items": [
    {
      "id": 1,
      "nombre": "Leche descremada",
      "precio_base": 1500,
      "stock_cantidad": 10,
      "disponible": true,
      "categoria_id": 2,
      "descripcion": "Leche descremada 1L"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "has_next": true,
  "has_prev": false
}
```

#### Example Requests

**Filter by price range (cheap items: $5-$20):**
```bash
curl "http://localhost:8000/api/v1/productos/publico/catalogo?precio_min=500&precio_max=2000"
```

**Sort by price ascending:**
```bash
curl "http://localhost:8000/api/v1/productos/publico/catalogo?sort_by=price_asc&limit=50"
```

**Combine filters: price $10-$50, recent first, page 2:**
```bash
curl "http://localhost:8000/api/v1/productos/publico/catalogo?precio_min=1000&precio_max=5000&sort_by=reciente&skip=20&limit=20"
```

**Search + exclude allergens:**
```bash
curl "http://localhost:8000/api/v1/productos/publico/catalogo?search=leche&excluir_alergenos=2,4"
```

#### Validation

- Returns **400 Bad Request** if:
  - `precio_min > precio_max`
  - `sort_by` is not in enum (valid: reciente, price_asc, price_desc, nombre_asc, nombre_desc)
  - `limit > 100`
  - `page < 1`

- Example error response:
```json
{
  "detail": "precio_min no puede ser mayor a precio_max"
}
```

#### Performance Notes

- Database indexes on `(categoria_id, precio_base)` and `creado_en DESC` optimize queries
- Queries complete in <200ms for typical datasets (5k-50k items)
- TanStack Query (frontend) deduplicates identical requests within 5-minute window
- Consider pagination with `limit=20` for better performance and UX

#### Implementation Details

- Soft delete filter: `eliminado_en IS NULL` applied automatically
- Only active products: `es_activo = true` applied automatically
- Allergen exclusion uses NOT EXISTS subquery for atomic filtering
- Query builder constructs dynamic WHERE clauses based on provided filters

---

## Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists and user has permissions

### Secret Key Validation Error

- Ensure SECRET_KEY is at least 32 characters
- Use a strong random string (e.g., `openssl rand -hex 32`)

### CORS Issues

- Add your frontend URL to CORS_ORIGINS in .env
- Separate multiple origins with commas

### Port Already in Use

- Change the port: `uvicorn main:app --port 8001`
- Kill the process using the port

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and add tests
3. Run tests and linting: `pytest && flake8 .`
4. Commit with conventional commits: `git commit -m "feat: add your feature"`
5. Push to remote: `git push origin feature/your-feature`

## License

This project is part of FOOD-STORE.

## Support

For issues or questions, please contact the development team.
