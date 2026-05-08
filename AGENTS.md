# AGENTS.md — Food Store IA Agent Collaboration Framework

Documento de configuración para trabajo colaborativo con agentes IA usando **Spec-Driven Development (SDD)** y **OpenSpec (OPSX)**.

---

## 📋 Descripción del Proyecto

### Visión
**Food Store** es un sistema de comercio electrónico especializado en la venta de productos alimenticios. Ofrece una plataforma completa de compra para clientes, herramientas de administración de inventario y procesamiento de pedidos, con integración robusta a MercadoPago para pagos seguros.

### Actores del Sistema
- **Cliente**: Usuario final que explora catálogo, compra y gestiona sus pedidos
- **Administrador (Admin)**: Control total del sistema, gestión de usuarios y configuración
- **Gestor de Stock**: Responsable del inventario y catálogo de productos
- **Gestor de Pedidos**: Encargado del flujo operativo de órdenes
- **Sistema**: Procesos automatizados (webhooks IPN, rotación de tokens)

### Objetivos del Negocio
✅ Experiencia de compra fluida y segura para clientes  
✅ Trazabilidad completa de cada pedido  
✅ Integridad garantizada del inventario  
✅ Procesamiento robusto de pagos con MercadoPago  
✅ Modelo de autorización granular basado en roles (RBAC)

---

## 🔧 Stack Tecnológico

### Frontend
```
React 18+           - Librería UI principal
TypeScript          - Tipado estático end-to-end
Vite               - Bundler de desarrollo ultra-rápido
TanStack Query     - State management para datos del servidor
TanStack Form      - Validación y gestión de formularios
Zustand            - State management del cliente (carrito, auth)
Axios              - Cliente HTTP con interceptores
Tailwind CSS       - Utilidades de estilos (sin CSS separado)
Recharts           - Gráficos y visualización de métricas
MercadoPago SDK    - Integración de pagos (frontend)
```

### Backend
```
FastAPI 0.110+     - Framework web asíncrono de alto rendimiento
SQLModel 0.0.14+   - ORM hybrid (SQLAlchemy + Pydantic)
PostgreSQL 15+     - Base de datos relacional
Alembic            - Migraciones de base de datos
bcrypt             - Hashing seguro de contraseñas
python-jose        - Generación y validación de JWT
slowapi            - Rate limiting contra fuerza bruta
MercadoPago SDK    - Integración de pagos (backend)
pytest             - Testing framework
```

### Infrastructure
```
Node.js 18+        - Runtime para tooling y CLI
npm 9+             - Package manager
OpenSpec CLI       - Gestión de artefactos SDD
Git                - Control de versiones
Docker            - (opcional) Contenedorización
PostgreSQL Docker  - (opcional) Base de datos containerizada
```

---

## 📂 Estructura de Carpetas

```
FOOD-STORE-SDD/
├── docs/                          # 📚 Documentación fuente de verdad
│   ├── Descripcion.txt           # Visión, actores, stack
│   ├── Integrador.txt            # Arquitectura, ERD, API
│   ├── Historias_de_usuario.txt  # US-000 a US-076 + criterios aceptación
│   └── CHANGES.md                # Historial de cambios
│
├── openspec/                      # 🎯 Artefactos SDD / OPSX
│   ├── config.yaml               # Configuración de proyecto para IA
│   ├── specs/                    # Especificaciones fuente de verdad
│   ├── changes/                  # Cambios activos en desarrollo
│   └── archive/                  # Cambios completados archivados
│
├── frontend/                      # 🎨 Aplicación React + Vite
│   ├── src/
│   │   ├── app/                 # Configuración global, providers
│   │   ├── pages/               # Páginas (rutas)
│   │   ├── widgets/             # Componentes complejos (composiciones)
│   │   ├── features/            # Features de usuario (interacciones)
│   │   ├── entities/            # Modelos de dominio
│   │   ├── shared/              # Utils, componentes genéricos, config
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                       # 🔌 Aplicación FastAPI + Python
│   ├── core/                    # Configuración, constantes
│   ├── middleware/              # CORS, JWT, rate limiting
│   ├── models/                  # Entidades SQLModel
│   ├── schemas/                 # Schemas Pydantic (validación/respuesta)
│   ├── routers/                 # Endpoints HTTP (API)
│   ├── services/                # Lógica de negocio
│   ├── repositories/            # Acceso a datos (DAL)
│   ├── tests/                   # Pruebas unitarias e integración
│   ├── .env.example
│   ├── requirements.txt
│   ├── main.py                  # Punto de entrada FastAPI
│   └── README.md
│
├── .git/                          # Control de versiones
├── .gitignore
├── README.md
└── AGENTS.md                      # Este archivo

```

