"""add_producto_imagen_url - Add Cloudinary image URL to Producto

Revision ID: 011
Revises: 010
Create Date: 2026-06-09

Purpose: Add imagen_url column to the producto table to store Cloudinary
image URLs for product images.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '011'
down_revision: Union[str, None] = '010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add imagen_url column to producto table."""
    op.add_column(
        'producto',
        sa.Column('imagen_url', sa.String(length=512), nullable=True),
    )


def downgrade() -> None:
    """Drop imagen_url column from producto table."""
    op.drop_column('producto', 'imagen_url')
