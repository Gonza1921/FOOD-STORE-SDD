# SDD Convenciones — Food Store

Guía de estándares para crear y actualizar artefactos Spec-Driven Development (SDD) en Food Store.

---

## 📋 Estándares Generales

### Idioma
- **Documentación SDD** (propuestas, specs, diseño, tasks): **Español**
- **Código**: **Inglés** (comentarios, docstrings, tipos)
- **Commits**: Mensaje en español, prefijo en inglés (`feat(auth): login con JWT`)

### Formato de Archivos
- Todos los artefactos: **Markdown (.md)**
- Nombres de archivos: `kebab-case` (ej: `proposal.md`, `design.md`, `tasks.md`)
- Encoding: UTF-8 sin BOM

---

## 🎯 Estructura de Propuestas

**Archivo**: `openspec/changes/{change-name}/proposal.md`

### Secciones Obligatorias

```markdown
# Propuesta: {nombre-descriptivo}

## Intención
[1-2 párrafos describiendo QUÉ se va a hacer y POR QUÉ — enfocado en el valor]

## Scope
### Entra en este cambio
- Item 1
- Item 2

### NO entra en este cambio
- Item 1
- Item 2

## Impacto
- **Módulos afectados**: auth, productos, pedidos
- **Roles involucrados**: ADMIN, STOCK
- **Complejidad estimada**: Media (3-5 horas)
- **Riesgos**: Transacciones concurrentes, rendimiento con grandes catálogos

## Enfoque (alto nivel)
[3-5 puntos clave del enfoque, SIN detalles de implementación]

## Dependencias
- [ ] Otro cambio X (bloqueador)
- [ ] Base de datos actualizada

## Aceptación
El cambio se considera completo cuando:
- Todos los scenarios GIVEN/WHEN/THEN pasen
- Coverage > 80% en módulos críticos
- Performance test OK (< X ms)
```

**Máximo**: 300 palabras (sin contar secciones estructuradas)

---

## 📝 Estructura de Especificaciones

**Archivo**: `openspec/changes/{change-name}/specs.md`

### Secciones Obligatorias

```markdown
# Especificaciones: {nombre-descriptivo}

## Resumen Ejecutivo
[1 párrafo: qué se especifica, por qué importa]

## Términos y Definiciones
- **Término 1**: Definición clara
- **Término 2**: Definición clara

## Requisitos Funcionales

### RF-001: {Descripción}
**Tipo**: MUST | SHOULD | MAY
**Descripción**: [Declaración clara del requisito]
**Criterios de aceptación**:
- [ ] Criterio 1
- [ ] Criterio 2

### Scenario: {Nombre descriptivo}

**Scope**: Backend | Frontend | Full-stack

**GIVEN** [Estado inicial, contexto]
**WHEN** [Acción que ocurre]
**THEN** [Resultado esperado]
**AND** [Resultado adicional]

#### Caso de Error: {Descripción}
**GIVEN** [Condición que causa error]
**WHEN** [Acción]
**THEN** [Comportamiento en error: HTTP 400 con "mensaje claro"]

## Requisitos No-Funcionales

- **Performance**: Endpoint debe responder en < 200ms
- **Seguridad**: Validar rol ADMIN antes de proceder
- **Compatibilidad**: TypeScript 5+, Python 3.11+

## API (si aplica)

### POST /api/v1/endpoint
**Auth**: Bearer token requerido
**Roles**: [ADMIN | STOCK | PEDIDOS | CLIENT]
**Request**:
```json
{
  "campo1": "tipo"
}
```
**Response (200)**:
```json
{
  "id": 123,
  "status": "success"
}
```
**Response (400)**:
```json
{
  "type": "validation_error",
  "detail": "Campo requerido"
}
```

## Schemas (Backend)

```python
class CreateProductRequest(BaseModel):
    """Crear nuevo producto"""
    nombre: str  # Min 1, Max 255
    precio: Decimal  # > 0
    stock: int  # >= 0
