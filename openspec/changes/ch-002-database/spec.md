# Spec — ch-002-database

## Requisitos Funcionales

### DB-001: MUST configurar PostgreSQL 15+
El sistema MUST establecer conexión a PostgreSQL con pool size 10, max overflow 20, validación pre-ping habilitada.

### DB-002: MUST crear 13 entidades SQLModel
El sistema MUST definir todas las tablas con tipos correctos, constraints, índices y relaciones N:M pivots.

### DB-003: MUST implementar soft delete
El sistema MUST usar `deleted_at: Optional[datetime]` en entidades Usuario, Categoria, Producto, Rol (semántico), FormaPago (semántico).

### DB-004: MUST crear migraciones Alembic
El sistema MUST usar Alembic para versionar cambios de BD. Primera migración: schema inicial + seed.

### DB-005: MUST cargar seed data
El sistema MUST insertar en startup:
- Rol: ADMIN (1), STOCK (2), PEDIDOS (3), CLIENT (4)
- EstadoPedido: PENDIENTE, CONFIRMADO, EN_PREP, EN_CAMINO, ENTREGADO, CANCELADO
- FormaPago: MERCADOPAGO, EFECTIVO, TRANSFERENCIA
- Usuario admin: admin@foodstore.local / admin_password_hashed

### DB-006: MUST validar integridad referencial
El sistema MUST usar:
- FK con ON DELETE SET NULL para categoría padre (soft ref)
- FK con ON DELETE CASCADE para HistorialEstadoPedido (hard ref, append-only)
- UQ constraints en email, token_hash, codigo, etc.

### DB-007: MUST soportar CTE recursiva para categorías
El sistema MUST permitir queries recursivas en categorías jerárquicas sin ciclos.

### DB-008: MUST persistir snapshot en pedidos
El sistema MUST crear DetallePedido con nombre_snapshot y precio_snapshot inmutables desde el producto al momento de crear el pedido.

---

## Scenarios

### Scenario: Conexión exitosa a BD

GIVEN PostgreSQL 15+ corriendo en localhost:5432  
WHEN la aplicación inicia y ejecuta `check_database_health()`  
THEN devuelve `True` y el pool está listo

---

### Scenario: Migraciones aplicadas sin errores

GIVEN una BD vacía  
WHEN ejecutamos `alembic upgrade head`  
THEN todas las 13 tablas existen con constraints correctos

---

### Scenario: Seed data cargado

GIVEN migraciones aplicadas  
WHEN consultamos `SELECT COUNT(*) FROM rol`  
THEN devuelve 4 registros (ADMIN, STOCK, PEDIDOS, CLIENT)

---

### Scenario: Soft delete funcional en Usuario

GIVEN usuario registrado con id=1  
WHEN se ejecuta UPDATE usuario SET deleted_at = NOW() WHERE id = 1  
THEN `SELECT * FROM usuario WHERE deleted_at IS NULL AND id = 1` devuelve vacío

---

### Scenario: Snapshot preservado en pedido

GIVEN producto con precio 100.00  
WHEN se crea pedido con ese producto  
THEN el `DetallePedido.precio_snapshot` es 100.00  
AND cambios posteriores a Producto no afectan el snapshot

---

## Criterios de Aceptación

- [ ] PostgreSQL connection pool: pool_size=10, max_overflow=20, pool_pre_ping=True
- [ ] 13 tablas creadas: Usuario, Rol, UsuarioRol, RefreshToken, DireccionEntrega, Categoria, Producto, ProductoIngrediente, Ingrediente, EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido, FormaPago, Pago
- [ ] Migraciones en `/backend/alembic/versions/` con timestamps y versiones
- [ ] Seed data automático en `env.py` o script de inicialización
- [ ] Índices en FK y campos frecuentemente consultados (email, usuario_id, producto_id)
- [ ] Tests de conexión y seed data pasando
- [ ] `check_database_health()` retorna True en startup
