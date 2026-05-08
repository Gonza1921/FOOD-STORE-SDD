# Skill: sdd-tasks

## Propósito

Desglosar diseño técnico en tareas ejecutables y estimadas. El agente Task Planner divide el work en chunks de máximo 2 horas, agrupa por fases (setup, implement, test, docs), y proporciona criterio de "done" claro para cada tarea.

**Cuándo usar**: Después de que el diseño está aprobado, antes de implementación. Tasks guían la ejecución paso a paso.

---

## 🎯 Responsabilidades

1. **Lectura de Diseño**
   - Leer `{change}/proposal.md`, `{change}/specs.md`, `{change}/design.md`
   - Extraer: cambios backend, frontend, BD, decisiones
   - Entender complejidad, dependencias, riesgos

2. **Desglose en Tasks**
   - Dividir en chunks máximo 2 horas (idealmente 1 hora)
   - Numerar jerárquicamente: 1, 1.1, 1.2, 2, 2.1, 2.2, etc.
   - Agrupar por fase: Setup → Implementation → Testing → Documentation
   - Asegurar independencia y orden de ejecución

3. **Estimación Realista**
   - Calcular tiempo por tarea (30 min, 45 min, 1 hora, 1.5 hora)
   - Sumar tareas por fase
   - Estimar total (considerando debugging, retesting)
   - Indicar si tareas pueden paralelizarse

4. **Definición de Done Criteria**
   - Cada tarea tiene criterio verificable
   - Incluir: archivos creados, tests, linter, type check
   - Especificar pasos manuales si aplica
   - Mensajes de commit convencionales listos

5. **Gestión de Dependencias**
   - Indicar prerequisites: tarea X debe completarse antes de Y
   - Identificar tareas parallelizables
   - Documentar bloqueadores

---

## 📋 Reglas

### Estructura y Formato
- ✅ Archivo: `openspec/changes/{change}/tasks.md`
- ✅ Título: "Tasks: {nombre}"
- ✅ Secciones: Resumen, Jerarquía, Estimación Total, Riesgos
- ✅ Numeración jerárquica: 1, 1.1, 1.2, 2, 2.1, etc.
- ✅ Agrupación: Fase 1 (Setup), Fase 2 (Implementation), Fase 3 (Testing), Fase 4 (Documentation)
- ✅ Cada tarea: estimado, descripción, dependencias, done criteria, commit message
- ✅ Máximo 2 horas por tarea (típico: 45 min - 1 hora)
- ✅ Máximo 2 páginas (síntesis clara)
- ❌ NO detallar cómo implementar (eso es para Apply)
- ❌ NO incluir código (solo descripción de qué hacer)

### Numeración de Tasks
```
1. Fase 1: Setup e Infraestructura
   1.1 Subtarea setup 1
   1.2 Subtarea setup 2
2. Fase 2: Implementación Backend
   2.1 Backend feature 1
   2.2 Backend feature 2
3. Fase 3: Implementación Frontend
   3.1 Frontend feature 1
4. Fase 4: Testing e Integración
   4.1 Tests backend
   4.2 Tests frontend
5. Fase 5: Documentación
   5.1 Actualizar docs
```

### Estimación
- ✅ Formato: **Estimado**: 30 min | 45 min | 1 hora | 1.5 hora
- ✅ Máximo 2 horas por tarea (split si más)
- ✅ Incluir tiempo de debugging y retesting
- ✅ Calcular total de fases
- ✅ Indicar si puede paralelizarse
- ❌ NO subestimar (siempre cuenta debugging)
- ❌ NO sobreestimar (ser realista)

### Done Criteria
- ✅ Específico: "archivo X existe en path Y con contenido Z"
- ✅ Verificable: "Tests pasan con coverage >= 80%"
- ✅ Mensurable: "0 ESLint errors, 0 warnings"
- ✅ Incluir: archivos, tests, linter, type check
- ✅ Checklist con [ ] para cada criterio
- ✅ Commit message convencional: `feat(modulo): descripción`
- ❌ NO vago: "código debe funcionar" (no verificable)

