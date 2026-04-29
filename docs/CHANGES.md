# Mapa Completo de Changes — Food Store v5.0

> **Documento**: Propuesta de estructura de changes para implementar Food Store de principio a fin  
> **Metodología**: Spec-Driven Development (SDD) — Feature-First  
> **Fecha**: 2026-04-28  
> **Autor**: Análisis de Especificación Técnica v5.0

---

## 📋 Resumen Ejecutivo

Food Store se desarrolla en **18 changes atómicos**, agrupados en **5 etapas** de acuerdo a dependencias arquitectónicas:

1. **Sprint 0 - Infraestructura** (5 changes): Base del proyecto — repo, configs, BD, migraciones
2. **Sprint 1 - Autenticación** (3 changes): JWT, RBAC, tokens de renovación
3. **Sprint 2 - Catálogo** (4 changes): Categorías, ingredientes, productos, navegación
4. **Sprint 3 - Pedidos** (4 changes): Creación, máquina de estados, historial, gestión
5. **Sprint 4 - Pagos y Dashboard** (2 changes): MercadoPago, panel de administración

Cada change es **atómico y versionable**: tiene proposal.md, design.md, tasks.md, y se archiva con sus specs delta en `openspec/specs/`.

---

## 📊 Tabla de Changes (Resumen)

| Sprint | Change ID | Nombre | Historias | Rol | Dependencias |
|--------|-----------|--------|-----------|-----|--------------|
| **0** | CH-000 | Scaffolding y repo | US-000 | Dev | Ninguna |
| | CH-001 | Backend config | US-000a | Dev | CH-000 |
| | CH-002 | Base de datos | US-000b | Dev | CH-001 |
| | CH-003 | Frontend config | US-000c | Dev | CH-000 |
| | CH-004 | Patrones base | US-000d, US-000e | Dev | CH-002 |
| **1** | CH-010 | Registro de cliente | US-001 | Auth | CH-004 |
| | CH-011 | Login y JWT | US-002, US-073 | Auth | CH-010 |
| | CH-012 | RBAC y roles | US-005, US-006 | Auth | CH-011 |
| **2** | CH-020 | Categorías jerárquicas | US-007, US-008, US-009, US-010 | Catalog | CH-004 |
| | CH-021 | Ingredientes y alérgenos | US-011, US-012, US-013, US-014 | Catalog | CH-020 |
| | CH-022 | Productos CRUD | US-015, US-016, US-017, US-020, US-022 | Catalog | CH-021 |
| | CH-023 | Catálogo público | US-018, US-019, US-023 | Catalog | CH-022 |
| **3** | CH-030 | Direcciones de entrega | US-024, US-025, US-026, US-027, US-028 | Orders | CH-012 |
| | CH-031 | Carrito de compras | US-029 a US-034 | Orders | CH-023 |
| | CH-032 | Creación de pedidos | US-035, US-036, US-037, US-038 | Orders | CH-031 |
| | CH-033 | Máquina de estados | US-039 a US-044 | Orders | CH-032 |
| **4** | CH-040 | MercadoPago | US-045, US-046, US-047, US-048 | Payments | CH-033 |
| | CH-041 | Panel de admin | US-049 a US-065 | Admin | CH-040 |

---

## 🔄 Mapa de Dependencias (Grafo)

```
CH-000 (scaffolding)
  ↓
  ├→ CH-001 (backend config)
  │    ↓
  │    └→ CH-002 (BD + Alembic + seed)
  │         ↓
  │         └→ CH-004 (BaseRepo, UoW, dependencias)
  │              ├→ CH-010 (registro)
  │              │    ↓
  │              │    └→ CH-011 (login JWT)
  │              │         ↓
  │              │         └→ CH-012 (RBAC roles)
  │              │              ↓
  │              │              └→ CH-030 (direcciones entrega)
  │              │
  │              ├→ CH-020 (categorías)
  │              │    ↓
  │              │    └→ CH-021 (ingredientes)
  │              │         ↓
  │              │         └→ CH-022 (productos CRUD)
  │              │              ↓
  │              │              └→ CH-023 (catálogo público)
  │              │                   ↓
  │              │                   └→ CH-031 (carrito)
  │              │                        ↓
  │              │                        └→ CH-032 (crear pedidos)
  │              │                             ↓
  │              │                             └→ CH-033 (máquina estados)
  │              │                                  ↓
  │              │                                  └→ CH-040 (MercadoPago)
  │              │                                       ↓
  │              │                                       └→ CH-041 (panel admin)
  │
  └→ CH-003 (frontend config)
       ↓
       └→ CH-004 (stores Zustand)
            ↓
            ├→ CH-010, CH-011, CH-012, CH-023, CH-031, CH-032, CH-033, CH-040, CH-041
```

---

## 📖 Especificación Detallada de Changes

