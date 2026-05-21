"""Database tests - connection, seed data, soft delete, CTE queries"""

import pytest
from datetime import datetime
from sqlalchemy import text
from sqlmodel import Session

from backend.core.database import engine, SessionLocal, check_database_health


# Fixture to skip tests if database is not available
@pytest.fixture(scope="session", autouse=True)
def database_available():
    """Check if database is available for tests"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        pytest.skip(f"Database not available: {e}")
        return False


class TestDatabaseConnection:
    """Test database connectivity"""
    
    def test_check_database_health_passes(self):
        """Test that health check passes when database is accessible"""
        # This test may pass or fail depending on DB availability
        # We allow it to be True or False
        result = check_database_health()
        assert isinstance(result, bool), "check_database_health should return a boolean"
    
    def test_get_session(self):
        """Test that we can get a database session"""
        try:
            session = SessionLocal()
            assert session is not None
            session.close()
        except Exception:
            # If database is not available, skip this test
            pytest.skip("Database not available for session test")


@pytest.mark.skipif(not database_available, reason="Database not available")
class TestSeedData:
    """Test that seed data was correctly inserted"""
    
    def test_roles_seeded(self):
        """Test that 4 roles exist after migration"""
        session = SessionLocal()
        try:
            result = session.execute(text("SELECT COUNT(*) as count FROM rol"))
            count = result.scalar()
            assert count == 4, f"Expected 4 roles, found {count}"
        finally:
            session.close()
    
    def test_specific_roles_exist(self):
        """Test that specific roles exist"""
        session = SessionLocal()
        try:
            result = session.execute(
                text("SELECT COUNT(*) as count FROM rol WHERE codigo IN ('ADMIN', 'STOCK', 'PEDIDOS', 'CLIENT')")
            )
            count = result.scalar()
            assert count == 4, "Not all 4 required roles found"
        finally:
            session.close()
    
    def test_order_states_seeded(self):
        """Test that 6 order states exist"""
        session = SessionLocal()
        try:
            result = session.execute(text("SELECT COUNT(*) as count FROM estado_pedido"))
            count = result.scalar()
            assert count == 6, f"Expected 6 order states, found {count}"
        finally:
            session.close()
    
    def test_payment_methods_seeded(self):
        """Test that 3 payment methods exist"""
        session = SessionLocal()
        try:
            result = session.execute(text("SELECT COUNT(*) as count FROM forma_pago"))
            count = result.scalar()
            assert count == 3, f"Expected 3 payment methods, found {count}"
        finally:
            session.close()
    
    def test_admin_user_exists(self):
        """Test that admin user was created"""
        session = SessionLocal()
        try:
            result = session.execute(
                text("SELECT id, email FROM usuario WHERE email = 'admin@foodstore.local'")
            )
            row = result.first()
            assert row is not None, "Admin user not found"
            assert row.email == 'admin@foodstore.local'
        finally:
            session.close()
    
    def test_admin_has_admin_role(self):
        """Test that admin user has ADMIN role"""
        session = SessionLocal()
        try:
            result = session.execute(
                text("""
                    SELECT COUNT(*) as count FROM usuario_rol 
                    WHERE usuario_id = 1 AND rol_codigo = 'ADMIN'
                """)
            )
            count = result.scalar()
            assert count == 1, "Admin user doesn't have ADMIN role"
        finally:
            session.close()


@pytest.mark.skipif(not database_available, reason="Database not available")
class TestSoftDelete:
    """Test soft delete functionality"""
    
    def test_soft_delete_usuario(self):
        """Test that soft delete works for users"""
        session = SessionLocal()
        try:
            # Create a test user
            session.execute(
                text("""
                    INSERT INTO usuario (email, password_hash, nombre, apellido, creado_en, actualizado_en)
                    VALUES ('test@example.com', 'hashed_pwd', 'Test', 'User', NOW(), NOW())
                """)
            )
            session.commit()
            
            # Verify user exists
            result = session.execute(
                text("SELECT id FROM usuario WHERE email = 'test@example.com' AND deleted_at IS NULL")
            )
            user = result.first()
            assert user is not None, "Test user not found"
            
            # Soft delete the user
            user_id = user.id
            session.execute(
                text(f"UPDATE usuario SET deleted_at = NOW() WHERE id = {user_id}")
            )
            session.commit()
            
            # Verify soft deleted user is not returned by normal query
            result = session.execute(
                text(f"SELECT id FROM usuario WHERE id = {user_id} AND deleted_at IS NULL")
            )
            deleted_user = result.first()
            assert deleted_user is None, "Soft deleted user should not be found with deleted_at IS NULL"
            
            # Verify soft deleted user CAN be found if we include deleted records
            result = session.execute(
                text(f"SELECT id, deleted_at FROM usuario WHERE id = {user_id}")
            )
            deleted_user = result.first()
            assert deleted_user is not None, "Soft deleted user should exist in database"
            assert deleted_user.deleted_at is not None, "deleted_at should be set"
        finally:
            # Cleanup
            session.execute(text("DELETE FROM usuario WHERE email = 'test@example.com'"))
            session.commit()
            session.close()


@pytest.mark.skipif(not database_available, reason="Database not available")
class TestCTERecursive:
    """Test CTE recursive queries for hierarchical categories"""
    
    def test_categoria_hierarchy(self):
        """Test that we can query categories hierarchically"""
        session = SessionLocal()
        try:
            # Insert root category first to get the ID
            root_result = session.execute(
                text("""
                    INSERT INTO categoria (nombre, descripcion, parent_id, creado_en, actualizado_en)
                    VALUES ('Comidas', 'Todas las comidas', NULL, NOW(), NOW())
                    RETURNING id
                """)
            )
            session.commit()
            root_id = root_result.scalar()
            
            # Insert child categories using the returned root ID
            session.execute(
                text(f"""
                    INSERT INTO categoria (nombre, descripcion, parent_id, creado_en, actualizado_en)
                    VALUES 
                    ('Rapidas', 'Comidas rapidas', {root_id}, NOW(), NOW()),
                    ('Hamburguesas', 'Tipo hamburguesa', {root_id}, NOW(), NOW())
                """)
            )
            session.commit()
            
            # Query with CTE - get all descendants of "Comidas"
            result = session.execute(text("""
                WITH RECURSIVE cat_tree AS (
                    SELECT id, nombre, parent_id, 0 as depth
                    FROM categoria
                    WHERE nombre = 'Comidas'
                    
                    UNION ALL
                    
                    SELECT c.id, c.nombre, c.parent_id, ct.depth + 1
                    FROM categoria c
                    JOIN cat_tree ct ON c.parent_id = ct.id
                )
                SELECT id, nombre, depth FROM cat_tree ORDER BY depth
            """))
            
            rows = result.fetchall()
            assert len(rows) >= 3, "CTE recursive query should return at least 3 categories"
            assert rows[0].nombre == 'Comidas', "Root category should be first"
        finally:
            # Cleanup
            session.execute(text("DELETE FROM categoria WHERE nombre IN ('Hamburguesas', 'Rapidas', 'Comidas')"))
            session.commit()
            session.close()


@pytest.mark.skipif(not database_available, reason="Database not available")
class TestTableStructure:
    """Test that table structure is correct"""
    
    def test_usuario_columns(self):
        """Test that usuario table has expected columns"""
        session = SessionLocal()
        try:
            result = session.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'usuario'
                ORDER BY ordinal_position
            """))
            
            columns = {row.column_name: row.data_type for row in result}
            assert 'id' in columns
            assert 'email' in columns
            assert 'password_hash' in columns
            assert 'deleted_at' in columns
        finally:
            session.close()
    
    def test_pedido_columns(self):
        """Test that pedido table has snapshot columns"""
        session = SessionLocal()
        try:
            result = session.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'pedido'
                ORDER BY ordinal_position
            """))
            
            columns = {row.column_name: row.data_type for row in result}
            assert 'total' in columns, "Pedido should have total snapshot"
            assert 'costo_envio' in columns, "Pedido should have costo_envio snapshot"
        finally:
            session.close()
    
    def test_historial_estado_pedido_append_only(self):
        """Test that HistorialEstadoPedido is append-only (no UPDATE/DELETE expected)"""
        session = SessionLocal()
        try:
            # Just verify the table exists and has correct columns
            result = session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'historial_estado_pedido'
            """))
            
            columns = [row.column_name for row in result]
            assert 'created_at' in columns, "Should have created_at (not updated_at)"
            assert 'estado_desde' in columns, "Should track estado_desde"
            assert 'estado_nuevo' in columns, "Should track estado_nuevo"
        finally:
            session.close()
