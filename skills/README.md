# Skills Index — SDD Orchestrator

Documentación completa de las 6 skills especializadas del Sistema Orquestador de **Spec-Driven Development (SDD)** para FOOD STORE.

---

## 📚 Overview

Cada skill es un agente IA especializado con responsabilidades, reglas, y procesos bien definidos. Juntos implementan el **ciclo SDD de 8 fases**:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1️⃣  /sdd-explore    Investigación (sin comprometerse)          │
│        ↓                                                          │
│  2️⃣  /sdd-new        Generar propuesta                           │
│        ↓                                                          │
│  3️⃣  /sdd-spec       Escribir especificaciones                  │
│        ↓                                                          │
│  4️⃣  /sdd-design     Diseño técnico                              │
│        ↓                                                          │
│  5️⃣  /sdd-tasks      Desglose en tareas                          │
│        ↓                                                          │
│  6️⃣  /sdd-apply      Implementación código                       │
│        ↓                                                          │
│  7️⃣  /sdd-verify     Validación contra specs                     │
│        ↓                                                          │
│  8️⃣  /sdd-archive    Sincronizar y cerrar                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Skills Disponibles

### 1. **sdd-explore** — Explorador de Codebase
**Archivo**: `skills/sdd-explore/SKILL.md`

Investiga ideas **sin comprometerse** a cambios. Lee código, compara enfoques, valida viabilidad.

| Aspecto | Detalle |
|---------|---------|
| **Entrada** | Tema/idea a investigar |
| **Proceso** | Lectura codebase, análisis, comparación |
| **Salida** | Reporte mental (sin archivos) |
| **Tiempo** | 1-2 horas típico |
| **NO hace** | Diseña, especifica, implementa |
| **SÍ hace** | Investiga, compara, recomienda |

**Responsabilidades clave**:
- Leer múltiples archivos (4+) sin inflación de contexto
- Análisis comparativo de enfoques
- Validación de viabilidad técnica
- Reporte estructurado con recomendaciones

**Ejemplo de uso**:
```
user: /sdd-explore autenticación con JWT vs. sessions
sdd-explore: Investiga ambos enfoques, contexto actual, recomendación
→ Reporte: "JWT recomendado porque escalable, add payload claims para roles"
```

---

### 2. **sdd-spec** — Especificador de Requisitos
**Archivo**: `skills/sdd-spec/SKILL.md`

Define **requirements exactos** usando RFC 2119 (MUST, SHALL, SHOULD, MAY). Escribe scenarios GIVEN/WHEN/THEN verificables.

| Aspecto | Detalle |
|---------|---------|
| **Entrada** | proposal.md (dependencia) |
| **Proceso** | RFC 2119 requirements, scenarios GIVEN/WHEN/THEN, APIs |
| **Salida** | `openspec/changes/{change}/specs.md` (fuente de verdad) |
| **Tiempo** | 2-3 horas típico |
| **Máximo** | 5-8 scenarios, 3-5 páginas |
| **NO hace** | Diseña arquitectura, implementa |
| **SÍ hace** | Define requirements, escenarios, APIs, errores |

**Responsabilidades clave**:
- RFC 2119: marcar MUST/SHALL/SHOULD/MAY
- Scenarios GIVEN/WHEN/THEN paso a paso
- APIs: endpoints, params, respuestas, errores
- Schemas: inputs, outputs, validaciones
- Done criteria verificable

**Estructura típica**:
```markdown
## Requirements (RFC 2119)
- MUST crear endpoint POST /pedidos
- MUST validar stock antes de confirmar
- SHOULD enviar email de confirmación
- MAY guardar historial de cambios

## Scenarios
### Scenario 1: Cliente crea pedido exitosamente
GIVEN cliente autenticado con carrito lleno
WHEN hace POST /pedidos con items válidos
THEN recibe 201 + pedido_id + estado PENDIENTE

## APIs
### POST /pedidos
Request: { items: [{ producto_id, cantidad }] }
Response: 201 { id, estado, creado_en }
Error: 400 si stock insuficiente
```

---

### 3. **sdd-design** — Arquitecto de Soluciones
**Archivo**: `skills/sdd-design/SKILL.md`

Diseña la **arquitectura técnica** con capas, componentes, flujos, decisiones justificadas.

| Aspecto | Detalle |
|---------|---------|
| **Entrada** | proposal.md, specs.md (dependencias) |
| **Proceso** | Capas backend/frontend, cambios BD, flujos, riesgos |
| **Salida** | `openspec/changes/{change}/design.md` |
| **Tiempo** | 2-4 horas típico |
| **Máximo** | 5-10 páginas, diagramas claros |
| **NO hace** | Especifica detalles, implementa |
| **SÍ hace** | Diseña estructura, justifica decisiones |