### 🔵 SPRINT 0 — INFRAESTRUCTURA

---

### **CH-000: Scaffolding y Estructura Base del Proyecto**

**Nombre en kebab-case**: `project-scaffolding`

**Funcionalidad que cubre**:
- Inicialización del repositorio Git
- Estructura de carpetas para backend (feature-first) y frontend (Feature-Sliced Design)
- Archivos base: `.gitignore`, `README.md`, `.env.example`
- Configuración inicial de commitizen y convención de commits

**Historias de usuario que implementa**:
- **US-000**: Inicialización del repositorio y estructura del proyecto

**De qué otros changes depende**:
- ❌ Ninguno (es el primero)

**Por qué depende de otros**:
- N/A

**Criterios de aceptación clave**:
- [ ] Monorepo con carpetas `/backend` y `/frontend` claramente separadas
- [ ] Backend: estructura feature-first con módulos (`auth/`, `usuarios/`, `productos/`, etc.)
- [ ] Frontend: estructura FSD con capas (`app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`)
- [ ] `.gitignore` completo y `.env.example` documentado
- [ ] Commits progresivos usando conventional commits

---

### **CH-001: Configuración del Backend (FastAPI + Dependencias Core)**

**Nombre en kebab-case**: `backend-core-setup`

**Funcionalidad que cubre**:
- Instalación de FastAPI y todas las librerías del stack backend
- Configuración de `main.py` con aplicación FastAPI
- Middleware: CORS, rate limiting global, manejo de errores RFC 7807
- Módulo `core/` con configuración centralizada (config.py, database.py, security.py)

**Historias de usuario que implementa**:
- **US-000a**: Configuración del entorno backend (FastAPI + dependencias)

**De qué otros changes depende**:
- ✅ CH-000 (scaffolding)

**Por qué depende**:
- Necesita la estructura de carpetas ya creada

**Criterios de aceptación clave**:
- [ ] `pip install -r requirements.txt` instala todas las dependencias
- [ ] `uvicorn main:app --reload` arranca en puerto 8000 sin errores
- [ ] Documentación automática en `/docs` y `/redoc`
- [ ] CORS permite `http://localhost:5173` (frontend)
- [ ] Variables de entorno: DATABASE_URL, SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRE_MINUTES, etc.

---

### **CH-002: Base de Datos, Migraciones y Seed Data**

**Nombre en kebab-case**: `database-postgres-alembic`

**Funcionalidad que cubre**:
- Configuración de PostgreSQL
- Creación de todos los modelos SQLModel (16 tablas según ERD v5)
- Configuración de Alembic para migraciones versionadas
- Script de seed data: carga Roles, EstadoPedido, FormaPago, usuario admin

**Historias de usuario que implementa**:
- **US-000b**: Configuración de PostgreSQL, migraciones y seed data

**De qué otros changes depende**:
- ✅ CH-001 (backend config — necesita DATABASE_URL, SQLModel, Alembic)

**Por qué depende**:
- Los modelos SQLModel y la configuración de BD requieren las dependencias instaladas

**Criterios de aceptación clave**:
- [ ] `alembic upgrade head` crea todas las tablas sin errores
- [ ] Tabla Usuario con email UNIQUE e índice
- [ ] Tabla RefreshToken con campos token_hash, expires_at, revoked_at
- [ ] Tabla Pedido con snapshot pattern (direccion_snapshot, total)
- [ ] Tabla HistorialEstadoPedido append-only (solo INSERT)
- [ ] `python -m app.db.seed` carga datos iniciales sin duplicar
- [ ] Alembic downgrade -1 es reversible

---

### **CH-003: Configuración del Frontend (React + Vite + Dependencias Core)**

**Nombre en kebab-case**: `frontend-core-setup`

**Funcionalidad que cubre**:
- Instalación de React, TypeScript, Vite
- Configuración de Tailwind CSS con PostCSS
- Setup de Axios con interceptor base (sin JWT aún)
- Configuración de TanStack Query y routing
- TypeScript en modo strict

**Historias de usuario que implementa**:
- **US-000c**: Configuración del entorno frontend (React + Vite + dependencias)

**De qué otros changes depende**:
- ✅ CH-000 (scaffolding)

**Por qué depende**:
- Necesita la estructura de carpetas ya creada

**Criterios de aceptación clave**:
- [ ] `npm install` instala todas las dependencias
- [ ] `npm run dev` arranca servidor en puerto 5173 sin errores
- [ ] TypeScript con `strict: true`
- [ ] Tailwind CSS configurado con purging en build
- [ ] Axios instance centralizada con `VITE_API_BASE_URL`
- [ ] React Router configurado (rutas públicas y privadas base)
- [ ] QueryClientProvider en App root

---

### **CH-004: Patrones Base del Backend (BaseRepository, UoW, Dependencias)**

**Nombre en kebab-case**: `backend-core-patterns`