### Estructura de Tarea Completa
```markdown
#### X.X {Nombre Descriptivo de la Tarea}
**Estimado**: 1 hora
**Prerequisitos**: Tarea X completada
**Descripción**: {Qué se va a hacer, no cómo}
**Cambios Afectados**: 
- `backend/modulo/archivo.py`
- `frontend/component.tsx`
**Done Criteria**:
- [ ] Archivo `backend/modulo/archivo.py` creado
- [ ] Función `nueva_funcion` implementada con type hints
- [ ] Tests unitarios en `backend/tests/test_modulo.py`
- [ ] Coverage >= 80%
- [ ] Pylint score >= 8.0
- [ ] Mypy sin errores
- [ ] PR review: 1+ aprobaciones
**Commit Message**: `feat(modulo): descripción breve`
```

### Stack Específico
- ✅ Backend tasks: especificar capa (Router/Service/Repository/Model)
- ✅ Frontend tasks: especificar FSD layer (pages/widgets/features/entities/shared)
- ✅ DB tasks: vincular a Alembic migration si aplica
- ✅ Test tasks: especificar framework (pytest, React Testing Library)
- ✅ Considerar convenciones: naming, commits, linting
- ❌ NO asumir herramientas no establecidas

### Idioma
- ✅ Español: toda documentación
- ✅ Inglés: nombres de archivos, commits, estándares
- ✅ Convencional: `feat/fix/test/docs(modulo): descripción`
- ❌ NO mezclar innecesariamente

---

## 📐 Estructura de Tasks Completa

