"""add_categoria_slug - Add slug field to Categoria model

Revision ID: 009
Revises: 008
Create Date: 2026-05-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = '009'
down_revision: Union[str, None] = '008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add slug column to categoria table with backfill."""

    # Step 1: Add slug column as nullable initially
    op.add_column('categoria', sa.Column('slug', sa.String(length=100), nullable=True))
    op.create_index('ix_categoria_slug', 'categoria', ['slug'])

    # Step 2: Backfill slugs for existing categories using Python slugify
    # Use a simple regex-based slug generation to avoid external dependency in migration
    conn = op.get_bind()
    result = conn.execute(
        text("SELECT id, nombre FROM categoria WHERE slug IS NULL")
    )
    rows = result.fetchall()

    for row_id, nombre in rows:
        # Simple slugify: lowercase, replace non-alphanumeric with hyphens, collapse
        slug = nombre.lower().strip()
        import re
        slug = re.sub(r'[^a-z0-9áéíóúñü\s-]', '', slug)
        slug = re.sub(r'[\s_]+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')

        # Handle potential duplicates
        counter = 1
        original_slug = slug
        while True:
            check = conn.execute(
                text("SELECT id FROM categoria WHERE slug = :slug AND id != :row_id"),
                {"slug": slug, "row_id": row_id}
            ).fetchone()
            if check is None:
                break
            slug = f"{original_slug}-{counter}"
            counter += 1

        conn.execute(
            text("UPDATE categoria SET slug = :slug WHERE id = :id"),
            {"slug": slug, "id": row_id}
        )

    # Step 3: Make slug NOT NULL and add unique constraint
    op.alter_column('categoria', 'slug', nullable=False)
    op.create_unique_constraint('uq_categoria_slug', 'categoria', ['slug'])


def downgrade() -> None:
    """Remove slug column from categoria table."""
    op.drop_constraint('uq_categoria_slug', 'categoria', type_='unique')
    op.drop_index('ix_categoria_slug', table_name='categoria')
    op.drop_column('categoria', 'slug')
