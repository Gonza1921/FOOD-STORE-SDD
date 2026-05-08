# Skill: sdd-verify

## Propósito

Validar que la implementación cumple exactamente las especificaciones, el diseño y las tareas. El agente Verifier compara código contra specs, ejecuta scenarios GIVEN/WHEN/THEN, y reporta hallazgos con severidad (CRÍTICO, ADVERTENCIA, SUGERENCIA). **NO arregla** → solo valida y reporta.

**Cuándo usar**: Después de que Apply completó todas las tareas. Verify es el QA final antes de Archivo.

---

## 🎯 Responsabilidades

1. **Lectura de Artefactos**
   - Leer `{change}/specs.md` → requirements fuente de verdad
   - Leer `{change}/design.md` → arquitectura esperada
   - Leer `{change}/tasks.md` → qué debería estar implementado
   - Leer código implementado (branch de feature)
   - Entender: qué se promised, qué se built

2. **Validación contra Specs**
   - RFC 2119 (MUST, SHALL, SHOULD, MAY) → ¿cumplido?
   - Scenarios GIVEN/WHEN/THEN → ¿ejecutables? ¿pasan?
   - APIs y schemas → ¿match con spec?
   - Casos de error → ¿manejan como esperado?
   - **NO** improbar, **NO** improvisar → specs son la ley

3. **Ejecución de Tests**
   - Correr test suite completo (backend + frontend)
   - Validar cobertura >= 80%
   - Confirmar linter 0 errors
   - Type-check sin warnings
   - Tests integración si aplica
   - **NO pasar "casi OK"** → all or nothing

4. **Validación Arquitectónica**
   - Backend: ¿respeta layers? Router → Service → UoW → Repo → Model
   - Frontend: ¿respeta FSD? app → pages → widgets → features → entities → shared
   - Soft deletes: ¿implementados consistentemente?
   - RBAC: ¿roles validados en routers?
   - Unit of Work: ¿transacciones atómicas?
   - Máquinas de estado: ¿transiciones correctas?

5. **Reporte Detallado**
   - Formato: Status, Severidad, Descripción, Ubicación, Recomendación
   - Agrupa por tipo: Specs, Arquitectura, Testing, Convenciones
   - Si CRÍTICO: bloquea, vuelve a Apply
   - Si ADVERTENCIA: reporta pero puede proseguir
   - Si SUGERENCIA: mejora futura, no bloquea

---

## 📋 Reglas

### Validación de Specs
- ✅ Leer cada requirement RFC 2119 (MUST, SHALL, SHOULD, MAY)
- ✅ Verificar: ¿código implementa esto?
- ✅ Para MUST: es bloqueador si no cumple
- ✅ Para SHOULD: advertencia si no cumple
- ✅ Para MAY: sugerencia si falta
- ✅ Ejecutar scenarios: GIVEN → WHEN → THEN, paso a paso
- ✅ Si scenario falla: **CRÍTICO**
- ❌ NO asumir intención, NO interpretar specs
- ❌ NO pasar requirement incumplido "por ahora"

### Validación de Tests
- ✅ `pytest --cov` backend: cobertura >= 80%
- ✅ `npm test -- --coverage` frontend: cobertura >= 80%
- ✅ Todos los tests pasan (0 failed)
- ✅ Mínimo 3 scenarios GIVEN/WHEN/THEN ejecutables
- ✅ Tests cubren casos happy path y error
- ✅ Si test falla: **CRÍTICO** (vuelve a Apply)
- ❌ NO aceptar warnings en test output
- ❌ NO ignorar broken tests

### Validación Arquitectónica
- ✅ Backend: Trazar request → Router → Service → Repo → Model (unidireccional)
- ✅ Frontend: Componentes en capa correcta, imports respetan jerarquía
- ✅ Soft delete: `eliminado_en` consistently aplicado, queries filtran
- ✅ UoW: Multi-step operations en transacción atómica
- ✅ RBAC: Endpoints validar `current_user.role` antes de lógica
- ✅ FSM: Máquina de estados (ej. pedidos) respeta transiciones spec
- ✅ Type hints: 0 implicit `any`, mypy/tsc limpio
- ❌ NO permitir saltos de capas (Router directo a Repo)
- ❌ NO permitir transactions sin UoW
- ❌ NO permitir type `any` sin justificación

