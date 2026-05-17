"""Alembic environment configuration"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys

# Add backend to path
backend_path = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, backend_path)

# Import models to register them with SQLModel metadata
from models import usuario, direccion, categoria, producto, pedido, configuracion

# Import settings with fallback
try:
    from core.config import settings
except ImportError:
    # Fallback: get DATABASE_URL from environment
    import dotenv
    dotenv.load_dotenv(os.path.join(backend_path, '.env'))
    db_url = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/food_store_db')
    class Settings:
        database_url = db_url
    settings = Settings()

# this is the Alembic Config object, which provides
# the values of the [alembic] section of the .ini file
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Configure SQLAlchemy URL from settings
config.set_main_option("sqlalchemy.url", settings.database_url)

# Model's MetaData object for 'autogenerate' support
from sqlmodel import SQLModel
target_metadata = SQLModel.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
