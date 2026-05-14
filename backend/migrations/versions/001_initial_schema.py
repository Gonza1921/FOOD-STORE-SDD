"""Initial schema with 13 entities

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-05-08 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create Rol table (catalog)
    op.create_table(
        'rol',
        sa.Column('codigo', sa.String(length=20), nullable=False),
        sa.Column('nombre', sa.String(length=50), nullable=False),
        sa.Column('descripcion', sa.String(length=200), nullable=True),
        sa.PrimaryKeyConstraint('codigo')
    )
    
    # Create Usuario table
    op.create_table(
        'usuario',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('email', sa.String(length=254), nullable=False),
        sa.Column('password_hash', sa.String(length=60), nullable=False),
        sa.Column('nombre', sa.String(length=50), nullable=False),
        sa.Column('apellido', sa.String(length=50), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_usuario_email', 'usuario', ['email'])
    op.create_index('ix_usuario_deleted_at', 'usuario', ['deleted_at'])
    
    # Create UsuarioRol pivot table (M:N)
    op.create_table(
        'usuario_rol',
        sa.Column('usuario_id', sa.BigInteger(), nullable=False),
        sa.Column('rol_codigo', sa.String(length=20), nullable=False),
        sa.Column('asignado_en', sa.DateTime(), nullable=False),
        sa.Column('asignado_por_id', sa.BigInteger(), nullable=True),
        sa.ForeignKeyConstraint(['asignado_por_id'], ['usuario.id'], ),
        sa.ForeignKeyConstraint(['rol_codigo'], ['rol.codigo'], ),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('usuario_id', 'rol_codigo')
    )
    
    # Create RefreshToken table
    op.create_table(
        'refresh_token',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('usuario_id', sa.BigInteger(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash')
    )
    op.create_index('ix_refresh_token_usuario_id', 'refresh_token', ['usuario_id'])
    op.create_index('ix_refresh_token_token_hash', 'refresh_token', ['token_hash'])
    
    # Create DireccionEntrega table
    op.create_table(
        'direccion_entrega',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('usuario_id', sa.BigInteger(), nullable=False),
        sa.Column('alias', sa.String(length=50), nullable=True),
        sa.Column('linea1', sa.String(length=200), nullable=False),
        sa.Column('linea2', sa.String(length=200), nullable=True),
        sa.Column('ciudad', sa.String(length=50), nullable=False),
        sa.Column('provincia', sa.String(length=50), nullable=False),
        sa.Column('codigo_postal', sa.String(length=10), nullable=False),
        sa.Column('es_principal', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_direccion_entrega_usuario_id', 'direccion_entrega', ['usuario_id'])
    
    # Create Categoria table (self-referencing)
    op.create_table(
        'categoria',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('descripcion', sa.String(length=200), nullable=True),
        sa.Column('parent_id', sa.BigInteger(), nullable=True),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['parent_id'], ['categoria.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_categoria_nombre', 'categoria', ['nombre'])
    op.create_index('ix_categoria_deleted_at', 'categoria', ['deleted_at'])
    
    # Create Ingrediente table
    op.create_table(
        'ingrediente',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('descripcion', sa.String(length=200), nullable=True),
        sa.Column('es_alergeno', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre')
    )
    op.create_index('ix_ingrediente_nombre', 'ingrediente', ['nombre'])
    
    # Create Producto table
    op.create_table(
        'producto',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('nombre', sa.String(length=200), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('precio_base', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('stock_cantidad', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('disponible', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('categoria_id', sa.BigInteger(), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.CheckConstraint('precio_base >= 0'),
        sa.CheckConstraint('stock_cantidad >= 0'),
        sa.ForeignKeyConstraint(['categoria_id'], ['categoria.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_producto_nombre', 'producto', ['nombre'])
    op.create_index('ix_producto_categoria_id', 'producto', ['categoria_id'])
    op.create_index('ix_producto_deleted_at', 'producto', ['deleted_at'])
    
    # Create ProductoIngrediente pivot table (M:N)
    op.create_table(
        'producto_ingrediente',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('producto_id', sa.BigInteger(), nullable=False),
        sa.Column('ingrediente_id', sa.BigInteger(), nullable=False),
        sa.Column('es_removible', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['ingrediente_id'], ['ingrediente.id'], ),
        sa.ForeignKeyConstraint(['producto_id'], ['producto.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_producto_ingrediente_producto_id', 'producto_ingrediente', ['producto_id'])
    op.create_index('ix_producto_ingrediente_ingrediente_id', 'producto_ingrediente', ['ingrediente_id'])
    
    # Create ProductoCategoria pivot table (M:N)
    op.create_table(
        'producto_categoria',
        sa.Column('producto_id', sa.BigInteger(), nullable=False),
        sa.Column('categoria_id', sa.BigInteger(), nullable=False),
        sa.Column('es_principal', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['categoria_id'], ['categoria.id'], ),
        sa.ForeignKeyConstraint(['producto_id'], ['producto.id'], ),
        sa.PrimaryKeyConstraint('producto_id', 'categoria_id')
    )
    
    # Create EstadoPedido table (catalog)
    op.create_table(
        'estado_pedido',
        sa.Column('codigo', sa.String(length=20), nullable=False),
        sa.Column('descripcion', sa.String(length=200), nullable=False),
        sa.Column('orden', sa.Integer(), nullable=False),
        sa.Column('es_terminal', sa.Boolean(), nullable=False, server_default='false'),
        sa.PrimaryKeyConstraint('codigo')
    )
    
    # Create FormaPago table (catalog)
    op.create_table(
        'forma_pago',
        sa.Column('codigo', sa.String(length=20), nullable=False),
        sa.Column('descripcion', sa.String(length=200), nullable=False),
        sa.Column('habilitado', sa.Boolean(), nullable=False, server_default='true'),
        sa.PrimaryKeyConstraint('codigo')
    )
    
    # Create Pedido table
    op.create_table(
        'pedido',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('usuario_id', sa.BigInteger(), nullable=False),
        sa.Column('estado_codigo', sa.String(length=20), nullable=False),
        sa.Column('total', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('costo_envio', sa.Numeric(precision=10, scale=2), nullable=False, server_default='50.00'),
        sa.Column('forma_pago_codigo', sa.String(length=20), nullable=False),
        sa.Column('direccion_id', sa.BigInteger(), nullable=True),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.CheckConstraint('total >= 0'),
        sa.ForeignKeyConstraint(['direccion_id'], ['direccion_entrega.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['estado_codigo'], ['estado_pedido.codigo'], ),
        sa.ForeignKeyConstraint(['forma_pago_codigo'], ['forma_pago.codigo'], ),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pedido_usuario_id', 'pedido', ['usuario_id'])
    op.create_index('ix_pedido_estado_codigo', 'pedido', ['estado_codigo'])
    
    # Create DetallePedido table
    op.create_table(
        'detalle_pedido',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('pedido_id', sa.BigInteger(), nullable=False),
        sa.Column('producto_id', sa.BigInteger(), nullable=False),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('nombre_snapshot', sa.String(length=200), nullable=False),
        sa.Column('precio_snapshot', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('personalizacion', postgresql.ARRAY(sa.Integer()), nullable=True),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedido.id'], ),
        sa.ForeignKeyConstraint(['producto_id'], ['producto.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_detalle_pedido_pedido_id', 'detalle_pedido', ['pedido_id'])
    
    # Create HistorialEstadoPedido table (append-only)
    op.create_table(
        'historial_estado_pedido',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('pedido_id', sa.BigInteger(), nullable=False),
        sa.Column('estado_desde', sa.String(length=20), nullable=True),
        sa.Column('estado_nuevo', sa.String(length=20), nullable=False),
        sa.Column('motivo', sa.String(length=500), nullable=True),
        sa.Column('usuario_id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['estado_desde'], ['estado_pedido.codigo'], ),
        sa.ForeignKeyConstraint(['estado_nuevo'], ['estado_pedido.codigo'], ),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedido.id'], ),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_historial_estado_pedido_pedido_id', 'historial_estado_pedido', ['pedido_id'])
    op.create_index('ix_historial_estado_pedido_created_at', 'historial_estado_pedido', ['created_at'])
    
    # Create Pago table
    op.create_table(
        'pago',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('pedido_id', sa.BigInteger(), nullable=False),
        sa.Column('mp_payment_id', sa.BigInteger(), nullable=True),
        sa.Column('mp_status', sa.String(length=30), nullable=False),
        sa.Column('external_reference', sa.String(length=100), nullable=False),
        sa.Column('idempotency_key', sa.String(length=100), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedido.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('external_reference'),
        sa.UniqueConstraint('idempotency_key'),
        sa.UniqueConstraint('mp_payment_id'),
        sa.UniqueConstraint('pedido_id')
    )
    op.create_index('ix_pago_pedido_id', 'pago', ['pedido_id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('pago')
    op.drop_table('historial_estado_pedido')
    op.drop_table('detalle_pedido')
    op.drop_table('pedido')
    op.drop_table('forma_pago')
    op.drop_table('estado_pedido')
    op.drop_table('producto_categoria')
    op.drop_table('producto_ingrediente')
    op.drop_table('producto')
    op.drop_table('ingrediente')
    op.drop_table('categoria')
    op.drop_table('direccion_entrega')
    op.drop_table('refresh_token')
    op.drop_table('usuario_rol')
    op.drop_table('usuario')
    op.drop_table('rol')
