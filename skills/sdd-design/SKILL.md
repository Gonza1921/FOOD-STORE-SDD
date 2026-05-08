# Skill: sdd-design

## Propósito

Crear diseño técnico detallado que traduce especificaciones en arquitectura implementable. El agente Designer documenta capas afectadas, cambios de datos, flujos de componentes, decisiones arquitectónicas y trade-offs.

**Cuándo usar**: Después de que specs están aprobadas, antes de desglosar en tasks. Design es el blueprint para implementación.

---

## 🎯 Responsabilidades

1. **Lectura de Propuesta y Specs**
   - Leer `{change}/proposal.md` y `{change}/specs.md`
   - Extraer: intención, requirements funcionales, scenarios
   - Entender contexto, complejidad, riesgos

2. **Análisis de Arquitectura**
   - Identificar capas afectadas (backend: Router → Service → Repository → Model)
   - Identificar capas frontend (frontend: pages → widgets → features → entities → shared)
   - Mapear flujo de datos entre capas
   - Considerar patrones existentes (UoW, soft delete, snapshots, FSM)

3. **Especificación de Cambios Técnicos**
   - Tablas nuevas/modificadas con columnas, tipos, constraints, índices
   - Nuevos módulos/servicios/hooks con responsabilidades
   - Modificaciones en modelos SQLModel / TypeScript interfaces
   - Schemas Pydantic / tipos TypeScript

4. **Justificación de Decisiones**
   - Explicar por qué cada decisión (no solo QUÉ, sino POR QUÉ)
   - Listar trade-offs explícitamente
   - Considerar performance, seguridad, mantenibilidad
   - Comparar alternativas descartadas

5. **Documentación de Flujos**
   - Secuencias de componentes (quién llama a quién)
   - Flujo de datos (de frontend a backend y BD)
   - Manejo de errores y edge cases
   - Transacciones críticas (atomicidad)

---

## 📋 Reglas

### Estructura y Formato
- ✅ Archivo: `openspec/changes/{change}/design.md`
- ✅ Título: "Diseño Técnico: {nombre}"
- ✅ Secciones: Resumen, Arquitectura, Cambios Backend, Cambios Frontend, Flujo, Decisiones, Performance, Seguridad, Riesgos
- ✅ Diagramas ASCII si es complejo (opcional pero recomendado)
- ✅ Tablas para comparar opciones, cambios en BD
- ✅ Código de ejemplo (sin implementación, solo estructura)
- ✅ Máximo 3-5 páginas
- ❌ NO incluir código funcional (eso es para Apply)
- ❌ NO especificar módulos como "crea en backend/auth/router.py" (demasiado específico para design)

### Capas Backend
- ✅ Identificar si afecta Router (endpoints nuevos)
- ✅ Identificar si afecta Service (lógica de negocio)
- ✅ Identificar si afecta Repository (queries nuevas)
- ✅ Identificar si afecta Model (entidades nuevas)
- ✅ Considerar Unit of Work (transacciones atómicas)
- ✅ Especificar cambios en cada capa
- ❌ NO saltear capas (siempre flujo unidireccional)

### Capas Frontend (FSD)
- ✅ Identificar si nuevo en app (providers, global config)
- ✅ Identificar si nuevo en pages (rutas)
- ✅ Identificar si nuevo en widgets (composiciones)
- ✅ Identificar si nuevo en features (interacciones)
- ✅ Identificar si nuevo en entities (modelos)
- ✅ Identificar si nuevo en shared (componentes genéricos)
- ✅ Especificar relaciones Zustand vs TanStack Query
- ❌ NO importar hacia arriba (solo hacia abajo)

### Cambios en Base de Datos
- ✅ Tablas nuevas con: name, descripción, columnas (tipo, nullable, default, constraints)
- ✅ Columnas nuevas con: tabla, nombre, tipo, nullable, default
- ✅ Índices con: nombre, tabla, columnas, razón (performance)
- ✅ Constraints con: tipo (FK, UNIQUE, CHECK), columnas
- ✅ Migraciones: especificar si upgrade/downgrade funcionan
- ✅ Considerar soft delete: ¿nueva tabla necesita `eliminado_en`?
- ✅ Considerar snapshots: ¿necesita copia de datos en pedidos?
- ❌ NO especificar SQL exacto (eso es para Apply)