**Funcionalidad que cubre**:
- `BaseRepository[T]` genérico con operaciones CRUD comunes
- `UnitOfWork` como context manager para gestión de transacciones
- Dependencias FastAPI: `get_current_user()`, `require_role(roles)`
- Middleware de manejo de errores RFC 7807
- Cuatro stores Zustand en frontend: authStore, cartStore, paymentStore, uiStore

**Historias de usuario que implementa**:
- **US-000d**: Implementación de patrones base (BaseRepository, Unit of Work, dependencias)
- **US-000e**: Configuración de stores Zustand

**De qué otros changes depende**:
- ✅ CH-002 (BD — necesita SessionLocal)
- ✅ CH-003 (frontend — necesita estructura FSD)

**Por qué depende**:
- BaseRepository y UoW necesitan acceso a la BD (SQLAlchemy session)
- Stores Zustand necesitan la estructura FSD ya establecida

**Criterios de aceptación clave**:
- [ ] `BaseRepository[T]` implementado con métodos: get_by_id, list_all, create, update, soft_delete, hard_delete
- [ ] `get_by_id` y `list_all` excluyen registros con soft delete automáticamente
- [ ] `UnitOfWork` como context manager (`async with uow as _`)
- [ ] Commit automático al salir sin excepciones; rollback si hay error
- [ ] `get_current_user` extrae JWT del header Authorization y valida
- [ ] `require_role(["ADMIN"])` valida roles y lanza HTTP 403 si no tiene permiso
- [ ] authStore con accessToken, usuario, isAuthenticated + persist
- [ ] cartStore con items + persist
- [ ] paymentStore sin persist (transitorio)
- [ ] uiStore sin persist (transitorio)

---

### 🟡 SPRINT 1 — AUTENTICACIÓN Y AUTORIZACIÓN

---

### **CH-010: Registro de Cliente**

**Nombre en kebab-case**: `auth-user-registration`

**Funcionalidad que cubre**:
- Endpoint POST `/api/v1/auth/register`
- Validación de email único, contraseña hasheada con bcrypt
- Asignación automática de rol CLIENT
- Respuesta con access token, refresh token y datos del usuario
- Esquemas Pydantic: RegisterRequest, UserResponse

**Historias de usuario que implementa**:
- **US-001**: Registro de cliente

**De qué otros changes depende**:
- ✅ CH-004 (patrones base — necesita BaseRepository, UoW, validación de datos)

**Por qué depende**:
- Necesita UoW para crear transacciones atómicas
- Necesita dependencia `require_role` de FastAPI (aunque no se usa aún)
- Necesita los modelos SQLModel (Usuario, Rol) ya creados

**Criterios de aceptación clave**:
- [ ] Email se valida como único; error 409 si ya existe
- [ ] Contraseña mínimo 8 caracteres, hasheada con bcrypt (cost ≥ 10)
- [ ] Rol CLIENT asignado automáticamente en la capa de servicio
- [ ] Respuesta incluye access token (30 min) + refresh token (7 días)
- [ ] RefreshToken almacenado en BD con expires_at correcto

---

### **CH-011: Login de Usuario y JWT**

**Nombre en kebab-case**: `auth-login-jwt`

**Funcionalidad que cubre**:
- Endpoint POST `/api/v1/auth/login`
- Validación de credenciales (email + password)
- Generación de access token (30 min) y refresh token (7 días)
- Rate limiting: máximo 5 intentos fallidos en 15 minutos por IP
- No diferencia entre "email no existe" y "contraseña incorrecta"
- Endpoint POST `/api/v1/auth/logout`
- Interceptor de Axios en frontend para renovación transparente de token (401 → refresh automático)

**Historias de usuario que implementa**:
- **US-002**: Login de usuario
- **US-003**: Refresh de token
- **US-004**: Logout
- **US-066**: Manejo de token expirado en frontend
- **US-073**: Rate limiting en endpoints sensibles

**De qué otros changes depende**:
- ✅ CH-010 (registro — necesita que existan usuarios en BD)

**Por qué depende**:
- Usa el modelo Usuario y RefreshToken ya existentes
- Solo hace sentido si hay usuarios registrados

**Criterios de aceptación clave**:
- [ ] POST /auth/login valida credenciales; error 401 sin detallar si email existe
- [ ] Rate limiting: 5 intentos en 15 min por IP; HTTP 429 si se excede
- [ ] Access token contiene: userId, email, roles, exp
- [ ] Refresh token almacenado en BD; rotación: anterior se revoca
- [ ] POST /auth/refresh genera nuevo par de tokens
- [ ] POST /auth/logout marca refresh token como revocado
- [ ] Frontend: interceptor Axios detecta 401 → llama refresh automático → reintenta request original

---

### **CH-012: RBAC y Gestión de Roles**

**Nombre en kebab-case**: `auth-rbac-roles`

