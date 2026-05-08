# FOOD STORE — ROADMAP PROFESIONAL Y DEFINITIVO v5.0

**Documento**: Roadmap Completo y Definitivo del Proyecto  
**Metodología**: Spec-Driven Development (SDD) + Feature-First Architecture  
**Fecha de generación**: 2026-05-08  
**Versión**: 5.0 — Sistema E-commerce de Alimentos  
**Estado**: Listo para Implementación

---

## 📋 EXECUTIVE SUMMARY

**FOOD STORE** es una plataforma de e-commerce full-stack especializada en la venta de productos alimenticios. Implementa una arquitectura modular, escalable y con patrones de diseño de nivel empresarial (Unit of Work, Repository Pattern, FSM, Snapshot, Audit Trail).

### Visión de 18 Sprints / 5 Etapas

El desarrollo se organiza en **18 changes atómicos** agrupados en **5 sprints**:

1. **Sprint 0 - Infraestructura** (5 changes, ~12-16h): Base del proyecto, repos, configs, BD, migraciones
2. **Sprint 1 - Autenticación** (3 changes, ~12-16h): JWT, RBAC, renovación de tokens
3. **Sprint 2 - Catálogo** (4 changes, ~16-20h): Categorías jerárquicas, ingredientes, productos, navegación
4. **Sprint 3 - Pedidos** (4 changes, ~20-24h): Creación, máquina de estados, historial, gestión
5. **Sprint 4 - Pagos & Admin** (2 changes, ~12-16h): MercadoPago, panel de administración

**Estimación Total**: ~72-92 horas (~2-3 semanas de desarrollo full-time)

### Dependencias Críticas

- **Orden es CRÍTICO**: Las dependencias respetan el flujo de datos y la coherencia del sistema
- **Unit of Work**: Garantiza transacciones atómicas en operaciones complejas
- **Soft Delete**: Preserva integridad referencial sin perder datos históricos
- **Snapshot Pattern**: Inmutabilidad de datos en pedidos (precios, direcciones, nombres)
- **Audit Trail Append-Only**: Trazabilidad completa en HistorialEstadoPedido

### Stack Validado

**Backend**: FastAPI 0.110+ | SQLModel 0.0.19+ | PostgreSQL 15+ | Alembic | Passlib(bcrypt) | slowapi | MercadoPago SDK  
**Frontend**: React 18+ | TypeScript 5+ | Vite 5+ | TanStack Query 5+ | TanStack Form | Zustand 4+ | Tailwind CSS 3+ | recharts | Axios

---

## 🎯 MAPA VISUAL DE DEPENDENCIAS (DAG)

```
CH-000 (scaffolding) ─────────────────────────────────────────┐
  ├─→ CH-001 (backend config)                                 │
  │    └─→ CH-002 (BD + Alembic + seed)                       │
  │         └─→ CH-004 (BaseRepo, UoW, deps FastAPI)          │
  │              ├─→ CH-010 (registro)                        │
  │              │    └─→ CH-011 (login JWT)                  │
  │              │         └─→ CH-012 (RBAC roles)            │
  │              │              └─→ CH-030 (direcciones)      │
  │              │                   ↓                         │
  │              │              CH-032 (crear pedidos) ←──────┤
  │              │                   ↓                        │
  │              │              CH-033 (FSM)                  │
  │              │                   ↓                        │
  │              │              CH-040 (MercadoPago)          │
  │              │                   ↓                        │
  │              │              CH-041 (admin)                │
  │              │                                            │
  │              ├─→ CH-020 (categorías)                      │
  │              │    └─→ CH-021 (ingredientes)               │
  │              │         └─→ CH-022 (productos CRUD)        │
  │              │              └─→ CH-023 (catálogo público) │
  │              │                   └─→ CH-031 (carrito) ────┘
  │              │
  └──────────────→ CH-003 (frontend config)
       └─→ CH-004 (stores Zustand)
```

---

## 📊 TABLA MAESTRA DE CHANGES (18 Total)

| # | ID | Nombre | Módulo | Sprint | Rol | Prioridad | Complejidad | Horas | Historias | Dependencias |
|---|----|----|--------|--------|-----|-----------|-----------|-------|-----------|--|
| 1 | CH-000 | Scaffolding y repo | DevOps | 0 | Dev | Crítica | Trivial | 2 | US-000 | Ninguna |
| 2 | CH-001 | Backend config | DevOps | 0 | Dev | Crítica | Baja | 3 | US-000a | CH-000 |
| 3 | CH-002 | Base de datos | DevOps | 0 | Dev | Crítica | Media | 4 | US-000b | CH-001 |
| 4 | CH-003 | Frontend config | DevOps | 0 | Dev | Crítica | Baja | 3 | US-000c | CH-000 |
| 5 | CH-004 | Patrones base | Backend | 0 | Dev | Crítica | Media | 4 | US-000d, US-000e | CH-002, CH-003 |
| 6 | CH-010 | Registro | Auth | 1 | Auth | Crítica | Media | 4 | US-001 | CH-004 |
| 7 | CH-011 | Login & JWT | Auth | 1 | Auth | Crítica | Media | 4 | US-002, US-003, US-004, US-066, US-073 | CH-010 |
| 8 | CH-012 | RBAC roles | Auth | 1 | Auth | Alta | Media | 3 | US-005, US-006, US-075, US-076 | CH-011 |
| 9 | CH-020 | Categorías | Catalog | 2 | Backend | Alta | Media | 4 | US-007, US-008, US-009, US-010 | CH-004 |
| 10 | CH-021 | Ingredientes | Catalog | 2 | Backend | Alta | Baja | 3 | US-011, US-012, US-013, US-014 | CH-020 |
| 11 | CH-022 | Productos CRUD | Catalog | 2 | Backend | Crítica | Media | 5 | US-015, US-016, US-017, US-020, US-021, US-022 | CH-021 |
| 12 | CH-023 | Catálogo público | Catalog | 2 | Backend/Frontend | Alta | Media | 4 | US-018, US-019, US-023 | CH-022 |
| 13 | CH-030 | Direcciones | Orders | 3 | Backend | Alta | Baja | 3 | US-024, US-025, US-026, US-027, US-028 | CH-012 |
| 14 | CH-031 | Carrito | Orders | 3 | Frontend | Alta | Media | 4 | US-029 a US-034 | CH-023 |
| 15 | CH-032 | Crear pedidos | Orders | 3 | Backend | Crítica | Alta | 6 | US-035, US-036, US-037, US-038 | CH-031, CH-030 |
| 16 | CH-033 | FSM pedidos | Orders | 3 | Backend | Crítica | Alta | 6 | US-039 a US-044 | CH-032 |
| 17 | CH-040 | MercadoPago | Payments | 4 | Backend/Frontend | Crítica | Alta | 8 | US-045, US-046, US-047, US-048 | CH-033 |
| 18 | CH-041 | Panel Admin | Admin | 4 | Frontend | Media | Muy Alta | 10 | US-049 a US-065 | CH-040 |

**Estimación Total**: 92 horas (~2.3 semanas full-time, ~3.7 semanas part-time @ 24h/semana)

---

## 📖 ESPECIFICACIÓN COMPLETA POR CHANGE

---

### **SPRINT 0: INFRAESTRUCTURA Y BASE**

---

### **CH-000: Scaffolding y Estructura Base del Proyecto**

**Nombre en kebab-case**: `project-scaffolding`

**Sprint**: 0  
**Módulo**: DevOps  
**Prioridad**: Crítica  
**Complejidad**: Trivial  
**Horas estimadas**: 2h  

#### OBJETIVO

Inicializar el repositorio Git con la estructura de carpetas para un monorepo backend (feature-first) y frontend (Feature-Sliced Design), estableciendo la base sobre la cual se construirá el resto del sistema. Define convenciones, gitignore, README y archivos de configuración base.

#### FUNCIONALIDADES CUBIERTAS

- Creación del repositorio Git con estructura monorepo
- Carpetas `/backend` y `/frontend` separadas y claras
- Estructura feature-first en backend: `auth/`, `usuarios/`, `productos/`, `categorias/`, `ingredientes/`, `pedidos/`, `pagos/`, `direcciones/`, `admin/`, `refreshtokens/`, `core/`
- Estructura Feature-Sliced Design en frontend: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`
- Archivo `.gitignore` completo para Python y Node.js
- Archivo `README.md` raíz con instrucciones básicas de setup
- Archivo `.env.example` en backend y frontend con todas las variables documentadas
- Inicialización de commits con conventional commits

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-000**: Inicialización del repositorio y estructura del proyecto

#### DEPENDENCIAS

**Depende de**: Ninguna (es el primero)

**Impacto**: CH-001, CH-003 dependen de este

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] Git repositorio inicializado con commits convencionales
- [ ] Monorepo: `/backend` y `/frontend` son carpetas raíz diferenciadas
- [ ] Backend: 10 carpetas de módulos + `/core` configurada
- [ ] Frontend: 6 capas FSD configuradas (`app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`)
- [ ] `.gitignore` excluye: `.env`, `__pycache__/`, `node_modules/`, `.venv/`, `*.pyc`, `dist/`, `.DS_Store`, `.idea/`
- [ ] `README.md` raíz con: descripción, stack, setup steps, comandos principales
- [ ] `.env.example` en `/backend` con: DATABASE_URL, SECRET_KEY, JWT_EXPIRE, CORS_ORIGINS, MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_NOTIFICATION_URL
- [ ] `.env.example` en `/frontend` con: VITE_API_BASE_URL, VITE_MERCADOPAGO_PUBLIC_KEY
- [ ] Commits progresivos (no un solo commit masivo): initialize repo, structure backend, structure frontend, add docs

#### PATRONES APLICADOS

- Convención de commits: conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- Estructura modular: feature-first (backend) y FSD (frontend)

#### DECISIONES ARQUITECTÓNICAS

- **Monorepo vs. Polyrepo**: Elegimos monorepo para simplificar el desarrollo y mantener todo en un solo lugar
- **Feature-First Backend**: Agrupa toda la lógica de una funcionalidad (router, service, repository, model) en una carpeta única
- **FSD Frontend**: Separa por capas (app → pages → widgets → features → entities → shared) con restricción de importación hacia arriba

#### POSIBLES MEJORAS FUTURAS

- [ ] Agregar Husky + pre-commit hooks para linting
- [ ] Agregar workspace scripts en package.json para comandos de frontend y backend simultaneos
- [ ] Configurar CI/CD (GitHub Actions) con linting y tests

---

### **CH-001: Configuración del Backend (FastAPI + Dependencias Core)**

**Nombre en kebab-case**: `backend-core-setup`

**Sprint**: 0  
**Módulo**: DevOps  
**Prioridad**: Crítica  
**Complejidad**: Baja  
**Horas estimadas**: 3h  

#### OBJETIVO

Configurar FastAPI con todas las dependencias core (SQLModel, Alembic, bcrypt, python-jose, slowapi, MercadoPago SDK), crear el archivo `main.py`, establecer middleware (CORS, rate limiting global, error handling), y preparar la estructura `core/` con módulos de configuración, base de datos y seguridad.

#### FUNCIONALIDADES CUBIERTAS

- Instalación de dependencias (requirements.txt)
- Configuración de FastAPI application
- Middleware: CORS (permite localhost:5173), rate limiting global, error handling RFC 7807
- Módulo `core/config.py`: lectura de variables de entorno con valores por defecto
- Módulo `core/database.py`: engine de SQLAlchemy y session factory
- Módulo `core/security.py`: funciones de hashing (bcrypt) y JWT (sign/verify)
- Documentación automática: Swagger UI (/docs) y ReDoc (/redoc)
- Punto de entrada: `main.py` con registro de routers

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-000a**: Configuración del entorno backend (FastAPI + dependencias)

#### DEPENDENCIAS

**Depende de**: CH-000 (necesita estructura de carpetas)

**Impacto**: CH-002 (BD configurada), CH-004 (patrones base) dependen de este

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] `pip install -r requirements.txt` instala: FastAPI, SQLModel, Alembic, Passlib[bcrypt], python-jose, slowapi, mercadopago, uvicorn, httpx, pydantic[email-validator]
- [ ] `uvicorn main:app --reload` arranca en puerto 8000 sin errores
- [ ] Swagger UI accesible en `http://localhost:8000/docs`
- [ ] ReDoc accesible en `http://localhost:8000/redoc`
- [ ] CORS middleware permite origen `http://localhost:5173` (frontend)
- [ ] `core/config.py` lee variables de entorno con valores por defecto
- [ ] `core/database.py` configura SQLAlchemy engine y SessionLocal
- [ ] `core/security.py` contiene: `hash_password(password) → hashed`, `verify_password(plain, hashed) → bool`, `create_jwt(payload) → token`
- [ ] RFC 7807 error handler devuelve: `{ "detail": "...", "code": "ERROR_CODE", "timestamp": "..." }`
- [ ] main.py registra routers con prefijo `/api/v1`

