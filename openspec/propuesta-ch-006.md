# 📌 Propuesta CH-006 — Análisis y Planificación

> **Estado**: Propuesta / Planificación  
> **Fecha**: 2026-05-12  
> **Basado en**: Análisis del estado actual del proyecto (CH-000 a CH-005)

---

## 1. 📊 Estado Actual del Sistema

### Resumen de cobertura

| Change | Estado | US Cubiertas |
|--------|--------|-------------|
| CH-000 | ✅ Hecho | US-000 |
| CH-001 | ✅ Hecho | US-000a |
| CH-002 | ✅ Completo | US-000b |
| CH-003 | ✅ Completo | US-000c |
| CH-004 | ✅ Archivado | US-000d, US-000e, US-068 |
| CH-005 | ✅ Completado (verify pendiente) | US-001..006, US-066, US-073 |
| **TOTAL** | **6 changes** | **15 de 82 US (~18%)** |

### Lo que funciona hoy

```
Backend                          Frontend
├── FastAPI + CORS + rate limit  ├── React + Vite + TypeScript strict
├── SQLModel (13 tablas)        ├── FSD structure
├── Alembic + seed data          ├── Axios interceptor (JWT + refresh)
├── BaseRepository[T] + UoW      ├── Zustand (auth, cart, payment, ui)
├── Auth (register, login,       ├── Auth components (Login, Register,
│    refresh, logout)             │    ProtectedRoute, PublicRoute)
├── get_current_user,            ├── Shared (Button, validators,
│    require_role                 │    formatters, useDebounce)
└── RFC 7807 error handling      └── Router (/login, /registro, /, 403)
```

### Lo que NO existe (módulos de negocio faltantes)

| Prioridad | Módulo | US Afectadas | Depende de |
|-----------|--------|-------------|------------|
| 🔴 **ALTA** | Categorías (CRUD + jerarquía) | US-007..010 | CH-004 ✅ |
| 🔴 **ALTA** | Ingredientes y alérgenos | US-011..014 | Categorías |
| 🔴 **ALTA** | Productos (CRUD + stock) | US-015..023 | Ingredientes |
| 🔴 **ALTA** | Direcciones de entrega | US-024..028 | CH-005 ✅ |
| 🟡 **MEDIA** | Carrito de compras (frontend) | US-029..034 | Productos |
| 🟡 **MEDIA** | Perfil de usuario | US-061..063 | CH-005 ✅ |
| 🟡 **MEDIA** | Navegación por rol + layout | US-075, 076 | CH-005 ✅ |
| 🟠 **ALTA** | Pedidos (creación + FSM) | US-035..044 | Carrito + Direcciones |
| 🔴 **ALTA** | Pagos MercadoPago | US-045..048 | Pedidos |
| 🟢 **BAJA** | Testing completo | — | Cualquier momento |
| 🟢 **BAJA** | Panel admin + dashboard | US-049..060 | Pedidos + Pagos |

---

## 2. 🧭 Opciones para CH-006

Se proponen 3 opciones viables, ordenadas por recomendación.

---

### 🔷 OPCIÓN A (RECOMENDADA): Catálogo — Categorías + Ingredientes

#### Objetivo
Implementar la base del catálogo de productos: categorías jerárquicas (con CTE recursiva) e ingredientes con alérgenos, incluyendo backend CRUD + frontend de administración.

#### Alcance

| Componente | Backend | Frontend |
|-----------|---------|----------|
| **Categorías** | CRUD completo con CTE recursiva, validación anti-ciclos, soft delete con verificación de productos activos | Admin CRUD (lista, crear, editar, eliminar) + selector jerárquico |
| **Ingredientes** | CRUD completo con `es_alergeno`, soft delete | Admin CRUD (lista, crear, editar, eliminar) |

#### Historias de usuario cubiertas
- **US-007**: Crear categoría
- **US-008**: Listar categorías jerárquicas
- **US-009**: Editar categoría
- **US-010**: Eliminar categoría (soft delete)
- **US-011**: Crear ingrediente
- **US-012**: Listar ingredientes
- **US-013**: Editar ingrediente
- **US-014**: Eliminar ingrediente (soft delete)

#### Módulos afectados