---

## 📦 Comandos npm Principales

### Frontend

```bash
# Instalación
npm install                      # Instala dependencias

# Desarrollo
npm run dev                      # Inicia servidor Vite (http://localhost:5173)
npm run dev:api-mock            # Dev con API simulada (para testing aislado)

# Build
npm run build                    # Compila para producción
npm run build:analyze           # Analiza tamaño del bundle

# Testing
npm run test                     # Ejecuta pruebas unitarias
npm run test:watch              # Watch mode para desarrollo
npm run test:coverage           # Reporte de cobertura

# Code Quality
npm run lint                     # ESLint
npm run lint:fix                # ESLint con auto-fix
npm run format                  # Prettier (format)
npm run format:check            # Prettier (check)
npm run type-check              # TypeScript type checking

# Production
npm run preview                 # Previsualiza build de producción
npm run start                   # Sirve build para producción
```

### Backend

```bash
# Setup inicial
cd backend
python -m venv .venv
source .venv/bin/activate       # Linux/Mac
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Migraciones de base de datos
alembic upgrade head            # Aplica todas las migraciones pendientes
alembic downgrade -1            # Revierte la última migración
alembic revision --autogenerate -m "descripción"  # Crea nueva migración

# Servidor de desarrollo
uvicorn app.main:app --reload   # Inicia FastAPI en http://localhost:8000

# Testing
pytest                          # Ejecuta todas las pruebas
pytest -v                       # Verbose output
pytest -k "test_login"          # Ejecuta solo tests que contengan "test_login"
pytest --cov=app                # Reporte de cobertura

# Code Quality
pylint app                      # Linter
black app                       # Formateador (check)
black --check app               # Formateador (verify)
mypy app                        # Type checking

# Documentación
# Accede a http://localhost:8000/docs (Swagger UI interactivo)
# Accede a http://localhost:8000/redoc (ReDoc)
```

---

## 🚀 Flujo de Trabajo OpenSpec (OPSX)

Todos los cambios al sistema siguen este ciclo SDD (Spec-Driven Development):

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  /sdd-explore <topic>     ← Investigación y pensamiento     │
│         ↓                                                     │
│  /sdd-new <change>        ← Generar propuesta + diseño      │
│         ↓                                                     │
│  /sdd-spec                ← Escribir especificaciones       │
│         ↓                                                     │
│  /sdd-design              ← Diseño técnico y arquitectura   │
│         ↓                                                    │
│  /sdd-tasks               ← Desglose en tareas              │
│         ↓                                                    │
│  /sdd-apply               ← Implementación tarea por tarea  │
│         ↓                                                    │
│  /sdd-verify              ← Validación contra specs         │
│         ↓                                                    │
│  /sdd-archive             ← Sincronizar y cerrar change     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Fase por Fase

#### 1. **Exploración** (`/sdd-explore <topic>`)
- Investiga la idea **sin comprometerse** a cambios
- Lee código, compara enfoques, valida viabilidad
- No crea archivos, solo reporte mental
- Resultado: Entendimiento compartido

#### 2. **Propuesta** (`/sdd-new <change>`)
- Describe el cambio: qué, por qué, alcance, enfoque
- Incluye: rol requerido, complejidad estimada, riesgos
- No diseña ni especifica detalles —solo la intención
- Resultado: `openspec/changes/{change-name}/proposal.md`