#### PATRONES APLICADOS

- Dependency Injection: FastAPI Depends para inyectar dependencias
- Configuration Management: variables de entorno centralizadas

#### DECISIONES ARQUITECTÓNICAS

- **HS256 vs. RS256**: Elegimos HS256 por simplicity; RS256 en producción si fuera necesario
- **Rate Limiting Global**: slowapi con storage in-memory (producción: Redis)

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Variables de entorno no configuradas en primer deploy
   - Impacto: CRÍTICO — aplicación no arranca
   - Mitigación: Script de setup que valida `.env.example`

2. **Riesgo**: CORS muy permisivo en desarrollo
   - Impacto: BAJO — solo en desarrollo
   - Mitigación: Configuración por ambiente (dev vs. prod)

---

### **CH-002: Base de Datos, Migraciones y Seed Data**

**Nombre en kebab-case**: `database-postgres-alembic`

**Sprint**: 0  
**Módulo**: DevOps  
**Prioridad**: Crítica  
**Complejidad**: Media  
**Horas estimadas**: 4h  

#### OBJETIVO

Crear toda la estructura de base de datos PostgreSQL (16 tablas del ERD v5), configurar Alembic para migraciones versionadas, y desarrollar un script de seed data idempotente que cargue los datos iniciales (Roles, EstadoPedido, FormaPago, usuario admin).

#### FUNCIONALIDADES CUBIERTAS

- Modelos SQLModel para todas las 16 tablas del ERD v5
- Configuración de Alembic (init, env.py, script.py.mako)
- Creación de migraciones con autogenerate desde modelos
- Script seed data: `app/db/seed.py` (idempotente)
- Aplicación de migraciones: `alembic upgrade head`
- Reversión de migraciones: `alembic downgrade -1`

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-000b**: Configuración de PostgreSQL, migraciones y seed data

#### DEPENDENCIAS

**Depende de**: CH-001 (necesita DATABASE_URL, SQLModel, Alembic configurados)

**Impacto**: CH-004 (patrones base) depende de este

#### ENDPOINTS/FEATURES PRINCIPALES

No hay endpoints en este change; es infraestructura pura.

#### CHANGES DEL BACKEND

**Modelos SQLModel (16 tablas)**:
- Usuario (id, email UNIQUE, password_hash, nombre, telefono, creado_en, actualizado_en, eliminado_en)
- Rol (codigo PK, nombre, descripcion)
- UsuarioRol (usuario_id FK, rol_codigo FK, asignado_por_id FK)
- RefreshToken (token_hash PK, usuario_id FK, expires_at, revoked_at)
- DireccionEntrega (id, usuario_id FK, alias, linea1, linea2, ciudad, codigo_postal, referencia, es_principal, creado_en, actualizado_en, eliminado_en)
- Categoria (id, nombre, descripcion, imagen_url, padre_id FK (self-ref), creado_en, actualizado_en, eliminado_en)
- Producto (id, nombre, descripcion, precio_base DECIMAL(10,2), stock_cantidad INTEGER, disponible BOOLEAN, imagen_url, creado_en, actualizado_en, eliminado_en)
- Ingrediente (id, nombre UQ, descripcion, es_alergeno BOOLEAN, creado_en, actualizado_en, eliminado_en)
- ProductoCategoria (producto_id FK, categoria_id FK, es_principal BOOLEAN, PK compuesta)
- ProductoIngrediente (producto_id FK, ingrediente_id FK, es_removible BOOLEAN, PK compuesta)
- FormaPago (codigo PK, nombre, descripcion, habilitado BOOLEAN)
- EstadoPedido (codigo PK, nombre, descripcion, orden INTEGER, es_terminal BOOLEAN)
- Pedido (id, usuario_id FK, estado_codigo FK, direccion_id FK (SET NULL), forma_pago_codigo FK, costo_envio DECIMAL, total DECIMAL, direccion_snapshot JSONB, creado_en, actualizado_en, eliminado_en)
- DetallePedido (id, pedido_id FK, producto_id FK, cantidad INTEGER, precio_snapshot DECIMAL, nombre_snapshot VARCHAR, personalizacion INTEGER[], creado_en)
- HistorialEstadoPedido (id, pedido_id FK, estado_desde VARCHAR FK (NULL), estado_nuevo VARCHAR FK, usuario_id FK (NULL), observacion TEXT, creado_en)
- Pago (id, pedido_id FK, monto DECIMAL, mp_payment_id BIGINT (UQ, NULL), mp_status VARCHAR, external_reference UUID (UQ), idempotency_key VARCHAR (UQ), creado_en, actualizado_en)

**Migraciones Alembic**:
- `versions/001_initial_schema.py`: crea todas las tablas

**Script Seed**:
- `app/db/seed.py`: carga Roles (ADMIN, STOCK, PEDIDOS, CLIENT), EstadoPedido (6 estados), FormaPago (3 formas), Usuario admin

#### SCHEMAS PYDANTIC / TYPESCRIPT

No hay schemas en este change (es infraestructura).

#### PATRONES APLICADOS

- Soft Delete: campo `eliminado_en` TIMESTAMPTZ en tablas principales
- Audit Trail: `creado_en` (default NOW), `actualizado_en` (auto-update)
- Snapshot Pattern: `direccion_snapshot` JSONB, `precio_snapshot` DECIMAL en DetallePedido
- Append-Only: HistorialEstadoPedido solo INSERT (no UPDATE/DELETE)

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] `alembic upgrade head` sin errores
- [ ] Todas las 16 tablas creadas en PostgreSQL
- [ ] Email en Usuario con UNIQUE e índice
- [ ] RefreshToken con token_hash (SHA-256) y expires_at
- [ ] Categoria con padre_id autoreferencial nullable
- [ ] Producto con precio_base DECIMAL (nunca float), stock_cantidad INTEGER
- [ ] Ingrediente con es_alergeno booleano
- [ ] Pedido con direccion_snapshot JSONB
- [ ] DetallePedido con personalizacion INTEGER[] (array de PostgreSQL)
- [ ] HistorialEstadoPedido con estado_desde VARCHAR (puede ser NULL para primer historial)
- [ ] Pago con mp_payment_id UQ nullable, external_reference UQ
- [ ] Script seed es idempotente: ejecutar 2 veces NO duplica datos
- [ ] `alembic downgrade -1` sin errores (migraciones reversibles)
- [ ] Campos de auditoría (creado_en, actualizado_en) en todas las tablas principales

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: DATABASE_URL no configurada
   - Impacto: CRÍTICO — migraciones no corren
   - Mitigación: Script pre-setup que verifica .env

2. **Riesgo**: Columnas de snapshot JSONB sin índice
   - Impacto: BAJO — performance en queries complejas
   - Mitigación: Agregar índices GIN en producción si es necesario

3. **Riesgo**: Datos de seed duplicados en múltiples ejecuciones
   - Impacto: ALTO — inconsistencia de datos
   - Mitigación: Script idempotente con INSERT ... ON CONFLICT DO NOTHING

---

### **CH-003: Configuración del Frontend (React + Vite + Dependencias Core)**

**Nombre en kebab-case**: `frontend-core-setup`

**Sprint**: 0  
**Módulo**: DevOps  
**Prioridad**: Crítica  
**Complejidad**: Baja  
**Horas estimadas**: 3h  

#### OBJETIVO

Inicializar el proyecto React con TypeScript, Vite como bundler, Tailwind CSS para estilos, TanStack Query para sincronización de servidor, React Router para enrutamiento, y Axios configurado (sin JWT aún). Establecer estructura FSD y variables de entorno.

#### FUNCIONALIDADES CUBIERTAS

- Instalación de React, TypeScript, Vite
- Configuración de Tailwind CSS + PostCSS
- Setup de Axios con instance centralizada
- Configuración de TanStack Query con QueryClientProvider
- React Router v6 con rutas base
- TypeScript en modo `strict: true`
- Vite con HMR y fast refresh

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-000c**: Configuración del entorno frontend (React + Vite + dependencias)

#### DEPENDENCIAS

**Depende de**: CH-000 (necesita estructura de carpetas)

**Impacto**: CH-004 (stores Zustand), CH-023 (catálogo) dependen de este

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] `npm install` sin errores
- [ ] `npm run dev` arranca en puerto 5173 sin errores
- [ ] TypeScript configurado con `strict: true` en tsconfig.json
- [ ] Tailwind CSS configurado con PostCSS y purging
- [ ] Archivo `src/shared/api/axios.ts` con instance centralizada
- [ ] `VITE_API_BASE_URL` definido en `.env` (ejemplo: `http://localhost:8000/api/v1`)
- [ ] React Router configured en `src/app/App.tsx` con rutas públicas y privadas base
- [ ] QueryClientProvider envuelve la aplicación en App root
- [ ] ESLint + Prettier configurados (opcional pero recomendado)

#### PATRONES APLICADOS

- Dependency Injection: React Context/Hooks
- Centralized Configuration: variables de entorno via Vite
- Utility-First CSS: Tailwind

#### DECISIONES ARQUITECTÓNICAS

- **Vite vs. Create React App**: Vite es más rápido, mejor UX en desarrollo
- **TypeScript strict mode**: Detección de errores en compile-time

---

### **CH-004: Patrones Base del Backend y Frontend (BaseRepository, UoW, Stores Zustand)**

**Nombre en kebab-case**: `backend-core-patterns`

**Sprint**: 0  
**Módulo**: Backend + Frontend  
**Prioridad**: Crítica  
**Complejidad**: Media  
**Horas estimadas**: 4h  

#### OBJETIVO

Implementar los patrones arquitectónicos fundamentales del backend (BaseRepository genérico, Unit of Work como context manager, dependencias FastAPI para autenticación y autorización) y del frontend (cuatro stores Zustand con responsabilidades bien definidas). Estos patrones sirven de base para todos los módulos funcionales posteriores.

#### FUNCIONALIDADES CUBIERTAS

**Backend**:
- `BaseRepository[T]` genérico con CRUD común
- `UnitOfWork` como context manager async
- Dependencia `get_current_user()` de FastAPI
- Factory de dependencias `require_role(roles: list[str])`
- Middleware de manejo de errores RFC 7807

**Frontend**:
- `authStore` (Zustand): acceso token, refresh token, usuario, isAuthenticated
- `cartStore` (Zustand): items, cantidades, personalizaciones
- `paymentStore` (Zustand): estado del pago, preferencia, error
- `uiStore` (Zustand): tema, sidebar, toasts

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-000d**: Implementación de patrones base (BaseRepository, Unit of Work, dependencias)
- **US-000e**: Configuración de stores Zustand

#### DEPENDENCIAS

**Depende de**: CH-002 (para database connection), CH-003 (para estructura FSD frontend)

**Impacto**: CH-010 (registro), CH-020 (categorías), CH-031 (carrito) dependen de este

#### ENDPOINTS/FEATURES PRINCIPALES

**Backend**: No hay endpoints públicos; son herramientas internas para otros modules.

**Frontend**: No hay componentes React; son stores para otros modules.

#### CHANGES DEL BACKEND

**Archivos**:
- `app/core/repository.py`: BaseRepository[T] genérico
- `app/core/uow.py`: UnitOfWork context manager
- `app/core/dependencies.py`: get_current_user, require_role

**BaseRepository[T]**:
```python
class BaseRepository[T]:
    def __init__(self, session: AsyncSession, model_class: type[T])
    async def get_by_id(id: int) -> T | None
    async def list_all(skip: int, limit: int) -> list[T]
    async def count() -> int
    async def create(obj: T) -> T
    async def update(id: int, data: dict) -> T
    async def soft_delete(id: int) -> None
    async def hard_delete(id: int) -> None
```

**UnitOfWork**:
```python
class UnitOfWork:
    async def __aenter__() -> UnitOfWork
    async def __aexit__(*args) -> None
    # Repos as properties:
    @property
    def usuarios(self) -> UsuarioRepository
    @property
    def productos(self) -> ProductoRepository
    ...
```

**Dependencias**:
```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> Usuario
    # Valida JWT, retorna Usuario o lanza 401

def require_role(allowed_roles: list[str]) -> Callable:
    # Retorna un Callable que verifica roles y lanza 403 si falta permiso
```

#### CHANGES DEL FRONTEND

**Stores Zustand**:
- `src/entities/auth/store.ts`: authStore
- `src/entities/cart/store.ts`: cartStore
- `src/features/payment/store.ts`: paymentStore
- `src/shared/store/ui.ts`: uiStore

