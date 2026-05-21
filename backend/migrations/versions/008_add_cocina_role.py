"""add_cocina_role - Add COCINA role and seed user

Revision ID: 008
Revises: 007
Create Date: 2026-05-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from passlib.hash import bcrypt


# revision identifiers, used by Alembic.
revision: str = '008'
down_revision: Union[str, None] = '007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add COCINA role and seed development user."""

    # Insert COCINA role (idempotent)
    op.execute("""
        INSERT INTO rol (codigo, nombre, descripcion)
        VALUES (
            'COCINA',
            'Cocinero',
            'Operaci\u00f3n de cocina: recibe pedidos confirmados y gestiona su preparaci\u00f3n'
        )
        ON CONFLICT (codigo) DO NOTHING;
    """)

    # Generate bcrypt hash for seed user password
    password_hash = bcrypt.hash("cocina123")

    # Insert seed user and assign role (idempotent via email)
    op.execute(
        f"""
        WITH new_user AS (
            INSERT INTO usuario (email, password_hash, nombre, apellido, creado_en, actualizado_en)
            VALUES (
                'cocina@foodstore.com',
                '{password_hash}',
                'Cocinero',
                'Prueba',
                NOW(),
                NOW()
            )
            ON CONFLICT (email) DO NOTHING
            RETURNING id
        )
        INSERT INTO usuario_rol (usuario_id, rol_codigo, asignado_en)
        SELECT id, 'COCINA', NOW() FROM new_user
        ON CONFLICT (usuario_id, rol_codigo) DO NOTHING;
        """
    )


def downgrade() -> None:
    """Remove COCINA role and seed user."""
    op.execute(
        "DELETE FROM usuario_rol WHERE rol_codigo = 'COCINA' "
        "AND usuario_id = (SELECT id FROM usuario WHERE email = 'cocina@foodstore.com');"
    )
    op.execute("DELETE FROM usuario WHERE email = 'cocina@foodstore.com';")
    op.execute("DELETE FROM rol WHERE codigo = 'COCINA';")