```markdown
# Tasks: {nombre}

## Resumen
[1 párrafo: qué se implementa, desglose general, estimado total]

**Estimación Total**: X horas (realista: X+1 con debugging)
**Equipo Sugerido**: 1 persona | 2 personas (paralelizable)

## Jerarquía de Tasks

### Fase 1: Setup e Infraestructura

#### 1.1 Crear migración Alembic
**Estimado**: 30 min
**Descripción**: Generar migración para nueva tabla `tabla_nueva` con columnas y índices
**Cambios Afectados**:
- `backend/alembic/versions/XXXXX_crear_tabla_nueva.py`
**Done Criteria**:
- [ ] Archivo migración existe
- [ ] `alembic upgrade head` ejecuta sin errores
- [ ] Tabla creada con columnas correctas
- [ ] `alembic downgrade -1` revierte cambios correctamente
- [ ] Verificación manual: `\dt tabla_nueva` en psql
**Commit Message**: `feat(db): create tabla_nueva migration`
**Prerequisitos**: Ninguno

#### 1.2 Crear modelos SQLModel
**Estimado**: 45 min
**Descripción**: Definir clase `TablaNueva` con campos, tipos, relaciones, soft delete
**Cambios Afectados**:
- `backend/modulo/model.py` (crear clase)
- `backend/modulo/__init__.py` (exportar)
**Done Criteria**:
- [ ] Clase `TablaNueva` definida en `model.py`
- [ ] Todos los campos tienen type hints
- [ ] Relaciones bidireccionales configuradas
- [ ] Soft delete filter presente
- [ ] Mypy sin errores
- [ ] Docstring de clase presente
**Commit Message**: `feat(models): add TablaNueva model`
**Prerequisitos**: 1.1 (migración)

### Fase 2: Implementación Backend

#### 2.1 Crear repository
**Estimado**: 1 hora
**Descripción**: Extender `BaseRepository[TablaNueva]` con queries específicas
**Cambios Afectados**:
- `backend/modulo/repository.py`
**Done Criteria**:
- [ ] Clase `TablaNuevaRepository` hereda `BaseRepository[TablaNueva]`
- [ ] Métodos CRUD + queries específicas del dominio
- [ ] Soft delete filter en todas las queries
- [ ] Type hints completos
- [ ] Tests unitarios en `backend/tests/test_modulo_repo.py`
- [ ] Coverage >= 80%
- [ ] Pylint score >= 8.0
**Commit Message**: `feat(repository): implement TablaNuevaRepository`
**Prerequisitos**: 1.2 (modelos)

#### 2.2 Crear servicio
**Estimado**: 1 hora
**Descripción**: Lógica de negocio en `TablaNuevaService` usando UoW
**Cambios Afectados**:
- `backend/modulo/service.py`
**Done Criteria**:
- [ ] Clase `TablaNuevaService` implementada
- [ ] Métodos: `crear`, `listar`, `obtener_por_id`, `actualizar`, etc.
- [ ] Validaciones de negocio aplicadas
- [ ] Unit of Work para operaciones críticas
- [ ] Type hints completos
- [ ] Tests unitarios: happy path + errores
- [ ] Coverage >= 80%
**Commit Message**: `feat(service): implement TablaNuevaService`
**Prerequisitos**: 2.1 (repository)

#### 2.3 Crear router (endpoints)
**Estimado**: 1.5 horas
**Descripción**: Endpoints REST + validaciones de entrada + respuestas HTTP
**Cambios Afectados**:
- `backend/modulo/router.py`
**Done Criteria**:
- [ ] Endpoints implementados: GET, POST, PUT, DELETE según spec
- [ ] Validaciones de rol (RBAC) aplicadas
- [ ] Schemas Pydantic para request/response
- [ ] Documentación Swagger auto-generada
- [ ] Error handling: 400, 401, 403, 404, 500
- [ ] Tests integración: happy path + errores
- [ ] Coverage >= 80%
**Commit Message**: `feat(api): add TablaNueva endpoints`
**Prerequisitos**: 2.2 (service)

### Fase 3: Implementación Frontend

#### 3.1 Crear hook TanStack Query
**Estimado**: 1 hora
**Descripción**: Hook para queries/mutations de API backend
**Cambios Afectados**:
- `src/entities/TablaNueva/hooks/useTablaNueva.ts`
**Done Criteria**:
- [ ] Hook exportado: `useTablaNuevaList()`, `useTablaNuevaDetail()`, etc.
- [ ] Usa `useQuery`, `useMutation` de TanStack Query
- [ ] Axios configurado con auth token
- [ ] Error handling: muestra mensajes del servidor
- [ ] Loading states claros
- [ ] TypeScript: strict mode, sin `any`
- [ ] Tests con React Testing Library
**Commit Message**: `feat(hooks): add useTablaNueva hooks`
**Prerequisitos**: 2.3 (API endpoints)

#### 3.2 Crear componente widget
**Estimado**: 1.5 horas
**Descripción**: Componente UI usando el hook, integra con Tailwind
**Cambios Afectados**:
- `src/widgets/TablaNueva/TablaNuevaList.tsx`
- `src/widgets/TablaNueva/TablaNuevaForm.tsx`
**Done Criteria**:
- [ ] Componentes creados y exportados
- [ ] Props tipadas en TypeScript
- [ ] Integración con hook (useQuery/useMutation)
- [ ] UI: Tailwind CSS, responsive, accesible
- [ ] Error boundaries o error handling visual
- [ ] Loading skeleton o spinner
- [ ] Tests: components render correctamente
**Commit Message**: `feat(ui): add TablaNuevaList and TablaNuevaForm components`
**Prerequisitos**: 3.1 (hooks)

### Fase 4: Testing e Integración

#### 4.1 Tests backend end-to-end
**Estimado**: 1 hora
**Descripción**: Tests integración con BD real, validar workflows completos
**Cambios Afectados**:
- `backend/tests/test_modulo_e2e.py`
**Done Criteria**:
- [ ] Tests: crear, listar, actualizar, eliminar (soft delete)
- [ ] Transacciones: crear + validación fallan juntos
- [ ] Validaciones de negocio: errores correctos
- [ ] Coverage >= 80% en servicios críticos
- [ ] All tests pasan: `pytest -v`
**Commit Message**: `test(backend): add end-to-end integration tests`
**Prerequisitos**: 2.3 (endpoints) + 4.1

#### 4.2 Tests frontend E2E
**Estimado**: 45 min
**Descripción**: Tests UI: formulario, mutaciones, respuestas
**Cambios Afectados**:
- `src/widgets/TablaNueva/__tests__/TablaNuevaForm.test.tsx`
**Done Criteria**:
- [ ] Form submits correctamente
- [ ] Error messages show from server
- [ ] Loading state visible
- [ ] Success response actualiza UI
- [ ] Tests pasan: `npm test`
- [ ] ESLint: 0 errors, 0 warnings
**Commit Message**: `test(frontend): add TablaNuevaForm E2E tests`
**Prerequisitos**: 3.2 (components)

### Fase 5: Documentación

#### 5.1 Actualizar README y API docs
**Estimado**: 30 min
**Descripción**: Documentar endpoints, ejemplos curl, cambios en arquitectura
**Cambios Afectados**:
- `backend/README.md`
- `docs/API.md` (si existe)
**Done Criteria**:
- [ ] Endpoints documentados con curl examples
- [ ] Query parameters explicados
- [ ] Response examples incluidos
- [ ] Error cases documentados
- [ ] Link a Swagger UI: `http://localhost:8000/docs`
**Commit Message**: `docs(api): document TablaNueva endpoints`
**Prerequisitos**: 4.2 (tests completos)