#### SCHEMAS PYDANTIC / TYPESCRIPT

No hay schemas nuevos; se reutilizan los existentes.

#### PATRONES APLICADOS

- Repository Pattern: abstracción de acceso a datos
- Unit of Work: gestión atómica de transacciones
- Dependency Injection: FastAPI Depends, Zustand stores
- Zustand subscription by slice: evita re-renders innecesarios

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

**Backend**:
- [ ] BaseRepository[T] implementado con 7 métodos
- [ ] get_by_id y list_all excluyen registros con soft delete automáticamente
- [ ] UnitOfWork es context manager (`async with uow as _`)
- [ ] Commit automático sin excepciones; rollback si hay error
- [ ] get_current_user extrae JWT del header Authorization
- [ ] get_current_user lanza 401 si token inválido/expirado
- [ ] require_role valida roles y lanza 403 si falta permiso
- [ ] Error handler retorna RFC 7807 format

**Frontend**:
- [ ] authStore con: accessToken, refreshToken, usuario, isAuthenticated
- [ ] authStore acciones: login(), logout(), updateTokens()
- [ ] authStore selectores: isAuthenticated(), hasRole(role)
- [ ] authStore persiste solo accessToken (partialize)
- [ ] cartStore con: items[]
- [ ] cartStore acciones: addItem(), removeItem(), updateQuantity(), clearCart()
- [ ] cartStore persiste en localStorage
- [ ] cartStore carrito sobrevive logout/login
- [ ] paymentStore sin persist (transitorio)
- [ ] uiStore sin persist (transitorio)
- [ ] Todos los stores usan suscripción por slice (no hook completo)

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: UoW sin rollback automático en excepciones
   - Impacto: CRÍTICO — transacciones inconsistentes
   - Mitigación: Validar en tests que rollback ocurre

2. **Riesgo**: authStore persiste password (security risk)
   - Impacto: CRÍTICO — tokens en localStorage sin httpOnly
   - Mitigación: Usar partialize para excluir sensible

---

---

### **SPRINT 1: AUTENTICACIÓN Y AUTORIZACIÓN**

---

### **CH-010: Registro de Cliente**

**Nombre en kebab-case**: `auth-user-registration`

**Sprint**: 1  
**Módulo**: Auth  
**Prioridad**: Crítica  
**Complejidad**: Media  
**Horas estimadas**: 4h  

#### OBJETIVO

Implementar el endpoint de registro de usuario, donde un cliente puede crear una nueva cuenta con email, nombre y contraseña. La contraseña se hashea con bcrypt, se valida que el email sea único, se asigna automáticamente el rol CLIENT, y se devuelven los tokens de acceso y renovación.

#### FUNCIONALIDADES CUBIERTAS

- Endpoint POST `/api/v1/auth/register`
- Validación de email (formato + unicidad)
- Hashing de contraseña con bcrypt (cost ≥ 10)
- Asignación automática de rol CLIENT
- Generación de tokens: access (30 min) + refresh (7 días)
- Almacenamiento de refresh token en BD
- Esquemas Pydantic: RegisterRequest, UserResponse

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-001**: Registro de cliente

#### DEPENDENCIAS

**Depende de**: CH-004 (patrones base: BaseRepository, UoW, validación)

**Impacto**: CH-011 (login) depende de este

#### ENDPOINTS/FEATURES PRINCIPALES

- `POST /api/v1/auth/register` — registra nuevo usuario

#### CHANGES DEL BACKEND

**Modelos SQLModel**: Usuario, Rol, UsuarioRol, RefreshToken (ya creados en CH-002)

**Routers nuevos**:
- `app/modules/auth/router.py`: POST /register

**Services nuevos**:
- `app/modules/auth/service.py`: `register_user(uow, nombre, email, password)`

**Repositorios**:
- `app/modules/auth/repository.py`: hereda de BaseRepository
- `app/modules/usuarios/repository.py`: operaciones de Usuario

**Migraciones Alembic**: Ninguna (BD ya existe)

#### SCHEMAS PYDANTIC / TYPESCRIPT

**Backend (Pydantic v2)**:
- `RegisterRequest`: nombre (str, min 2), email (EmailStr), password (str, min 8)
- `UserResponse`: id, nombre, email, roles (list[str]), creado_en

**Frontend (TypeScript)**:
- `RegisterFormData`: { nombre, email, password, passwordConfirm }

#### PATRONES APLICADOS

- Unit of Work: transacción atómica al crear usuario + asignar rol + generar tokens
- Repository Pattern: acceso a Usuario, Rol, RefreshToken abstraído
- Password hashing: bcrypt con cost factor automático (≥ 10)

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] POST /api/v1/auth/register recibe { nombre, email, password }
- [ ] Email validado con EmailStr (RFC 5322 simplificado)
- [ ] Email debe ser único; error 409 si ya existe
- [ ] Contraseña mínimo 8 caracteres; error 400 si < 8
- [ ] Contraseña hasheada con bcrypt cost ≥ 10
- [ ] Contraseña nunca almacenada en texto plano
- [ ] Rol CLIENT asignado automáticamente (no viene del request)
- [ ] Respuesta incluye access token (30 min) + refresh token (7 días)
- [ ] RefreshToken almacenado en BD con expires_at correcto
- [ ] Respuesta incluye UserResponse (id, nombre, email, roles)
- [ ] Transacción atómica: si falla cualquier paso, rollback
- [ ] HTTP 201 en caso exitoso

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Contraseña débil (< 8 caracteres)
   - Impacto: ALTO — cuentas vulnerables a fuerza bruta
   - Mitigación: Validación en backend + frontend

2. **Riesgo**: Email no único (sin índice)
   - Impacto: CRÍTICO — dos usuarios con mismo email
   - Mitigación: Email UQ en BD + validación en servicio

---

### **CH-011: Login de Usuario y JWT**

**Nombre en kebab-case**: `auth-login-jwt`

**Sprint**: 1  
**Módulo**: Auth  
**Prioridad**: Crítica  
**Complejidad**: Media  
**Horas estimadas**: 4h  

#### OBJETIVO

Implementar el endpoint de login con generación de JWT (access + refresh token), rate limiting (5 intentos en 15 min por IP), rotación de refresh tokens, logout, renovación automática de tokens en frontend, y manejo de errores genéricos para no revelar si el email existe.

#### FUNCIONALIDADES CUBIERTAS

- Endpoint POST `/api/v1/auth/login` con validación de credenciales
- Rate limiting: 5 intentos fallidos en 15 minutos por IP (HTTP 429)
- Generación de access token (30 min, HS256)
- Generación de refresh token (7 días, UUID v4)
- Almacenamiento seguro de refresh token en BD
- Endpoint POST `/api/v1/auth/logout` (marca token como revocado)
- Endpoint POST `/api/v1/auth/refresh` (rotación de tokens)
- Interceptor de Axios en frontend: detección de 401 → refresh automático → reintento
- Mensajes de error genéricos ("Credenciales inválidas") sin detallar si email existe

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-002**: Login de usuario
- **US-003**: Refresh de token (rotación)
- **US-004**: Logout
- **US-066**: Manejo de token expirado en frontend
- **US-073**: Rate limiting en endpoints sensibles

#### DEPENDENCIAS

**Depende de**: CH-010 (usuarios registrados deben existir)

**Impacto**: CH-012 (RBAC) depende de este

#### ENDPOINTS/FEATURES PRINCIPALES

- `POST /api/v1/auth/login` — login con credenciales
- `POST /api/v1/auth/refresh` — renovación de tokens
- `POST /api/v1/auth/logout` — revoca refresh token
- Interceptor Axios: 401 → refresh automático

#### CHANGES DEL BACKEND

**Routers**:
- `app/modules/auth/router.py`: POST /login, POST /refresh, POST /logout

**Services**:
- `app/modules/auth/service.py`: `authenticate_user()`, `refresh_tokens()`, `logout_user()`

**Middleware**:
- `app/middleware/rate_limiting.py`: slowapi rate limiter

**Schemas**:
- `LoginRequest`: email, password
- `TokenResponse`: access_token, refresh_token, token_type ("Bearer"), expires_in

#### CHANGES DEL FRONTEND

**Stores Zustand**:
- `src/entities/auth/store.ts`: login(), logout(), updateTokens() actions

**Interceptor Axios**:
- `src/shared/api/axios.ts`: request interceptor (adjunta token), response interceptor (401 → refresh)

**Schemas TypeScript**:
- `LoginFormData`: { email, password }
- `TokenResponse`: { access_token, refresh_token, token_type, user }

#### PATRONES APLICADOS

- JWT: HS256 con clave secreta en variables de entorno
- Rate Limiting: slowapi con sliding window per IP
- Refresh Token Rotation: cada refresh revoca el token anterior
- Retry Logic: Axios interceptor reintenta request original post-refresh

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] POST /api/v1/auth/login recibe { email, password }
- [ ] Credenciales válidas: genera access token (30 min) + refresh token (7 días)
- [ ] Credenciales inválidas: HTTP 401 sin detallar si email existe
- [ ] Rate limiting: 5 intentos fallidos en 15 min por IP
- [ ] Sexto intento en ventana: HTTP 429 con header Retry-After
- [ ] Access token contiene: userId, email, roles[], exp
- [ ] Refresh token: UUID v4, almacenado en BD con expires_at
- [ ] POST /api/v1/auth/refresh recibe refresh token válido
- [ ] Refresh genera nuevo par de tokens; token anterior se revoca
- [ ] Refresh token expirado: HTTP 401
- [ ] POST /api/v1/auth/logout revoca refresh token actual
- [ ] Frontend: authStore.login() actualiza accessToken, refreshToken, usuario
- [ ] Frontend: interceptor Axios adjunta "Authorization: Bearer {token}" a cada request
- [ ] Frontend: interceptor detecta 401 → llama /refresh automáticamente
- [ ] Frontend: reintenta request original post-refresh (transparente para usuario)
- [ ] Frontend: si refresh falla, redirige a login

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Rate limiting por IP en proxies (multiple users share IP)
   - Impacto: MEDIO — usuarios legítimos bloqueados
   - Mitigación: Alternativa: rate limit por email + IP combo

2. **Riesgo**: Refresh token comprometido
   - Impacto: CRÍTICO — acceso persistente
   - Mitigación: Rotación de tokens, logout invalida todos

3. **Riesgo**: CORS expone token en response body (no httpOnly)
   - Impacto: MEDIO — XSS puede robar tokens
   - Mitigación: En producción considerar httpOnly cookies + SameSite

---

### **CH-012: RBAC y Gestión de Roles**

**Nombre en kebab-case**: `auth-rbac-roles`

**Sprint**: 1  
**Módulo**: Auth  
**Prioridad**: Alta  
**Complejidad**: Media  
**Horas estimadas**: 3h  

#### OBJETIVO

Implementar el control de acceso basado en roles (RBAC) con 4 roles fijos (ADMIN, STOCK, PEDIDOS, CLIENT), endpoints de asignación de roles (solo ADMIN), middleware/guards de autorización en backend, protección de rutas en frontend, y navegación adaptada por rol.

#### FUNCIONALIDADES CUBIERTAS

- 4 roles: ADMIN (control total), STOCK (catálogo), PEDIDOS (gestión de pedidos), CLIENT (compra)
- Endpoint GET `/api/v1/admin/usuarios/{id}/roles` — listar roles del usuario
- Endpoint PUT `/api/v1/admin/usuarios/{id}/roles` — asignar/quitar roles (solo ADMIN)
- Validación: ADMIN no puede quitarse el único rol ADMIN
- Dependencia FastAPI `require_role(["ADMIN", "STOCK"])` en routers
- Protección de rutas en frontend: route guards basados en roles
- Componente Navigation que muestra opciones según roles del usuario
- Rutas públicas: catálogo, login, registro (sin autenticación)

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-005**: Gestión de roles (RBAC)
- **US-006**: Protección de rutas por rol
- **US-075**: Navegación por rol
- **US-076**: Protección de rutas en frontend

#### DEPENDENCIAS

**Depende de**: CH-011 (JWT debe estar implementado)

**Impacto**: CH-030 (direcciones), CH-020 (categorías) dependen de este

#### ENDPOINTS/FEATURES PRINCIPALES

- `GET /api/v1/admin/usuarios/{id}/roles` — listar roles (ADMIN)
- `PUT /api/v1/admin/usuarios/{id}/roles` — asignar roles (ADMIN)
- Frontend: componente Navigation adaptado por rol

#### CHANGES DEL BACKEND

**Routers**:
- `app/modules/usuarios/router.py`: GET/PUT /usuarios/{id}/roles