#### 3. **Especificaciones** (`/sdd-spec`)
- Define **requirements** exactos (RFC 2119: MUST, SHALL, SHOULD, MAY)
- Escenarios con formato **Given/When/Then**
- Criterios de aceptación claros y testables
- Resultado: `openspec/changes/{change-name}/specs.md`

#### 4. **Diseño Técnico** (`/sdd-design`)
- Arquitectura de la solución: capas, módulos, flujos
- Decisiones de diseño con trade-offs
- Secuencias de componentes, flujo de datos
- Resultado: `openspec/changes/{change-name}/design.md`

#### 5. **Tareas** (`/sdd-tasks`)
- Desglose del work en chunks de máx 2 horas
- Numerar jerárquicamente (1.1, 1.2, 2.1)
- Agrupar por fase (setup, implement, test)
- Resultado: `openspec/changes/{change-name}/tasks.md` (checklist)

#### 6. **Implementación** (`/sdd-apply`)
- Ejecuta tarea por tarea, marca completadas
- Sigue specs, design y tasks al pie de la letra
- Commits convencionales por tarea
- Resultado: Código implementado, cambios commiteados

#### 7. **Verificación** (`/sdd-verify`)
- Valida que cada tarea implementada cumple specs
- Compara contra scenarios GIVEN/WHEN/THEN
- Reporte: ✅ CRÍTICO, ⚠️ ADVERTENCIA, 💡 SUGERENCIA
- Si hay issues: vuelve al step 6

#### 8. **Archivo** (`/sdd-archive`)
- Sincroniza delta specs → specs principales
- Cierra el change y archiva en `openspec/archive/`
- Limpia estado de trabajo
- Resultado: Change finalizado y documentado

---

## 🤖 Responsabilidades de los Agentes IA

### Orchestrator (`sdd-orchestrator`)
- **Rol**: Coordinador estratégico (no ejecutor)
- **Responsabilidades**:
  - Toma decisiones sobre qué fase ejecutar
  - Delega trabajo a sub-agentes especializados
  - Sintetiza resultados y mantiene contexto
  - Gestiona estado del DAG (proposal → specs → design → tasks)
  - Valida que dependencias estén listas
  - **NUNCA** lee múltiples archivos, **SIEMPRE** delega exploración

### Explorer (`sdd-explore`)
- **Rol**: Investigador del codebase
- **Responsabilidades**:
  - Lee código para entender viabilidad
  - Compara enfoques existentes
  - Evalúa impacto en la arquitectura
  - Retorna reporte mental sin crear archivos
  - **NO** diseña ni especifica

### Proposer (`sdd-propose`)
- **Rol**: Defini la intención y alcance
- **Responsabilidades**:
  - Describe cambio: qué, por qué, alcance
  - Identifica roles requeridos (STOCK, ADMIN, etc.)
  - Estima complejidad y riesgos
  - Crea `proposal.md`
  - **NO** especifica detalles de implementación

### Specifier (`sdd-spec`)
- **Rol**: Define requirements exactos
- **Responsabilidades**:
  - Escribe requirements con RFC 2119
  - Define scenarios GIVEN/WHEN/THEN
  - Especifica inputs, outputs, casos error
  - Crea `specs.md` como fuente de verdad
  - **DEBE** leer proposal como dependencia

### Designer (`sdd-design`)
- **Rol**: Arquitecto de la solución
- **Responsabilidades**:
  - Diseña capas y módulos
  - Justifica decisiones arquitectónicas
  - Describe flujos de datos entre componentes
  - Crea `design.md`
  - **DEBE** leer proposal y specs como dependencias

### Task Planner (`sdd-tasks`)
- **Rol**: Desglosa en chunks ejecutables
- **Responsabilidades**:
  - Desglose: máx 2 horas por tarea
  - Numeración jerárquica (1.1, 1.2, etc.)
  - Agrupa por fase (setup, implement, test)
  - Crea checklist en `tasks.md`
  - **DEBE** leer specs y design como dependencias

### Implementer (`sdd-apply`)
- **Rol**: Executor del código
- **Responsabilidades**:
  - Implementa tarea por tarea
  - Sigue specs, design, tasks exactamente
  - Commits convencionales por tarea
  - Marca tareas completadas
  - **NUNCA** improvisa fuera de specs