```

## Database Changes

### Tablas nuevas
- `tabla_nueva` (descripción)

### Columnas nuevas
- `productos.nuevo_campo` (tipo, nullable, default)

### Índices
- `idx_productos_categoria_id` (performance de queries)

## Integración con Sistemas Externos

- **MercadoPago**: Crear orden en checkout API
- **Email**: Notificar al cliente

## Definiciones de Hecho (Done)

Esto se considera completado cuando:
1. Código implementado siguiendo specs exactamente
2. Tests unitarios ≥ 80% coverage
3. Linter y type-checker sin errores
4. Review + aprobación manual de scenarios
5. Documentación actualizada
```

**Mínimo**: 3 scenarios; máximo 1 página por RF

---

## 🏗️ Estructura de Diseño

**Archivo**: `openspec/changes/{change-name}/design.md`

### Secciones Obligatorias

```markdown
# Diseño Técnico: {nombre-descriptivo}

## Resumen
[2-3 párrafos: cómo se soluciona, arquitectura general]

## Arquitectura General
[Diagrama ASCII o referencia a diagrama]

```
Router → Service → UoW → Repository → Model
  ↓
(HTTP)   (Lógica)   (Transacción)   (Acceso datos)   (DB)
```

## Cambios en Backend

### Nuevos Módulos/Capas
- `backend/nuevo_modulo/router.py` — Endpoints
- `backend/nuevo_modulo/service.py` — Lógica de negocio
- `backend/nuevo_modulo/repository.py` — Acceso a datos
- `backend/nuevo_modulo/model.py` — Entidades SQLModel

### Cambios en Services
- `ProductoService.create()` — Ahora valida stock mínimo

### Cambios en Database

#### Tabla nueva: `tabla_nueva`
```sql
CREATE TABLE tabla_nueva (
  id SERIAL PRIMARY KEY,
  campo1 VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW(),
  eliminado_en TIMESTAMP,
  CONSTRAINT uq_tabla_nueva_campo1 UNIQUE (campo1)
);

CREATE INDEX idx_tabla_nueva_eliminado_en 
  ON tabla_nueva(eliminado_en);
```

#### Alter Table
- `productos` — Agregar columna `nuevo_campo TEXT DEFAULT ''`

## Cambios en Frontend

### Nuevos Componentes (FSD)
- `src/features/NuevaFeature/` — Feature wrapper
- `src/widgets/NuevoWidget/` — Composición de features
- `src/entities/NuevaEntidad/` — Modelo de dominio

### State Management
- **Zustand**: Agregar `useCartStore` para estado local
- **TanStack Query**: Query `GET /api/v1/productos?categoria=X`

### Cambios en Layouts
- `src/app/Layout.tsx` — Agregar nueva ruta

## Flujo de Datos

```
USER → UI Component
         ↓
       Hook (useProducts)
         ↓
       TanStack Query
         ↓
       Axios Interceptor (auth)
         ↓
       Backend Router → Service → Repository
         ↓
       PostgreSQL
```

## Decisiones Arquitectónicas

### Decisión 1: Usar Snapshot en Pedidos
**Problema**: Precios cambian, dirección cambia, pero orden histórica debe ser inmutable  
**Solución**: Copiar estado actual a snapshot al crear pedido  
**Trade-off**: +Storage, -Query complexity

### Decisión 2: Zustand vs Redux
**Problema**: Necesitamos state management para carrito  
**Solución**: Zustand (API minimalista, mejor performance)  
**Trade-off**: Comunidad más pequeña vs Redux

## Performance

- Query `GET /api/v1/productos` usa índice en `categoria_id`
- Frontend caching: 5 minutos en TanStack Query
- N+1 Prevention: Usar eager loading en Repository

## Seguridad

- Rol ADMIN requerido para crear usuarios
- Rate limit: 5 intentos login/15 minutos
- Contraseña hasheada con bcrypt

## Testing Strategy

### Unit Tests
- `test_crear_usuario.py` — Service layer
- `test_producto_repository.py` — Repository

### Integration Tests
- `test_crear_pedido_completo.py` — End-to-end UoW

### E2E Tests (Frontend)
- Agregar producto al carrito y checkear state

## Documentación a Actualizar
- `backend/README.md` — Nuevos endpoints
- `docs/API.md` — OpenAPI spec
- `docs/ARCHITECTURE.md` — Decisiones

## Riesgos y Mitigación

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|-----------|
| Transacción larga | Bloqueo | Media | Usar índices, limit queries |
| Race condition | Data loss | Baja | UoW + transacciones explícitas |
```