```
Backend (nuevos):
├── backend/categorias/
│   ├── __init__.py
│   ├── router.py        ← CRUD endpoints
│   ├── service.py        ← Lógica de negocio + CTE
│   ├── repository.py     ← Queries con CTE recursiva
│   └── schemas.py        ← Pydantic request/response
├── backend/ingredientes/
│   ├── __init__.py
│   ├── router.py
│   ├── service.py
│   ├── repository.py
│   └── schemas.py
├── backend/main.py       ← Registrar routers
└── backend/tests/        ← Tests de categorías + ingredientes

Frontend (nuevos):
├── features/categories/
│   ├── components/        ← CategoryList, CategoryForm, CategoryTree
│   ├── hooks/             ← useCategories
│   └── store.ts           ← (opcional, si aplica)
├── features/ingredients/
│   ├── components/        ← IngredientList, IngredientForm
│   ├── hooks/             ← useIngredients
│   └── store.ts
├── pages/
│   ├── AdminCategoriesPage.tsx
│   └── AdminIngredientsPage.tsx
└── app/Router.tsx         ← Nuevas rutas admin
```

#### Dependencias
- ✅ CH-004 (BaseRepository, UoW, dependencias FastAPI) — **ya resuelto**
- ✅ Modelos Categoria e Ingrediente — **ya existen desde CH-002**
- ❌ **No depende** de ningún otro change pendiente

#### Complejidad estimada

| Aspecto | Estimación |
|---------|-----------|
| Backend | **Alta** — CTE recursiva (PostgreSQL), validación anti-ciclos, herencia de patrones |
| Frontend | **Media** — CRUD estándar con formularios y listados |
| Testing | **Alta** — 8 US, tests unitarios + integración |
| **Total** | **~24-32 horas efectivas** |

#### Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| CTE recursiva compleja de testear | Tests específicos con fixture de árbol de 3 niveles |
| Categorías huérfanas al eliminar padre | Validación: reasignar hijos o bloquear eliminación |
| Nombres duplicados (categorías hermanas) | Validación de unicidad por nivel (no global) |

#### Valor de negocio
🔑 **Desbloquea todo el dominio de producto**: sin categorías ni ingredientes no se pueden crear productos, y sin productos no hay carrito, pedidos ni pagos. Es la **puerta de entrada** al negocio.

#### Orden dentro del sprint
```
CH-006 → CH-007 (Productos) → CH-008 (Catálogo público + Carrito)
```

---

### 🔷 OPCIÓN B: Layout Global + Navegación por Rol + Dashboard

#### Objetivo
Crear la estructura visual y de navegación del sistema: Header con auth state, Sidebar con menú por rol, layout responsive, y un Dashboard funcional con KPIs reales desde el backend.

#### Alcance

| Componente | Descripción |
|-----------|-------------|
| **Layout** | Header (logo, usuario, logout) + Sidebar (menú por rol) + contenido |
| **Navegación por rol** | CLIENT: Catálogo, Carrito, Mis Pedidos. STOCK: Productos, Stock. PEDIDOS: Pedidos. ADMIN: Todo + Admin |
| **Dashboard** | KPIs básicos (total productos, pedidos hoy, etc.) desde backend |
| **Perfil de usuario** | Ver/editar perfil, cambiar contraseña |
| **Manejo global de errores** | Toast system, error boundary, 404 page |

#### Historias de usuario cubiertas
- **US-075**: Navegación por rol
- **US-076**: Protección de rutas en frontend (ya base, falta refinamiento)
- **US-067**: Manejo de errores global en frontend
- **US-061**: Ver perfil propio
- **US-062**: Editar perfil propio
- **US-063**: Cambiar contraseña

#### Módulos afectados

```
Backend:
├── backend/usuarios/
│   ├── router.py         ← GET/PUT /me, PATCH /me/password
│   └── schemas.py
├── backend/admin/
│   ├── router.py         ← GET /dashboard (KPIs básicos)
│   └── schemas.py
└── backend/main.py       ← Registrar routers

Frontend:
├── widgets/
│   ├── Header.tsx        ← rewrite completo
│   └── Sidebar.tsx       ← rewrite con menú por rol
├── app/Router.tsx        ← Layout wrapper con Header+Sidebar
├── pages/
│   ├── ProfilePage.tsx   ← Nuevo
│   ├── NotFoundPage.tsx  ← Nuevo (mejorar el inline actual)
│   └── DashboardPage.tsx ← Rewrite con KPIs reales
├── features/auth/
│   └── components/       ← LogoutButton, UserMenu
└── shared/components/    ← ErrorBoundary, Toast
```