**Funcionalidad que cubre**:
- Endpoint GET `/api/v1/admin/usuarios/{id}/roles` — listar roles del usuario
- Endpoint PUT `/api/v1/admin/usuarios/{id}/roles` — asignar roles (solo ADMIN)
- Validación: un ADMIN no puede quitarse el único rol ADMIN
- Middleware de autorización: `require_role(["ADMIN", "STOCK"])` en routers
- Protección de rutas en frontend basada en roles
- Navegación por rol: CLIENT ve catálogo + carrito, STOCK ve productos, PEDIDOS ve pedidos, ADMIN ve todo
- Rutas públicas: catálogo, login, registro

**Historias de usuario que implementa**:
- **US-005**: Gestión de roles (RBAC)
- **US-006**: Protección de rutas por rol
- **US-075**: Navegación por rol
- **US-076**: Protección de rutas en frontend

**De qué otros changes depende**:
- ✅ CH-011 (login — necesita JWT con roles en payload)

**Por qué depende**:
- Los roles deben estar presentes en el JWT para poder proteger rutas

**Criterios de aceptación clave**:
- [ ] Endpoint de asignación de roles valida que solo ADMIN puede ejecutar
- [ ] Un usuario puede tener múltiples roles simultáneamente (M2M)
- [ ] ADMIN no puede quitarse el único rol ADMIN
- [ ] `require_role` en backend valida y lanza HTTP 403 si falta permiso
- [ ] Frontend: componente Navigation muestra opciones según roles
- [ ] Frontend: route guard redirige a login si no está autenticado
- [ ] Frontend: route guard muestra 403 o redirige si rol insuficiente
- [ ] Rutas públicas accesibles sin token

---

### 🟢 SPRINT 2 — CATÁLOGO DE PRODUCTOS

---

### **CH-020: Categorías Jerárquicas**

**Nombre en kebab-case**: `catalog-categories-hierarchy`

**Funcionalidad que cubre**:
- Endpoints CRUD: POST, GET, PUT, DELETE para categorías
- Soporte de jerarquía: `padre_id` autoreferencial (self-referencing FK)
- Validación: no permitir ciclos, no asignar categoría como padre de sí misma
- Consultas con CTE recursiva de PostgreSQL para obtener árbol completo
- Soft delete: no se pueden eliminar categorías con productos activos
- Respuesta jerárquica (nodos anidados)

**Historias de usuario que implementa**:
- **US-007**: Crear categoría
- **US-008**: Listar categorías jerárquicas
- **US-009**: Editar categoría
- **US-010**: Eliminar categoría (soft delete)

**De qué otros changes depende**:
- ✅ CH-004 (patrones base — necesita BaseRepository, UoW)

**Por qué depende**:
- Necesita UoW para transacciones atómicas
- Usa modelos SQLModel (Categoria) ya definidos

**Criterios de aceptación clave**:
- [ ] POST /api/v1/categorias crea categoría raíz o con padre
- [ ] GET /api/v1/categorias devuelve árbol anidado (público, sin auth)
- [ ] PUT /api/v1/categorias/{id} valida que no genera ciclos
- [ ] DELETE realiza soft delete; error si tiene productos activos
- [ ] Consulta jerarquía con CTE recursiva (una sola query eficiente)

---

### **CH-021: Ingredientes y Alérgenos**

**Nombre en kebab-case**: `catalog-ingredients-allergens`

**Funcionalidad que cubre**:
- Endpoints CRUD: POST, GET, PUT, DELETE para ingredientes
- Campo `es_alergeno` booleano para identificar alérgenos
- Validación: nombre único y no vacío
- Soft delete: ingredientes eliminados no aparecen en nuevas asociaciones
- Filtrado por alérgeno (GET /ingredientes?es_alergeno=true)

**Historias de usuario que implementa**:
- **US-011**: Crear ingrediente
- **US-012**: Listar ingredientes
- **US-013**: Editar ingrediente
- **US-014**: Eliminar ingrediente (soft delete)

**De qué otros changes depende**:
- ✅ CH-020 (categorías — aunque son independientes, es orden lógico)

**Por qué depende**:
- Sin dependencia técnica directa; es orden de desarrollo

**Criterios de aceptación clave**:
- [ ] POST /api/v1/ingredientes crea ingrediente con `es_alergeno`
- [ ] GET /api/v1/ingredientes devuelve lista con paginación
- [ ] Filtro por `?es_alergeno=true` funciona
- [ ] PUT /api/v1/ingredientes/{id} valida nombre único
- [ ] DELETE realiza soft delete

---

### **CH-022: Productos CRUD y Asociaciones**

**Nombre en kebab-case**: `catalog-products-crud`