**Services**:
- `app/modules/usuarios/service.py`: `assign_roles()`, `validate_role_change()`

**Dependencias FastAPI**:
- `app/core/dependencies.py`: `require_role()` ya implementada

**Esquemas**:
- `AssignRolesRequest`: { rol_ids: list[int] }
- `RoleResponse`: { id, codigo, nombre }

#### CHANGES DEL FRONTEND

**Componentes**:
- `src/features/auth/components/Navigation.tsx`: muestra opciones según roles
- `src/shared/components/ProtectedRoute.tsx`: HOC que valida autenticación + rol

**Hooks**:
- `src/shared/hooks/useAuth.ts`: acceso a authStore, hasRole()

**Stores**:
- `src/entities/auth/store.ts`: actualizar con `hasRole(role: string) → boolean`

#### ESQUEMAS PYDANTIC / TYPESCRIPT

**Backend (Pydantic v2)**:
- `AssignRolesRequest`: { rol_ids: list[int] }
- `RoleResponse`: { id, codigo, nombre }

**Frontend (TypeScript)**:
- `UserWithRoles`: { id, nombre, email, roles: Role[] }

#### PATRONES APLICADOS

- Role-Based Access Control (RBAC): 4 roles predefinidos
- Dependency Injection: `require_role` como dependencia FastAPI
- Route Guards: HOC `ProtectedRoute` en React

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

**Backend**:
- [ ] Los 4 roles existen: ADMIN (1), STOCK (2), PEDIDOS (3), CLIENT (4)
- [ ] GET /api/v1/admin/usuarios/{id}/roles retorna roles del usuario (ADMIN)
- [ ] PUT /api/v1/admin/usuarios/{id}/roles asigna roles (solo ADMIN)
- [ ] Validación: ADMIN no puede quitarse el único rol ADMIN (error 400)
- [ ] `require_role(["ADMIN"])` en endpoint: solo ADMIN accede (403 si falta permiso)
- [ ] Endpoint sin role required: acceso público
- [ ] Token inválido: 401

**Frontend**:
- [ ] Navigation: CLIENT ve Catálogo, Carrito, Mis Pedidos, Perfil
- [ ] Navigation: STOCK ve Productos, Categorías, Ingredientes
- [ ] Navigation: PEDIDOS ve Panel de Pedidos
- [ ] Navigation: ADMIN ve todas las opciones + Usuarios + Métricas
- [ ] Route guard: usuario no autenticado → redirige a login
- [ ] Route guard: rol insuficiente → muestra 403 o redirige
- [ ] Rutas públicas accesibles sin autenticación

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Rol no incluido en JWT
   - Impacto: ALTO — require_role() no funciona
   - Mitigación: Validar en CH-011 que roles están en JWT

2. **Riesgo**: ADMIN se quita el único rol ADMIN
   - Impacto: CRÍTICO — nadie puede administrar
   - Mitigación: Validación en servicio

---

---

### **SPRINT 2: CATÁLOGO DE PRODUCTOS**

---

### **CH-020: Categorías Jerárquicas**

**Nombre en kebab-case**: `catalog-categories-hierarchy`

**Sprint**: 2  
**Módulo**: Catalog  
**Prioridad**: Alta  
**Complejidad**: Media  
**Horas estimadas**: 4h  

#### OBJETIVO

Implementar un sistema de categorías jerárquicas para organizar productos. Las categorías pueden tener subcategorías (relación padre-hijo autoreferencial), se valida que no existan ciclos, se soportan consultas eficientes con CTE recursiva de PostgreSQL, y se aplica soft delete.

#### FUNCIONALIDADES CUBIERTAS

- Endpoint POST `/api/v1/categorias` — crear categoría
- Endpoint GET `/api/v1/categorias` — listar árbol jerárquico (público)
- Endpoint PUT `/api/v1/categorias/{id}` — editar categoría
- Endpoint DELETE `/api/v1/categorias/{id}` — soft delete
- Validación: no permitir ciclos, no auto-parenthood
- Validación: no eliminar categoría con productos activos
- Consulta jerárquica con CTE recursiva (una sola query)
- Respuesta anidada: categoría con subcategorias[]

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-007**: Crear categoría
- **US-008**: Listar categorías jerárquicas
- **US-009**: Editar categoría
- **US-010**: Eliminar categoría (soft delete)

#### DEPENDENCIAS

**Depende de**: CH-004 (patrones base: BaseRepository, UoW)

**Impacto**: CH-021 (ingredientes), CH-022 (productos) dependen de este

#### ENDPOINTS/FEATURES PRINCIPALES

- `POST /api/v1/categorias` — crear
- `GET /api/v1/categorias` — listar (público)
- `PUT /api/v1/categorias/{id}` — editar
- `DELETE /api/v1/categorias/{id}` — eliminar

#### CHANGES DEL BACKEND

**Modelos SQLModel**: Categoria (ya creada en CH-002, con padre_id self-ref)

**Routers**:
- `app/modules/categorias/router.py`: POST, GET, PUT, DELETE

**Services**:
- `app/modules/categorias/service.py`: `create_categoria()`, `list_hierarchy()`, `update_categoria()`, `validate_no_cycles()`

**Repositorios**:
- `app/modules/categorias/repository.py`: hereda de BaseRepository, agrega método `get_hierarchy(categoria_id) → tree`

**Migraciones**: Ninguna (BD ya existe)

#### SCHEMAS PYDANTIC / TYPESCRIPT

**Backend**:
- `CreateCategoriaRequest`: { nombre, descripcion?, padre_id? }
- `CategoriaResponse`: { id, nombre, descripcion, padre_id, subcategorias: [] }
- `HierarchyResponse`: list[CategoriaResponse]

**Frontend**:
- `Categoria`: { id, nombre, descripcion, subcategorias: Categoria[] }

#### PATRONES APLICADOS

- CTE Recursiva: consulta eficiente de árbol jerárquico
- Validación de Ciclos: algoritmo DFS antes de persistir
- Soft Delete: eliminado_en timestamp

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] POST /api/v1/categorias crea categoría raíz o subcategoría
- [ ] GET /api/v1/categorias devuelve árbol anidado (público, sin auth)
- [ ] Árbol correcto: nodos raíz sin padre, subnodos con padre_id
- [ ] PUT /api/v1/categorias/{id} valida que no crea ciclos
- [ ] Validación: categoría no puede ser padre de sí misma
- [ ] DELETE /api/v1/categorias/{id} soft delete si no tiene productos activos
- [ ] DELETE error 400 si categoría tiene productos activos
- [ ] Consulta usa CTE recursiva (SELECT ... WITH RECURSIVE)
- [ ] Performance: una sola query para todo el árbol (sin N+1)

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Ciclos en jerarquía (A padre de B, B padre de A)
   - Impacto: ALTO — queries infinitas
   - Mitigación: Validación DFS antes de UPDATE

2. **Riesgo**: Productos huérfanos si se elimina categoría
   - Impacto: MEDIO — inconsistencia
   - Mitigación: Validar sin productos antes de eliminar

---

### **CH-021: Ingredientes y Alérgenos**

**Nombre en kebab-case**: `catalog-ingredients-allergens`

**Sprint**: 2  
**Módulo**: Catalog  
**Prioridad**: Alta  
**Complejidad**: Baja  
**Horas estimadas**: 3h  

#### OBJETIVO

Implementar un catálogo de ingredientes con flag `es_alergeno` para identificar alérgenos comunes. Proporciona endpoints CRUD, validación de nombres únicos, filtrado por alérgeno, y soft delete. Es base para asociar ingredientes a productos.

#### FUNCIONALIDADES CUBIERTAS

- Endpoint POST `/api/v1/ingredientes` — crear
- Endpoint GET `/api/v1/ingredientes` — listar (con filtro es_alergeno)
- Endpoint PUT `/api/v1/ingredientes/{id}` — editar
- Endpoint DELETE `/api/v1/ingredientes/{id}` — soft delete
- Validación: nombre único, no vacío
- Filtro: `?es_alergeno=true`
- Paginación en listados

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-011**: Crear ingrediente
- **US-012**: Listar ingredientes
- **US-013**: Editar ingrediente
- **US-014**: Eliminar ingrediente (soft delete)

#### DEPENDENCIAS

**Depende de**: CH-020 (orden lógico, aunque sin dependencia técnica directa)

**Impacto**: CH-022 (productos) depende de este

#### ENDPOINTS/FEATURES PRINCIPALES

- `POST /api/v1/ingredientes` — crear
- `GET /api/v1/ingredientes` — listar
- `PUT /api/v1/ingredientes/{id}` — editar
- `DELETE /api/v1/ingredientes/{id}` — eliminar

#### CHANGES DEL BACKEND

**Modelos SQLModel**: Ingrediente (ya creada en CH-002)

**Routers**:
- `app/modules/ingredientes/router.py`: POST, GET, PUT, DELETE

**Services**:
- `app/modules/ingredientes/service.py`: CRUD básico

**Repositorios**:
- `app/modules/ingredientes/repository.py`: hereda de BaseRepository

#### SCHEMAS PYDANTIC / TYPESCRIPT

**Backend**:
- `CreateIngredienteRequest`: { nombre, descripcion?, es_alergeno }
- `IngredienteResponse`: { id, nombre, descripcion, es_alergeno }

**Frontend**:
- `Ingrediente`: { id, nombre, es_alergeno }

#### PATRONES APLICADOS

- Repository Pattern: acceso abstraído
- Soft Delete: eliminado_en timestamp

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] POST /api/v1/ingredientes crea ingrediente con es_alergeno booleano
- [ ] GET /api/v1/ingredientes devuelve lista paginada
- [ ] Filtro ?es_alergeno=true devuelve solo alérgenos
- [ ] PUT /api/v1/ingredientes/{id} actualiza nombre/es_alergeno
- [ ] Validación: nombre no puede duplicarse
- [ ] DELETE realiza soft delete

---

### **CH-022: Productos CRUD y Asociaciones**

**Nombre en kebab-case**: `catalog-products-crud`

**Sprint**: 2  
**Módulo**: Catalog  
**Prioridad**: Crítica  
**Complejidad**: Media  
**Horas estimadas**: 5h  

#### OBJETIVO

Implementar CRUD completo de productos con gestión de stock, precio (DECIMAL con precisión fija), disponibilidad, y asociaciones muchos-a-muchos con categorías e ingredientes. Proporciona endpoints para crear, actualizar, eliminar productos, y gestionar stock atomicamente.

#### FUNCIONALIDADES CUBIERTAS

- Endpoint POST `/api/v1/productos` — crear
- Endpoint GET `/api/v1/productos` — listar (admin con filtros)
- Endpoint PUT `/api/v1/productos/{id}` — editar
- Endpoint PATCH `/api/v1/productos/{id}/stock` — actualizar stock
- Endpoint DELETE `/api/v1/productos/{id}` — soft delete
- Asociación M2M Producto ↔ Categoría (tabla ProductoCategoria)
- Asociación M2M Producto ↔ Ingrediente (tabla ProductoIngrediente)
- Precio como DECIMAL(10,2) — nunca float
- Stock como INTEGER >= 0
- Disponible: booleano, default true
- Soft delete

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-015**: Crear producto
- **US-016**: Asociar producto a categorías
- **US-017**: Asociar ingredientes a producto
- **US-020**: Editar producto
- **US-021**: Gestionar stock de producto
- **US-022**: Eliminar producto (soft delete)

#### DEPENDENCIAS

**Depende de**: CH-021 (ingredientes deben existir)

**Impacto**: CH-023 (catálogo público) depende de este

#### ENDPOINTS/FEATURES PRINCIPALES

- `POST /api/v1/productos` — crear
- `GET /api/v1/productos` — listar (admin only)
- `PUT /api/v1/productos/{id}` — editar
- `PATCH /api/v1/productos/{id}/stock` — actualizar stock
- `DELETE /api/v1/productos/{id}` — eliminar
- `PUT /api/v1/productos/{id}/categorias` — asociar categorías
- `PUT /api/v1/productos/{id}/ingredientes` — asociar ingredientes

#### CHANGES DEL BACKEND

**Modelos SQLModel**: Producto, ProductoCategoria, ProductoIngrediente (ya creadas en CH-002)

**Routers**:
- `app/modules/productos/router.py`: POST, GET, PUT, PATCH, DELETE, PUT /categorias, PUT /ingredientes

**Services**:
- `app/modules/productos/service.py`: CRUD + asociaciones

**Repositorios**:
- `app/modules/productos/repository.py`: hereda de BaseRepository

**Migraciones**: Ninguna (BD ya existe)

#### SCHEMAS PYDANTIC / TYPESCRIPT