### Validación de Convenciones
- ✅ Commits: formato convencional `feat(modulo): desc`
- ✅ Nombres: PascalCase componentes, camelCase funciones, UPPER_SNAKE_CASE constantes
- ✅ Docstrings: funciones públicas tienen doc (Google style)
- ✅ Linter: ESLint/pylint sin errors
- ✅ Format: Prettier/Black aplicado
- ✅ Type-check: mypy/tsc sin warnings
- ❌ NO commits con "Fixed bugs" sin modulo
- ❌ NO nombres inconsistentes (a veces snake, a veces camel)
- ❌ NO código sin docstrings públicos

### Severidad de Issues

```
🔴 CRÍTICO: Bloqueador absoluto, MUST en specs incumplido
   Ejemplos:
   - Requirement MUST no implementado
   - Test falla, scenario GIVEN/WHEN/THEN no funciona
   - Salto de capas arquitectónicas
   - Type error (mypy/tsc error, no warning)
   → VUELVE A APPLY, no prosigue a Archive

🟠 ADVERTENCIA: Issue significativo pero no bloqueador
   Ejemplos:
   - SHOULD en specs no cumplido
   - Coverage < 80% (pero > 70%)
   - ESLint warning (no error)
   - Soft delete inconsistente en modelo menor
   → Reporta, puede proseguir si user acepta riesgo

🟡 SUGERENCIA: Mejora de código/docs, no bloqueador
   Ejemplos:
   - Documentación incompleta (pero código claro)
   - Variable podría renombrarse (pero válida)
   - Test podría ampliarse (pero coverage OK)
   - Performance: O(n²) cuando podría ser O(n) (pero funciona)
   → Reporta para próxima iteración, prosigue normalmente
```

---

## 🔄 Proceso

### Inicio
1. Leer `specs.md` completo → entender qué se deve cumplir
2. Leer `design.md` completo → entender arquitectura esperada
3. Leer `tasks.md` completo → qué debería estar hecho
4. Clonar/pull rama feature → código actual
5. Listar requirements por tarea (para tracking)
6. Reportar: "Iniciando verificación de {change}. Hallazgos:"

### Validación de Specs
1. **Extraer requirements RFC 2119**
   ```
   Formato:
   □ MUST ... (bloqueador)
   □ SHALL ... (obligatorio, técnico)
   □ SHOULD ... (recomendado)
   □ MAY ... (opcional)
   ```

2. **Por cada requirement MUST**
   - Buscar en código: ¿dónde implementado?
   - Si NO encontrado: **CRÍTICO**
   - Si encontrado: ¿funciona correctamente?
   - Verificar: tests, casos de error, edge cases

3. **Por cada scenario GIVEN/WHEN/THEN**
   - Setup (GIVEN): ¿datos/estado inicial existente?
   - Action (WHEN): ¿endpoint/función callable?
   - Assertion (THEN): ¿resultado esperado?
   - Si FALLA en cualquier paso: **CRÍTICO**

4. **APIs y Schemas**
   - Endpoint existe según spec
   - HTTP method correcto (GET, POST, etc.)
   - Query/path params match
   - Request body schema match
   - Response status codes correctos (200, 400, 401, etc.)
   - Response body schema match

### Validación de Testing
1. **Ejecutar test suite**
   ```bash
   # Backend
   cd backend
   pytest tests/ -v --cov=app --cov-report=term-missing
   
   # Frontend
   cd frontend
   npm test -- --coverage
   ```

2. **Verificar resultados**
   - Todos los tests pasan (0 failed)
   - Cobertura >= 80% (si < 80%: **ADVERTENCIA**)
   - No hay skipped tests (si hay: investigar)
   - Output limpio (no warnings molestos)

3. **Validación de scenarios en tests**
   - Mínimo 3 GIVEN/WHEN/THEN scenarios implementados como tests
   - Setup (GIVEN) corresponde a fixtures
   - Action (WHEN) corresponde a llamada función/endpoint
   - Assert (THEN) corresponde a assertions en test

### Validación Arquitectónica
1. **Backend Layers**
   ```
   Router (HTTP)
     ↓ (importa Service)
   Service (Lógica negocio)
     ↓ (importa UoW/Repo)
   UnitOfWork (Transacciones)
     ↓ (importa Repo)
   Repository (Acceso datos)
     ↓ (importa Model)
   Model (BD ORM)
   ```
   Verificar: ¿cada capa solo importa capas inferiores?
   Si Router importa directo Repository: **CRÍTICO**

2. **Frontend Layers (FSD)**
   ```
   app (config global)
     ↓
   pages (rutas)
     ↓
   widgets (composiciones complejas)
     ↓
   features (interacciones usuario)
     ↓
   entities (modelos dominio)
     ↓
   shared (genéricos)
   ```
   Verificar: ¿imports siguen dirección?
   Si widgets importan pages: **CRÍTICO**

