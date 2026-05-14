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
