"""add_order_tracking_timestamps - Add FSM tracking timestamps to pedido

Revision ID: 011
Revises: 010, a69a12bc4427
Create Date: 2026-06-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '011'
down_revision: Union[str, Sequence[str], None] = ('010', 'a69a12bc4427')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add tracking timestamp columns to pedido table."""
    op.add_column(
        'pedido',
        sa.Column('confirmado_en', sa.DateTime(), nullable=True)
    )
    op.add_column(
        'pedido',
        sa.Column('en_preparacion_en', sa.DateTime(), nullable=True)
    )
    op.add_column(
        'pedido',
        sa.Column('listo_en', sa.DateTime(), nullable=True)
    )
    op.add_column(
        'pedido',
        sa.Column('en_camino_en', sa.DateTime(), nullable=True)
    )
    op.add_column(
        'pedido',
        sa.Column('entregado_en', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    """Remove tracking timestamp columns from pedido table."""
    op.drop_column('pedido', 'entregado_en')
    op.drop_column('pedido', 'en_camino_en')
    op.drop_column('pedido', 'listo_en')
    op.drop_column('pedido', 'en_preparacion_en')
    op.drop_column('pedido', 'confirmado_en')