3. **Soft Delete**
   - Modelos críticos tienen `eliminado_en: datetime | None`
   - Queries filtran: `.where(Model.eliminado_en.is_(None))`
   - No hay DELETE hard de datos persistentes
   - Si delete hard detectado: **CRÍTICO**

4. **Unit of Work**
   - Operaciones multi-step en `async with UoW(session) as uow:`
   - Commit implícito al salir del with
   - Rollback automático si exception
   - Si transactions sin UoW: **ADVERTENCIA**

5. **RBAC**
   - Endpoints validar `current_user.role` antes de lógica
   - Roles: ADMIN, STOCK_MANAGER, ORDER_MANAGER, CUSTOMER
   - Si endpoint sin validación role: **CRÍTICO** (si spec lo requiere)

### Validación de Convenciones
1. **Commits**
   ```bash
   git log --oneline <rama> | head -20
   # Verificar formato: feat(modulo): desc
   ```

2. **Linting**
   ```bash
   # Backend
   pylint backend/app --fail-under=8.0
   
   # Frontend
   npm run lint
   ```

3. **Type Checking**
   ```bash
   # Backend
   mypy backend/app
   
   # Frontend
   npm run type-check
   ```

4. **Formatting**
   ```bash
   # Backend
   black --check backend/app
   
   # Frontend
   npm run format:check
   ```

### Generación de Reporte
1. **Estructura**
   ```markdown
   # Verification Report: {change}
   
   **Status**: ✅ PASS | ⚠️ WARNINGS | 🔴 FAILED
   
   ## Issues by Severity
   
   ### 🔴 CRÍTICO (X)
   - Issue 1
   - Issue 2
   
   ### 🟠 ADVERTENCIA (X)
   - Issue 1
   
   ### 🟡 SUGERENCIA (X)
   - Issue 1
   
   ## Summary
   - Specs coverage: X/Y requirements met
   - Test coverage: X%
   - Linter: X errors, X warnings
   - Type-check: X errors
   
   ## Recommendation
   If CRÍTICO present: Vuelve a sdd-apply
   If ADVERTENCIA present: User must review and decide
   If only SUGERENCIA: Proceed to sdd-archive
   ```

2. **Por cada issue**
   - **Severidad**: 🔴 CRÍTICO | 🟠 ADVERTENCIA | 🟡 SUGERENCIA
   - **Tipo**: Specs | Testing | Arquitectura | Convenciones
   - **Descripción**: Qué se encontró
   - **Ubicación**: Archivo, línea, función
   - **Spec relevante**: Qué requirement no cumple
   - **Recomendación**: Cómo arreglarlo

---

## ✅ Checklist de Verificación

- [ ] **Specs**: Todos los requirements MUST implementados
- [ ] **Specs**: Todos los scenarios GIVEN/WHEN/THEN ejecutables
- [ ] **APIs**: Endpoints existen, métodos correctos, schemas match
- [ ] **Tests**: Todos pasan (0 failed)
- [ ] **Tests**: Cobertura >= 80% (backend + frontend)
- [ ] **Tests**: Mínimo 3 scenarios GIVEN/WHEN/THEN como tests
- [ ] **Arquitectura Backend**: Capas unidireccionales (Router → Service → Repo → Model)
- [ ] **Arquitectura Frontend**: FSD layers respetadas
- [ ] **Soft Delete**: Implementado en modelos persistentes, queries filtran
- [ ] **Transacciones**: Multi-step en UoW, commit/rollback correctos
- [ ] **RBAC**: Endpoints validan roles si spec lo requiere
- [ ] **FSM**: Transiciones respetan máquina de estados spec
- [ ] **Convenciones**: Commits convencionales `feat(modulo): ...`
- [ ] **Linting**: ESLint/pylint sin errors
- [ ] **Type-check**: mypy/tsc sin errors
- [ ] **Formatting**: Prettier/Black aplicado uniformemente
- [ ] **Docstrings**: Funciones públicas tienen Google-style doc
- [ ] **No Hardcoding**: Constantes en config, no en código

---

## 📊 Template de Reporte

