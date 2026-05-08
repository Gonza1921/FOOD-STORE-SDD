# Design — ch-002-database

## Arquitectura

El schema sigue Tercera Forma Normal (3FN) con Soft Delete, Snapshot Pattern en pedidos y Audit Trail append-only.

### Dominios

```
┌─────────────────────────────────────────────────────────────────┐
│ DOMINIO 1: IDENTIDAD Y ACCESO (5 entidades)                    │
├─────────────────────────────────────────────────────────────────┤
│ Usuario (PK: id, UQ: email, soft delete via deleted_at)        │
│ Rol (PK semántica: codigo ∈ {ADMIN, STOCK, PEDIDOS, CLIENT})  │
│ UsuarioRol (PK compuesta: usuario_id + rol_codigo, M:M pivot) │
│ RefreshToken (PK: id, UQ: token_hash, revoked_at para logout) │
│ DireccionEntrega (PK: id, FK: usuario_id, es_principal: BOOL) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DOMINIO 2: CATÁLOGO DE PRODUCTOS (5 entidades)                 │
├─────────────────────────────────────────────────────────────────┤
│ Categoria (PK: id, self-ref: parent_id NULL, CTE recursiva)    │
│ Producto (PK: id, FK: categoria_id, stock_cantidad, disponible)│
│ ProductoIngrediente (PK compuesta: producto_id + ingrediente_id)
│ Ingrediente (PK: id, UQ: nombre, es_alergeno: BOOL)           │
│ ProductoCategoria (PK compuesta: producto_id + cat_id pivot)   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DOMINIO 3: VENTAS, PAGOS Y TRAZABILIDAD (5 entidades)         │
├─────────────────────────────────────────────────────────────────┤
│ EstadoPedido (PK semántica: codigo, catálogo fijo)             │
│ Pedido (PK: id, FK: usuario_id, estado_codigo, total snapshot) │
│ DetallePedido (PK: id, FK: pedido_id, precio/nombre snapshot)  │
│ HistorialEstadoPedido (PK: id, append-only, estado_desde NULL) │
│ FormaPago (PK semántica: codigo, catálogo fijo)                │
│ Pago (PK: id, FK: pedido_id, mp_payment_id UQ, MercadoPago)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Entidades Detalladas

### DOMINIO 1

#### Usuario
```python
class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: EmailStr = Field(unique=True, max_length=254)
    password_hash: str = Field(max_length=60)  # bcrypt, cost ≥ 12
    nombre: str = Field(max_length=50)
    apellido: str = Field(max_length=50)
    
    # Audit
    creado_en: datetime = Field(default_factory=utcnow)
    actualizado_en: datetime = Field(default_factory=utcnow)
    deleted_at: Optional[datetime] = None  # Soft delete
    
    # Relations
    roles: List["Rol"] = Relationship(back_populates="usuarios", link_model=UsuarioRol)
    direcciones: List["DireccionEntrega"] = Relationship(back_populates="usuario")
```

#### Rol
```python
class Rol(SQLModel, table=True):
    codigo: str = Field(primary_key=True, max_length=20)  # ADMIN, STOCK, PEDIDOS, CLIENT
    nombre: str = Field(max_length=50)
    descripcion: Optional[str] = Field(max_length=200)
    
    # Relations
    usuarios: List["Usuario"] = Relationship(back_populates="roles", link_model=UsuarioRol)
```

#### UsuarioRol (Pivot)
```python
class UsuarioRol(SQLModel, table=True):
    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    rol_codigo: str = Field(foreign_key="rol.codigo", primary_key=True)
    asignado_en: datetime = Field(default_factory=utcnow)
    asignado_por_id: Optional[int] = Field(foreign_key="usuario.id")
```

#### RefreshToken
```python
class RefreshToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    token_hash: str = Field(unique=True, max_length=64)  # SHA-256
    expires_at: datetime  # 7 días
    revoked_at: Optional[datetime] = None  # NULL = activo
    creado_en: datetime = Field(default_factory=utcnow)