**Backend**:
- `CreateProductoRequest`: { nombre, descripcion, precio_base (DECIMAL), stock_cantidad (INTEGER), disponible?, categoria_ids, ingrediente_ids }
- `ProductoResponse`: { id, nombre, descripcion, precio_base, stock_cantidad, disponible, categorias[], ingredientes[], creado_en }

**Frontend**:
- `Producto`: { id, nombre, precio, stock, disponible, categorias, ingredientes }

#### PATRONES APLICADOS

- Repository Pattern
- Soft Delete
- M2M Association: tabla pivote (ProductoCategoria, ProductoIngrediente)
- Snapshot Pattern: precio se captura al crear pedido (no aquí)

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] POST /api/v1/productos (STOCK/ADMIN) crea producto
- [ ] Precio: DECIMAL(10,2), nunca float
- [ ] Precio validado: > 0, máximo 2 decimales
- [ ] Stock: INTEGER, >= 0, default 0
- [ ] Disponible: booleano, default true
- [ ] PUT /api/v1/productos/{id} (STOCK/ADMIN) actualiza todos los campos
- [ ] PATCH /api/v1/productos/{id}/stock (STOCK/ADMIN) actualiza stock atomicamente
- [ ] Stock nunca puede ser negativo (validación)
- [ ] Asociación de categorías: PUT /api/v1/productos/{id}/categorias (body: category_ids[])
- [ ] Asociación de ingredientes: PUT /api/v1/productos/{id}/ingredientes (body: ingrediente_ids[])
- [ ] DELETE realiza soft delete
- [ ] Producto eliminado no aparece en listados públicos

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Precio en float (imprecisión)
   - Impacto: CRÍTICO — cálculos de pedidos incorrectos
   - Mitigación: Validar que es DECIMAL en BD

2. **Riesgo**: Stock negativo
   - Impacto: ALTO — oversell
   - Mitigación: CHECK (stock_cantidad >= 0) en BD

---

### **CH-023: Catálogo Público y Búsqueda**

**Nombre en kebab-case**: `catalog-public-browsing`

**Sprint**: 2  
**Módulo**: Catalog/Frontend  
**Prioridad**: Alta  
**Complejidad**: Media  
**Horas estimadas**: 4h  

#### OBJETIVO

Implementar la interfaz pública del catálogo para clientes: listado de productos disponibles con búsqueda, filtros (categoría, precio, alérgenos), paginación, vista de detalle, y componentes en frontend (grid con imágenes, filtros, skeleton loaders).

#### FUNCIONALIDADES CUBIERTAS

- Endpoint GET `/api/v1/productos` (público) — lista productos disponibles
- Filtros: categoría, búsqueda por nombre (ILIKE), rango de precio, excluir alérgenos
- Paginación: parámetros page/limit + metadatos (total, pages)
- Endpoint GET `/api/v1/productos/{id}` (público) — detalle con ingredientes
- Frontend: componente ProductGrid con items
- Frontend: ProductFilter con opciones de búsqueda
- Frontend: ProductCard con imagen, precio, disponibilidad
- Frontend: ProductDetail modal/página
- Skeleton loaders mientras se cargan productos

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-018**: Listar productos del catálogo (público)
- **US-019**: Ver detalle de producto
- **US-023**: Filtrar productos por alérgenos

#### DEPENDENCIAS

**Depende de**: CH-022 (productos deben existir)

**Impacto**: CH-031 (carrito) depende de este

#### ENDPOINTS/FEATURES PRINCIPALES

- `GET /api/v1/productos` (público) — lista con filtros/paginación
- `GET /api/v1/productos/{id}` (público) — detalle
- Frontend: ProductGrid, ProductFilter, ProductCard, ProductDetail

#### CHANGES DEL BACKEND

**Routers**:
- `app/modules/productos/router.py`: GET /productos, GET /productos/{id} (público)

**Services**:
- `app/modules/productos/service.py`: `list_available_products()`, `get_product_detail()`

**Repositorios**:
- `app/modules/productos/repository.py`: `list_available()`, `search_by_filters()`

#### CHANGES DEL FRONTEND

**Componentes**:
- `src/features/catalog/components/ProductGrid.tsx`: lista de productos con grid layout
- `src/features/catalog/components/ProductFilter.tsx`: filtros (categoría, precio, búsqueda)
- `src/features/catalog/components/ProductCard.tsx`: tarjeta de producto
- `src/features/catalog/components/ProductDetail.tsx`: modal/página de detalle

**Hooks**:
- `src/features/catalog/hooks/useProducts.ts`: TanStack Query para GET /productos
- `src/features/catalog/hooks/useProductDetail.ts`: TanStack Query para GET /productos/{id}

**Stores**: (sin cambios nuevos)

#### SCHEMAS PYDANTIC / TYPESCRIPT

**Backend**:
- `ProductListResponse`: { items: ProductoResponse[], total, page, size, pages }
- `ProductDetailResponse`: { ...ProductoResponse, ingredientes: IngredienteResponse[], categorias: CategoriaResponse[] }

**Frontend**:
- `UseProductsQuery`: { search?, category_id?, price_min?, price_max?, exclude_allergen_ids?, page, limit }

#### PATRONES APLICADOS

- TanStack Query: caching de productos con staleTime
- Debounce: búsqueda con debounce de 500ms
- Pagination: skip/limit con metadatos
- Skeleton Loading: componentes skeleton mientras se cargan datos

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] GET /api/v1/productos devuelve solo productos con disponible=true y eliminado_en IS NULL
- [ ] Filtro categoría: ?category_id=5
- [ ] Búsqueda por nombre: ?search=pizza (ILIKE, case-insensitive)
- [ ] Rango de precio: ?price_min=100&price_max=500
- [ ] Filtro alérgenos: ?exclude_allergen_ids=1,3,7
- [ ] Paginación: ?page=1&limit=20 → { items[], total, page, size, pages }
- [ ] GET /api/v1/productos/{id} incluye ingredientes con es_alergeno
- [ ] GET /api/v1/productos/{id} incluye categorías
- [ ] Endpoints públicos (sin autenticación)
- [ ] Respuesta no incluye stock exacto (solo booleano "hay stock")
- [ ] Frontend: ProductGrid muestra productos en grid layout
- [ ] Frontend: ProductFilter con inputs de búsqueda
- [ ] Frontend: ProductCard muestra imagen, nombre, precio, disponibilidad
- [ ] Frontend: debounce búsqueda (no refetch en cada keystroke)
- [ ] Frontend: skeleton loaders mientras se cargan datos
- [ ] Frontend: ProductDetail modal con ingredientes destacando alérgenos

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Búsqueda lenta sin índice FULLTEXT
   - Impacto: MEDIO — performance en catálogo grande
   - Mitigación: Agregar índice GIN en nombre (ILIKE)

2. **Riesgo**: Stock exacto revelado (información competitiva)
   - Impacto: BAJO
   - Mitigación: Respuesta solo indica "stock disponible" (booleano)

---

---

### **SPRINT 3: PEDIDOS Y GESTIÓN**

---

### **CH-030: Direcciones de Entrega**

**Nombre en kebab-case**: `orders-delivery-addresses`

**Sprint**: 3  
**Módulo**: Orders  
**Prioridad**: Alta  
**Complejidad**: Baja  
**Horas estimadas**: 3h  

#### OBJETIVO

Implementar CRUD de direcciones de entrega para clientes. Cada cliente puede tener múltiples direcciones con una designada como principal. Validación de ownership: un cliente solo ve/edita/elimina sus propias direcciones. Soft delete incluido.

#### FUNCIONALIDADES CUBIERTAS

- Endpoint POST `/api/v1/direcciones` — crear dirección
- Endpoint GET `/api/v1/direcciones` — listar direcciones del usuario autenticado
- Endpoint PUT `/api/v1/direcciones/{id}` — editar dirección
- Endpoint PATCH `/api/v1/direcciones/{id}/principal` — marcar como principal
- Endpoint DELETE `/api/v1/direcciones/{id}` — soft delete
- Validación: solo una dirección principal por usuario
- Validación: ownership por userId (usuario solo ve sus direcciones)
- Primera dirección se marca como principal automáticamente

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-024**: Crear dirección de entrega
- **US-025**: Ver direcciones propias
- **US-026**: Editar dirección propia
- **US-027**: Eliminar dirección propia (soft delete)
- **US-028**: Marcar dirección como principal

#### DEPENDENCIAS

**Depende de**: CH-012 (usuario autenticado via JWT)

**Impacto**: CH-032 (crear pedidos) depende de este

#### ENDPOINTS/FEATURES PRINCIPALES

- `POST /api/v1/direcciones` — crear
- `GET /api/v1/direcciones` — listar propias
- `PUT /api/v1/direcciones/{id}` — editar
- `PATCH /api/v1/direcciones/{id}/principal` — marcar principal
- `DELETE /api/v1/direcciones/{id}` — eliminar

#### CHANGES DEL BACKEND

**Modelos SQLModel**: DireccionEntrega (ya creada en CH-002)

**Routers**:
- `app/modules/direcciones/router.py`: POST, GET, PUT, PATCH, DELETE

**Services**:
- `app/modules/direcciones/service.py`: CRUD con validación de ownership

**Repositorios**:
- `app/modules/direcciones/repository.py`: hereda de BaseRepository

**Dependencias FastAPI**:
- Usar `get_current_user()` para extraer userId

#### SCHEMAS PYDANTIC / TYPESCRIPT

**Backend**:
- `CreateDireccionRequest`: { alias?, linea1, linea2?, ciudad, codigo_postal, referencia? }
- `DireccionResponse`: { id, usuario_id, alias, linea1, linea2, ciudad, codigo_postal, referencia, es_principal, creado_en }

**Frontend**:
- `Direccion`: { id, alias, linea1, linea2, ciudad, es_principal }

#### PATRONES APLICADOS

- Repository Pattern
- Soft Delete
- Ownership Validation: verificar que direccion.usuario_id == current_user.id

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] POST /api/v1/direcciones (CLIENT autenticado) crea dirección
- [ ] Primera dirección creada: es_principal = true automáticamente
- [ ] GET /api/v1/direcciones devuelve solo direcciones del usuario autenticado
- [ ] PUT /api/v1/direcciones/{id} permite editar (validar ownership)
- [ ] PATCH /api/v1/direcciones/{id}/principal marca como principal
- [ ] Cambio a principal: la dirección anterior deja de ser principal
- [ ] Solo una dirección principal por usuario (validación)
- [ ] DELETE realiza soft delete
- [ ] Validación de ownership: HTTP 403 si usuario intenta acceder dirección de otro

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Validación de ownership no hecha
   - Impacto: CRÍTICO — usuarios ven/editan direcciones ajenas
   - Mitigación: Validar en servicio: `if direccion.usuario_id != current_user.id: raise 403`

---

### **CH-031: Carrito de Compras (Client-Side)**

**Nombre en kebab-case**: `orders-shopping-cart`

**Sprint**: 3  
**Módulo**: Orders  
**Prioridad**: Alta  
**Complejidad**: Media  
**Horas estimadas**: 4h  

#### OBJETIVO

Implementar carrito de compras 100% client-side con Zustand + localStorage. El carrito persiste al cerrar navegador, refrescar página, logout/login. NO hay carrito en backend. Soporte para personalización (exclusión de ingredientes), incremento automático de cantidad si producto ya está en carrito, selectores para total de ítems y precio.

#### FUNCIONALIDADES CUBIERTAS

- Store Zustand `cartStore` con estado: items[]
- Estructura de item: { productoId, producto (snapshot), cantidad, personalizacion (array de IDs de ingredientes a excluir) }
- Acciones: `addItem(producto, cantidad, personalizacion)`, `removeItem(productoId)`, `updateQuantity(productoId, nueva_cantidad)`, `clearCart()`
- Selectores: `totalItems()` (suma de cantidades), `totalPrice()` (suma de precios + envío), `getItem(productoId)`
- Persistencia en localStorage con clave `food-store-cart`
- Carrito disponible post-login (no se limpia con logout)
- Validación: solo se pueden excluir ingredientes que el producto efectivamente tiene

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-029**: Agregar producto al carrito
- **US-030**: Personalizar ingredientes del carrito (excluir)
- **US-031**: Ver resumen del carrito
- **US-032**: Actualizar cantidad en carrito
- **US-033**: Remover producto del carrito
- **US-034**: Limpiar carrito

#### DEPENDENCIAS

**Depende de**: CH-023 (catálogo público — clientes agregan del catálogo)

**Impacto**: CH-032 (crear pedidos) depende de este

#### ENDPOINTS/FEATURES PRINCIPALES

No hay endpoints backend. Todo es client-side.

