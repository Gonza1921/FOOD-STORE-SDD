"""add_pago_fields - Add transaction_amount and date_approved to Pago table

Revision ID: 004
Revises: 003
Create Date: 2026-05-14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add transaction_amount and date_approved columns to Pago table."""
    op.add_column('pago', sa.Column('transaction_amount', sa.Float(), nullable=True))
    op.add_column('pago', sa.Column('date_approved', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Remove transaction_amount and date_approved columns from Pago table."""
    op.drop_column('pago', 'date_approved')
    op.drop_column('pago', 'transaction_amount')