**Responsabilidades clave**:
- Arquitectura de capas (backend y frontend)
- Modelos de dato (cambios en BD, relaciones)
- Flujos de ejecución (request → response)
- Decisiones arquitectónicas con trade-offs
- Consideraciones de performance, seguridad, escalabilidad

**Estructura típica**:
```markdown
## Arquitectura Backend
Router: POST /pedidos → Service: crear_pedido() → UoW → Repository

## Cambios en Base de Datos
- Tabla `pedidos`: agregar columna `estado` (ENUM)
- Tabla `historial_estado_pedidos`: registrar transiciones

## Flujo de Creación de Pedido
1. Cliente envía POST /pedidos
2. Service valida stock con Repository
3. Si OK: crea Pedido en estado PENDIENTE
4. Retorna 201 + id

## Trade-offs
- ✅ UoW para transacción atómica (garantiza consistencia)
- ❌ Más overhead de bd, pero necesario (data integrity)
```

---

### 4. **sdd-tasks** — Planificador de Tareas
**Archivo**: `skills/sdd-tasks/SKILL.md`

Desglosa diseño en **chunks ejecutables** de máximo 2 horas. Numera jerárquicamente, agrupa por fase.

| Aspecto | Detalle |
|---------|---------|
| **Entrada** | specs.md, design.md (dependencias) |
| **Proceso** | Desglose jerárquico, estimación, dependencias |
| **Salida** | `openspec/changes/{change}/tasks.md` (checklist) |
| **Tiempo** | 1-2 horas típico |
| **Máximo** | 15-25 tareas totales, ~20 horas estimado |
| **NO hace** | Implementa, especifica |
| **SÍ hace** | Desglosa, estima, ordena |

**Responsabilidades clave**:
- Máximo 2 horas por tarea (idealmente 1 hora)
- Numeración jerárquica: 1, 1.1, 1.2, 2, 2.1, etc.
- Agrupación por fase: Setup, Implementation, Testing, Docs
- Done criteria verificable para cada tarea
- Estimación realista + total por fase

**Estructura típica**:
```markdown
## Fase 1: Setup e Infraestructura (1.5h)
### 1.1 Crear modelo Pedido en SQLModel
Estimado: 30 min
Cambios: backend/modelos/pedido.py
Done: [ ] Modelo existe [ ] Type hints [ ] Tests setup

## Fase 2: Implementación Backend (4h)
### 2.1 Implementar POST /pedidos endpoint
Estimado: 1 hora
Dependencia: Tarea 1.1 completada
Done: [ ] Router existe [ ] Valida stock [ ] Tests pasan

## Fase 3: Implementación Frontend (3h)
### 3.1 Formulario CreateOrderForm
Estimado: 1.5 horas
...
```

---

### 5. **sdd-apply** — Implementador de Código
**Archivo**: `skills/sdd-apply/SKILL.md`

Implementa **tarea por tarea**, escribiendo código real que sigue specs exactamente. Commits convencionales, incrementales.

| Aspecto | Detalle |
|---------|---------|
| **Entrada** | tasks.md, specs.md, design.md (dependencias) |
| **Proceso** | Lectura artefactos, implementación, tests, commits |
| **Salida** | Código en rama feature, commits convencionales |
| **Ejecución** | Secuencial (no paralelo), tarea tras tarea |
| **Máximo** | ~20 horas típico (según tasks) |
| **NO hace** | Diseña, especifica, improvisa |
| **SÍ hace** | Implementa exactamente specs, tests, commits |

**Responsabilidades clave**:
- Lee specs **antes** de implementar
- Escribe tests **junto con** código
- Respeta layers arquitectónicas (Router → Service → Repo → Model)
- Commits convencionales: `feat(modulo): descripción`
- Type hints, docstrings, convenciones
- Linter/type-check limpio antes de commit

**Proceso por tarea**:
```
1. Leer spec de la tarea (qué debe hacerse)
2. Leer design (cómo arquitectónicamente)
3. Escribir test (qué validar)
4. Escribir código (implementación)
5. Run tests, linter, type-check locales
6. Si TODO OK: commit convencional
7. Marcar tarea ✅ en checklist
```

**Commits reales**:
```
feat(pedidos): implementar máquina de estados PENDIENTE→CONFIRMADO→ENTREGADO
fix(carrito): resolver race condition en sincronización localStorage
test(productos): agregar tests para filtrado por categoría
docs(api): actualizar swagger spec de endpoints de pagos
```