**Frontend**:
- Componente CartDrawer: vista del carrito, resumen de precios
- Componente CartItem: item individual con cantidad, personalización, botón eliminar
- Componente CartSummary: totales, costo envío, total final
- Hook: useCart() para acceso a cartStore

#### CHANGES DEL FRONTEND

**Stores Zustand**:
- `src/entities/cart/store.ts`: cartStore (actualización importante)

**Componentes**:
- `src/widgets/CartDrawer.tsx`: drawer con items del carrito
- `src/features/cart/components/CartItem.tsx`: item individual
- `src/features/cart/components/CartSummary.tsx`: resumen con totales

**Hooks**:
- `src/features/cart/hooks/useCart.ts`: acceso a cartStore

#### SCHEMAS TYPESCRIPT

**Frontend**:
- `CartItem`: { productoId: number, producto: Producto, cantidad: number, personalizacion: number[] }
- `CartStore`: { items: CartItem[], addItem(), removeItem(), updateQuantity(), clearCart(), totalItems(), totalPrice() }

#### PATRONES APLICADOS

- Zustand store con persist middleware
- Suscripción selectiva (no whole store subscription)
- Snapshot del producto en CartItem (para precio, nombre)

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] `cartStore.addItem(producto, cantidad, personalizacion)` agrega o incrementa cantidad si existe
- [ ] `cartStore.removeItem(productoId)` elimina del carrito
- [ ] `cartStore.updateQuantity(productoId, cantidad)` actualiza cantidad
- [ ] `cartStore.clearCart()` vacía el carrito
- [ ] `cartStore.totalItems()` suma todas las cantidades
- [ ] `cartStore.totalPrice()` = suma(cantidad × precio) + costoEnvio (50 pesos default)
- [ ] `cartStore.getItem(productoId)` retorna item o null
- [ ] Personalización: solo permite IDs de ingredientes que el producto tiene
- [ ] Persistencia en localStorage con clave `food-store-cart`
- [ ] Carrito disponible post-login (no se limpia con logout)
- [ ] Carrito sobrevive cierre del navegador
- [ ] Carrito sobrevive refresh de página
- [ ] CartDrawer muestra todos los items con imagen, nombre, precio
- [ ] CartItem permite cambiar cantidad, ver personalización
- [ ] CartSummary muestra subtotal, envío, total
- [ ] Botón "Proceder a Checkout" deshabilitado si carrito vacío

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Carrito grande (muchos items) → localStorage lleno
   - Impacto: BAJO — límite de localStorage es 5-10MB típicamente
   - Mitigación: Documentar límite o usar IndexedDB si es necesario

2. **Riesgo**: Personalización con ingredientes eliminados
   - Impacto: MEDIO — al crear pedido puede fallar
   - Mitigación: Validar en CH-032 que ingredientes siguen existiendo

---

### **CH-032: Creación de Pedidos (Transacción Atómica)**

**Nombre en kebab-case**: `orders-create-pedido`

**Sprint**: 3  
**Módulo**: Orders  
**Prioridad**: Crítica  
**Complejidad**: Alta  
**Horas estimadas**: 6h  

#### OBJETIVO

Implementar endpoint atómico de creación de pedidos. Recibe items del carrito + dirección + forma de pago, valida stock suficiente, crea snapshots de precio/dirección (inmutables), calcula totales, y persiste Pedido + DetallePedido + HistorialEstadoPedido en una transacción. Si algo falla, todo se revierte (rollback automático via UoW).

#### FUNCIONALIDADES CUBIERTAS

- Endpoint POST `/api/v1/pedidos` (solo CLIENT autenticado)
- Recibe: items (producto_id, cantidad, personalizacion), direccion_id, forma_pago_id
- Validación: stock suficiente (SELECT FOR UPDATE), productos disponibles, dirección pertenece al usuario, forma de pago activa
- Snapshots inmutables: precio_snapshot, nombre_snapshot en DetallePedido; direccion_snapshot en Pedido
- Cálculo de totales: subtotal por item, subtotal general, costo envío (50 pesos), total final
- Creación atómica: Pedido + DetallePedido (×N) + HistorialEstadoPedido inicial (estado_desde = NULL)
- Estado inicial: PENDIENTE
- Si validación falla: error 400 y no se crea nada (rollback)

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-035**: Crear pedido desde carrito
- **US-036**: Validar stock suficiente
- **US-037**: Generar snapshot de precio
- **US-038**: Generar snapshot de dirección

#### DEPENDENCIAS

**Depende de**: CH-031 (carrito), CH-030 (direcciones)

**Impacto**: CH-033 (FSM) depende de este

#### ENDPOINTS/FEATURES PRINCIPALES

- `POST /api/v1/pedidos` — crear pedido

#### CHANGES DEL BACKEND

**Modelos SQLModel**: Pedido, DetallePedido, HistorialEstadoPedido (ya creados en CH-002)

**Routers**:
- `app/modules/pedidos/router.py`: POST /pedidos

**Services**:
- `app/modules/pedidos/service.py`: `create_pedido(uow, usuario_id, items[], direccion_id, forma_pago_id)`

**Repositorios**:
- `app/modules/pedidos/repository.py`: hereda de BaseRepository
- `app/modules/direcciones/repository.py`: validar dirección existe
- `app/modules/productos/repository.py`: validar stock

**Migraciones**: Ninguna (BD ya existe)

#### SCHEMAS PYDANTIC / TYPESCRIPT

**Backend**:
- `CreatePedidoRequest`: { items: ItemPedidoRequest[], direccion_id: int, forma_pago_id: int, notas?: str }
- `ItemPedidoRequest`: { producto_id: int, cantidad: int, personalizacion: int[] }
- `PedidoResponse`: { id, estado_codigo, total, costo_envio, creado_en, usuario_id, items_count }

**Frontend**:
- `CheckoutFormData`: { direccion_id, forma_pago_id, notas }

#### PATRONES APLICADOS

- Unit of Work: transacción atómica (Pedido + Detalles + Historial)
- Snapshot Pattern: precio_snapshot, nombre_snapshot, direccion_snapshot
- SELECT FOR UPDATE: bloqueo pesimista para stock (evita race conditions)
- Append-Only: HistorialEstadoPedido solo INSERT

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] POST /api/v1/pedidos (CLIENT autenticado) recibe items[] + direccion_id + forma_pago_id
- [ ] Validación: stock >= cantidad para cada item (SELECT FOR UPDATE)
- [ ] Si stock insuficiente en cualquier item: error 400, nada persiste
- [ ] Validación: todos los productos existen y disponible=true
- [ ] Validación: dirección_id pertenece al usuario autenticado
- [ ] Validación: forma_pago_id existe y habilitado=true
- [ ] Creación ATÓMICA: Pedido + DetallePedido×N + HistorialEstadoPedido
- [ ] Snapshot de precio: precio actual del producto al crear
- [ ] Snapshot de nombre: nombre actual del producto al crear
- [ ] Snapshot de dirección: serialización JSONB de dirección (completa e inmutable)
- [ ] Personalización validada: solo IDs de ingredientes del producto
- [ ] Cálculo de totales: subtotal = cantidad × precio_snapshot por item
- [ ] Total = sum(subtotales) + costo_envio (50 pesos)
- [ ] HistorialEstadoPedido inicial: estado_desde = NULL (RN-02)
- [ ] Pedido nace en estado PENDIENTE
- [ ] Si error en cualquier paso: rollback automático (UoW)
- [ ] Respuesta: PedidoResponse con id, estado, total, creado_en
- [ ] HTTP 201 en éxito
- [ ] HTTP 400 en validación fallida
- [ ] HTTP 401 si usuario no autenticado
- [ ] HTTP 403 si intenta crear para otro usuario

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Race condition: stock consultado, luego vendido por otro cliente, luego decrementado
   - Impacto: CRÍTICO — oversell
   - Mitigación: SELECT FOR UPDATE (lock pesimista) en stock

2. **Riesgo**: Snapshots no persistidos correctamente
   - Impacto: ALTO — pedidos sin precios/direcciones
   - Mitigación: Tests que validen snapshots = valores al crear

3. **Riesgo**: Personalización con ingredientes inexistentes
   - Impacto: MEDIO — referencia a ingrediente deletreado
   - Mitigación: Validar que personalizacion[] IDs existen en tabla Ingrediente

---

### **CH-033: Máquina de Estados del Pedido (FSM)**

**Nombre en kebab-case**: `orders-state-machine`

**Sprint**: 3  
**Módulo**: Orders  
**Prioridad**: Crítica  
**Complejidad**: Alta  
**Horas estimadas**: 6h  

#### OBJETIVO

Implementar la máquina de estados finitos (FSM) del pedido con 6 estados (PENDIENTE, CONFIRMADO, EN_PREPARACIÓN, EN_CAMINO, ENTREGADO, CANCELADO) y transiciones estrictamente validadas. Incluye decremento de stock al confirmar, restauración al cancelar, validación de permisos por rol, y historial append-only de transiciones.

#### FUNCIONALIDADES CUBIERTAS

- Endpoint PATCH `/api/v1/pedidos/{id}/estado` — avanzar estado
- Endpoint DELETE `/api/v1/pedidos/{id}` o PATCH `/pedidos/{id}/cancelar` — cancelar pedido
- Validación de transiciones según FSM: PENDIENTE → CONFIRMADO → EN_PREPARACIÓN → EN_CAMINO → ENTREGADO
- CANCELADO accesible desde PENDIENTE, CONFIRMADO, EN_PREPARACIÓN
- Estados terminales (ENTREGADO, CANCELADO) no permiten transiciones salientes
- Decremento de stock al confirmar: PENDIENTE → CONFIRMADO (automático via pago en CH-040)
- Restauración de stock al cancelar (operación inversa)
- Historial append-only: cada cambio → INSERT en HistorialEstadoPedido
- Validación de permisos: PEDIDOS/ADMIN avanzan; solo ADMIN cancela desde EN_PREPARACIÓN

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-039**: Avanzar estado PENDIENTE → CONFIRMADO (automático vía pago)
- **US-040**: Avanzar estado CONFIRMADO → EN_PREPARACIÓN
- **US-041**: Avanzar estado EN_PREPARACIÓN → EN_CAMINO
- **US-042**: Avanzar estado EN_CAMINO → ENTREGADO
- **US-043**: Cancelar pedido con restauración de stock
- **US-044**: Ver historial de estados

#### DEPENDENCIAS

**Depende de**: CH-032 (pedidos creados deben existir)

**Impacto**: CH-040 (MercadoPago) depende de este (webhook avanza estado)

#### ENDPOINTS/FEATURES PRINCIPALES

- `PATCH /api/v1/pedidos/{id}/estado` — avanzar estado
- `DELETE /api/v1/pedidos/{id}` o `PATCH /api/v1/pedidos/{id}/cancelar` — cancelar
- `GET /api/v1/pedidos/{id}/historial` — ver historial de estados

#### CHANGES DEL BACKEND

**Modelos SQLModel**: EstadoPedido, Pedido, HistorialEstadoPedido (ya creados en CH-002)

**Routers**:
- `app/modules/pedidos/router.py`: PATCH /pedidos/{id}/estado, DELETE /pedidos/{id}, GET /pedidos/{id}/historial

**Services**:
- `app/modules/pedidos/service.py`: `advance_state()`, `cancel_pedido()`, `validate_transition()`

**Tabla EstadoPedido** (seed data en CH-002):
- PENDIENTE (orden 1, es_terminal=false)
- CONFIRMADO (orden 2, es_terminal=false)
- EN_PREPARACIÓN (orden 3, es_terminal=false)
- EN_CAMINO (orden 4, es_terminal=false)
- ENTREGADO (orden 5, es_terminal=true)
- CANCELADO (orden 6, es_terminal=true)

#### SCHEMAS PYDANTIC / TYPESCRIPT

**Backend**:
- `AvanzarEstadoRequest`: { observacion?: str }
- `HistorialEstadoResponse`: { id, pedido_id, estado_desde, estado_nuevo, usuario_id?, observacion, creado_en }

**Frontend**:
- `PedidoState`: enum { PENDIENTE, CONFIRMADO, EN_PREP, EN_CAMINO, ENTREGADO, CANCELADO }

#### PATRONES APLICADOS