### Verifier (`sdd-verify`)
- **Rol**: Validador de calidad
- **Responsabilidades**:
  - Compara implementación contra specs
  - Valida scenarios GIVEN/WHEN/THEN
  - Ejecuta tests incluidos
  - Reporta CRÍTICO / ADVERTENCIA / SUGERENCIA
  - **NO** arregla issues, solo reporta

### Archiver (`sdd-archive`)
- **Rol**: Finaliza y documenta
- **Responsabilidades**:
  - Sincroniza delta specs → specs principales
  - Archiva change en `openspec/archive/`
  - Limpia estado de trabajo
  - Documenta lecciones aprendidas

---

## 🏛️ Reglas de Arquitectura

### Backend (FastAPI + SQLModel)

#### Capas Unidireccionales
```
Router (HTTP) → Service (Business Logic) → UoW (Transaction) → Repository (Data) → Model (DB)
```
- Cada capa **solo** importa capas inferiores
- **Nunca** saltear capas (directamente al Repository desde Router)
- Flujo de dependencia: **siempre hacia adentro**

#### Pattern: Unit of Work (UoW)
```python
async with UnitOfWork(db_session) as uow:
    # Múltiples operaciones en transacción atómica
    uow.productos.create(...)      # No hay commit hasta salir del with
    uow.pedidos.update(...)
    # Al salir: commit si todo OK, rollback si error
```
- **Atomicidad garantizada**: todo o nada
- **Transacciones explícitas** para operaciones complejas
- **Rollback automático** en excepciones

#### Feature-First Organization
```
backend/
├── auth/           # auth + refreshtokens
├── usuarios/       # CRUD usuarios + roles
├── categorias/     # Categorías jerárquicas
├── productos/      # CRUD + ingredientes
├── pedidos/        # Lógica de pedidos + FSM
├── pagos/          # MercadoPago integration
├── admin/          # Panel + métricas
└── direcciones/    # Direcciones de entrega
```
- Cada módulo tiene: `model.py`, `schema.py`, `repository.py`, `service.py`, `router.py`
- **Coherencia clara**: todo lo relacionado en un lugar

#### Soft Delete Pattern
```python
# En lugar de DELETE → UPDATE ... SET eliminado_en = NOW()
@property
def esta_eliminado(self):
    return self.eliminado_en is not None
```
- **Nunca destruir datos**: preserve auditoría e histórico
- Filtrar en queries: `where(Model.eliminado_en == None)`

#### Máquina de Estados (FSM) para Pedidos
```
PENDIENTE → CONFIRMADO → EN_PREPARACIÓN → EN_CAMINO → ENTREGADO
    ↓           ↓              ↓              ↓
    └─────────────────────────────────────────┘ → CANCELADO (terminal)
```
- **Transiciones estrictas**: validar en service
- **Automatización**: PENDIENTE → CONFIRMADO por webhook IPN
- **Atomicidad**: cambio de estado + decremento de stock en una transacción

#### Rate Limiting
- Login: máx **5 intentos cada 15 minutos** por IP
- Protege contra ataques de fuerza bruta
- Implementado con `slowapi` middleware

### Frontend (React + TanStack Query + Zustand)

#### Separación: Client State vs Server State
```
Zustand (Client)              TanStack Query (Server)
├── Carrito                   ├── Productos
├── Autenticación (tokens)    ├── Pedidos
├── Preferencias UI           ├── Usuarios
└── Estado de UI              └── Métricas
```
- **Nunca mezclar**: evita desincronización y duplicación
- Client state: **localStorage** persistence
- Server state: **caching automático + revalidación**

#### Feature-Sliced Design (FSD)
```
src/
├── app/          # Configuración global, providers, rutas
├── pages/        # Páginas (por ruta)
├── widgets/      # Bloques de UI complejos (composiciones)
├── features/     # Interacciones de usuario específicas
├── entities/     # Modelos de dominio
└── shared/       # Utilidades, componentes genéricos
```
- **Regla de importación**: solo capas inferiores (no hacia arriba)
- **Coherencia**: features son auto-contenidas, reutilizables