### Decisiones Arquitectónicas
- ✅ Formato: Decisión, Problema, Solución, Rationale, Trade-off
- ✅ Comparar alternativas descartadas
- ✅ Justificar por qué la solución elegida es mejor
- ✅ Documentar impacto en performance, seguridad, mantenibilidad
- ✅ Considerar convenciones del proyecto (patterns, naming)
- ❌ NO ser impreciso ("mejora performance")
- ❌ NO omitir trade-offs

### Stack Específico
- ✅ Backend: capas unidireccionales, UoW, soft delete, FSM, RBAC
- ✅ Frontend: FSD, Zustand (client state), TanStack Query (server state)
- ✅ Database: PostgreSQL, 3NF, soft delete, snapshots, audit trails
- ✅ Patrones: Repository, Dependency Injection, Feature-First
- ✅ Seguridad: RBAC checks, input validation, type safety
- ❌ NO introducir nuevos patrones sin justificación

### Idioma
- ✅ Español: toda documentación
- ✅ Inglés: nombres de archivos, clases, funciones (en ejemplos)
- ✅ RFC/estándares: HTTP, SQL, TypeScript (en inglés)
- ❌ NO mezclar innecesariamente

---

## 📐 Estructura de Design Completo

```markdown
# Diseño Técnico: {nombre}

## Resumen
[2-3 párrafos: cómo se soluciona el problema, arquitectura general, por qué este enfoque]

## Arquitectura General

### Diagrama de Capas
```
Frontend (React + TypeScript)
  pages/ → widgets/ → features/ → entities/ → shared/
  ↓ (API call via Axios)
Backend (FastAPI + SQLModel)
  Router → Service → UoW → Repository → Model
  ↓
Database (PostgreSQL)
  Tables, Indices, Constraints
```

### Flujo de Datos
[1 párrafo describiendo cómo fluye datos: usuario → frontend → API → backend → BD]

## Cambios en Backend

### Nuevos Módulos/Servicios
- `{modulo}/router.py` — Endpoints HTTP
- `{modulo}/service.py` — Lógica de negocio
- `{modulo}/repository.py` — Acceso a datos
- `{modulo}/model.py` — Entidades SQLModel

### Cambios en Servicios Existentes
- `ProductService.nueva_operación()` — Qué hace, parámetros, retorna
- Modificaciones a servicios existentes

### Schemas Pydantic
```python
class CreateProductRequest(BaseModel):
    """Crear nuevo producto"""
    nombre: str  # Min 1, Max 255
    precio: Decimal  # > 0
    stock: int  # >= 0
```

## Cambios en Frontend

### Nuevos Componentes (FSD)
- `pages/NuevaPage/` — Nueva página/ruta
- `widgets/NuevoWidget/` — Composición de features
- `features/NuevaFeature/` — Interacción de usuario
- `entities/NuevaEntidad/` — Modelo de dominio

### Nuevos Hooks
- `useNuevaFeature()` — Hook personalizado (qué hace)
- Usa TanStack Query para servidor o Zustand para cliente

### Cambios en State Management
- **Zustand**: agregar store `useAuthStore`, `useCartStore`
- **TanStack Query**: agregar queries `useProducts`, `usePedidos`

### Cambios en Routing
- Nueva ruta: `/nueva-pagina` → `NuevaPage` component

## Cambios en Base de Datos

### Tabla Nueva: `tabla_nueva`
```
Descripción: Propósito de la tabla

Columnas:
- id (SERIAL PRIMARY KEY)
- campo1 (VARCHAR 255 NOT NULL)
- campo2 (INTEGER DEFAULT 0)
- creado_en (TIMESTAMP DEFAULT NOW())
- actualizado_en (TIMESTAMP DEFAULT NOW())
- eliminado_en (TIMESTAMP NULL) — soft delete

Constraints:
- UNIQUE(campo1)
- FK(tabla_nueva.otro_id → tabla_existe.id)

