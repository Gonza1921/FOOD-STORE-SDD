# Tasks — ch-002-database

## 1. Setup Alembic (1h)

- [ ] **1.1**: Instalar `alembic` en `backend/requirements.txt`
- [ ] **1.2**: Ejecutar `alembic init backend/alembic` para scaffolding
- [ ] **1.3**: Configurar `alembic/alembic.ini` con `sqlalchemy.url` desde `backend/core/config.py`
- [ ] **1.4**: Configurar `alembic/env.py` para usar SQLModel metadata

---

## 2. Modelos SQLModel (1.5h)

- [ ] **2.1**: Crear `backend/models/usuario.py` con Usuario, Rol, UsuarioRol, RefreshToken
- [ ] **2.2**: Crear `backend/models/direccion.py` con DireccionEntrega
- [ ] **2.3**: Crear `backend/models/categoria.py` con Categoria (self-ref parent_id)
- [ ] **2.4**: Crear `backend/models/producto.py` con Producto, Ingrediente, ProductoIngrediente, ProductoCategoria
- [ ] **2.5**: Crear `backend/models/pedido.py` con EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido, FormaPago, Pago
- [ ] **2.6**: Importar todos los modelos en `backend/models/__init__.py` para Alembic autogenerate

---

## 3. Migraciones Alembic (1h)

- [ ] **3.1**: Ejecutar `alembic revision --autogenerate -m "initial_schema"` para crear 001_
- [ ] **3.2**: Revisar migration script generado (validar constraints, índices, FK)
- [ ] **3.3**: Crear `alembic/versions/002_seed_data.py` con INSERT para Rol, EstadoPedido, FormaPago, Usuario admin
- [ ] **3.4**: Ejecutar `alembic upgrade head` para aplicar ambas migraciones en BD local

---

## 4. Índices y Constraints (30m)

- [ ] **4.1**: Agregar índices en migration 001 (email, deleted_at, FK frecuentes)
- [ ] **4.2**: Validar CHECK constraints en `precio_base >= 0`, `stock_cantidad >= 0` en migration
- [ ] **4.3**: Validar UNIQUE constraints en email, token_hash, codigo, es_principal por usuario

---

## 5. Testing (30m)

- [ ] **5.1**: Crear `backend/tests/test_database.py` con test de conexión
- [ ] **5.2**: Test seed data: verificar 4 roles, 6 estados, 3 formas de pago insertados
- [ ] **5.3**: Test soft delete: INSERT usuario, UPDATE deleted_at, verificar WHERE deleted_at IS NULL no lo devuelve
- [ ] **5.4**: Test CTE recursiva: INSERT categorías con jerarquía, ejecutar query recursiva

---

## 6. Integración (30m)

- [ ] **6.1**: Actualizar `backend/main.py`: ejecutar `alembic upgrade head` en startup (con manejo de errores)
- [ ] **6.2**: Validar que `check_database_health()` retorna True después de migrations
- [ ] **6.3**: Crear fixture pytest `@fixture def db_session():` para tests de servicios
- [ ] **6.4**: Documentar env vars requeridas: `DATABASE_URL`, etc.

---

## Criterios de Aceptación

- [ ] `alembic --version` retorna 1.13+
- [ ] `alembic current` muestra última migración aplicada
- [ ] `psql -c "SELECT COUNT(*) FROM rol"` retorna 4
- [ ] `psql -c "SELECT COUNT(*) FROM estado_pedido"` retorna 6
- [ ] Tests en `test_database.py` pasando (pytest backend/tests/test_database.py)
- [ ] `backend/models/__init__.py` importa los 13 modelos sin circular imports
- [ ] No hay warnings de SQL en alembic revision --autogenerate

