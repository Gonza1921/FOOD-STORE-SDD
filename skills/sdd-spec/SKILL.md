# Skill: sdd-spec

## Propósito

Escribir especificaciones detalladas y testables basadas en propuestas. El agente Specifier traduce intención en requirements concretos usando RFC 2119 keywords, scenarios GIVEN/WHEN/THEN, y criterios de aceptación verificables.

**Cuándo usar**: Después de que la propuesta está aprobada, antes de diseño técnico. Specs son la fuente de verdad para implementación y verificación.

---

## 🎯 Responsabilidades

1. **Lectura y Comprensión de Propuesta**
   - Leer `{change}/proposal.md` completamente
   - Extraer: intención, scope, complejidad, riesgos
   - Clarificar ambigüedades si las hay (preguntar al usuario)

2. **Definición de Requirements**
   - Escribir requirements funcionales numerados (RF-001, RF-002, etc.)
   - Usar RFC 2119: MUST, SHALL, SHOULD, MAY, MUST NOT
   - Cada requirement debe ser verificable y testeable
   - Incluir casos de error y edge cases

3. **Creación de Scenarios**
   - Mínimo 3 scenarios por change (happy path, errors, edge cases)
   - Formato GIVEN/WHEN/THEN estricto
   - Incluir AND para pasos o condiciones adicionales
   - Cada scenario independiente y completo

4. **Especificación de Interfaces**
   - API endpoints: método, path, parámetros, respuestas (200, 400, 401, 403, 404, 500)
   - Backend schemas: tipos, validaciones, restricciones
   - Frontend hooks: inputs, outputs, side effects
   - Database changes: tablas nuevas, columnas, índices, constraints

5. **Documentación de Aceptación**
   - Criterios de aceptación claros y objetivos
   - Definir "hecho": pruebas, cobertura, linting
   - Incluir consideraciones de performance, seguridad, accesibilidad

---

## 📋 Reglas

### Estructura y Formato
- ✅ Archivo: `openspec/changes/{change}/specs.md`
- ✅ Título: "Especificaciones: {nombre}"
- ✅ Secciones obligatorias: Resumen, Términos, RF-XXX, Scenarios, No-Funcionales, Definición de Hecho
- ✅ Markdown limpio, tablas para comparaciones
- ✅ Máximo: 1-2 páginas por RF (síntesis clara)
- ❌ NO incluir detalles de implementación
- ❌ NO mencionar módulos específicos (eso es Design)

### Requirements Funcionales (RF)
- ✅ Numeración: RF-001, RF-002, RF-003, etc.
- ✅ Tipo: **MUST** (obligatorio) | **SHOULD** (recomendado) | **MAY** (opcional)
- ✅ Descripción clara: "El sistema MUST X" no "El usuario puede X"
- ✅ Verificable: "debe retornar HTTP 200 con estructura JSON" (sí) vs. "debe funcionar bien" (no)
- ✅ Específico: "máximo 5 intentos cada 15 minutos" vs. "debe tener protección"
- ❌ NO incluir cómo implementar, solo QUÉ hacer

### Scenarios GIVEN/WHEN/THEN
- ✅ Formato estricto:
  ```
  **Scenario**: {Nombre descriptivo}
  
  GIVEN {Condición inicial}
  WHEN {Acción}
  THEN {Resultado esperado}
  ```
- ✅ Pueden tener múltiples GIVEN, WHEN, THEN y AND
- ✅ Incluir escenarios de error con código HTTP y mensaje
- ✅ Cada scenario es completo e independiente
- ✅ Mínimo 3 scenarios (happy path, error 1, error 2 o edge case)
- ✅ Usar datos reales cuando sea posible (nombres, IDs, etc.)
- ❌ NO usar lógica compleja en scenarios (deben ser simples)
- ❌ NO mezclar múltiples feature en un scenario

### Definición de Hecho
- ✅ Done criteria específico, objetivo, verificable
- ✅ Incluir: tests (80%+ coverage), linter (0 errors), type check, manual test
- ✅ Especificar si hay cambios en DB, frontend, API
- ✅ Mención de documentación a actualizar
- ❌ NO dejar done criteria ambiguo

### Stack Específico
- ✅ Entender React + TypeScript: hooks, components, state
- ✅ Entender FastAPI + SQLModel: endpoints, schemas, dependency injection
- ✅ Entender PostgreSQL: relaciones, constraints, índices
- ✅ Considerar RBAC: roles requeridos (ADMIN, STOCK, PEDIDOS, CLIENT)
- ✅ Considerar patterns: Unit of Work, soft delete, snapshots
- ✅ Usar tipos Pydantic/TypeScript en schemas
- ❌ NO escribir código, solo especificar tipos y estructuras

### Idioma
- ✅ Toda documentación en ESPAÑOL
- ✅ Keywords GIVEN/WHEN/THEN en inglés (formato estándar)
- ✅ HTTP métodos y códigos en inglés (estándar)
- ❌ NO mezclar español e inglés en descripciones

---

## 📝 Estructura de Spec Completa

