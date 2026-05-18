# CH-019: Task Breakdown

## Fase 1: Diagnóstico y Setup

- [x] **1.1** Identificar causa raíz de "ERROR DE CONEXIÓN" en Mis Direcciones
  - Diagnóstico: Backend 500 por `UndefinedTableError` — modelo SQLModel sin `__tablename__`
- [x] **1.2** Identificar causa raíz de DELETE roto
  - Diagnóstico: `DataError` de asyncpg — timezone-aware datetime contra columna naive

## Fase 2: Implementación Backend

- [x] **2.1** Agregar `__tablename__ = "direccion_entrega"` a modelo `DireccionEntrega`
  - Archivo: `backend/models/direccion.py`
  - Criteria: Consultas GET/POST/PUT/PATCH/DELETE a `/api/v1/direcciones/` no devuelven 500
- [x] **2.2** Fix timezone en `Repository.soft_delete`
  - Archivo: `backend/core/repository.py`
  - Criteria: DELETE `/api/v1/direcciones/{id}` devuelve 204 en lugar de DataError

## Fase 3: Frontend

- [x] **3.1** Agregar ruta `/mis-direcciones/nueva` en Router.tsx
  - Criteria: Navegar a `/mis-direcciones/nueva` no da 404
- [x] **3.2** Auto-open modal de creación en `DireccionesListPage`
  - Criteria: Navegar a `/mis-direcciones/nueva` abre el modal de creación sin clicks

## Fase 4: Verificación

- [x] **4.1** Verificar CRUD completo de direcciones via API
  - [x] POST → 201 Created
  - [x] GET list → 200 OK
  - [x] GET by ID → 200 OK
  - [x] PUT → 200 OK
  - [x] PATCH principal → 200 OK
  - [x] DELETE → 204 No Content
- [x] **4.2** Verificar frontend build (`npm run build`)
  - Criteria: 0 TS errors, Vite build exitoso
- [x] **4.3** Verificar frontend lint (`npm run lint`)
  - Criteria: 0 nuevos errores/warnings (solo pre-existentes)
- [x] **4.4** Verificar backend startup
  - Criteria: `curl localhost:8000/` devuelve `{"message":"FOOD-STORE API"}`

## Fase 5: Archive

- [x] **5.1** Crear proposal.md
- [x] **5.2** Crear design.md
- [x] **5.3** Crear tasks.md
- [x] **5.4** Crear verify-report.md
- [x] **5.5** Crear .openspec.yaml
- [x] **5.6** Verificar integridad: sin merge conflicts, TS errors, imports rotos