**Máximo**: 3-5 páginas

---

## ✅ Estructura de Tasks

**Archivo**: `openspec/changes/{change-name}/tasks.md`

### Formato

```markdown
# Tasks: {nombre-descriptivo}

## Resumen
[1 párrafo: desglose general, estimado total de horas]

## Jerarquía de Tasks

### Fase 1: Setup e Infraestructura

#### 1.1 Crear migración Alembic
**Estimado**: 30 min
**Descripción**: Generar migración para nueva tabla `productos_categoria`
**Done**: 
- [ ] `alembic/versions/XXX_create_productos_categoria.py` existe
- [ ] `alembic upgrade head` funciona sin errores
- [ ] `alembic downgrade -1` reversa cambios correctamente
**Commit**: `feat(db): create productos_categoria migration`

#### 1.2 Definir modelos SQLModel
**Estimado**: 45 min
**Prerequisito**: 1.1 completado
**Descripción**: Crear clases ProductoCategoria y ProductoCategoriaRepository
**Done**:
- [ ] `backend/productos/model.py` tiene clase `ProductoCategoria`
- [ ] Relaciones bidireccionales configuradas
- [ ] Type hints completos
- [ ] Soft delete filter en queries
**Commit**: `feat(models): add ProductoCategoria model`

### Fase 2: Implementación Backend

#### 2.1 Crear servicio ProductoCategoria
**Estimado**: 1 hora
**Prerequisito**: 1.2 completado
**Descripción**: Implementar lógica de crear, listar, actualizar relación
**Done**:
- [ ] `backend/productos/service.py` tiene `ProductoCategoriaService`
- [ ] Métodos: `asignar_categoria`, `remover_categoria`, `listar_por_producto`
- [ ] Validaciones: producto existe, categoría existe
- [ ] Tests unitarios en `backend/tests/test_producto_service.py`
- [ ] Coverage > 80%
**Commit**: `feat(service): implement ProductoCategoriaService`

#### 2.2 Crear endpoints
**Estimado**: 1 hora
**Prerequisito**: 2.1 completado
**Descripción**: POST/DELETE endpoints para asignar/remover categorías
**Done**:
- [ ] `backend/productos/router.py` tiene endpoints
- [ ] POST `/api/v1/productos/{id}/categorias` — asignar
- [ ] DELETE `/api/v1/productos/{id}/categorias/{cat_id}` — remover
- [ ] Validaciones de rol (STOCK, ADMIN)
- [ ] Schemas Pydantic definidos
- [ ] Swagger docs auto-generada
**Commit**: `feat(api): add product category endpoints`

### Fase 3: Implementación Frontend

#### 3.1 Crear hook `useProductCategories`
**Estimado**: 45 min
**Prerequisito**: 2.2 completado
**Descripción**: Hook para query/mutation de categorías
**Done**:
- [ ] `src/entities/Producto/hooks/useProductCategories.ts`
- [ ] Usa TanStack Query + Axios
- [ ] Mutations: `useMutateProductCategories`
- [ ] Queries: `useProductCategories`
**Commit**: `feat(hooks): add useProductCategories`

#### 3.2 Crear componente `CategorySelector`
**Estimado**: 1 hora
**Prerequisito**: 3.1 completado
**Descripción**: Widget para seleccionar/deseleccionar categorías
**Done**:
- [ ] `src/widgets/CategorySelector/CategorySelector.tsx`
- [ ] Multi-select UI con Tailwind
- [ ] Integración con hook
- [ ] Tests con React Testing Library
**Commit**: `feat(ui): add CategorySelector component`

### Fase 4: Testing e Integración

#### 4.1 Tests de integración backend
**Estimado**: 1 hora
**Prerequisito**: 2.2 completado
**Descripción**: End-to-end tests con BD real
**Done**:
- [ ] `backend/tests/test_producto_categoria_e2e.py`
- [ ] Test crear, listar, actualizar, eliminar
- [ ] Verificar soft delete
- [ ] Verificar transacciones UoW
**Commit**: `test(backend): add integration tests`

#### 4.2 Tests E2E frontend
**Estimado**: 45 min
**Prerequisito**: 3.2 completado
**Descripción**: Prueba flujo completo UI
**Done**:
- [ ] Frontend carga categorías correctamente
- [ ] Seleccionar/deseleccionar categoría muestra feedback
- [ ] Error handling visible al usuario
**Commit**: `test(frontend): add E2E category assignment`

### Fase 5: Documentación

#### 5.1 Actualizar README y API docs
**Estimado**: 30 min
**Prerequisito**: 4.2 completado
**Descripción**: Documentar nuevos endpoints y cambios
**Done**:
- [ ] `backend/README.md` updated con endpoints nuevos
- [ ] Ejemplos curl/Postman
- [ ] Swagger docs en `http://localhost:8000/docs`
**Commit**: `docs(api): update ProductoCategoria documentation`