```markdown
# Especificaciones: {nombre-descriptivo}

## Resumen Ejecutivo
[1 párrafo: qué se especifica, por qué importa, quién se beneficia]

## Términos y Definiciones
- **Término 1**: Definición clara, sin ambigüedad
- **Token JWT**: Estructura base64 en tres partes (header.payload.signature)

## Requisitos Funcionales

### RF-001: Descripción del requisito
**Tipo**: MUST | SHOULD | MAY
**Descripción**: El sistema MUST [acción] bajo [condiciones]
**Criterios de Aceptación**:
- [ ] Sub-criterio 1
- [ ] Sub-criterio 2
- [ ] Sub-criterio 3

## Scenarios

### Scenario: {Nombre descriptivo}
**Scope**: Backend | Frontend | Full-stack

**GIVEN** {Condición inicial 1}
**AND** {Condición inicial 2}
**WHEN** {Acción}
**AND** {Acción adicional}
**THEN** {Resultado esperado}
**AND** {Resultado adicional}

#### Error Case: {Descripción del error}
**GIVEN** {Condición de error}
**WHEN** {Acción que causa error}
**THEN** HTTP 400: "Mensaje claro del error"

## API Specification (si aplica)

### POST /api/v1/endpoint
**Autenticación**: Bearer token requerido
**Roles**: [ADMIN | STOCK | PEDIDOS | CLIENT]
**Rate Limit**: No aplicable | 5 requests/minute

**Request Body**:
```json
{
  "campo1": "string (requerido, 1-255 chars)",
  "campo2": "integer (positivo)"
}
```

**Response 200 OK**:
```json
{
  "id": "integer",
  "status": "success"
}
```

**Response 400 Bad Request**:
```json
{
  "type": "validation_error",
  "detail": "Campo1 es requerido"
}
```

## Schemas de Datos

### Backend (Pydantic)
```python
class CreateProductRequest(BaseModel):
    """Crear nuevo producto"""
    nombre: str  # Min 1, Max 255, unique
    precio: Decimal  # > 0, precision 10,2
    stock: int  # >= 0
    categoria_ids: List[int]  # Mínimo 1
```

### Frontend (TypeScript)
```typescript
interface Product {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  disponible: boolean;
}
```

## Cambios en Base de Datos

### Tablas Nuevas
- `tabla_nueva` (descripción breve)

### Columnas Nuevas
- `productos.nuevo_campo` (tipo, nullable, default)

### Índices
- `idx_productos_categoria_id` (para performance en queries)

## Requisitos No-Funcionales

- **Performance**: Endpoint debe responder en < 200ms (p95)
- **Seguridad**: Validar rol ADMIN, sin SQL injection
- **Compatibilidad**: TypeScript 5.0+, Python 3.11+
- **Accesibilidad**: WCAG 2.1 AA si frontend

## Integración con Sistemas Externos

- **MercadoPago**: Crear orden usando Checkout API
- **Email**: Notificar al usuario post-acción

## Definición de Hecho (Done Criteria)

### Backend
- [ ] Código implementado siguiendo spec exactamente
- [ ] Tests unitarios: 80%+ coverage en servicios críticos
- [ ] Tests integración: end-to-end con BD real
- [ ] Linter sin errores: pylint score >= 8.0
- [ ] Type checking: mypy sin errores
- [ ] Documentación actualizada en README

### Frontend
- [ ] Componentes implementados según spec
- [ ] Tests: React Testing Library, 80%+ coverage
- [ ] TypeScript: strict mode, sin `any`
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: formateado correctamente

### General
- [ ] PR review: 1+ aprobaciones
- [ ] Código mergeado a develop
- [ ] Cambio archivado en `openspec/archive/`
```

---

## 🔍 Proceso de Especificación

### 1. Leer Propuesta
```
Lee {change}/proposal.md:
- ¿Cuál es la intención?
- ¿Cuál es el scope?
- ¿Qué módulos afecta?
- ¿Cuál es la complejidad?
```

### 2. Identificar Requirements
```
Mínimo 3 RF:
- RF-001: Flujo principal (happy path)
- RF-002: Validación de entrada
- RF-003: Manejo de errores
```

### 3. Crear Scenarios
```
Estructura:
1. Scenario: Happy path (flujo principal)
2. Scenario: Error case (validación falla)
3. Scenario: Edge case (condición especial)
```

### 4. Especificar Interfaces
```
Si es backend:
- Endpoints (verb, path, params, responses)
- Schemas (tipos, validaciones)
- Status codes (200, 400, 401, 403, 404)

Si es frontend:
- Hooks (inputs, outputs, side effects)
- Components (props, state)
```

### 5. Definir Done Criteria
```
Cada item debe ser verificable:
❌ "Tests deben pasar"
✅ "80%+ coverage en servicios críticos"
```

---

## 📤 Resultados Esperados

### Spec Exitosa
- [x] Archivo: `openspec/changes/{change}/specs.md`
- [x] RFC 2119 keywords presentes (MUST, SHOULD, MAY)
- [x] Mínimo 3 scenarios GIVEN/WHEN/THEN
- [x] Casos de error con código HTTP
- [x] Inputs/outputs claros (tipos)
- [x] Done criteria verificables
- [x] Máximo 2 páginas por RF
- [x] Español, sin detalles de implementación

