"""add_producto_price_indexes - Add composite indexes for product filtering

Revision ID: 010
Revises: 009
Create Date: 2026-05-28

Purpose: Create indexes on (categoria_id, precio_base) and (creado_en) to optimize
         filtering by price range and sorting by creation date.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '010'
down_revision: Union[str, None] = '009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create composite and single-column indexes for performance."""
    
    # Composite index: (categoria_id, precio_base) for filtering by category and price range
    op.create_index(
        'ix_producto_categoria_precio',
        'producto',
        ['categoria_id', 'precio_base'],
        unique=False
    )
    
    # Single index: (creado_en) for sorting by "recent" (descending)
    op.create_index(
        'ix_producto_creado_en',
        'producto',
        ['creado_en'],
        unique=False
    )


def downgrade() -> None:
    """Drop indexes."""
    op.drop_index('ix_producto_categoria_precio', table_name='producto')
    op.drop_index('ix_producto_creado_en', table_name='producto')