- State Machine: validación de transiciones
- Unit of Work: stock decrement/restore atómica
- Append-Only: HistorialEstadoPedido solo INSERT
- RBAC: validación de permisos por rol

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] `PATCH /api/v1/pedidos/{id}/estado` valida transición según FSM
- [ ] Transición inválida: error 400 con mensaje descriptivo
- [ ] Transición PENDIENTE → CONFIRMADO: decrementa stock atomicamente
- [ ] Si decremento falla: rollback (RN-03, RN-04)
- [ ] Transición CONFIRMADO → EN_PREPARACIÓN: solo PEDIDOS/ADMIN
- [ ] Transición EN_PREPARACIÓN → EN_CAMINO: solo PEDIDOS/ADMIN
- [ ] Transición EN_CAMINO → ENTREGADO: solo PEDIDOS/ADMIN
- [ ] `PATCH /api/v1/pedidos/{id}/cancelar`: cancela desde PENDIENTE (CLIENT/Gestor/ADMIN), CONFIRMADO (Gestor/ADMIN), EN_PREPARACIÓN (solo ADMIN)
- [ ] Cancelación: error 400 si desde ENTREGADO o CANCELADO
- [ ] Cancelación desde CONFIRMADO/EN_PREPARACIÓN: restaura stock atomicamente
- [ ] Estados ENTREGADO y CANCELADO son terminales: error si se intenta cambiar
- [ ] Todo cambio genera INSERT en HistorialEstadoPedido (append-only)
- [ ] HistorialEstadoPedido: estado_desde, estado_nuevo, timestamp, usuario_id (NULL si SISTEMA), observacion
- [ ] Observación (motivo) obligatoria si cancela (error 400 si no viene)
- [ ] GET /api/v1/pedidos/{id}/historial devuelve historial ordenado ASC por creado_en
- [ ] HTTP 404 si pedido no existe
- [ ] HTTP 403 si usuario intenta cambiar estado de pedido ajeno

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Transición inválida no validada
   - Impacto: CRÍTICO — estado inconsistente
   - Mitigación: Tabla FSM: map(estado_actual → [estados_válidos])

2. **Riesgo**: Stock restaurado parcialmente en cancelación
   - Impacto: CRÍTICO — oversell o pérdida de stock
   - Mitigación: UoW atomicidad + tests

3. **Riesgo**: HistorialEstadoPedido actualizado por error
   - Impacto: CRÍTICO — auditoría inválida
   - Mitigación: Restricción en BD: NO UPDATE/DELETE (solo INSERT)

---

---

### **SPRINT 4: PAGOS Y ADMINISTRACIÓN**

---

### **CH-040: Integración MercadoPago**

**Nombre en kebab-case**: `payments-mercadopago`

**Sprint**: 4  
**Módulo**: Payments  
**Prioridad**: Crítica  
**Complejidad**: Alta  
**Horas estimadas**: 8h  

#### OBJETIVO

Integrar MercadoPago Checkout API para procesar pagos con tarjeta, Rapipago, Pago Fácil. Incluye tokenización segura de tarjeta en frontend (PCI SAQ-A), webhook IPN para confirmación asíncrona, procesamiento de estados de pago, transición automática de pedido a CONFIRMADO, e idempotency keys para evitar cobros duplicados.

#### FUNCIONALIDADES CUBIERTAS

- Endpoint POST `/api/v1/pagos/crear-preferencia` — crea orden en MercadoPago
- SDK MercadoPago.js en frontend: tokenización de tarjeta (datos nunca tocan servidor)
- Endpoint POST `/api/v1/pagos/webhook` — recibe notificaciones IPN
- Procesamiento IPN: validación de firma, consulta API MP, actualización de pago, transición de pedido
- Estados de pago: approved (avanza a CONFIRMADO), rejected (permanece PENDIENTE), pending (permanece PENDIENTE)
- Idempotency key UUID: evita cobros duplicados
- Tabla Pago: mp_payment_id, mp_status, external_reference, idempotency_key
- Relación 1:N Pedido → Pago (múltiples intentos por pedido)

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-045**: Integración MercadoPago — tokenización de tarjeta
- **US-046**: Webhook IPN — confirmación automática de pago
- **US-047**: Manejo de pagos rechazados
- **US-048**: Múltiples intentos de pago por pedido

#### DEPENDENCIAS

**Depende de**: CH-033 (FSM debe estar implementada para transición a CONFIRMADO)

**Impacto**: CH-041 (admin) depende de este (metricas de ingresos)

#### ENDPOINTS/FEATURES PRINCIPALES

**Backend**:
- `POST /api/v1/pagos/crear-preferencia` — crear orden
- `POST /api/v1/pagos/webhook` — recibir IPN
- `GET /api/v1/pagos/{pedido_id}` — listar pagos de pedido

**Frontend**:
- Componente CardPayment: formulario con SDK MercadoPago.js
- Componente PaymentStatus: estado del pago (processing, approved, rejected)

#### CHANGES DEL BACKEND

**Modelos SQLModel**: Pago, Pedido (ya creados en CH-002)

**Routers**:
- `app/modules/pagos/router.py`: POST /crear-preferencia, POST /webhook, GET /{pedido_id}

**Services**:
- `app/modules/pagos/service.py`: `create_preference()`, `process_webhook()`, `verify_payment_status()`

**Integración MercadoPago SDK**:
- `import mercadopago` SDK oficial Python
- Configuración: MP_ACCESS_TOKEN en variables de entorno

#### CHANGES DEL FRONTEND

**Componentes**:
- `src/features/payment/components/CardPayment.tsx`: formulario con SDK MercadoPago.js
- `src/features/payment/components/PaymentStatus.tsx`: estado del pago

**Stores Zustand**:
- `src/features/payment/store.ts`: actualización con `setPaymentStatus()`, `setMpPaymentId()`

**Hooks**:
- `src/features/payment/hooks/useCreatePayment.ts`: mutation para POST /pagos/crear-preferencia
- `src/features/payment/hooks/usePaymentStatus.ts`: query para GET /pagos/{pedido_id}

#### SCHEMAS PYDANTIC / TYPESCRIPT

**Backend**:
- `CreatePreferenciaRequest`: { pedido_id: int, token: str (tarjeta) }
- `PreferenciaResponse`: { preference_id, init_point (URL de checkout) }
- `WebhookPayload`: { topic: "payment", id: int (mp_payment_id) }
- `PagoResponse`: { id, pedido_id, monto, mp_payment_id, mp_status, created_at }

**Frontend**:
- `CardPaymentFormData`: { cardNumber, cardholderName, expirationMonth, expirationYear, cvv }

#### PATRONES APLICADOS

- Idempotency Key: UUID único por pago (evita duplicados)
- Webhook Verification: validación de firma MercadoPago
- Async Confirmation: webhook dispara transición automática
- PCI SAQ-A: tokenización en frontend, datos nunca en backend

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

- [ ] POST /api/v1/pagos/crear-preferencia crea orden en MercadoPago
- [ ] Respuesta incluye preference_id y URL de checkout (init_point)
- [ ] URL redirige a MercadoPago (no es checkout nuestro)
- [ ] SDK MercadoPago.js tokeniza tarjeta en frontend sin datos sensibles en servidor
- [ ] CardPayment form obtiene token via SDK.tokenize()
- [ ] POST /api/v1/pagos/webhook recibe notificación IPN de MercadoPago
- [ ] Webhook responde HTTP 200 inmediatamente (no procesa en línea)
- [ ] Validación de firma IPN (MercadoPago proporciona secret)
- [ ] Consulta estado real del pago via MP API (nunca confiar solo en webhook)
- [ ] Si approved: UoW avanza pedido de PENDIENTE → CONFIRMADO + decrementa stock
- [ ] Si rejected: registra pago rechazado, pedido sigue PENDIENTE (cliente puede reintentar)
- [ ] Si pending: registra pago pendiente, pedido sigue PENDIENTE
- [ ] Tabla Pago: mp_payment_id (UQ, nullable), mp_status, external_reference (UUID del pedido), idempotency_key (UQ)
- [ ] Relación 1:N: un pedido puede tener múltiples pagos (reintentos)
- [ ] Idempotency key: si recibe webhook duplicado (mismo id_pago), ignora
- [ ] Frontend: PaymentStatus muestra estado actualizado en tiempo real (polling o webhook)
- [ ] Frontend: redirige a resultado post-pago exitoso/rechazado

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Webhook no procesado (sin respuesta 200)
   - Impacto: CRÍTICO — pago no confirmado
   - Mitigación: Responder 200 inmediatamente, procesar en async

2. **Riesgo**: Idempotency key no único
   - Impacto: CRÍTICO — cobro duplicado
   - Mitigación: UUID v4 garantiza unicidad

3. **Riesgo**: Stock decrementado dos veces (race condition en webhook)
   - Impacto: CRÍTICO — undersell
   - Mitigación: Validar que pedido aún está PENDIENTE antes de avanzar

4. **Riesgo**: Datos de tarjeta en request HTTP (no HTTPS)
   - Impacto: CRÍTICO — compromiso de seguridad
   - Mitigación: SDK tokeniza, backend no toca datos; enforce HTTPS en producción

---

### **CH-041: Panel de Administración**

**Nombre en kebab-case**: `admin-dashboard-and-management`

**Sprint**: 4  
**Módulo**: Admin  
**Prioridad**: Media  
**Complejidad**: Muy Alta  
**Horas estimadas**: 10h  

#### OBJETIVO

Construir un panel de administración completo con dashboard de KPIs, gráficos, y gestión de todas las entidades del sistema (usuarios, categorías, productos, ingredientes, pedidos). Restricción: acceso solo para ADMIN. Interfaz responsiva mobile-first con Tailwind, componentes skeleton, toasts, modales de confirmación.

#### FUNCIONALIDADES CUBIERTAS

**Dashboard**:
- KPIs: total de pedidos, ingresos totales, pedidos hoy, productos bajo stock
- Gráficos recharts: barras (ingresos/día), líneas (pedidos trend), torta (por estado)

**Gestión de Usuarios**:
- CRUD: crear, listar, editar, eliminar (soft delete)
- Asignación de roles
- Búsqueda y filtrado

**Gestión de Categorías**:
- CRUD con validación de jerarquía
- Visualizar árbol

**Gestión de Productos**:
- CRUD
- Stock actualizable
- Toggle de disponibilidad
- Búsqueda y filtrado por stock

**Gestión de Ingredientes**:
- CRUD
- Toggle de es_alergeno

**Gestión de Pedidos**:
- Filtro por estado
- Vista detallada con items, dirección, pago, historial
- Avance manual de estado
- Cancelación con restauración de stock

**UI/UX**:
- Componentes: skeleton loaders, toasts, modales de confirmación
- Diseño mobile-first con Tailwind
- Responsive en tablet y desktop

#### HISTORIAS DE USUARIO ASOCIADAS

- **US-049**: Ver panel de métricas (dashboard)
- **US-050**: Gestionar usuarios
- **US-051**: CRUD categorías desde admin
- **US-052**: CRUD productos desde admin
- **US-053**: CRUD ingredientes desde admin
- **US-054**: Asignación de roles
- **US-055**: Gestión de pedidos desde admin
- **US-056 a US-065**: Funcionalidades adicionales del admin (perfiles, reportes, etc.)

#### DEPENDENCIAS

**Depende de**: CH-040 (para mostrar datos de pagos/ingresos en dashboard)

**Impacto**: Ninguno (es el último change)

#### ENDPOINTS/FEATURES PRINCIPALES

**No hay nuevos endpoints en backend** (reutiliza endpoints existentes con rol ADMIN).

**Frontend**:
- Página: AdminDashboard (componentes DashboardKPIs, DashboardCharts)
- Páginas: AdminUsers, AdminCategorias, AdminProductos, AdminIngredientes, AdminPedidos

#### CHANGES DEL FRONTEND