## Estimación por Fase

| Fase | Tareas | Estimado | Paralelizable |
|------|--------|----------|--------------|
| Setup | 1.1, 1.2 | 1.5h | No (secuencial) |
| Backend | 2.1, 2.2, 2.3 | 3.5h | Parcial |
| Frontend | 3.1, 3.2 | 2.5h | Sí (depende de 2.3) |
| Testing | 4.1, 4.2 | 1.75h | Sí |
| Docs | 5.1 | 0.5h | Última |
| **TOTAL** | | **9.25h** | 1 persona: 10-11h |

## Estimación Realista
- **1 persona**: 10-12 horas (incluye debugging, retesting)
- **2 personas**: Backend (3h) + Frontend (2.5h) en paralelo = 5-6h total
- **Con interrupciones**: Agregar 10-20% más tiempo

## Riesgos y Mitigación

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Migración Alembic falla en downgrade | Medium | Revisar reversión manual antes de merge |
| Type errors en TypeScript | Medium | Verificar `npm run type-check` antes de commit |
| Tests fallan por falta de datos | Low | Usar fixtures/factories en tests |
| Performance issue en queries | Low | Verificar índices, explain query plan |

## Commits Esperados

Al terminar todas las tareas, esperamos 6 commits:

```
feat(db): create tabla_nueva migration
feat(models): add TablaNueva model
feat(repository): implement TablaNuevaRepository
feat(service): implement TablaNuevaService
feat(api): add TablaNueva endpoints
feat(hooks): add useTablaNueva hooks
feat(ui): add TablaNuevaList and TablaNuevaForm components
test(backend): add end-to-end integration tests
test(frontend): add TablaNuevaForm E2E tests
docs(api): document TablaNueva endpoints
```

## Cómo Usar este Document

1. **Durante Planning**: El Task Planner creó este documento
2. **Durante Implement**: El Implementer lee cada tarea, la completaTask
3. **Marca como done**: Cuando todos los criteria se cumplen
4. **1 commit por tarea**: Mensaje convencional listo
5. **Final**: Todos los commits submiteados, PRs aprobadas
```

---

## 🔍 Proceso de Planificación de Tasks

### 1. Leer Diseño Completo
```
Extraer:
- Cambios en backend (capas, modelos)
- Cambios en frontend (componentes, hooks)
- Cambios en BD (tablas, índices)
- Decisiones arquitectónicas
```

### 2. Identificar Fases Naturales
```
Típicamente:
1. Setup (DB migrations, models)
2. Backend (Repository, Service, Router)
3. Frontend (Hooks, Components)
4. Testing (Unit, Integration, E2E)
5. Documentation
```

### 3. Desglose en Tasks
```
Cada task:
- Máximo 2 horas (idealmente 1 hora)
- Descripción clara de QUÉ, no CÓMO
- Done criteria verificable
- Dependencias explícitas
```

### 4. Estimar Realista
```
- 30 min: tarea muy pequeña
- 45 min: tarea típica
- 1 hora: tarea normal
- 1.5 horas: tarea compleja (split si posible)
- 2 horas: máximo (split si > 2)
```

### 5. Agrupar por Fase
```
Organizar jerárquicamente:
1. Setup
   1.1 Sub-task 1
   1.2 Sub-task 2
