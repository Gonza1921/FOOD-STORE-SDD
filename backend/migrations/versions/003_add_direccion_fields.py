"""Add deleted_at and referencia columns to direccion_entrega

Revision ID: 003_add_direccion_fields
Revises: 002_seed_data
Create Date: 2026-05-14 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003_add_direccion_fields"
down_revision: Union[str, None] = "002_seed_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add referencia column (nullable, existing rows get NULL)
    op.add_column(
        "direccion_entrega",
        sa.Column("referencia", sa.String(length=200), nullable=True),
    )

    # Add deleted_at column (nullable, existing rows get NULL = not deleted)
    op.add_column(
        "direccion_entrega",
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )

    # Index for soft-delete filtering
    op.create_index(
        "ix_direccion_entrega_deleted_at",
        "direccion_entrega",
        ["deleted_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_direccion_entrega_deleted_at", table_name="direccion_entrega")
    op.drop_column("direccion_entrega", "deleted_at")
    op.drop_column("direccion_entrega", "referencia")