#### Dependencias
- ✅ CH-005 (auth) — **ya resuelto**
- ❌ **No depende** de catálogo ni pedidos

#### Complejidad estimada

| Aspecto | Estimación |
|---------|-----------|
| Backend | **Baja** — solo endpoints de perfil + dashboard KPI simple |
| Frontend | **Alta** — layout responsive, sidebar dinámico, integración con router, toasts |
| Testing | **Media** — tests de layout, navegación, perfil |
| **Total** | **~16-24 horas efectivas** |

#### Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Sidebar con muchos ítems futuros | Diseño modular: el menú se construye desde una configuración |
| Dashboard sin datos reales (catálogo vacío) | Mostrar valores 0 con estado "vacío" |
| Layout complejo de mantener | Usar React Router v6 layout routes (Outlet) |

#### Valor de negocio
🖥️ **Experiencia de usuario inmediata**: el sistema se ve y siente como una app real. Los roles se reflejan visualmente. Preparaa el terreno para todas las features futuras.

#### Orden dentro del sprint
```
CH-006 → se puede hacer en paralelo con CH-007 (no compiten)
```

---

### 🔷 OPCIÓN C: Testing + Calidad (Backend + Frontend)

#### Objetivo
Establecer una base sólida de calidad: tests unitarios para backend auth, tests de integración para endpoints, tests de frontend para componentes auth, y configuración de CI.

#### Alcance

| Componente | Descripción |
|-----------|-------------|
| **Tests backend auth** | AuthService.register/login/refresh/logout (unit) + endpoints (integration) |
| **Tests backend categorías** | (si se avanza) |
| **Tests frontend auth** | LoginForm, RegisterForm, ProtectedRoute, axios interceptor |
| **CI/CD** | GitHub Actions: lint + type-check + test |
| **Mejoras** | fixtures mejorados, base de datos de testing |

#### Historias de usuario cubiertas
- Ninguna US nueva — pero **asegura calidad** de US-001 a US-006 y US-073

#### Módulos afectados

```
Backend:
├── backend/tests/
│   ├── test_auth_service.py    ← Unit tests con mocks
│   ├── test_auth_api.py        ← Integration tests
│   └── conftest.py             ← Mejorar fixtures (mock UoW, mock Repo)

Frontend:
├── src/features/auth/
│   ├── __tests__/
│   │   ├── LoginForm.test.tsx
│   │   ├── RegisterForm.test.tsx
│   │   ├── ProtectedRoute.test.tsx
│   │   └── axiosClient.test.ts
│   └── store.test.ts
├── vitest.config.ts            ← Configurar vitest (o jest)
└── src/test/                   ← Test utilities, mocks, providers

CI:
└── .github/workflows/
    ├── ci-backend.yml
    └── ci-frontend.yml
```

#### Dependencias
- ✅ CH-005 (auth completo para testear)
- ❌ No depende de otros changes

#### Complejidad estimada

| Aspecto | Estimación |
|---------|-----------|
| Backend tests | **Media** — mocks de UoW, fixtures, ~30 tests |
| Frontend tests | **Alta** — configurar testing library, mocks de axios, ~20 tests |
| CI/CD | **Baja** — YAML estándar, ~2 workflows |
| **Total** | **~16-20 horas efectivas** |

#### Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Tests lentos sin Mock | Usar mocks para UoW/Repository, no base de datos real |
| Frontend tests frágiles | Testing Library (no snapshot tests), selectores por rol/aria |
| CI tarda mucho | Separar workflows, cache de dependencias |

#### Valor de negocio
🧪 **Calidad asegurada** — los tests protegen el código existente y dan confianza para agregar nuevas features. Sin tests, cada cambio nuevo puede romper auth (el core del sistema).

#### Orden dentro del sprint
```
CH-006 → Se puede hacer en paralelo con cualquier otro change
```

---

## 3. 🏆 Recomendación Final

### Recomendación principal: **OPCIÓN A — Catálogo: Categorías + Ingredientes**

**Razones:**

1. **Orden lógico**: El plan original (y el sentido común) dicta que primero vienen los datos maestros (categorías, ingredientes), luego productos, luego flujos transaccionales (carrito, pedidos, pagos).

2. **Desbloquea el negocio**: Sin categorías e ingredientes, no se puede crear ni un solo producto. Sin productos, el carrito, los pedidos y los pagos son imposibles.

