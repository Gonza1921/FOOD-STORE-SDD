"""add_producto_stock_minimo - Add stock_minimo threshold column to producto

Revision ID: 012
Revises: 011
Create Date: 2026-06-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '012'
down_revision: Union[str, Sequence[str], None] = '011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add stock_minimo column with default 10 and NOT NULL."""
    op.add_column(
        'producto',
        sa.Column('stock_minimo', sa.Integer(), nullable=False, server_default='10')
    )


def downgrade() -> None:
    """Remove stock_minimo column."""
    op.drop_column('producto', 'stock_minimo')