### Checklist de Calidad
- [x] ¿Cada RF es verificable? (sí = testeable)
- [x] ¿Cada scenario es independiente? (sí = se puede ejecutar por separado)
- [x] ¿Hay casos de error documentados? (sí = 400, 401, 403, 500)
- [x] ¿Se consideró RBAC? (sí = roles especificados)
- [x] ¿Se definió "hecho"? (sí = done criteria claro)

---

## 🎓 Ejemplos

### Ejemplo 1: Spec Mínima (Feature Simple)
```markdown
# Especificaciones: Logout de Usuario

## Resumen
Permitir que usuarios autenticados cierren sesión revocando su refresh token.

## Requisitos Funcionales

### RF-001: Revocar refresh token
**MUST** marcar refresh token como revocado en BD
- El access token existente expira naturalmente (no requiere invalidación)
- Frontend elimina tokens de localStorage
- Usuario es redirigido a login

## Scenarios

**Scenario**: Logout exitoso
**GIVEN** usuario autenticado con refresh token activo
**WHEN** POST /api/v1/auth/logout {"refresh_token": "..."}
**THEN** HTTP 204 No Content
**AND** refresh token está marcado como revocado en BD

## API

### POST /api/v1/auth/logout
Request: `{"refresh_token": "uuid-string"}`
Response: 204 No Content (o 200 OK con `{"status": "success"}`)

## Done Criteria
- [ ] Endpoint implementado
- [ ] Tests: logout marca token como revocado
- [ ] Verificación: token revocado no permite refresh
```

### Ejemplo 2: Spec Compleja (Feature con Múltiples Casos)
```markdown
# Especificaciones: Creación de Pedido

## Requisitos Funcionales

### RF-001: Crear pedido en estado PENDIENTE
**MUST** crear registro en tabla Pedido
**MUST** validar que usuario existe y está activo
**MUST** validar que dirección pertenece al usuario
**MUST** validar que todos los productos existen y están disponibles
**MUST** validar stock suficiente para cada ítem
**MUST** crear snapshots de precio para cada detalle
**MUST** calcular totales (subtotal + envío)

### RF-002: Validar entrada
**MUST** retornar HTTP 400 si items está vacío
**MUST** retornar HTTP 400 si cantidad < 1
**MUST** retornar HTTP 404 si producto no existe
**MUST** retornar HTTP 400 si stock insuficiente con mensaje: "Stock insuficiente para {producto}: disponible {X}"

## Scenarios

**Scenario**: Crear pedido exitosamente
**GIVEN** usuario autenticado con rol CLIENT
**AND** existe dirección perteneciente al usuario
**AND** existen productos con stock suficiente
**WHEN** POST /api/v1/pedidos
  - items: [{producto_id: 1, cantidad: 2}, ...]
  - direccion_id: 5
  - forma_pago_id: 1
**THEN** HTTP 201 Created
**AND** respuesta contiene pedido con id, estado: PENDIENTE, total
**AND** HistorialEstadoPedido tiene entrada inicial
**AND** stock no se decrementa (se decrementa en confirmación)

**Scenario**: Stock insuficiente
**GIVEN** producto tiene 1 unidad
**WHEN** usuario intenta crear pedido con cantidad: 2
**THEN** HTTP 400
**AND** mensaje: "Stock insuficiente para {producto}: disponible 1"
**AND** pedido NO se crea (transacción rollback)

## Done Criteria
- [ ] Service layer crea pedido atómicamente (UoW)
- [ ] Todos los campos snapshot se populan correctamente
- [ ] Tests: 80%+ coverage en PedidoService
- [ ] Verificación manual: crear pedido exitoso y errores
```

---

## 🚫 Anti-Patrones

❌ **NO HAGAS**:
- Escribir code, solo specificar Q录 hacer
- Asumir detalles de implementación
- Crear requirements vagas ("debe funcionar bien")
- Scenarios con múltiples features (un scenario = una cosa)
- Done criteria que no sean verificables
- Incluir módulos específicos o arquitectura (eso es Design)
- Scenarios sin casos de error
- Specs > 2 páginas por RF (es demasiado)

---

## 📚 Referencias

- `AGENTS.md` — Contexto del proyecto
- `openspec/config.yaml` — Reglas SDD
- `docs/Historias_de_usuario.txt` — User stories (para contexto)
- `openspec/CONVENTIONS.md` — Estándares de spec
- `openspec/archive/` — Ejemplos completados

---

## 🔗 Integración con Workflow SDD

```
/sdd-spec  (después de propuesta aprobada)
      ↓
[Specifier crea specs.md]
      ↓
Specs con RF-XXX y scenarios
      ↓
/sdd-design  ← Siguiente fase
```

---

**Versión**: 1.0  
**Última actualización**: Mayo 8, 2026  
**Responsable**: SDD Specifier Agent  
**Idioma**: Español (GIVEN/WHEN/THEN en inglés)
