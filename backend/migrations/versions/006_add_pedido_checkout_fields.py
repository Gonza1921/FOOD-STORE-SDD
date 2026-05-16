"""add_pedido_checkout_fields - Add subtotal, direccion_snapshot, and ingredientes_excluidos

Revision ID: 006
Revises: 005
Create Date: 2026-05-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add checkout fields to pedido and detalle_pedido tables."""
    # Add subtotal column to pedido
    op.add_column(
        'pedido',
        sa.Column('subtotal', sa.Numeric(10, 2), nullable=False, server_default='0')
    )

    # Add direccion_snapshot column to pedido
    op.add_column(
        'pedido',
        sa.Column('direccion_snapshot', sa.String(500), nullable=True)
    )

    # Rename personalizacion to ingredientes_excluidos in detalle_pedido
    # First check if personalizacion exists
    try:
        op.alter_column(
            'detalle_pedido',
            'personalizacion',
            new_column_name='ingredientes_excluidos',
            type_=sa.String(500),
            nullable=True
        )
    except Exception:
        # Column might not exist or already renamed
        pass


def downgrade() -> None:
    """Remove checkout fields from pedido and detalle_pedido tables."""
    # Remove direccion_snapshot
    op.drop_column('pedido', 'direccion_snapshot')

    # Remove subtotal
    op.drop_column('pedido', 'subtotal')

    # Rename ingredientes_excluidos back to personalizacion
    try:
        op.alter_column(
            'detalle_pedido',
            'ingredientes_excluidos',
            new_column_name='personalizacion',
            type_=sa.String(500),
            nullable=True
        )
    except Exception:
        pass