**Páginas**:
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminUsers.tsx`
- `src/pages/admin/AdminCategorias.tsx`
- `src/pages/admin/AdminProductos.tsx`
- `src/pages/admin/AdminIngredientes.tsx`
- `src/pages/admin/AdminPedidos.tsx`

**Componentes**:
- `src/features/admin/components/DashboardKPIs.tsx`
- `src/features/admin/components/DashboardCharts.tsx`
- `src/features/admin/components/UserTable.tsx`
- `src/features/admin/components/ProductTable.tsx`
- `src/features/admin/components/OrderTable.tsx`
- `src/shared/components/SkeletonLoader.tsx`
- `src/shared/components/Toast.tsx`
- `src/shared/components/ConfirmModal.tsx`

**Hooks**:
- `src/features/admin/hooks/useDashboardMetrics.ts`: TanStack Query para KPIs
- `src/features/admin/hooks/useAdminUsers.ts`: CRUD usuarios
- `src/features/admin/hooks/useAdminProductos.ts`: CRUD productos
- `src/features/admin/hooks/useAdminPedidos.ts`: CRUD pedidos

**Stores**: (sin cambios, reutiliza uiStore para toasts)

#### SCHEMAS TYPESCRIPT

**Frontend**:
- `DashboardMetrics`: { total_pedidos, ingresos_totales, pedidos_hoy, productos_bajo_stock }
- `ChartData`: arrays de { date, ingresos }, { date, pedidos }, etc.

#### PATRONES APLICADOS

- TanStack Query: caching de datos con invalidación tras mutaciones
- Skeleton Loading: componentes placeholder mientras se cargan datos
- Modal Dialog: confirmación de acciones destructivas
- Responsive Design: Tailwind grid que adapta a mobile/tablet/desktop
- Optimistic Updates: actualización inmediata de UI post-acción (rollback en error)

#### CRITERIOS DE ACEPTACIÓN (VERIFICABLE)

**General**:
- [ ] Panel accesible solo para ADMIN (route guard + 403 si no es ADMIN)
- [ ] Sidebar/Navigation con opciones de admin

**Dashboard**:
- [ ] KPIs: total_pedidos, ingresos_totales, pedidos_hoy, productos_bajo_stock (campos numéricos grandes)
- [ ] Gráficos recharts:
  - [ ] Barras: ingresos por día (últimos 7 días)
  - [ ] Líneas: pedidos por día (trend)
  - [ ] Torta: distribución por estado (PENDIENTE, CONFIRMADO, EN_CAMINO, ENTREGADO, CANCELADO)
- [ ] Gráficos interactivos (hover muestra tooltips)

**CRUD Usuarios**:
- [ ] Tabla con: id, nombre, email, roles, acciones (editar, asignar roles, eliminar)
- [ ] Crear usuario: form modal
- [ ] Editar usuario: form modal
- [ ] Asignar roles: modal con checkboxes
- [ ] Eliminar usuario: soft delete con confirmación
- [ ] Búsqueda por email/nombre
- [ ] Paginación

**CRUD Categorías**:
- [ ] Tabla con: id, nombre, padre (si aplica), acciones
- [ ] Crear: form modal
- [ ] Editar: form modal con validación de ciclos
- [ ] Eliminar: soft delete con validación de productos activos
- [ ] Visualización de jerarquía (árbol)

**CRUD Productos**:
- [ ] Tabla con: id, nombre, precio, stock, disponible, acciones
- [ ] Crear: form modal
- [ ] Editar: form modal
- [ ] Actualizar stock: input numérico directo o modal
- [ ] Toggle disponibilidad: checkbox o switch
- [ ] Eliminar: soft delete
- [ ] Búsqueda por nombre/sku
- [ ] Filtro: stock bajo (< 10)
- [ ] Paginación

**CRUD Ingredientes**:
- [ ] Tabla con: id, nombre, es_alergeno, acciones
- [ ] Crear: form modal
- [ ] Editar: form modal
- [ ] Toggle es_alergeno: switch o checkbox
- [ ] Eliminar: soft delete
- [ ] Búsqueda/paginación

**Gestión Pedidos**:
- [ ] Tabla con: id, usuario, estado, total, creado_en, acciones
- [ ] Filtro por estado (PENDIENTE, CONFIRMADO, EN_PREP, EN_CAMINO, ENTREGADO, CANCELADO)
- [ ] Filtro por fecha
- [ ] Click en pedido: modal/página con detalle completo (items, dirección, pago, historial)
- [ ] Botón "Avanzar Estado": dropdown con transiciones válidas (según FSM)
- [ ] Botón "Cancelar": confirmación + razón (observacion)
- [ ] Historial de estados: timeline o tabla

**UI/UX**:
- [ ] Skeleton loaders mientras se cargan datos (no blank pages)
- [ ] Toast notifications: éxito, error, warning (bottom-right)
- [ ] Modales de confirmación para acciones destructivas (delete, cancel pedido)
- [ ] Responsive: mobile (single column), tablet (2 cols), desktop (3+ cols)
- [ ] Mobile-first: Tailwind grid que adapta
- [ ] Colores/iconos de estado de pedido

#### RIESGOS IDENTIFICADOS

1. **Riesgo**: Admin panel lento con muchas transacciones
   - Impacto: MEDIO — mala UX
   - Mitigación: TanStack Query caching, paginación

2. **Riesgo**: Acceso no restringido a ADMIN
   - Impacto: CRÍTICO — exposición de datos
   - Mitigación: Route guard + require_role en endpoints

3. **Riesgo**: Cambios en lote sin confirmación
   - Impacto: MEDIO — cambios accidentales
   - Mitigación: Modal de confirmación para cada acción destructiva

---

## 📈 CRONOGRAMA Y ESTIMACIONES

### Por Sprint

| Sprint | Duración | Changes | Horas | Complejidad Promedio | Historias |
|--------|----------|---------|-------|------|-----------|
| **0** | 3-4 días | 5 | 16 | Trivial/Baja | US-000 a US-000e |
| **1** | 3-4 días | 3 | 11 | Media | US-001 a US-006, US-073, US-075, US-076 |
| **2** | 4-5 días | 4 | 16 | Baja/Media | US-007 a US-023 |
| **3** | 5-6 días | 4 | 19 | Media/Alta | US-024 a US-044 |
| **4** | 4-5 días | 2 | 18 | Alta/Muy Alta | US-045 a US-065 |
| **TOTAL** | ~3 semanas | 18 | 80 | Media | 65 historias |

**Consideraciones**:
- Estimaciones asumen desarrollador experimentado con el stack (FastAPI, React, PostgreSQL)
- Incluye tiempo de testing, debugging, documentación
- No incluye deployment, CI/CD, o mejoras de performance
- +20% buffer para scope creep recomendado

---

## ✅ CHECKLIST FINAL DE VALIDACIÓN

**Completitud**:
- [ ] Todos los 65+ historias de usuario están asignadas a un change
- [ ] Todas las 70+ reglas de negocio están reflejadas en criterios de aceptación
- [ ] Las dependencias forman un DAG válido (sin ciclos)
- [ ] Cada change es implementable en <= 10 horas (excepto admin que es 10)

**Arquitectura**:
- [ ] Stack documentado: librerías, versiones, justificación
- [ ] Patrones aplicados: BaseRepository, UoW, Soft Delete, Snapshot, Audit Trail, FSM, RBAC, JWT
- [ ] Capas backend unidireccionales: Router → Service → UoW → Repository → Model
- [ ] Capas frontend FSD: Pages → Widgets → Features → Entities → Shared

**Seguridad**:
- [ ] Rate limiting en login
- [ ] JWT con rotación de tokens
- [ ] Contraseñas hasheadas con bcrypt (cost ≥ 10)
- [ ] PCI SAQ-A: tarjetas tokenizadas en frontend
- [ ] CORS configurado
- [ ] Validación de inputs

**Base de Datos**:
- [ ] Soft delete: eliminado_en timestamp
- [ ] Audit trail: creado_en, actualizado_en
- [ ] Snapshots: precio_snapshot, nombre_snapshot, direccion_snapshot
- [ ] Append-only: HistorialEstadoPedido (solo INSERT)
- [ ] Constraints de integridad: UQ, FK, CHECK
- [ ] Precio DECIMAL (nunca float)
- [ ] Stock INTEGER >= 0

**Testing (bonus)**:
- [ ] Tests unitarios con pytest (backend)
- [ ] Tests de integración para UoW, transacciones
- [ ] Tests E2E para flujo de pedido completo
- [ ] Coverage >= 60%

**Documentación**:
- [ ] README.md completo con setup instructions
- [ ] API documentada: Swagger UI (/docs), ReDoc (/redoc)
- [ ] Schemas Pydantic/TypeScript tipados
- [ ] Comentarios en código complejo

---

## 🚀 CÓMO USAR ESTE ROADMAP

### Para Iniciar un Change

1. **Lee la especificación completa** del change (arriba)
2. **Verifica dependencias**: asegúrate que todos los changes antecesores estén archivados
3. **Crea una rama Git**: `git checkout -b feature/CH-XXX-nombre-kebab`
4. **Sigue la metodología SDD**:
   - `sdd-propose`: draft de propuesta (intent + scope)
   - `sdd-spec`: especificaciones con scenarios GIVEN/WHEN/THEN
   - `sdd-design`: arquitectura y decisiones técnicas
   - `sdd-tasks`: desglose atómico de tareas (≤ 2h cada una)
   - `sdd-apply`: implementación tarea por tarea
   - `sdd-verify`: validación contra specs
   - `sdd-archive`: sincronizar specs, cerrar change

### Para Paralelizar

- **Sprint 0**: CH-000, CH-001/CH-003 pueden ir en paralelo (no hay dependencia directa)
- **Sprint 1**: Todos los changes dependen linealmente
- **Sprint 2**: Todos los changes dependen linealmente
- **Sprint 3**: CH-030 puede iniciar antes que CH-032 (sin dependencia)
- **Sprint 4**: CH-040 debe completarse antes que CH-041 (dashboard usa datos de pagos)

### Si Algo Falla

- **Stock race condition**: Usar SELECT FOR UPDATE en transacción
- **Webhook no procesado**: Responder 200 inmediatamente, procesar async
- **Transición inválida**: Validar FSM antes de persistir
- **Snapshot corrompido**: Validar serialización JSON en BD

---

## 📊 MATRIZ DE RIESGOS CONSOLIDADA

| Riesgo | Change(s) | Severity | Probabilidad | Impacto | Mitigación |
|--------|-----------|----------|--------------|---------|-----------|
| Contraseña en texto plano | CH-010 | CRÍTICO | Alta | Compromise | Validar bcrypt cost ≥ 10 en code review |
| Email no único | CH-010 | CRÍTICO | Media | Duplicated users | UQ constraint en BD + validación servicio |
| Rate limiting por IP (proxies) | CH-011 | MEDIO | Baja | Legitimate users blocked | Rate limit por email + IP combo |
| Refresh token compromised | CH-011 | CRÍTICO | Media | Persistent access | Rotación de tokens + logout invalida |
| Ciclos en categorías | CH-020 | ALTO | Baja | Infinite queries | Validación DFS antes UPDATE |
| Produtos huérfanos | CH-020 | MEDIO | Baja | Data inconsistency | Validar sin productos antes DELETE |
| Stock race condition | CH-032 | CRÍTICO | Alta | Oversell | SELECT FOR UPDATE en transacción |
| Snapshots no persistidos | CH-032 | ALTO | Media | Wrong prices/addresses | Tests que validen snapshots |
| Personalización con ingredientes inexistentes | CH-032 | MEDIO | Media | Invalid reference | Validar IDs existen en tabla |
| Transición inválida FSM | CH-033 | CRÍTICO | Alta | Inconsistent state | Tabla FSM + validación servicio |
| Stock restaurado parcialmente | CH-033 | CRÍTICO | Media | Undersell/oversell | UoW atomicidad + tests |
| HistorialEstadoPedido modificado | CH-033 | CRÍTICO | Baja | Invalid audit | BD restriction: NO UPDATE/DELETE |
| Webhook no procesado (sin 200) | CH-040 | CRÍTICO | Media | Payment not confirmed | Responder 200 inmediatamente |
| Idempotency key no único | CH-040 | CRÍTICO | Baja | Duplicate charge | UUID v4 garantiza uniqueness |
| Stock decrementado dos veces | CH-040 | CRÍTICO | Media | Undersell | Validar pedido aún PENDIENTE |
| Datos de tarjeta en HTTP | CH-040 | CRÍTICO | Alta | Compromise | Enforce HTTPS + tokenization |
| Admin access not restricted | CH-041 | CRÍTICO | Alta | Data exposure | Route guard + require_role |
| Cambios sin confirmación | CH-041 | MEDIO | Media | Accidental changes | Modal confirmación para destructive |

---

## 📝 NOTAS FINALES

Este roadmap es **exhaustivo pero flexible**. Durante la implementación pueden surgir:

1. **Scope Creep**: Si un change crecemucho, divídelo en dos
2. **Dependencias No Previstas**: Comunícalas y ajusta el orden
3. **Cambios en Requerimientos**: Actualiza specs, design y tasks
4. **Performance Issues**: Agrega indexación, caching donde sea necesario

**Principios de Oro**:
- ✅ Especificación primero (SDD — Spec-Driven Development)
- ✅ Unit of Work para atomicidad
- ✅ Soft Delete para auditoría
- ✅ Snapshots para inmutabilidad
- ✅ Append-Only para trazabilidad
- ✅ RBAC para seguridad
- ✅ Tests para confianza

**¡Que disfrutes el desarrollo! 🚀**

---

**FIN DEL ROADMAP PROFESIONAL Y DEFINITIVO**

**Versión**: 5.0  
**Generado**: 2026-05-08  
**Estado**: Listo para Implementación  
**Última Revisión**: 2026-05-08