**Funcionalidad que cubre**:
- Endpoints CRUD: POST, GET, PUT, DELETE para productos
- Asociación M2M Producto ↔ Categoría (tabla ProductoCategoria)
- Asociación M2M Producto ↔ Ingrediente (tabla ProductoIngrediente)
- Stock como campo entero en Producto (stock_cantidad)
- Precio como DECIMAL con precisión fija
- Endpoint PATCH para actualizar stock
- Campos de disponibilidad (disponible booleano)
- Soft delete

**Historias de usuario que implementa**:
- **US-015**: Crear producto
- **US-016**: Asociar producto a categorías
- **US-017**: Asociar ingredientes a producto
- **US-020**: Editar producto
- **US-021**: Gestionar stock de producto
- **US-022**: Eliminar producto (soft delete)

**De qué otros changes depende**:
- ✅ CH-021 (ingredientes — necesita ingredientes ya creados para asociar)

**Por qué depende**:
- Los ingredientes deben existir para poder asociarlos a productos

**Criterios de aceptación clave**:
- [ ] POST /api/v1/productos crea con nombre, descripción, precio (DECIMAL), stock, imagen
- [ ] Precio validado: > 0, máximo 2 decimales
- [ ] Stock inicial >= 0, entero
- [ ] Disponible: booleano, default true
- [ ] PUT /api/v1/productos/{id} actualiza todos los campos
- [ ] PATCH /api/v1/productos/{id}/stock actualiza stock atómicamente
- [ ] Asociación de categorías: PUT /api/v1/productos/{id}/categorias (body: array de categoryIds)
- [ ] Asociación de ingredientes: PUT /api/v1/productos/{id}/ingredientes (body: array de ingredientIds)
- [ ] DELETE realiza soft delete

---

### **CH-023: Catálogo Público y Búsqueda**

**Nombre en kebab-case**: `catalog-public-browsing`

**Funcionalidad que cubre**:
- Endpoint GET `/api/v1/productos` (público, sin auth)
- Solo devuelve productos con `disponible=true` y `eliminado_en IS NULL`
- Filtros: categoría, nombre (búsqueda con ILIKE), rango de precio
- Paginación: parámetros `page` y `limit`
- Endpoint GET `/api/v1/productos/{id}` detalle con ingredientes y categorías
- Filtro de alérgenos: excluir productos que contienen ciertos ingredientes
- Respuestas con metadatos de paginación (total, page, size, pages)

**Historias de usuario que implementa**:
- **US-018**: Listar productos del catálogo (público)
- **US-019**: Ver detalle de producto
- **US-023**: Filtrar productos por alérgenos

**De qué otros changes depende**:
- ✅ CH-022 (productos CRUD — necesita productos ya creados)

**Por qué depende**:
- Solo tiene sentido explorar el catálogo si hay productos cargados

**Criterios de aceptación clave**:
- [ ] GET /api/v1/productos devuelve solo disponibles + no eliminados
- [ ] Filtro por categoría: ?category=5
- [ ] Búsqueda por nombre: ?search=pizza (ILIKE)
- [ ] Rango de precio: ?precio_min=100&precio_max=500
- [ ] Paginación: ?page=1&limit=20 + response con metadatos
- [ ] GET /api/v1/productos/{id} incluye ingredientes con es_alergeno
- [ ] Filtro alérgenos: ?excluirAlergenos=1,3,7 (IDs de ingredientes)
- [ ] No requiere autenticación
- [ ] Incluye stock > 0 en respuesta (booleano, sin cantidad exacta)

---

### 🟣 SPRINT 3 — PEDIDOS Y GESTIÓN

---

### **CH-030: Direcciones de Entrega**

**Nombre en kebab-case**: `orders-delivery-addresses`

**Funcionalidad que cubre**:
- Endpoints CRUD: POST, GET, PUT, DELETE para direcciones de entrega
- Cada usuario puede tener múltiples direcciones
- Campos: alias, línea1 (calle), línea2 (número/piso), ciudad, código postal, referencia
- Una dirección principal por usuario (`es_principal`)
- CRUD protegido: un cliente solo ve/edita sus propias direcciones (ownership por userId)
- Soft delete

**Historias de usuario que implementa**:
- **US-024**: Crear dirección de entrega
- **US-025**: Ver direcciones propias
- **US-026**: Editar dirección propia
- **US-027**: Eliminar dirección propia (soft delete)
- **US-028**: Marcar dirección como principal

**De qué otros changes depende**:
- ✅ CH-012 (RBAC — necesita que el usuario esté autenticado)

**Por qué depende**:
- Las direcciones se asocian a usuarios vía JWT userId
- Necesita que la autenticación ya esté funcionando