---

### 6. **sdd-verify** — Validador de Calidad
**Archivo**: `skills/sdd-verify/SKILL.md`

Valida que **implementación cumple specs exactamente**. Compara código vs. requirements, reporta hallazgos (CRÍTICO, ADVERTENCIA, SUGERENCIA).

| Aspecto | Detalle |
|---------|---------|
| **Entrada** | specs.md, design.md, tasks.md, código implementado |
| **Proceso** | Specs validation, test execution, architecture check, reporting |
| **Salida** | Reporte detallado con severidad + recomendaciones |
| **Tiempo** | 2-3 horas típico |
| **NO hace** | Arregla issues, diseña, improvisa |
| **SÍ hace** | Valida, reporta, recomienda |

**Responsabilidades clave**:
- RFC 2119: ¿MUST requerimientos cumplidos?
- Scenarios GIVEN/WHEN/THEN: ¿ejecutables?
- Tests: ¿todos pasan? ¿cobertura >= 80%?
- Arquitectura: ¿capas respetadas? ¿soft deletes? ¿RBAC?
- Convenciones: ¿commits OK? ¿linter limpio? ¿types OK?

**Severidad de issues**:
- 🔴 **CRÍTICO**: Bloquea, vuelve a Apply (MUST no cumplido, test falla)
- 🟠 **ADVERTENCIA**: Reporta, user decide (SHOULD no cumplido, coverage < 80%)
- 🟡 **SUGERENCIA**: Documenta para próxima (mejora, refactor, docs)

**Ejemplo de reporte**:
```markdown
# Verify Report: pedidos-fsm

Status: ⚠️ WARNINGS (1 CRÍTICO, 1 ADVERTENCIA)

## 🔴 CRÍTICO (1)
- Scenario "Estado inválido rechazado" falla
  Ubicación: backend/test_pedidos.py:120
  Spec: "MUST validar transiciones de estado"
  Recomendación: Ajustar service.py línea 45, agregar validación FSM

## 🟠 ADVERTENCIA (1)
- Coverage backend 78% (necesita >= 80%)
  Ubicación: backend/pedidos/service.py
  Causa: Casos error sin tests
  Recomendación: Agregar tests para estado inválido

## Recommendation
Vuelve a sdd-apply, corregir issue CRÍTICO, re-run verify.
```

---

## 🔄 Workflow: De Idea a Deploy

### Fase 1: Exploración (Optional)
```
user: Quiero investigar mejor la autenticación
      /sdd-explore autenticación JWT + refresh tokens

sdd-explore: Lee código actual, analiza enfoques
             → Reporte: "JWT + rotating refresh tokens recomendado"
```

### Fase 2: Nueva Propuesta
```
user: /sdd-new auth-jwt-refresh-tokens
      (o usa Orchestrator para coordinar exploration + proposal)

orchestrator: Delega a sdd-explore + sdd-propose en paralelo
→ Genera proposal.md con intención, alcance, enfoque
```

### Fase 3: Especificación
```
user: /sdd-spec

sdd-spec: Lee proposal, escribe specs.md
          - Requirements MUST/SHALL/SHOULD/MAY
          - Scenarios GIVEN/WHEN/THEN
          - APIs: POST /login, POST /refresh, etc.
          - Errores: 401 invalid, 403 expired, etc.
→ Genera openspec/changes/auth-jwt-refresh-tokens/specs.md
```

### Fase 4: Diseño Técnico
```
user: /sdd-design

sdd-design: Lee proposal + specs, escribe design.md
            - Backend: JWT generation, refresh rotation, validation
            - Frontend: axios interceptor, token storage
            - BD: tokens table, rotations log
            - Flujos: login → access token, refresh → new tokens
→ Genera openspec/changes/auth-jwt-refresh-tokens/design.md
```

### Fase 5: Desglose en Tareas
```
user: /sdd-tasks

sdd-tasks: Lee specs + design, escribe tasks.md
           - Fase 1: Modelo JWT + Tabla tokens (30 min)
           - Fase 2: Endpoint POST /login (1h)
           - Fase 3: Refresh token rotation (1.5h)
           - Fase 4: Frontend axios interceptor (1h)
           - Fase 5: Tests integration (1h)
           Total: ~5 horas
→ Genera openspec/changes/auth-jwt-refresh-tokens/tasks.md
```