Índices:
- idx_tabla_nueva_campo1 (búsqueda frecuente)
- idx_tabla_nueva_eliminado_en (filtro soft delete)
```

### Columnas Nuevas
- `productos.nuevo_campo` (VARCHAR 255, DEFAULT '', NOT NULL)
  - Razón: [qué valor proporciona]

### Cambios en Constraints
- Agregar FK: `pedidos.nuevo_id → nueva_tabla.id`

## Flujos de Interacción

### Flujo 1: Crear Producto
```
1. Usuario completa form en UI (React component)
2. Valida con TanStack Form
3. POST /api/v1/productos con CreateProductRequest
4. Router recibe y valida schema
5. Service ejecuta lógica: validar campos, calcular X, etc.
6. UoW: inicia transacción
7. Repository: insert en DB
8. Commit automático
9. Response: 201 Created con producto
```

## Decisiones Arquitectónicas

### Decisión 1: Usar Zustand en lugar de Redux
**Problema**: Necesitamos state management para carrito
**Solución**: Zustand
**Rationale**: 
  - API minimalista, menos boilerplate
  - Better performance (suscripciones granulares)
  - Native localStorage persistence
**Trade-off**: 
  - Comunidad más pequeña que Redux
  - Documentación menos extensa

### Decisión 2: Snapshots en Pedidos
**Problema**: Precios cambian, dirección se modifica, pero pedido histórico debe ser inmutable
**Solución**: Copiar estado actual a snapshot al crear
**Rationale**: 
  - Garantiza datos correctos históricos
  - No rompe cálculos de antes
**Trade-off**: 
  - +Storage (copia de datos)
  - Queries ligeramente más complejas

## Performance

### Optimizaciones
- Query `GET /api/v1/productos` usa índice `idx_productos_categoria_id`
- Frontend caching: TanStack Query con 5 minutos stale time
- Eager loading en Repository para evitar N+1 queries
- Paginación con `skip` y `limit` en listados

### Consideraciones
- Endpoint debe responder < 200ms (p95)
- No usar cartesian products en JOINs
- Validar que índices estén creados en migraciones

## Seguridad

### Autenticación
- Requerido: JWT Bearer token en header
- Validado en Router via dependencia `get_current_user`

### Autorización (RBAC)
- Endpoint MUST validar rol: `require_role(["ADMIN", "STOCK"])`
- Si no tiene rol: HTTP 403 Forbidden

### Input Validation
- Pydantic valida tipos y restricciones
- SQL queries escapadas (SQLModel maneja)
- Frontend: validación adicional con TanStack Form

### Protección
- CORS configurado para `http://localhost:5173`
- HTTPS en producción
- Contraseñas hasheadas con bcrypt

## Riesgos y Mitigación

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|-----------|
| Race condition en stock | High | Medium | Usar transacciones UoW + LOCK |
| N+1 queries | Medium | High | Eager loading, índices |
| Falta de coverage | High | Low | Tests 80%+ coverage |

## Testing Strategy

### Unit Tests
- `test_service_logica.py` — Servicios
- `test_repository.py` — Queries

### Integration Tests
- `test_crear_pedido_completo.py` — End-to-end con BD real

### Frontend Tests
- Components con React Testing Library
- Hooks con useQuery/useMutation

## Documentación a Actualizar
- `backend/README.md` — Nuevos endpoints
- `docs/API.md` — OpenAPI spec
- `docs/ARCHITECTURE.md` — Decisiones

## Consideraciones de Migración
- Alembic migration: crear tabla nueva
- Downgrade: dropear tabla
- Verificar no hay datos importantes en rollback
```

---

## 🔍 Proceso de Diseño

### 1. Analizar Specs
```
Leer specs completamente:
- ¿Qué requirements funcionales hay?
- ¿Cuántos scenarios?
- ¿Afecta frontend, backend, BD?
```

### 2. Mapear Capas
```
Backend:
- ¿Nuevos endpoints? → Router
- ¿Nueva lógica? → Service
- ¿Nuevas queries? → Repository
- ¿Nuevas entidades? → Model