```

#### DireccionEntrega
```python
class DireccionEntrega(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    alias: Optional[str] = Field(max_length=50)  # 'Casa', 'Trabajo'
    linea1: str  # Calle, número
    linea2: Optional[str]  # Piso, depto
    ciudad: str = Field(max_length=50)
    provincia: str = Field(max_length=50)
    codigo_postal: str = Field(max_length=10)
    es_principal: bool = Field(default=False)
    
    creado_en: datetime = Field(default_factory=utcnow)
    actualizado_en: datetime = Field(default_factory=utcnow)
```

---

### DOMINIO 2

#### Categoria
```python
class Categoria(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    descripcion: Optional[str] = Field(max_length=200)
    parent_id: Optional[int] = Field(foreign_key="categoria.id", default=None)  # Self-ref
    
    creado_en: datetime = Field(default_factory=utcnow)
    actualizado_en: datetime = Field(default_factory=utcnow)
    deleted_at: Optional[datetime] = None  # Soft delete
```

#### Producto
```python
class Producto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=200)
    descripcion: Optional[str]
    precio_base: Decimal = Field(max_digits=10, decimal_places=2)  # CHECK >= 0
    stock_cantidad: int = Field(default=0)  # CHECK >= 0, gestionado por STOCK
    disponible: bool = Field(default=True)  # Toggle manual independiente del stock
    
    categoria_id: int = Field(foreign_key="categoria.id")
    
    creado_en: datetime = Field(default_factory=utcnow)
    actualizado_en: datetime = Field(default_factory=utcnow)
    deleted_at: Optional[datetime] = None
```

#### Ingrediente
```python
class Ingrediente(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, max_length=100)
    descripcion: Optional[str] = Field(max_length=200)
    es_alergeno: bool = Field(default=False)  # Badge en UI
    
    creado_en: datetime = Field(default_factory=utcnow)
    actualizado_en: datetime = Field(default_factory=utcnow)
```

#### ProductoIngrediente (Pivot)
```python
class ProductoIngrediente(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="producto.id")
    ingrediente_id: int = Field(foreign_key="ingrediente.id")
    es_removible: bool = Field(default=False)  # Habilita personalización
```

#### ProductoCategoria (Pivot)
```python
class ProductoCategoria(SQLModel, table=True):
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    es_principal: bool = Field(default=False)  # Categoría primaria del producto
```

---

### DOMINIO 3

#### EstadoPedido (Catálogo)
```python
class EstadoPedido(SQLModel, table=True):
    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: str = Field(max_length=200)
    orden: int  # 1-6 para visualización
    es_terminal: bool  # true = no transiciones salientes
```

#### Pedido
```python
class Pedido(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    estado_codigo: str = Field(foreign_key="estado_pedido.codigo")
    
    # Snapshots
    total: Decimal = Field(max_digits=10, decimal_places=2)  # Inmutable
    costo_envio: Decimal = Field(default=Decimal("50.00"))
    
    # Relaciones
    forma_pago_codigo: str = Field(foreign_key="forma_pago.codigo")
    direccion_id: Optional[int] = Field(foreign_key="direccion_entrega.id", default=None)  # SET NULL
    
    # Audit
    creado_en: datetime = Field(default_factory=utcnow)
    actualizado_en: datetime = Field(default_factory=utcnow)
```

#### DetallePedido
```python
class DetallePedido(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    producto_id: int = Field(foreign_key="producto.id")  # Referencia histórica
    cantidad: int
    
    # Snapshots (inmutables)
    nombre_snapshot: str = Field(max_length=200)
    precio_snapshot: Decimal = Field(max_digits=10, decimal_places=2)
    
    # Personalización
    personalizacion: Optional[List[int]]  # IDs de ingredientes removidos (PostgreSQL INTEGER[])
```

#### HistorialEstadoPedido (Append-Only)
```python
class HistorialEstadoPedido(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    
    estado_desde: Optional[str] = Field(foreign_key="estado_pedido.codigo", default=None)  # NULL = transición inicial
    estado_nuevo: str = Field(foreign_key="estado_pedido.codigo")
    
    motivo: Optional[str] = Field(max_length=500)  # Obligatorio si estado_nuevo = CANCELADO
    usuario_id: int = Field(foreign_key="usuario.id")
    
    created_at: datetime = Field(default_factory=utcnow)  # Append-only, nunca updated_at
    
    # Validación: NO UPDATE, NO DELETE
```

#### FormaPago (Catálogo)
```python
class FormaPago(SQLModel, table=True):
    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: str = Field(max_length=200)
    habilitado: bool = Field(default=True)
```

#### Pago
```python
class Pago(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    
    # MercadoPago
    mp_payment_id: Optional[int] = Field(unique=True)
    mp_status: str = Field(max_length=30)  # pending, approved, rejected
    external_reference: str = Field(unique=True, max_length=100)  # UUID del pedido
    idempotency_key: str = Field(unique=True, max_length=100)  # UUID generado
    
    # Audit
    creado_en: datetime = Field(default_factory=utcnow)
    actualizado_en: datetime = Field(default_factory=utcnow)
```

---

## Migraciones Alembic

### Estructura
```
backend/alembic/
├── versions/
│   ├── 001_initial_schema.py      # Crear todas las 13 tablas
│   └── 002_seed_data.py           # Insert catálogos
├── env.py
├── script.py.mako
└── alembic.ini
```

### Aplicación
```bash
# Primera vez
alembic upgrade head

# Crear nueva migración (autogenerate)
alembic revision --autogenerate -m "descripción"
```

---

## Índices Críticos

```sql
-- Performance en queries frecuentes
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_deleted_at ON usuario(deleted_at);
CREATE INDEX idx_producto_categoria_id ON producto(categoria_id);
CREATE INDEX idx_pedido_usuario_id ON pedido(usuario_id);
CREATE INDEX idx_pedido_estado_codigo ON pedido(estado_codigo);
CREATE INDEX idx_detalle_pedido_id ON detalle_pedido(pedido_id);
CREATE INDEX idx_historial_pedido_id ON historial_estado_pedido(pedido_id);
CREATE INDEX idx_refresh_token_usuario_id ON refresh_token(usuario_id);
```

---

## Seed Data Script

```python
# alembic/versions/002_seed_data.py

def upgrade():
    # Roles
    op.execute("""
        INSERT INTO rol (codigo, nombre, descripcion) VALUES
        ('ADMIN', 'Administrador', 'Acceso total al sistema'),
        ('STOCK', 'Gestor de Stock', 'Gestión de inventario'),
        ('PEDIDOS', 'Gestor de Pedidos', 'Operación de pedidos'),
        ('CLIENT', 'Cliente', 'Acceso cliente');
    """)
    
    # Estados de Pedido
    op.execute("""
        INSERT INTO estado_pedido (codigo, descripcion, orden, es_terminal) VALUES
        ('PENDIENTE', 'Pedido creado, pago pendiente', 1, false),
        ('CONFIRMADO', 'Pago procesado', 2, false),
        ('EN_PREP', 'En preparación', 3, false),
        ('EN_CAMINO', 'Despachado', 4, false),
        ('ENTREGADO', 'Entregado', 5, true),
        ('CANCELADO', 'Cancelado', 6, true);
    """)
    
    # Formas de Pago
    op.execute("""
        INSERT INTO forma_pago (codigo, descripcion, habilitado) VALUES
        ('MERCADOPAGO', 'MercadoPago', true),
        ('EFECTIVO', 'Efectivo al retirar', true),
        ('TRANSFERENCIA', 'Transferencia bancaria', false);
    """)
    
    # Usuario Admin
    op.execute("""
        INSERT INTO usuario (email, password_hash, nombre, apellido) VALUES
        ('admin@foodstore.local', '{bcrypt_hash_aquí}', 'Admin', 'Food Store');
    """)
```

---

## Validaciones de Integridad

1. **Soft Delete**: Siempre filtrar `WHERE deleted_at IS NULL` en queries
2. **CTE Recursiva**: Validar que no haya ciclos en categorías antes de INSERT
3. **Snapshot Immutable**: DetallePedido.nombre_snapshot y precio_snapshot = READ-ONLY
4. **Append-Only**: HistorialEstadoPedido = INSERT ONLY, nunca UPDATE/DELETE
5. **FSM Transiciones**: EstadoPedido.es_terminal valida en Service, no en BD

---

## Cambios Respecto a CH-001

- ✅ Alembic configurado (no manual CREATE TABLE)
- ✅ 13 entidades en SQLModel (no en modelos sueltos)
- ✅ Seed data automático (no manual INSERT)
- ✅ Índices para performance (no queries N+1)