**Criterios de aceptación clave**:
- [ ] POST /api/v1/direcciones crea dirección para usuario autenticado
- [ ] GET /api/v1/direcciones devuelve solo las propias
- [ ] Primera dirección se marca como principal automáticamente
- [ ] PUT /api/v1/direcciones/{id} permite cambiar datos y principal
- [ ] PATCH /api/v1/direcciones/{id}/principal marca como principal (desactiva la anterior)
- [ ] DELETE realiza soft delete
- [ ] Un cliente NO puede ver direcciones de otros usuarios (validación en servicio)
- [ ] Validación: solo una dirección principal por usuario

---

### **CH-031: Carrito de Compras**

**Nombre en kebab-case**: `orders-shopping-cart`

**Funcionalidad que cubre**:
- Carrito client-side: implementado con Zustand + localStorage
- NO existe carrito en backend
- Estructura de item: { productoId, producto (snapshot), cantidad, personalizacion (array de IDs de ingredientes a excluir) }
- Acciones: addItem, removeItem, updateQuantity, clearCart
- Persistencia: sobrevive cierre de navegador, refresh de página, logout/login
- Si producto ya está en carrito, incrementa cantidad (no duplica)
- Selectores: totalItems(), totalPrice(), getItem(productoId)
- Personalización solo permite excluir ingredientes que el producto tiene

**Historias de usuario que implementa**:
- **US-029**: Agregar producto al carrito
- **US-030**: Personalizar ingredientes del carrito (excluir)
- **US-031**: Ver resumen del carrito
- **US-032**: Actualizar cantidad en carrito
- **US-033**: Remover producto del carrito
- **US-034**: Limpiar carrito

**De qué otros changes depende**:
- ✅ CH-023 (catálogo público — necesita poder agregar productos del catálogo)

**Por qué depende**:
- El carrito se llena con productos del catálogo
- Solo funciona si hay productos disponibles

**Criterios de aceptación clave**:
- [ ] cartStore implementado en Zustand con persist
- [ ] addItem(producto, cantidad, personalizacion) agrega o incrementa
- [ ] removeItem(productoId) elimina del carrito
- [ ] updateQuantity(productoId, cantidad) actualiza cantidad
- [ ] clearCart() vacía el carrito
- [ ] totalItems() suma cantidades
- [ ] totalPrice() = suma de (cantidad × precio) + costoEnvio
- [ ] Personalización solo permite IDs de ingredientes del producto
- [ ] Persistencia en localStorage con clave `food-store-cart`
- [ ] Carrito disponible después de logout/login

---

### **CH-032: Creación de Pedidos (Transacción Atómica)**

**Nombre en kebab-case**: `orders-create-pedido`

**Funcionalidad que cubre**:
- Endpoint POST `/api/v1/pedidos` (privado, solo CLIENT)
- Recibe: array de items (producto_id, cantidad, personalizacion), dirección_id, forma_pago_id
- Validación: stock suficiente, productos disponibles, dirección pertenece al usuario
- Snapshots: precio de cada producto, nombre, dirección de entrega (inmutables)
- Cálculo de totales: subtotal por ítem, subtotal general, costo de envío, total final
- Creación atómica: Pedido + DetallePedido (×N) + HistorialEstadoPedido inicial
- Si alguna validación falla, rollback (nada persiste)
- Estado inicial: PENDIENTE

**Historias de usuario que implementa**:
- **US-035**: Crear pedido desde carrito
- **US-036**: Validar stock suficiente
- **US-037**: Generar snapshot de precio
- **US-038**: Generar snapshot de dirección

**De qué otros changes depende**:
- ✅ CH-031 (carrito — el cliente crea un pedido desde el carrito)
- ✅ CH-030 (direcciones — necesita dirección válida del usuario)

**Por qué depende**:
- El pedido se crea a partir de los items del carrito
- Necesita que la dirección exista y pertenezca al usuario

**Criterios de aceptación clave**:
- [ ] POST /api/v1/pedidos valida: stock >= cantidad para cada item
- [ ] Si stock insuficiente en cualquier item, error 400 y no se crea nada
- [ ] Creación es ATÓMICA: Pedido + todos los DetallePedido + HistorialEstadoPedido
- [ ] Snapshot de precio: precio actual del producto al crear el pedido
- [ ] Snapshot de dirección: serialización de la dirección al crear el pedido
- [ ] Total = suma(cantidad × precio_snapshot) + costo_envio
- [ ] HistorialEstadoPedido inicial: estado_desde=NULL (RN-02)
- [ ] Pedido nace en estado PENDIENTE
- [ ] Si error en cualquier paso: rollback automático (UoW)
- [ ] Respuesta: PedidoRead con id, estado, total, creado_en

---

### **CH-033: Máquina de Estados del Pedido (FSM)**

**Nombre en kebab-case**: `orders-state-machine`

