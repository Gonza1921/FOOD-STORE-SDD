"""Seed data - roles, order states, payment methods, admin user

Revision ID: 002_seed_data
Revises: 001_initial_schema
Create Date: 2026-05-08 15:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002_seed_data"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insert Roles (4 fixed roles)
    op.execute("""
        INSERT INTO rol (codigo, nombre, descripcion) VALUES
        ('ADMIN', 'Administrador', 'Acceso total al sistema'),
        ('STOCK', 'Gestor de Stock', 'Gestión de inventario y stock'),
        ('PEDIDOS', 'Gestor de Pedidos', 'Operación de pedidos y transiciones FSM'),
        ('CLIENT', 'Cliente', 'Acceso como cliente para comprar');
    """)
    
    # Insert Order States (FSM catalog - 6 states)
    op.execute("""
        INSERT INTO estado_pedido (codigo, descripcion, orden, es_terminal) VALUES
        ('PENDIENTE', 'Pedido creado, pago pendiente', 1, false),
        ('CONFIRMADO', 'Pago procesado y confirmado', 2, false),
        ('EN_PREP', 'En preparación en cocina', 3, false),
        ('EN_CAMINO', 'Despachado al cliente', 4, false),
        ('ENTREGADO', 'Entregado al cliente', 5, true),
        ('CANCELADO', 'Pedido cancelado', 6, true);
    """)
    
    # Insert Payment Methods (3 formas de pago)
    op.execute("""
        INSERT INTO forma_pago (codigo, descripcion, habilitado) VALUES
        ('MERCADOPAGO', 'MercadoPago (tarjeta, Rapipago, Pago Fácil)', true),
        ('EFECTIVO', 'Efectivo al retirar', true),
        ('TRANSFERENCIA', 'Transferencia bancaria', false);
    """)
    
    # Insert Admin User
    # Password: admin_password_hashed (bcrypt - this should be generated in real scenario)
    # For demo: Using placeholder, must be replaced with real bcrypt hash
    op.execute("""
        INSERT INTO usuario (email, password_hash, nombre, apellido, creado_en, actualizado_en)
        VALUES (
            'admin@foodstore.local',
            '$2b$12$8qDqy3X.Kz.9.6zC8qDqy.Kz.9.6zC8qDqy.Kz.9.6zC8qDqy.K',
            'Admin',
            'Food Store',
            NOW(),
            NOW()
        );
    """)
    
    # Assign ADMIN role to admin user
    op.execute("""
        INSERT INTO usuario_rol (usuario_id, rol_codigo, asignado_en)
        VALUES (1, 'ADMIN', NOW());
    """)


def downgrade() -> None:
    # Delete in reverse order
    op.execute("DELETE FROM usuario_rol WHERE usuario_id = 1;")
    op.execute("DELETE FROM usuario WHERE email = 'admin@foodstore.local';")
    op.execute("DELETE FROM forma_pago;")
    op.execute("DELETE FROM estado_pedido;")
    op.execute("DELETE FROM rol;")
