"""add_telefono_to_usuario - Add phone field to user profile

Revision ID: 005
Revises: 004
Create Date: 2026-05-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add telefono column to Usuario table (nullable, existing rows get NULL)."""
    op.add_column('usuario', sa.Column('telefono', sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Remove telefono column from Usuario table."""
    op.drop_column('usuario', 'telefono')