#### Tailwind CSS (Utility-First)
- **Sin CSS separado**: estilos en HTML via clases
- **Responsive**: `md:`, `lg:` prefixes (mobile-first)
- **Dark mode**: via `dark:` prefix (si aplica)
- **Purging automático** en build (unused classes eliminadas)

#### TypeScript End-to-End
- **Todos los tipos** inferidos o explícitos
- **No `any` sin justificación**: usaré `unknown` si es necesario
- **API contracts**: tipos generados desde Backend (OpenAPI)

#### Interceptor de Axios
```typescript
// Adjunta access token automáticamente
// Renueva token al recibir 401
// Reintenta request original
```
- Transparente para componentes
- Manejo centralizado de autenticación

---

## 📋 Convenciones del Proyecto

### Commits Convencionales

```bash
feat(modulo): descripción breve del cambio
fix(modulo): descripción del bug corregido
refactor(modulo): descripción del refactor
test(modulo): descripción de tests añadidos
docs(modulo): descripción del cambio en docs
chore(modulo): tareas de mantenimiento
```

**Ejemplos**:
```
feat(pedidos): implementar máquina de estados para transiciones
fix(auth): renovar refresh token con rotación segura
test(productos): agregar tests unitarios para filtrado por categoría
docs(api): actualizar especificación de endpoints de pagos
```

**Reglas**:
- **Verbo en infinitivo** (implementar, agregar, corregir, no agrego)
- **Sin mayúscula** ni punto final en descripción
- **Correlacionar con usuario**: referenciar `US-XXX` si aplica
- **Atómico**: un cambio conceptual por commit

### Nomenclatura

