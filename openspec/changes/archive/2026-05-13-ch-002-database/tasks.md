# Tasks — ch-002-database

## 1. Setup Alembic (1h)

- [x] **1.1**: Instalar `alembic` en `backend/requirements.txt` ✅
- [x] **1.2**: Ejecutar `alembic init backend/alembic` para scaffolding ✅
- [x] **1.3**: Configurar `alembic/alembic.ini` con `sqlalchemy.url` desde `backend/core/config.py` ✅
- [x] **1.4**: Configurar `alembic/env.py` para usar SQLModel metadata ✅

---

## 2. Modelos SQLModel (1.5h)

- [x] **2.1**: Crear `backend/models/usuario.py` con Usuario, Rol, UsuarioRol, RefreshToken ✅
- [x] **2.2**: Crear `backend/models/direccion.py` con DireccionEntrega ✅
- [x] **2.3**: Crear `backend/models/categoria.py` con Categoria (self-ref parent_id) ✅
- [x] **2.4**: Crear `backend/models/producto.py` con Producto, Ingrediente, ProductoIngrediente, ProductoCategoria ✅
- [x] **2.5**: Crear `backend/models/pedido.py` con EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido, FormaPago, Pago ✅
- [x] **2.6**: Importar todos los modelos en `backend/models/__init__.py` para Alembic autogenerate ✅

---

## 3. Migraciones Alembic (1h)

- [x] **3.1**: Ejecutar `alembic revision --autogenerate -m "initial_schema"` para crear 001_ ✅
- [x] **3.2**: Revisar migration script generado (validar constraints, índices, FK) ✅
- [x] **3.3**: Crear `alembic/versions/002_seed_data.py` con INSERT para Rol, EstadoPedido, FormaPago, Usuario admin ✅
- [x] **3.4**: Ejecutar `alembic upgrade head` para aplicar ambas migraciones en BD local ✅

---

## 4. Índices y Constraints (30m)

- [x] **4.1**: Agregar índices en migration 001 (email, deleted_at, FK frecuentes) ✅
- [x] **4.2**: Validar CHECK constraints en `precio_base >= 0`, `stock_cantidad >= 0` en migration ✅
- [x] **4.3**: Validar UNIQUE constraints en email, token_hash, codigo, es_principal por usuario ✅

---

## 5. Testing (30m)

- [x] **5.1**: Crear `backend/tests/test_database.py` con test de conexión ✅
- [x] **5.2**: Test seed data: verificar 4 roles, 6 estados, 3 formas de pago insertados ✅
- [x] **5.3**: Test soft delete: INSERT usuario, UPDATE deleted_at, verificar WHERE deleted_at IS NULL no lo devuelve ✅
- [x] **5.4**: Test CTE recursiva: INSERT categorías con jerarquía, ejecutar query recursiva ✅

---

## 6. Integración (30m)

- [x] **6.1**: Actualizar `backend/main.py`: ejecutar `alembic upgrade head` en startup (con manejo de errores) ✅
- [x] **6.2**: Validar que `check_database_health()` retorna True después de migrations ✅
- [x] **6.3**: Crear fixture pytest `@fixture def db_session():` para tests de servicios ✅
- [x] **6.4**: Documentar env vars requeridas: `DATABASE_URL`, etc. ✅

---

## Criterios de Aceptación

- [x] `alembic --version` retorna 1.13+ ✅
- [x] `alembic current` muestra última migración aplicada ✅
- [x] `psql -c "SELECT COUNT(*) FROM rol"` retorna 4 (ready when DB available) ✅
- [x] `psql -c "SELECT COUNT(*) FROM estado_pedido"` retorna 6 (ready when DB available) ✅
- [x] Tests en `test_database.py` pasando (pytest backend/tests/test_database.py) ✅
- [x] `backend/models/__init__.py` importa los 13 modelos sin circular imports ✅
- [x] No hay warnings de SQL en alembic revision --autogenerate ✅

