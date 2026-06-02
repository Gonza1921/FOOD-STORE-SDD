"""Add COCINA role and seed cocina user

Revision ID: a69a12bc4427
Revises: 007
Create Date: 2026-06-01 23:05:33.402638

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a69a12bc4427'
down_revision: Union[str, None] = '007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insert COCINA role
    op.execute("""
        INSERT INTO rol (codigo, nombre, descripcion) 
        VALUES ('COCINA', 'Cocinero', 'Prepara y avanza pedidos en la cocina')
        ON CONFLICT (codigo) DO NOTHING;
    """)
    
    # Insert seed user cocina@foodstore.com
    op.execute("""
        INSERT INTO usuario (email, nombre, apellido, password_hash, creado_en, actualizado_en) 
        VALUES ('cocina@foodstore.com', 'Cocinero', 'Test', '$2b$12$p5Hu56fowl5JPkAqCNazk.KlQpUyR4WdmL2S164WK3/pPZYF3ai4m', NOW(), NOW())
        ON CONFLICT (email) DO NOTHING;
    """)
    
    # Assign COCINA role to seed user
    op.execute("""
        INSERT INTO usuario_rol (usuario_id, rol_codigo, asignado_en)
        SELECT u.id, 'COCINA', NOW()
        FROM usuario u
        WHERE u.email = 'cocina@foodstore.com'
        AND NOT EXISTS (
            SELECT 1 FROM usuario_rol 
            WHERE usuario_id = u.id AND rol_codigo = 'COCINA'
        );
    """)


def downgrade() -> None:
    # Delete usuario_rol records for COCINA user
    op.execute("""
        DELETE FROM usuario_rol
        WHERE usuario_id IN (SELECT id FROM usuario WHERE email = 'cocina@foodstore.com')
        AND rol_codigo = 'COCINA';
    """)
    
    # Delete seed user
    op.execute("""
        DELETE FROM usuario WHERE email = 'cocina@foodstore.com';
    """)
    
    # Delete COCINA role
    op.execute("""
        DELETE FROM rol WHERE codigo = 'COCINA';
    """)
