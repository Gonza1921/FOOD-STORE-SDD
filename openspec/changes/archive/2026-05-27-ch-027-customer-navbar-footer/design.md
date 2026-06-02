## Context

FOOD-STORE ahora tiene **CustomerLayout** (gracias a CH-026), pero está vacío — solo tiene un `<Outlet />` y placeholders para navbar y footer. Los clientes CLIENT no tienen barra de navegación, ven el admin sidebar o nada.

Este cambio agrega una **navbar profesional de ecommerce** y un **footer** al CustomerLayout, reemplazando la experiencia admin-sidebar con una navegación moderna orientada al cliente.

**Estado actual:**
- `CustomerLayout.tsx` — tiene placeholders `{/* Customer navbar will go here in CH-027 */}`
- No existe componente Navbar ni Footer
- El header actual en AdminLayout tiene topbar con sidebar, no es apto para clientes
- Toda la data necesaria ya existe: categorías (GET /categorias), carrito (Zustand store), auth (Zustand store)

## Goals / Non-Goals

**Goals:**
- Crear `Navbar` component con: logo, search bar, categorías dropdown, carrito badge, perfil dropdown
- Crear `Footer` component con: links, copyright, info de compañía
- Integrar Navbar y Footer en `CustomerLayout`
- Navbar responsive: hamburger menu en mobile, full navbar en desktop
- Search con debounce, resultados limitados (hint/suggestions dropdown)
- Categorías dropdown fetch desde API existente
- Cart badge con count desde Zustand store
- Profile dropdown con nombre, links a perfil/pedidos/direcciones, logout

**Non-Goals:**
- Página de categorías (CH-028)
- Filtros avanzados de productos (CH-029)
- Mejoras visuales al admin sidebar (CH-032)
- Backend changes
- Tests unitarios (se harán en CH-029/CH-030)

## Decisions

### Decision 1: Componentes modulares dentro de `widgets/Navbar/`

Se crean subcomponentes separados en lugar de un navbar monolítico:

- `Navbar.tsx` — container principal, layout, estado de menú mobile
- `NavbarSearch.tsx` — input de búsqueda con debounce y dropdown de sugerencias
- `NavbarCategories.tsx` — dropdown de categorías (fetch desde API)
- `NavbarCart.tsx` — icono de carrito con badge de cantidad
- `NavbarProfile.tsx` — avatar + nombre + dropdown con links y logout

**Rationale**: Cada subcomponente tiene una responsabilidad única, facilita testing y reutilización.

### Decision 2: Search con búsqueda local + API

El search tiene dos modos:
1. **Sugerencias inline**: Mientras escribe, muestra productos sugeridos (fetch a `GET /productos/publico/catalogo?search=...` con debounce de 300ms)
2. **Búsqueda completa**: Al hacer Enter, navega a `/catalogo?search=...` (existente)

**Rationale**: Las sugerencias inline mejoran UX sin requerir navegación a otra página.

### Decision 3: Footer simple, sin backend

Footer es un componente puramente estático con información de la empresa y enlaces. No requiere fetch de datos.

## Architecture

### Component Tree

```
CustomerLayout
├── Navbar
│   ├── Logo (Link to /)
│   ├── NavbarSearch (input + suggestions)
│   ├── NavbarCategories (dropdown menu)
│   ├── NavbarCart (icon + badge)
│   └── NavbarProfile (avatar + name + dropdown)
│       ├── Link: Mi Perfil → /mi-perfil
│       ├── Link: Mis Pedidos → /mis-pedidos
│       ├── Link: Mis Direcciones → /mis-direcciones
│       └── Button: Cerrar Sesión
├── <Outlet /> (page content)
└── Footer
    ├── Company Info
    ├── Quick Links
    ├── Social / Contact
    └── Copyright
```

### File Structure

```
frontend/src/widgets/
├── Navbar/
│   ├── Navbar.tsx              — Container principal
│   ├── NavbarSearch.tsx        — Búsqueda con debounce
│   ├── NavbarCategories.tsx    — Dropdown de categorías
│   ├── NavbarCart.tsx          — Carrito + badge
│   ├── NavbarProfile.tsx       — Perfil + logout
│   └── index.ts                — Re-export
├── Footer/
│   ├── Footer.tsx              — Footer component
│   └── index.ts                — Re-export
├── Layout/
│   └── CustomerLayout.tsx      — MODIFICADO: importa Navbar + Footer
```

### Data Flow

```
useAuthStore (user, logout) ──────→ NavbarProfile (nombre, logout action)
useCartStore (items, totalItems) ──→ NavbarCart (badge count)
axiosClient.get(/categorias) ─────→ NavbarCategories (dropdown items)
axiosClient.get(/productos/publico/catalogo?search=) → NavbarSearch (suggestions)
```

### Navbar Layout Structure (Desktop)

```
┌────────────────────────────────────────────────────────────┐
│ [Logo]   [🔍 Buscar productos...]  [☰ Categorías ▾]      │
│                                                  🛒(3)  👤 │
│                                                  Admin ▾  │
└────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌───────────────────────┐
│ [Logo]          [☰]  │
├───────────────────────┤
│ (Hamburger drawer)    │
│ [🔍 Buscar...]       │
│ [☰ Categorías]       │
│ [🛒 Carrito (3)]     │
│ [👤 Mi Perfil]       │
│ [📦 Mis Pedidos]     │
│ [📍 Mis Direcciones] │
│ [🚪 Cerrar Sesión]   │
└───────────────────────┘
```

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Search suggestions slow (muchos productos) | LOW | MEDIUM | Debounce 300ms, limitar resultados a 5-8 items |
| Categorías dropdown lento | LOW | LOW | Cachear categorías en estado local con refetch periódico |
| Mobile menu no cierra al navegar | MEDIUM | LOW | Click en link → cerrar menú automáticamente |
| Cart badge desincronizado | LOW | MEDIUM | Subscribe directo al store de Zustand (reactivo) |
| Logout no redirige correctamente | LOW | HIGH | Usar `useNavigate` + `replace: true` a `/login` |

## Migration Plan

### Paso 1: Crear componentes Navbar
- Crear `NavbarSearch.tsx` con input + debounce + suggestions dropdown
- Crear `NavbarCategories.tsx` con fetch a categorías + dropdown
- Crear `NavbarCart.tsx` con icono + badge desde cart store
- Crear `NavbarProfile.tsx` con user info + dropdown menu + logout
- Crear `Navbar.tsx` que compone todo + responsive hamburger

### Paso 2: Crear Footer
- Crear `Footer.tsx` con layout de links + copyright

### Paso 3: Integrar en CustomerLayout
- Importar Navbar y Footer
- Reemplazar placeholders con los componentes reales

### Rollback
- Todos los archivos son nuevos, CustomerLayout tiene cambios mínimos
- Rollback: `git checkout -- src/widgets/Layout/CustomerLayout.tsx` + eliminar carpetas Navbar/Footer