Frontend:
- ¿Nueva página? → pages/
- ¿Nueva composición? → widgets/
- ¿Nueva interacción? → features/
- ¿Nuevo modelo? → entities/
```

### 3. Especificar Cambios en BD
```
¿Se necesita:
- Tabla nueva?
- Columnas nuevas?
- Índices?
- Constraints?
- Soft delete?
- Snapshots?
```

### 4. Diseñar Flujos
```
Ejemplo: Crear Pedido
Usuario → Form → Validación → API Call → Router → Service → UoW → Repository → DB
```

### 5. Justificar Decisiones
```
Para cada decisión importante:
- Problema que resuelve
- Alternativas consideradas
- Por qué esta solución
- Trade-offs explícitos
```

---

## 📤 Resultados Esperados

### Design Exitosa
- [x] Archivo: `openspec/changes/{change}/design.md`
- [x] Capas identificadas: backend (Router/Service/Repository/Model), frontend (FSD)
- [x] Cambios en BD documentados (tablas, columnas, índices)
- [x] Decisiones justificadas con trade-offs
- [x] Flujos de datos claros (quién llama a quién)
- [x] Performance y seguridad considerados
- [x] Riesgos identificados y mitigación
- [x] Máximo 3-5 páginas
- [x] Español, diagrama ASCII opcional

### Checklist de Calidad
- [x] ¿Cada cambio está justificado? (sí = tiene razón de ser)
- [x] ¿Se consideraron alternativas? (sí = trade-offs explícitos)
- [x] ¿La arquitectura sigue patrones del proyecto? (sí = coherente)
- [x] ¿Se consideró performance y seguridad? (sí = explícito)
- [x] ¿Los flujos son claros? (sí = sin ambigüedad)

---

## 🎓 Ejemplos

### Ejemplo 1: Design Simple (Login)
```markdown
# Diseño Técnico: Autenticación JWT

## Resumen
Implementar autenticación con JWT dual-token: access (30m) + refresh (7d).
Usuario login → sistema genera tokens → guarda refresh en BD → devuelve ambos.

## Cambios Backend

### Router
- POST /auth/login — recibe email/password
- POST /auth/refresh — recibe refresh token
- POST /auth/logout — revoca refresh token

### Service
- LoginService.authenticate(email, password) — verifica credenciales
- TokenService.generate_tokens(user_id) — crea JWT + UUID refresh

### Model
- RefreshToken — tabla nueva con: id, user_id, token, expires_at, revoked_at

### Schema
- LoginRequest: {email, password}
- TokenResponse: {access_token, refresh_token, token_type, user}

## Performance
- Lookup usuario por email usa índice
- Query refresh token es O(1) por token (UK en token)

## Seguridad
- Contraseña validada contra bcrypt hash
- JWT firmado con HS256
- Rate limit: 5 intentos/15 minutos en login
```

### Ejemplo 2: Design Compleja (Pedidos)
```markdown
# Diseño Técnico: Sistema de Pedidos

## Resumen
Sistema completo de ciclo de vida de pedidos:
- Cliente crea pedido (PENDIENTE)
- Pago confirmado automáticamente (PENDIENTE → CONFIRMADO)
- Gestor avanza estados (EN_PREPARACIÓN → EN_CAMINO → ENTREGADO)
- Snapshots garantizan datos históricos correctos

## Cambios Backend

### Router
- POST /pedidos — crear pedido
- GET /pedidos — listar (filtrar por usuario si CLIENT)
- PATCH /pedidos/{id}/avanzar — cambiar estado
- PATCH /pedidos/{id}/cancelar — cancelar

### Service
- PedidoService.crear(usuario, items, direccion, forma_pago)
  - Valida usuario, dirección, productos, stock
  - Crea snapshots de precios
  - Crea pedido + detalles + historial
  - Transacción atómica (UoW)
- PedidoService.avanzar_estado(pedido_id, nuevo_estado)
  - Valida FSM: transición permitida
  - Si CONFIRMADO: decrementa stock (atómico)
  - Registra en HistorialEstadoPedido

### Repository
- listar_por_usuario(usuario_id) — queries con índices
- listar_por_estado(estado_id) — queries con índices
- decrementar_stock(producto_id, cantidad) — UPDATE atómico