### Fase 6: Implementación
```
user: /sdd-apply

sdd-apply: Ejecuta tarea por tarea
           1. Crea modelo JWT en backend/models/token.py
           2. Crea endpoint POST /login en backend/routers/auth.py
           3. Implementa refresh rotation con UoW atómica
           4. Agrega axios interceptor en frontend/src/shared/http.ts
           5. Escribe tests para cada fase
           
           Commits:
           - feat(auth): crear modelo JWT y tabla tokens
           - feat(auth): implementar endpoint POST /login
           - feat(auth): agregar rotación de refresh tokens
           - feat(auth): axios interceptor para JWT automático
           - test(auth): agregar tests integration para auth flow
→ Código en rama feature/, commits en historial
```

### Fase 7: Verificación
```
user: /sdd-verify

sdd-verify: Valida implementación contra specs
            - RFC 2119: todos MUST cumplidos? ✅
            - Scenarios: GIVEN/WHEN/THEN pasan? ✅
            - Tests: 100% pasan, cobertura 85%? ✅
            - Arquitectura: capas respetadas? ✅
            - Linter: 0 errors? ✅
            
            Resultado: ✅ PASS (si hay CRÍTICO → vuelve a Apply)
→ Genera reporte, status PASS/WARNINGS/FAILED
```

### Fase 8: Archivo
```
user: /sdd-archive

sdd-archive: Finaliza y cierra change
             - Sincroniza specs delta → specs principales
             - Archiva change en openspec/archive/
             - Limpia estado de trabajo
             - Documenta lecciones aprendidas
→ Change cerrado, documentado, histórico conservado
```

---

## 🎯 Cómo Invocar Skills

### Vía Slash Commands (CLI)
```bash
# Explorar tema
/sdd-explore authentication approaches

# Crear nueva propuesta (auto-delega explore + propose)
/sdd-new change-name

# Escribir specs (Fast-forward)
/sdd-spec

# Escribir diseño
/sdd-design

# Desglose en tareas
/sdd-tasks

# Implementar
/sdd-apply

# Verificar
/sdd-verify

# Cerrar y archivar
/sdd-archive
```

### Vía Orchestrator (Coordinación)
El orchestrator coordina múltiples skills:
```
/sdd-new auth-jwt              # Inicia propuesta
/sdd-continue auth-jwt         # Sig. fase lista
/sdd-ff auth-jwt               # Fast-forward: proposal → specs → design → tasks
```

---

## 📊 Matriz de Responsabilidad

| Skill | Lee | Escribe | Implementa | Verifica |
|-------|-----|---------|-----------|----------|
| sdd-explore | Codebase | Reporte mental | — | — |
| sdd-spec | proposal | specs.md | — | — |
| sdd-design | proposal + specs | design.md | — | — |
| sdd-tasks | specs + design | tasks.md | — | — |
| sdd-apply | tasks + specs + design | Código + commits | ✅ | — |
| sdd-verify | specs + design + código | Reporte | — | ✅ |

---

## 🚀 Reglas de Oro

1. **Orden importa**: Explore → Propose → Spec → Design → Tasks → Apply → Verify → Archive
2. **Dependencias claras**: Design requiere Specs, Tasks requiere Design + Specs
3. **No hay atajos**: No saltar fases, no improviser fuera de specs
4. **Atomicidad**: Apply y Verify son secuenciales, no paralelos
5. **Reverificación**: Si Verify encuentra CRÍTICO, vuelve a Apply (iteración)
6. **Commits limpios**: Un commit por tarea, convencional, sin "Co-Authored-By"
7. **Specs son ley**: Apply implementa exactamente specs, Verify valida contra specs

---

## 📁 Archivos Relacionados

- `skills/sdd-explore/SKILL.md` — Explorador completo
- `skills/sdd-spec/SKILL.md` — Especificador completo
- `skills/sdd-design/SKILL.md` — Arquitecto completo
- `skills/sdd-tasks/SKILL.md` — Planificador completo
- `skills/sdd-apply/SKILL.md` — Implementador completo
- `skills/sdd-verify/SKILL.md` — Validador completo
- `openspec/CONVENTIONS.md` — Convenciones SDD
- `AGENTS.md` — Framework completo de agentes

---

## 🔗 Referencias

- **Spec-Driven Development**: https://github.com/fission-codes/openspec
- **RFC 2119 Keywords**: https://tools.ietf.org/html/rfc2119
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Feature-Sliced Design**: https://feature-sliced.design/
- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

---

**Última actualización**: Viernes 08 de Mayo de 2026  
**Versión**: 1.0  
**Status**: ✅ Operacional

