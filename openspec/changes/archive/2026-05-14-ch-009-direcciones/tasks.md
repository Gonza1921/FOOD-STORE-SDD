# Tasks: CH-009 Direcciones de Entrega

## Part 1 — Backend

### Setup
- [x] 1.1 Fix modelo Categoria (link_model string → class)
- [x] 1.2 Fix modelo Ingrediente (link_model string → class)
- [x] 1.3 Fix modelo Pedido (relationship → Relationship)

### Modelo y migración
- [x] 2.1 Actualizar DireccionEntrega: +referencia, +deleted_at
- [x] 2.2 Crear migration 003_add_direccion_fields

### Módulo backend
- [x] 3.1 Schemas Pydantic (Create, Update, Out, SetPrincipal)
- [x] 3.2 Repository con queries scoped por usuario
- [x] 3.3 Service con ownership validation
- [x] 3.4 Router con 6 endpoints
- [x] 3.5 Registrar router en main.py

### Tests
- [x] 4.1 Tests de schemas (10 tests)

### Validación
- [x] 5.1 Models import OK
- [x] 5.2 App startup OK (39 routes)
- [x] 5.3 OpenAPI genera OK (22 paths)
- [x] 5.4 Tests pasan (10/10)

## Part 2 — Frontend

### API layer
- [x] 6.1 Endpoints en shared/api/endpoints.ts
- [x] 6.2 Tipos, query keys y API functions

### Hooks
- [x] 7.1 useDirecciones (list query)
- [x] 7.2 useDireccionDetail (detail query)
- [x] 7.3 useDireccionMutations (create, update, delete, setPrincipal)

### Components
- [x] 8.1 DireccionCard (card + acciones)
- [x] 8.2 DireccionForm (formulario crear/editar)
- [x] 8.3 DireccionesListPage (página completa con 4 estados)

### Integración
- [x] 9.1 Router: ruta /mis-direcciones
- [x] 9.2 Sidebar: nav item "Mis Direcciones"
- [x] 9.3 Barrel exports

### Validación final
- [x] 10.1 type-check OK
- [x] 10.2 Build frontend OK (225 modules)
- [x] 10.3 Backend startup OK
- [x] 10.4 Tests OK (10/10)
- [x] 10.5 Git status clean