### Model
- Pedido (nueva tabla)
- DetallePedido (nueva tabla)
- HistorialEstadoPedido (nueva tabla, audit trail)
- Pago (nueva tabla, integración MercadoPago)

## Cambios Frontend

### Pages
- pages/Pedidos/ — listado y detalle de pedidos (rol: PEDIDOS)

### Features
- features/CrearPedido/ — flujo de creación (rol: CLIENT)
- features/AvanzarEstadoPedido/ — cambiar estado (rol: PEDIDOS)

### Entities
- entities/Pedido/ — modelo y tipos
- entities/DetallePedido/ — modelo y tipos

### State Management
- Zustand: `useCheckoutStore` (carrito → pedido)
- TanStack Query: `usePedidos`, `usePedidoDetail`

## Cambios en BD

### Tabla Pedido
- id, usuario_id (FK), estado_id (FK), direccion_id (FK), forma_pago_id (FK)
- total, costo_envio
- snapshots: direccion_snapshot, forma_pago_snapshot
- creado_en, actualizado_en, eliminado_en

### Tabla DetallePedido
- id, pedido_id (FK), producto_id (FK)
- cantidad, precio_unitario (snapshot), subtotal
- personalizacion (array de IDs de ingredientes a excluir)

### Tabla HistorialEstadoPedido
- id, pedido_id (FK), estado_anterior_id, estado_nuevo_id, usuario_id (nullable)
- observacion, creado_en
- Append-only (solo INSERT, nunca UPDATE/DELETE)

## FSM: Transiciones de Pedidos
```
PENDIENTE --[pago aprobado]--> CONFIRMADO --[gestor inicia]--> EN_PREPARACIÓN
                                    ↓
                            [gestor despacha]
                                    ↓
                              EN_CAMINO
                                    ↓
                            [cliente recibe]
                                    ↓
                              ENTREGADO (terminal)

En cualquier momento:
  → CANCELADO (terminal)
     Si ya confirmado: restaurar stock
```

## Decisión: Snapshots en Pedidos
**Problema**: Precios y direcciones cambian en el sistema. Pedido histórico debe mostrar datos correctos.
**Solución**: Copiar precio actual y dirección al crear pedido
**Rationale**: Garantiza inmutabilidad de datos históricos
**Trade-off**: +Storage (copias de datos), queries ligeramente complejas

## Security

### RBAC
- CLIENT: crear pedidos, ver propios, cancelar propios si PENDIENTE
- PEDIDOS: ver todos, avanzar estado, cancelar (con restricciones)
- ADMIN: ver todos, avanzar, cancelar sin restricciones

### Validations
- Pydantic valida estructura
- Service valida negocio: stock, rol, transiciones FSM
- DB constraints: FK, UNIQUE, CHECK

## Performance
- Índices: idx_pedidos_usuario_id, idx_pedidos_estado_id
- Eager loading de detalles y snapshots
- Paginación en listados
```

---

## 🚫 Anti-Patrones

❌ **NO HAGAS**:
- Escribir código funcional (solo estructura)
- Omitir justificación de decisiones
- Mencionar archivos específicos como "create backend/auth/router.py"
- Diseños vagas sin detalles de BD o flujos
- Ignorar performance y seguridad
- Diseños > 5 páginas (demasiado detalle)
- Saltar consideraciones de RBAC o transacciones

---

## 📚 Referencias

- `AGENTS.md` — Arquitectura del proyecto
- `openspec/config.yaml` — Reglas SDD
- `docs/Integrador.txt` — Arquitectura técnica detallada
- `openspec/archive/` — Ejemplos completados

---

## 🔗 Integración con Workflow SDD

```
/sdd-design  (después de specs aprobadas)
      ↓
[Designer crea design.md]
      ↓
Diseño técnico con capas, flujos, decisiones
      ↓
/sdd-tasks  ← Siguiente fase
```

---

**Versión**: 1.0  
**Última actualización**: Mayo 8, 2026  
**Responsable**: SDD Designer Agent  
**Idioma**: Español
