"""add_configuracion - System configuration key-value table

Revision ID: 007
Revises: 006
Create Date: 2026-05-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create configuracion table and seed default values."""
    # Create the table
    op.create_table(
        'configuracion',
        sa.Column('clave', sa.String(100), primary_key=True, comment='Configuration key'),
        sa.Column('valor', sa.String(500), nullable=False, server_default='', comment='Configuration value'),
        sa.Column('descripcion', sa.String(500), nullable=True, comment='Human-readable description'),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Seed default configuration values
    op.execute("""
        INSERT INTO configuracion (clave, valor, descripcion) VALUES
        ('costo_envio', '500.00', 'Costo de envío estándar en ARS'),
        ('pedido_minimo', '1500.00', 'Monto mínimo para realizar un pedido en ARS'),
        ('limite_stock_bajo', '10', 'Cantidad mínima de stock antes de alertar como bajo'),
        ('telefono_contacto', '+54 11 5555-0100', 'Teléfono de contacto del local'),
        ('email_contacto', 'contacto@foodstore.com', 'Email de contacto del local'),
        ('horario_atencion', 'Lun-Sáb 9:00-21:00', 'Horario de atención al público');
    """)


def downgrade() -> None:
    """Drop configuracion table."""
    op.drop_table('configuracion')