3. **Independencia técnica**: Los modelos ya existen desde CH-002. Los patrones base (BaseRepository, UoW) ya están probados con auth. Es un cambio puro de "aplicar patrón existente a nuevo dominio".

4. **Valor visible**: Aunque no es glamoroso, tener categorías + ingredientes funcionales permite al equipo de frontend empezar a construir el catálogo público en paralelo.

### Flujo de ejecución sugerido

```
Fase 1 (CH-006a): Categorías (backend + frontend admin)
  ├── CRUD completo backend
  ├── CTE recursiva para árbol
  ├── Frontend: CategoryList, CategoryForm, CategoryTree
  └── Tests: unit + integration

Fase 2 (CH-006b): Ingredientes (backend + frontend admin)
  ├── CRUD completo backend
  ├── Frontend: IngredientList, IngredientForm
  └── Tests: unit + integration

→ CH-007: Productos (depende de CH-006)
→ CH-008: Catálogo público + Carrito (depende de CH-007)
```

### Si se quiere hacer en paralelo

| Equipo | Change | Dependencia |
|--------|--------|-------------|
| Equipo A | **CH-006 Opción A** (Categorías + Ingredientes) | Ninguna |
| Equipo B | **CH-006 Opción B** (Layout + Navegación) | Ninguna |
| Ambos | **CH-006 Opción C** (Testing) puede correr en paralelo |

---

## 4. 📋 Plan de Ejecución Sugerido — Opción A

### Fase 1: Backend Categorías

| Tarea | Estimación |
|-------|-----------|
| Crear `categorias/` module (router, service, repository, schemas) | 4h |
| Implementar CTE recursiva en repository | 2h |
| Validaciones: anti-ciclos, nombre único por nivel | 1h |
| Soft delete con verificación de productos | 1h |
| Tests unitarios + integración | 2h |
| **Subtotal** | **10h** |

### Fase 2: Backend Ingredientes

| Tarea | Estimación |
|-------|-----------|
| Crear `ingredientes/` module (router, service, repository, schemas) | 3h |
| Validaciones: nombre único, es_alergeno | 1h |
| Tests unitarios + integración | 1h |
| **Subtotal** | **5h** |

### Fase 3: Frontend Admin Categorías

| Tarea | Estimación |
|-------|-----------|
| `useCategories` hook con TanStack Query | 1h |
| `CategoryList` component (table + paginación) | 2h |
| `CategoryForm` component (crear/editar con selector de padre) | 2h |
| `CategoryTree` component (visualización jerárquica) | 2h |
| `AdminCategoriesPage` | 1h |
| Tests | 2h |
| **Subtotal** | **10h** |

### Fase 4: Frontend Admin Ingredientes

| Tarea | Estimación |
|-------|-----------|
| `useIngredients` hook con TanStack Query | 1h |
| `IngredientList` component (table + filtro alérgenos) | 1.5h |
| `IngredientForm` component | 1.5h |
| `AdminIngredientsPage` | 1h |
| Tests | 1h |
| **Subtotal** | **5h** |

### Totales

| Fase | Horas |
|------|-------|
| Backend Categorías | 10h |
| Backend Ingredientes | 5h |
| Frontend Categorías | 10h |
| Frontend Ingredientes | 5h |
| **Total CH-006** | **~30h** |

---

## 5. 🔗 Conexión con el Plan Original

| Plan original | Realidad (consolidado) |
|--------------|----------------------|
| CH-020 (Categorías) | → **CH-006** (Categorías + Ingredientes) |
| CH-021 (Ingredientes) | → Consolidado en CH-006 |
| CH-022 (Productos) | → **CH-007** (Productos CRUD + stock) |
| CH-023 (Catálogo público) | → **CH-008** (Catálogo + Carrito frontend) |
| CH-030 (Direcciones) | → **CH-009** (Direcciones entrega) |
| CH-031 (Carrito) | → Consolidado en CH-008 + CH-009 |
| CH-032 (Pedidos) | → **CH-010** (Pedidos + FSM) |
| CH-033 (FSM) | → Consolidado en CH-010 |
| CH-040 (MercadoPago) | → **CH-011** |
| CH-041 (Admin) | → **CH-012** |

**Nota**: El testing (Opción C) y Layout (Opción B) se pueden ejecutar como cambios paralelos en cualquier momento.

---

*Documento generado el 2026-05-12 — basado en análisis del código real del proyecto.*
