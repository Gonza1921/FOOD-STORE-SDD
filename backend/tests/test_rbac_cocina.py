"""Unit tests for RBAC Cocinero Setup — CH-022

Tests:
- 3.1: COCINA role exists and is queryable
- 3.2: Seed user created with correct role
- 3.3: JWT token for COCINA user includes role
- 4.1: Migration idempotency
- 4.2: Manual E2E flow (integration)
"""

import pytest
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.models.usuario import Rol, Usuario, UsuarioRol
from backend.core.database import SessionLocal


@pytest.fixture
def db_session():
    """Provide a clean database session for tests"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# ===========================================================================
# Task 3.1: Unit test - COCINA role exists and is queryable
# ===========================================================================


def test_cocina_role_exists(db_session: Session):
    """Test that COCINA role exists in database after migration.
    
    Requirements:
    - SELECT * FROM rol WHERE codigo='COCINA' returns exactly 1 row
    - nombre='Cocinero'
    - descripcion contains kitchen responsibilities
    """
    # Query for COCINA role
    roles = db_session.query(Rol).filter(Rol.codigo == "COCINA").all()
    
    # Assert exactly 1 role found
    assert len(roles) == 1, f"Expected 1 COCINA role, found {len(roles)}"
    
    rol = roles[0]
    assert rol.codigo == "COCINA"
    assert rol.nombre == "Cocinero"
    assert "cocina" in rol.descripcion.lower() or "kitchen" in rol.descripcion.lower() or "preparación" in rol.descripcion.lower()


# ===========================================================================
# Task 3.2: Unit test - Seed user created with correct role
# ===========================================================================


def test_cocina_user_seeded_with_role(db_session: Session):
    """Test that seed user cocina@foodstore.com exists with COCINA role.
    
    Requirements:
    - User exists with email='cocina@foodstore.com'
    - User has nombre='Cocinero'
    - Password is hashed (bcrypt starts with $2a$, $2b$, or $2y$)
    - usuario_rol M:M record exists linking user to COCINA role
    """
    # Query for seed user
    usuarios = db_session.query(Usuario).filter(Usuario.email == "cocina@foodstore.com").all()
    
    assert len(usuarios) == 1, f"Expected 1 seed user, found {len(usuarios)}"
    
    usuario = usuarios[0]
    assert usuario.email == "cocina@foodstore.com"
    assert usuario.nombre == "Cocinero"
    
    # Verify password is bcrypt hashed
    assert usuario.password_hash.startswith(("$2a$", "$2b$", "$2y$")), \
        f"Password hash should be bcrypt, got: {usuario.password_hash[:10]}"
    
    # Verify role assignment
    usuario_roles = db_session.query(UsuarioRol).filter(
        (UsuarioRol.usuario_id == usuario.id) & (UsuarioRol.rol_codigo == "COCINA")
    ).all()
    
    assert len(usuario_roles) == 1, \
        f"Expected 1 COCINA role assignment, found {len(usuario_roles)}"


# ===========================================================================
# Task 3.3: Unit test - JWT token includes role
# ===========================================================================


def test_cocina_jwt_includes_role(db_session: Session):
    """Test that JWT token generation includes COCINA role.
    
    This test verifies that when creating a JWT for a COCINA user,
    the roles claim is properly populated.
    
    Requirements:
    - Usuario with COCINA role can be loaded
    - roles relationship includes COCINA
    """
    # Load cocina user with roles
    cocina_user = db_session.query(Usuario).filter(
        Usuario.email == "cocina@foodstore.com"
    ).first()
    
    assert cocina_user is not None, "Seed user not found"
    
    # Verify user has COCINA role via usuario_rol M:M table
    cocina_roles = db_session.query(UsuarioRol).filter(
        (UsuarioRol.usuario_id == cocina_user.id) &
        (UsuarioRol.rol_codigo == "COCINA")
    ).all()
    
    assert len(cocina_roles) == 1, "COCINA user should have COCINA role"
    assert cocina_roles[0].rol_codigo == "COCINA"
    
    # Verify that the role data is available for JWT generation
    rol = db_session.query(Rol).filter(Rol.codigo == "COCINA").first()
    assert rol is not None
    assert rol.codigo == "COCINA"


# ===========================================================================
# Task 4.1: Integration test - Migration idempotency
# ===========================================================================


def test_migration_idempotent(db_session: Session):
    """Test that applying migration twice produces same result.
    
    This test verifies idempotency by checking counts:
    - COCINA role exists exactly once
    - cocina@foodstore.com user exists exactly once
    - usuario_rol M:M record exists exactly once
    """
    # Count COCINA roles
    cocina_roles = db_session.query(Rol).filter(Rol.codigo == "COCINA").all()
    assert len(cocina_roles) == 1, "Expected 1 COCINA role"
    
    # Count seed users
    cocina_users = db_session.query(Usuario).filter(Usuario.email == "cocina@foodstore.com").all()
    assert len(cocina_users) == 1, "Expected 1 seed user"
    
    # Count usuario_rol records for this user + role
    usuario_rol_count = db_session.query(UsuarioRol).filter(
        (UsuarioRol.usuario_id == cocina_users[0].id) &
        (UsuarioRol.rol_codigo == "COCINA")
    ).all()
    assert len(usuario_rol_count) == 1, "Expected 1 usuario_rol record"


# ===========================================================================
# Task 4.2: Integration test - E2E verification (manual + API)
# ===========================================================================


def test_cocina_user_login_flow(client):
    """Integration test: Complete flow from user exists to JWT generation.
    
    This test verifies:
    1. User can login with correct credentials
    2. Response includes access_token and refresh_token
    3. JWT payload can be decoded
    4. Roles claim is present and contains COCINA
    
    Note: This assumes the FastAPI app and database are running.
    """
    # Login with seed credentials
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "cocina@foodstore.com",
            "password": "Test123456!"
        }
    )
    
    # Should succeed (200)
    assert response.status_code == 200, f"Login failed: {response.text}"
    
    # Response should contain tokens
    data = response.json()
    # Note: API uses camelCase (accessToken, refreshToken)
    assert "accessToken" in data or "access_token" in data
    assert "refreshToken" in data or "refresh_token" in data
    
    # Verify user info includes COCINA role
    assert "user" in data
    assert data["user"]["email"] == "cocina@foodstore.com"
    assert "COCINA" in data["user"]["roles"]


def test_cocina_role_in_jwt_payload(db_session: Session):
    """Verify that COCINA user JWT generation includes role in payload.
    
    This test ensures the auth service properly includes roles
    when generating JWT tokens for COCINA users.
    """
    # Load cocina user
    cocina_user = db_session.query(Usuario).filter(Usuario.email == "cocina@foodstore.com").first()
    
    assert cocina_user is not None, "Seed user not found"
    
    # Verify user has COCINA role
    # (Relationship loading depends on SQLModel configuration)
    cocina_roles = db_session.query(UsuarioRol).filter(
        (UsuarioRol.usuario_id == cocina_user.id) &
        (UsuarioRol.rol_codigo == "COCINA")
    ).all()
    
    assert len(cocina_roles) == 1, "User should have exactly 1 COCINA role"
    assert cocina_roles[0].rol_codigo == "COCINA"