**Funcionalidad que cubre**:
- Endpoint PATCH `/api/v1/pedidos/{id}/estado` — avanzar estado
- Endpoint PATCH `/api/v1/pedidos/{id}/cancelar` — cancelar pedido
- Validación de transiciones según FSM: PENDIENTE → CONFIRMADO → EN_PREP → EN_CAMINO → ENTREGADO
- CANCELADO es accesible desde PENDIENTE, CONFIRMADO, EN_PREP (solo ADMIN desde EN_PREP)
- Estados terminales (ENTREGADO, CANCELADO) no permiten transiciones salientes
- Decremento de stock al confirmar (PENDIENTE → CONFIRMADO)
- Restauración de stock al cancelar
- Historial append-only: cada cambio de estado → INSERT en HistorialEstadoPedido
- Validación de permisos: PEDIDOS/ADMIN pueden avanzar, solo ADMIN puede cancelar desde EN_PREP

**Historias de usuario que implementa**:
- **US-039**: Avanzar estado PENDIENTE → CONFIRMADO (automático vía pago)
- **US-040**: Avanzar estado CONFIRMADO → EN_PREPARACIÓN
- **US-041**: Avanzar estado EN_PREPARACIÓN → EN_CAMINO
- **US-042**: Avanzar estado EN_CAMINO → ENTREGADO
- **US-043**: Cancelar pedido con restauración de stock
- **US-044**: Ver historial de estados

**De qué otros changes depende**:
- ✅ CH-032 (crear pedidos — necesita pedidos ya creados)

**Por qué depende**:
- Solo tiene sentido cambiar estado de pedidos existentes

**Criterios de aceptación clave**:
- [ ] PATCH /api/v1/pedidos/{id}/estado valida transición según FSM
- [ ] Si transición inválida: error 400
- [ ] Al avanzar a CONFIRMADO (automático desde pago): decrementa stock atómicamente
- [ ] Si decremento falla: rollback (RN-03, RN-04)
- [ ] PATCH /api/v1/pedidos/{id}/cancelar cancela si está en PENDIENTE, CONFIRMADO, EN_PREP
- [ ] Al cancelar desde CONFIRMADO/EN_PREP: restaura stock atómicamente
- [ ] Estados ENTREGADO y CANCELADO son terminales: error si se intenta cambiar
- [ ] Todo cambio genera INSERT en HistorialEstadoPedido (append-only)
- [ ] Permiso: PEDIDOS/ADMIN avanzan; solo ADMIN cancela desde EN_PREP
- [ ] Observación (motivo) registrada en historial (obligatoria si cancela)

---

### 🔴 SPRINT 4 — PAGOS Y DASHBOARD

---

### **CH-040: Integración MercadoPago**

**Nombre en kebab-case**: `payments-mercadopago`

**Funcionalidad que cubre**:
- Endpoint POST `/api/v1/pagos/crear-preferencia` — crea pago en MercadoPago
- SDK MercadoPago en frontend: tokenización segura de tarjeta (PCI SAQ-A)
- Endpoint POST `/api/v1/pagos/webhook` — recibe IPN de MercadoPago
- Webhook procesamiento:
  - Valida firma de MercadoPago
  - Consulta estado real del pago en API de MercadoPago
  - Si status="approved": avanza pedido de PENDIENTE → CONFIRMADO + decrementa stock
  - Si status="rejected" o "pending": actualiza registro de pago, pedido permanece PENDIENTE
- Idempotency key UUID: evita cobros duplicados por reintentos
- Tabla Pago: mp_payment_id, mp_status, external_reference (UUID del pedido), idempotency_key

**Historias de usuario que implementa**:
- **US-045**: Integración MercadoPago — tokenización de tarjeta
- **US-046**: Webhook IPN — confirmación automática de pago
- **US-047**: Manejo de pagos rechazados
- **US-048**: Múltiples intentos de pago por pedido

**De qué otros changes depende**:
- ✅ CH-033 (FSM — el webhook avanza el estado del pedido)

**Por qué depende**:
- El webhook necesita la FSM implementada para avanzar a CONFIRMADO
- La transición automática PENDIENTE → CONFIRMADO está definida en la FSM

**Criterios de aceptación clave**:
- [ ] Endpoint POST /api/v1/pagos/crear-preferencia crea orden en MercadoPago
- [ ] Respuesta incluye URL de checkout para redirigir cliente
- [ ] SDK MercadoPago.js en frontend tokeniza tarjeta sin tocar servidor
- [ ] POST /api/v1/pagos/webhook recibe notificación IPN
- [ ] Webhook responde HTTP 200 inmediatamente (no procesa en línea)
- [ ] Validación de firma IPN (MercadoPago proporciona)
- [ ] Consulta estado real del pago via API (nunca confiar solo en webhook)
- [ ] Si approved: UoW avanza pedido a CONFIRMADO + decrementa stock
- [ ] Si rejected: pedido sigue PENDIENTE, cliente puede reintentar
- [ ] Tabla Pago: uno-a-muchos con Pedido (múltiples intentos)
- [ ] idempotency_key UUID generado por backend; evita cobros duplicados
- [ ] external_reference = UUID del pedido (vinculación)