#### Backend (Python)
- **Módulos**: snake_case (`auth`, `usuarios`, `productos`)
- **Archivos**: snake_case (`router.py`, `service.py`, `repository.py`)
- **Clases**: PascalCase (`UserRepository`, `ProductService`)
- **Funciones/métodos**: snake_case (`get_current_user`, `create_order`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_LOGIN_ATTEMPTS`)
- **Tipos Pydantic**: PascalCase + sufijo (`LoginRequest`, `UserResponse`)

#### Frontend (TypeScript/React)
- **Componentes**: PascalCase (`LoginForm`, `ProductCard`)
- **Hooks**: camelCase + `use` (`useCart`, `useFetchProducts`)
- **Funciones utilidad**: camelCase (`calculateTotal`, `formatPrice`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Tipos/Interfaces**: PascalCase (`User`, `Product`, `OrderItem`)
- **Archivos**: PascalCase para componentes, snake_case para utils

#### Base de Datos (PostgreSQL)
- **Tablas**: snake_case (`usuarios`, `productos`, `pedidos`)
- **Columnas**: snake_case (`creado_en`, `stock_cantidad`, `es_alergeno`)
- **Índices**: `idx_{tabla}_{columna}` (`idx_usuarios_email`)
- **Constraints**: `fk_{tabla}_{columna}` (`fk_pedidos_usuario_id`)

### Formato Código

#### Backend
- **Python**: Black formatter (88 chars line length)
- **Type hints**: Obligatorios para funciones públicas
- **Docstrings**: Google style para módulos y clases públicas
- **Linting**: pylint con configuración del proyecto

#### Frontend
- **TypeScript**: Prettier (80 chars line length)
- **Type annotations**: Obligatorios (no implicit `any`)
- **ESLint**: Configuración + auto-fix en pre-commit
- **JSX**: PascalCase, destructuring de props

### Estructura de Branches

```
main                          ← Producción (protegido)
├── release/v1.0.0           ← Release candidate
├── develop                  ← Integración
│   ├── feature/us-001-auth           ← Nueva feature
│   ├── fix/bug-carrito              ← Bug fix
│   └── refactor/pedidos-fsm         ← Refactor
└── hotfix/security-jwt              ← Urgente desde main
```

**Reglas**:
- `main`: solo tags + merges desde `release/`
- `develop`: rama de integración, tests + linting pasando
- Features: un branch por feature/fix, merge a develop vía PR
- Nombrar: `feature/us-{numero}-{slug}` o `fix/{slug}`

---

## 🎯 Reglas de Operación para Agentes IA

### Lectura y Entendimiento

✅ **Leer para decidir** (1-3 archivos inline)  
✅ **Exploración rápida** de pequeños cambios  
❌ **NO leer 4+ archivos** para "entender" — delegar a sdd-explore  
❌ **NO leer como prep para escribir** — leer + escribir juntos en delegación  

### Escritura

✅ **Escribir atómico** (un archivo, cambio mecánico, lógica clara)  
✅ **Escribir convencional**: commits con `feat()`, `fix()`, `test()`  
❌ **NO escribir multi-archivo** sin análisis — delegar sdd-apply  
❌ **NO write sin read previo** — siempre leer primero  

### Flujo SDD

✅ **Proposal**: 200-300 palabras, **solo** intención  
✅ **Specs**: MUST/SHOULD, scenarios GIVEN/WHEN/THEN  
✅ **Design**: Arquitectura con justificación  
✅ **Tasks**: Max 2 horas por tarea, jerarquía numérica  
✅ **Apply**: Tarea por tarea, commits pequeños  
✅ **Verify**: Comparar contra specs, no arreglar  
✅ **Archive**: Sincronizar y cerrar  

### Documentación

✅ **Español** para documentación de proyecto (README, specs, diseño)  
✅ **Inglés** para código (comentarios, docstrings, tipos)  
✅ **Markdown** para SDD artifacts (propuesta, specs, diseño, tasks)  
❌ **NO mezclar** idiomas en mismos comentarios  
❌ **NO crear docs** sin que usuario lo pida explícitamente  

### Dependencias Externas

✅ **MercadoPago SDK**: Usar para crear órdenes y procesar webhooks  
✅ **TanStack Query**: Server state management (queries)  
✅ **Zustand**: Client state management (carrito, auth)  
✅ **Tailwind**: Estilos directamente en className  
✅ **PostgreSQL CTE recursivas**: Para categorías jerárquicas  
❌ **NO agregar nuevas dependencias** sin proposal explícita  
❌ **NO reemplazar** Stack establecido (ejemplo: no Redux en lugar de Zustand)  

---

## 🔐 Especificación de Usuarios de Historia

Formato de especificación para scenarios dentro de SDD:

```gherkin
GIVEN    → Condición inicial (contexto, estado previo)
WHEN     → Acción que dispara el comportamiento
THEN     → Resultado esperado (verificable)

Ejemplo:
--------

**Scenario**: Cliente agrega producto al carrito desde página de detalle

GIVEN    el cliente está autenticado y visualiza detalle de producto "Pizza Margherita"
WHEN     hace clic en "Agregar al Carrito" con cantidad 2 y sin personalizaciones
THEN     el producto se agrega al carrito con cantidad 2
AND      el contador del carrito se incrementa a +1 badge rojo
AND      la compra parcial se persiste en localStorage
AND      no hay petición al backend (operación puramente local)

---

**Scenario**: Backend rechaza crear pedido sin stock suficiente

GIVEN    un pedido pendiente con 3 litros de leche ("Leche La Serenísima")
WHEN     el sistema intenta confirmar el pedido (pago aprobado)
AND      solo hay 2 litros disponibles en stock
THEN     la transacción se revierte (rollback)
AND      el pedido permanece en PENDIENTE
AND      se devuelve error 400: "Stock insuficiente para producto X"
AND      se registra en HistorialEstadoPedido el intento fallido
```

---

## 📊 Matriz de Decisión: Cuándo Delegar

| Situación | Acción | Responsable |
|-----------|--------|------------|
| Leer 1-2 archivos para decidir | Inline | Orchestrator |
| Leer 4+ archivos para entender | Delegar | sdd-explore |
| Escribir 1 archivo, cambio mecánico | Inline | (quien sea) |
| Escribir multi-archivo con lógica nueva | Delegar | sdd-apply |
| Explorar codebase | Delegar | sdd-explore |
| Crear especificaciones | Delegar | sdd-spec |
| Validar contra specs | Delegar | sdd-verify |
| Compilar / test / build | Delegar | (general) |

---

## ✅ Checklist: Calidad de SDD Artifacts

### ✓ Propuesta
- [ ] Describe "qué" y "por qué" claramente
- [ ] Identifica scope (qué entra, qué no)
- [ ] Estima complejidad y riesgos
- [ ] **Máximo 300 palabras**
- [ ] Sin detalles de implementación

### ✓ Especificaciones
- [ ] Usa RFC 2119 (MUST, SHALL, SHOULD, MAY)
- [ ] Mínimo 3 scenarios GIVEN/WHEN/THEN
- [ ] Casos de error especificados
- [ ] Inputs y outputs claros
- [ ] Criteria de aceptación verificables

### ✓ Diseño
- [ ] Diagrama de capas/módulos
- [ ] Justificación de decisiones
- [ ] Flujo de datos entre componentes
- [ ] Tabla de cambios en modelos (si aplica)
- [ ] Consideraciones de performance y seguridad

### ✓ Tasks
- [ ] Máximo 2 horas por tarea
- [ ] Numeración jerárquica (1.1, 1.2, 2.1)
- [ ] Agrupadas por fase (setup, implement, test)
- [ ] Criterio de "done" claro para cada tarea
- [ ] Estimaciones realistas

### ✓ Implementación
- [ ] Cada tarea: 1 commit convencional
- [ ] Código sigue convenciones del proyecto
- [ ] Tests pasando (si aplica)
- [ ] Sin warnings en linter
- [ ] Docs actualizadas si es necesario

---

## 🎓 Aprendizajes y Patrones

### Decisiones Arquitectónicas Documentadas

Para nuevas decisiones, registrar en `docs/ARCHITECTURE_DECISIONS.md`:

```markdown
## ADR-001: Usar Zustand en lugar de Redux

**Contexto**: Necesitamos state management para carrito y autenticación

**Decisión**: Zustand

**Rationale**:
- API minimalista vs boilerplate de Redux
- Mejor performance (suscripciones granulares)
- Soporte nativo de localStorage

**Consecuencias**:
- Menos familiarity para equipos con Redux background
- Documentación más pequeña (comunidad creciente)
```

### Patrones Reutilizables

- **Snapshot Pattern**: Inmutabilidad de datos históricos
- **Unit of Work**: Transacciones atómicas multi-entidad
- **FSM**: Máquina de estados para ciclo de vida de pedidos
- **Feature-Sliced Design**: Escalabilidad y mantenibilidad frontend
- **Repository Pattern**: Abstracción de acceso a datos
- **Dependency Injection**: Testabilidad y desacoplamiento

---

## 🔗 Referencias Externas

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLModel**: https://sqlmodel.tiangolo.com/
- **React Docs**: https://react.dev
- **TanStack Query**: https://tanstack.com/query/latest
- **Zustand**: https://github.com/pmndrs/zustand
- **Tailwind CSS**: https://tailwindcss.com
- **MercadoPago SDK**: https://developers.mercadopago.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **OpenSpec**: https://fission.codes/openspec

---

## 📞 Soporte y Escalación

### Cuándo contactar (en el contexto SDD)

| Situación | Acción |
|-----------|--------|
| Spec ambiguo / contradictorio | Clarificar con usuario, actualizar spec |
| Risk no contemplado | Reportar en riesgos, solicitar guidance |
| Dependencia bloqueada | Reportar, sugerir workaround o paralelización |
| Issue inesperado durante apply | Reportar a orchestrator, **no improvisar** |
| Tests fallando | Reportar en verify, volver a spec/design |

### Escalación a Usuario

- **CRÍTICO**: Bloqueador (risk, dependencia, clarificación)
- **ADVERTENCIA**: Issue menor (performance, edge case)
- **SUGERENCIA**: Mejora (refactor, documentación)

---

**Última actualización**: Viernes 08 de Mayo de 2026  
**Versión**: 1.0  
**Modo**: openspec (hybrid engram + files)  
**Status**: Operacional ✅