```markdown
# Verify Report: {change-name}

**Fecha**: 2026-05-08  
**Rama**: feature/{change-name}  
**Status**: [✅ PASS | ⚠️ WARNINGS | 🔴 FAILED]

---

## 1. Validación de Especificaciones

### Requirements RFC 2119
| Requirement | Tipo | Status | Evidencia |
|-------------|------|--------|-----------|
| Endpoint GET /productos con filtro categoria_id | MUST | ✅ | router.py:42 |
| Response schema includes producto.nombre | MUST | ✅ | schema.py:15 |
| Error 400 si categoria_id invalid | SHALL | ⚠️ | No valida tipo int |

### Scenarios GIVEN/WHEN/THEN
- ✅ Scenario 1: Cliente agrega item al carrito
- ✅ Scenario 2: Carrito se persiste en localStorage
- ❌ Scenario 3: Carrito vacío mostrar "0 items"

---

## 2. Validación de Testing

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Total Tests Passed | 100% | 24/25 | ⚠️ |
| Coverage (Backend) | >= 80% | 78% | ⚠️ |
| Coverage (Frontend) | >= 80% | 82% | ✅ |
| Linter Errors | 0 | 1 | ⚠️ |
| Type Errors | 0 | 0 | ✅ |

---

## 3. Validación Arquitectónica

### Backend Layers
- ✅ Router importa Service
- ✅ Service importa Repository + UoW
- ❌ Repository importa Model (correcto, pero verificar FK relationships)
- ⚠️ UoW maneja transacciones correctamente

### Frontend FSD
- ✅ features/carrito/cartStore.ts importa entities/CartItem
- ✅ widgets/Header importa features/carrito
- ✅ Respeta dirección de imports

### Data Management
- ✅ Soft delete en Producto, Pedido, Usuario
- ✅ Queries filtran `eliminado_en.is_(None)`
- ⚠️ Categoría tiene soft delete pero queries no filtran (encontrado en categorias/service.py)

---

## 4. Issues por Severidad

### 🔴 CRÍTICO (1)
1. **Scenario "Carrito vacío" no pasa**
   - Tipo: Testing
   - Ubicación: frontend/src/widgets/Header.test.tsx:45
   - Descripción: Badge se muestra aún con 0 items
   - Spec: "Si carrito vacío, NO mostrar badge"
   - Recomendación: Ajustar Header.tsx línea 20, agregar condicional `{totalItems > 0 && ...}`

### 🟠 ADVERTENCIA (1)
1. **Coverage backend < 80%**
   - Tipo: Testing
   - Ubicación: backend/productos/service.py
   - Descripción: Cobertura 78%, necesita >= 80%
   - Causa: Casos de error en `filter_by_categoria` sin tests
   - Recomendación: Agregar tests para `categoria_id inválido` en test_service.py

### 🟡 SUGERENCIA (1)
1. **Categorías sin soft delete en queries**
   - Tipo: Arquitectura
   - Ubicación: backend/categorias/service.py
   - Descripción: soft delete existe pero queries no filtran `eliminado_en`
   - Impacto: No inmediato (categorías rara vez se "elimina")
   - Recomendación: Aplicar patrón consistentemente en próxima iteración

---

## 5. Summary

| Métrica | Resultado |
|---------|-----------|
| Specs compliance | 5/6 requirements OK (83%) |
| Test pass rate | 24/25 (96%) |
| Coverage | Frontend 82%, Backend 78% |
| Linter | 1 warning (correctable) |
| Type-check | ✅ Clean |
| Architecture | ✅ Capas correctas |

---

## 6. Recomendación

**Status Final**: ⚠️ **BLOQUEO: CRÍTICO**

- 1 issue CRÍTICO debe corregirse antes de Archive
- 1 issue ADVERTENCIA: revisar cobertura backend
- 1 issue SUGERENCIA: para futura iteración

**Siguiente paso**: Volver a sdd-apply, corregir Header.tsx y agregar test.
Luego re-run verify.

---

## Signed Off

Verificador: sdd-verify  
Fecha: 2026-05-08 14:30 UTC  
Cambio: change-001-carrito-frontend
```

---

## 🎯 Decisión: Bloquear o Pasar

| Severidad | Decisión |
|-----------|----------|
| 🔴 CRÍTICO | ❌ Bloquea, vuelve a Apply |
| 🟠 ADVERTENCIA | ⚠️ Reporta, user decide |
| 🟡 SUGERENCIA | ✅ Prosigue, documenta para próxima |

**Regla de Oro**: Si hay CRÍTICO, reporte es status `FAILED`, NO procede a Archive.

---

## 📖 Referencias

- **Especificaciones SDD**: `openspec/CONVENTIONS.md`
- **RFC 2119**: https://tools.ietf.org/html/rfc2119
- **Testing Best Practices**: `skills/sdd-apply/SKILL.md` → Testing section
- **Arquitectura Backend**: `AGENTS.md` → "Reglas de Arquitectura"
- **pytest coverage**: https://pytest-cov.readthedocs.io/
- **NYC coverage (frontend)**: https://github.com/istanbuljs/nyc