---

### **CH-041: Panel de Administración**

**Nombre en kebab-case**: `admin-dashboard-and-management`

**Funcionalidad que cubre**:
- Dashboard con KPIs: total de pedidos, ingresos, pedidos pendientes, productos en stock bajo
- Gráficos con recharts: ingresos por período, pedidos por estado, productos más vendidos
- Gestión de usuarios: CRUD, asignación de roles, búsqueda y filtrado
- Gestión de productos: tabla con stock bajo, disponibilidad, búsqueda
- Gestión de pedidos: lista con filtro por estado, vista detallada, avance manual de estado
- Gestión de categorías: CRUD con validación de jerarquía
- Interfaz responsiva, mobile-first
- Componentes: skeleton loaders, toasts, modales de confirmación, estados vacíos
- Acceso restringido a ADMIN

**Historias de usuario que implementa**:
- **US-049**: Ver panel de métricas (dashboard)
- **US-050**: Gestionar usuarios
- **US-051**: CRUD categorías desde admin
- **US-052**: CRUD productos desde admin
- **US-053**: CRUD ingredientes desde admin
- **US-054**: Asignación de roles
- **US-055**: Gestión de pedidos desde admin
- **US-056** a **US-065**: Funcionalidades adicionales del admin

**De qué otros changes depende**:
- ✅ CH-040 (pagos — para mostrar datos de ingresos y pagos en dashboard)

**Por qué depende**:
- El dashboard muestra métricas de pagos, ingresos, pedidos
- Los datos de pagos están solo disponibles después de CH-040

**Criterios de aceptación clave**:
- [ ] Dashboard accesible solo para ADMIN
- [ ] KPIs: total pedidos, ingresos totales, pedidos hoy, productos bajo stock
- [ ] Gráficos recharts: barras (ingresos/día), líneas (pedidos trend), torta (por estado)
- [ ] CRUD usuarios: create, list, edit, delete + asignación de roles
- [ ] CRUD categorías: jerarquía visible, validación de ciclos
- [ ] CRUD productos: stock actualizable, disponibilidad toggle, filtro por stock
- [ ] CRUD ingredientes: es_alergeno toggle
- [ ] Gestión pedidos: filtro por estado, vista detallada, avance manual
- [ ] Componentes: skeleton loaders, toasts de confirmación, modales
- [ ] Diseño mobile-first con Tailwind
- [ ] Búsqueda y filtrado en todas las tablas
- [ ] Paginación en listados

---

## 📈 Cronograma Estimado

| Sprint | Duración | Changes | Historias | Puntos |
|--------|----------|---------|-----------|--------|
| **0** | 3-4 días | 5 | US-000 a US-000e | 50 |
| **1** | 3-4 días | 3 | US-001 a US-006, US-073, US-075, US-076 | 50 |
| **2** | 4-5 días | 4 | US-007 a US-023 | 60 |
| **3** | 5-6 días | 4 | US-024 a US-044 | 70 |
| **4** | 4-5 días | 2 | US-045 a US-065 | 70 |
| **Total** | ~3 semanas | 18 | 65 historias | 300 pts |

---

## 🎯 Reglas de Oro para Implementar Changes

### 1. **Orden es crítico**
Nunca comiences un change si sus dependencias no están archivadas. El orden respeta las dependencias reales.

### 2. **Cada change = una propuesta + un design + un checklist de tasks**
Siempre:
- Propone QUÉ y POR QUÉ
- Diseña CÓMO (arquitectura, endpoints, esquemas)
- Define TASKS atómicas (horas, no días)

### 3. **Unit of Work protege la integridad**
Todo lo que toca múltiples tablas (crear pedido, cambiar estado, procesar pago) debe estar dentro de `async with UnitOfWork() as uow:`.

### 4. **Snapshot = Inmutabilidad**
Precios, nombres, direcciones en pedidos son snapshots: se capturan al crear el pedido y nunca cambian.

### 5. **Append-only = Auditoría Completa**
`HistorialEstadoPedido` solo INSERT; nunca UPDATE ni DELETE. Garantiza trazabilidad.

### 6. **Soft delete = No pierdas datos**
Registros con `eliminado_en` no desaparecen; solo se ocultan en queries públicas.

### 7. **Rate limiting + validación = Seguridad**
Protege login (5/15min), valida inputs, no diferencies errores de auth.

---

## 📝 Nota Final

Este mapa es **flexible**. Si durante la implementación descubrís que un change es demasiado grande, podés dividirlo. Si descubrís dependencias no previstas, comunicalo al equipo. **La especificación es una guía viva**, no una biblia.

Cada change completamente implementado y archivado se vuelve contexto para los siguientes. Así se construye un sistema coherente y mantenible.

**¡Que disfrutes el desarrollo! 🚀**