2. Implementation
   2.1 Sub-task
```

---

## 📤 Resultados Esperados

### Tasks Exitosa
- [x] Archivo: `openspec/changes/{change}/tasks.md`
- [x] Numeración jerárquica: 1, 1.1, 1.2, 2, 2.1, etc.
- [x] Cada task: estimado, descripción, done criteria, commit
- [x] Máximo 2 horas por task (típico: 1 hora)
- [x] Fases claras: Setup → Backend → Frontend → Testing → Docs
- [x] Dependencias documentadas
- [x] Estimación total realista
- [x] Máximo 2 páginas
- [x] Español, commits en convencional

### Checklist de Calidad
- [x] ¿Cada task es independiente (dentro de su fase)? (sí = ejecutable)
- [x] ¿Done criteria es verificable? (sí = checkeable)
- [x] ¿Estimaciones son realistas? (sí = incluye debugging)
- [x] ¿Commits son convencionales? (sí = `feat/test/docs(modulo): desc`)
- [x] ¿Total de horas es razonable? (sí = coherente con complejidad)

---

## 🎓 Ejemplos

### Ejemplo 1: Tasks Simple (Login)
```
# Tasks: Autenticación JWT

## Estimación Total: 3 horas (1 persona)

### Fase 1: Setup
1.1 Crear modelo RefreshToken (30 min)

### Fase 2: Backend
2.1 Servicio de login/refresh (1 hora)
2.2 Endpoints POST /auth/login, /auth/refresh (1 hora)

### Fase 3: Tests
3.1 Tests login exitoso + credenciales inválidas (30 min)
3.2 Tests refresh token (30 min)

### Fase 4: Docs
4.1 README.md + ejemplos (30 min)
```

### Ejemplo 2: Tasks Compleja (Pedidos)
```
# Tasks: Sistema de Pedidos

## Estimación Total: 12 horas (1 persona) | 7 horas (2 personas)

### Fase 1: Setup
1.1 Migración: tablas Pedido, DetallePedido, HistorialEstadoPedido (45 min)
1.2 Modelos SQLModel para 3 tablas (1 hora)

### Fase 2: Backend
2.1 PedidoRepository (1 hora)
2.2 PedidoService (1.5 horas)
2.3 Endpoints REST (1.5 horas)

### Fase 3: Frontend
3.1 Hooks usePedidos, useCrearPedido (1 hora)
3.2 Componentes UI (2 horas)

### Fase 4: Testing
4.1 Tests backend (1 hora)
4.2 Tests frontend (45 min)

### Fase 5: Docs
5.1 API docs (30 min)
```

---

## 🚫 Anti-Patrones

❌ **NO HAGAS**:
- Tasks > 2 horas (deben ser pequeñas)
- Done criteria vagas ("debe funcionar")
- Olvidar dependencias entre tasks
- Incluir "how to implement" (eso es Apply)
- Tasks que dependen de muchas otras (secuencial infinito)
- Subestimar tiempo de tests y debugging
- Commits no convencionales

---

## 📚 Referencias

- `AGENTS.md` — Arquitectura del proyecto
- `openspec/config.yaml` — Reglas SDD
- `openspec/CONVENTIONS.md` — Estándares de tasks
- `docs/` — Documentación técnica

---

## 🔗 Integración con Workflow SDD

```
/sdd-tasks  (después de design aprobada)
      ↓
[Task Planner crea tasks.md]
      ↓
Tasks desglosadas con done criteria
      ↓
/sdd-apply  ← Siguiente fase (implementación)
```

---

**Versión**: 1.0  
**Última actualización**: Mayo 8, 2026  
**Responsable**: SDD Task Planner Agent  
**Idioma**: Español