## Resumen de Commits

```bash
git log --oneline
# feat(db): create productos_categoria migration
# feat(models): add ProductoCategoria model
# feat(service): implement ProductoCategoriaService
# feat(api): add product category endpoints
# feat(hooks): add useProductCategories
# feat(ui): add CategorySelector component
# test(backend): add integration tests
# test(frontend): add E2E category assignment
# docs(api): update ProductoCategoria documentation
```

## Estimación Total
**1 persona**: ~7 horas (realista: 8-9 con debugging)
**2 personas**: Backend (3.5h) + Frontend (3.5h) en paralelo

## Riesgos
- Migración Alembic falla en downgrade → revisar reversión manual
- Type errors en TypeScript → verificar tipos antes de compilar
- Race conditions en tests → usar transacciones de test
```

**Máximo**: 2 horas por task (idealmente 1 hora)

---

## 🎓 Ejemplos Completos

### Scenario GIVEN/WHEN/THEN

```
**Scenario**: Admin cambia estado de pedido a "En preparación"

GIVEN    existe un pedido en estado CONFIRMADO
AND      el usuario actual tiene rol PEDIDOS
AND      el pedido contiene 2 ítems válidos

WHEN     hace PATCH /api/v1/pedidos/{id}/avanzar
AND      proporciona observación "Comenzar preparación"

THEN     respuesta 200 OK
AND      estado del pedido ahora es EN_PREPARACIÓN
AND      se agrega entrada en HistorialEstadoPedido
AND      historial contiene timestamp, usuario y observación
AND      email de notificación se envía al cliente
```

### Task Done Criteria

```
**Done**: 
- [ ] Archivo existe en ubicación correcta
- [ ] Type hints completos (Python) / TypeScript estricto
- [ ] Tests unitarios pasan con coverage > 80%
- [ ] Linter sin warnings (pylint score > 8.0 / ESLint 0 errors)
- [ ] Manual testing: QA valida happy path
- [ ] Code review: 1+ aprobaciones
- [ ] Commit squashed con mensaje convencional
```

---

**Versión**: 1.0  
**Última actualización**: Mayo 8, 2026  
**Responsable**: SDD Orchestrator  
**Idioma**: Español
