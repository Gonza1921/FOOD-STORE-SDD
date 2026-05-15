## Context

El proyecto Food Store requiere un panel de administración para que los administradores puedan gestionar usuarios, productos, categorías, ingredientes y pedidos, además de visualizar métricas del negocio. Actualmente existe un backend con todos los endpoints necesarios, pero no hay una interfaz frontend para administración.

**Estado actual:**
- Backend: FastAPI con todos los endpoints CRUD para usuarios, productos, categorías, ingredientes y pedidos
- Frontend: React con TanStack Query, pero solo existe UI para clientes (catálogo, carrito, checkout)
- Auth: JWT con RBAC (ADMIN, STOCK, PEDIDOS, CLIENT)

**Restricciones:**
- Solo ADMIN puede acceder al panel
- Usar componentes existentes del proyecto
- Diseño mobile-first con Tailwind CSS
- Recharts ya está disponible como dependencia

## Goals / Non-Goals

**Goals:**
- Dashboard con KPIs de negocio (pedidos, ingresos, stock bajo)
- Gráficos de tendencias (barras, torta, línea) con Recharts
- CRUD completo de usuarios con asignación de roles
- Gestión de productos (stock, disponibilidad)
- CRUD de categorías con validación de jerarquía
- CRUD de ingredientes con toggle de alérgenos
- Gestión de pedidos con filtros y cambio de estado manual
- Componentes de UX (skeleton, toasts, modales, estados vacíos)
- Diseño responsivo mobile-first

**Non-Goals:**
- No se crearán nuevos endpoints backend (usar existentes)
- No se implementará configuración del sistema (US-060) en esta iteración
- No se implementará gestión de perfil propio del admin (US-061, US-062, US-063)
- No se implementará exportación de datos

## Decisions

### D1: Estructura de rutas del admin

**Decisión:** Usar sub-rutas bajo `/admin` (ej: `/admin/dashboard`, `/admin/usuarios`, `/admin/productos`)

**Alternativas consideradas:**
- `/dashboard`, `/usuarios`, `/productos` (planas): Más simple pero menos estructurado
- `/admin/...` (anidado): Más claro, permite protección centralizada

**Rationale:** Permite un ProtectedRoute central que verifica rol ADMIN antes de cualquier ruta /admin/*

### D2: Componentes vs Pages

**Decisión:** Crear componentes reutilizables en `features/admin/components/` y pages en `pages/admin/`

**Alternativas consideradas:**
- Todo en widgets: Difícil de mantener
- Todo en features: Pages muy complejas

**Rationale:** FSD recommends separar componentes reutilizables (features) de páginas. Los componentes de tabla, gráficos, modales van en `features/admin/components/`, las pages تركيبها them.

### D3: Estado de UI del admin

**Decisión:** Usar Zustand store dedicado para estado UI del admin (no persistido)

**Alternativas consideradas:**
- Usar uiStore existente: Mezcla responsabilidades de cliente y admin
- Estado local con useState: Complicado para modales/toasts globales

**Rationale:** adminUIStore con toast, modal, y filtros activos. Solo存活 durante la sesión.

### D4: Endpoints de métricas

**Decisión:** Consumir endpoints existentes de aggregation si existen, o crear endpoints simples en backend para KPIs

**Alternativas consideradas:**
- Todo desde frontend con queries: Ineficiente, muchas requests
- Crear endpoints dedicados de métricas: Más limpio

**Rationale:** Si no existen endpoints de métricas, agregarlos como parte del change. El dashboard necesita:
- GET /api/v1/admin/metrics/pedidos (total, pendientes, por estado)
- GET /api/v1/admin/metrics/ingresos (total, por período)
- GET /api/v1/admin/metrics/productos-bajo-stock

### D5: Validación de transiciones de estado de pedidos

**Decisión:** Reutilizar la lógica de FSM del backend; el frontend solo envía el nuevo estado y el backend valida

**Alternativas consideradas:**
- Validar en frontend: Puede desincronizarse del backend
- Validar solo en backend: Más robusto

**Rationale:** Mantiene consistencia. El frontend muestra las opciones válidas pero el backend hace la validación final.

## Risks / Trade-offs

### R1: Performance con grandes datasets

**Riesgo:** Tablas con muchos usuarios/productos pueden ser lentas

**Mitigación:** Implementar paginación server-side (ya soportada por backend) y virtualización si es necesario

### R2: Concurrencia en edición de usuarios

**Riesgo:** Dos admins_editan el mismo usuario simultáneamente

**Mitigación:** Implementar optimistic updates con TanStack Query y mostrar error si falla

### R3: Seguridad de endpoints de métricas

**Riesgo:** Endpoints de métricas expuestos sin protección

**Mitigación:** Asegurar que todos los endpoints de admin usen `require_role(["ADMIN"])`

### R4: Complejidad de gráficos con muchos datos

**Riesgo:** Gráficos con 30+ días de datos pueden saturar

**Mitigación:** Limitar a 30 días para ingresos, 7 días para tendencias, paginar datos históricos

## Migration Plan

1. **Setup (Día 1):**
   - Crear store adminUIStore
   - Agregar rutas /admin en Router.tsx
   - Crear ProtectedRoute para ADMIN

2. **Dashboard (Día 1-2):**
   - Crear MetricCard components
   - Crear gráficos con Recharts
   - Consumir endpoints de métricas

3. **Gestión de Usuarios (Día 2-3):**
   - CRUD de usuarios
   - Asignación de roles
   - Validación de no quitarse ADMIN a sí mismo

4. **Gestión de Productos/Categorías/Ingredientes (Día 3-4):**
   - Tablas con filtros y búsqueda
   - Toggle de disponibilidad/stock
   - CRUD completo

5. **Gestión de Pedidos (Día 4-5):**
   - Filtros por estado
   - Vista detallada
   - Cambio de estado

6. **UX Components (Día 5):**
   - Skeleton loaders
   - Toasts
   - Modales de confirmación
   - Estados vacíos

7. **Testing y Refinamiento (Día 6):**
   - Pruebas manuales
   - Fix de bugs
   - Responsive testing

## Open Questions

- ¿Existen endpoints de métricas en el backend o hay que crearlos?
- ¿El endpoint de cambio de estado de pedido permite todos los estados o solo los válidos según FSM?
- ¿Cómo se maneja el paginado en las tablas del backend (page/size o offset/limit)?