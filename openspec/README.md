# OpenSpec SDD Setup — Food Store

Bienvenido al flujo Spec-Driven Development de Food Store. Este documento te guía en la estructura y cómo iniciar cambios.

---

## 📁 Estructura de Artefactos

```
openspec/
├── config.yaml              ← Configuración del proyecto (contexto, reglas)
├── CONVENTIONS.md           ← Estándares para escribir specs, diseño, tasks
├── specs/                   ← Especificaciones maestras (fuente de verdad)
│   └── {spec-name}/
│       └── spec.md
├── changes/                 ← Cambios activos en desarrollo
│   └── {change-name}/
│       ├── proposal.md      ← Intención y scope (< 300 palabras)
│       ├── specs.md         ← Requirements detallados (GIVEN/WHEN/THEN)
│       ├── design.md        ← Arquitectura y decisiones
│       ├── tasks.md         ← Checklist de tareas (max 2h cada una)
│       ├── apply-progress.md ← Estado de implementación (progreso)
│       └── .openspec.yaml   ← Metadatos del change
└── archive/                 ← Cambios completados (histórico)
    └── 2026-04-29-backend-core-setup/
        ├── proposal.md
        ├── specs.md
        ├── design.md
        └── tasks.md
```

---

## 🚀 Cómo Iniciar un Cambio

### Paso 1: Explorar (Opcional)

Si necesitas investigar viabilidad o comparar enfoques:

```bash
/sdd-explore categorías jerárquicas en PostgreSQL
```

El agente Explorer investigará el codebase y reportará hallazgos **sin crear archivos**.

---

### Paso 2: Crear Propuesta

Para iniciar un **nuevo cambio**:

```bash
/sdd-new us-002-categorías-jerárquicas
```

El agente Proposer generará:
- `openspec/changes/us-002-categorías-jerárquicas/proposal.md`

**Propuesta**: Define INTENCIÓN y SCOPE (< 300 palabras, sin detalles de implementación)

---

### Paso 3: Escribir Especificaciones

Para definir **requirements exactos**:

```bash
/sdd-spec
```

El agente Specifier leerá la propuesta y creará:
- `openspec/changes/us-002-categorías-jerárquicas/specs.md`

**Specs**: Requirements con RFC 2119 (MUST/SHOULD/MAY), scenarios GIVEN/WHEN/THEN, acceptance criteria

---

### Paso 4: Diseño Técnico

Para arquitectura y decisiones:

```bash
/sdd-design
```

El agente Designer generará:
- `openspec/changes/us-002-categorías-jerárquicas/design.md`

**Design**: Capas afectadas, schema changes, flujos de datos, trade-offs

---

### Paso 5: Desglosar en Tasks

Para dividir en chunks ejecutables:

```bash
/sdd-tasks
```

El agente Task Planner creará:
- `openspec/changes/us-002-categorías-jerárquicas/tasks.md`

**Tasks**: Jerarquía numérica (1, 1.1, 1.2), max 2 horas cada una, done criteria claro

---

### Paso 6: Implementación

Para ejecutar las tasks:

```bash
/sdd-apply
```

El agente Implementer:
- Ejecuta tarea por tarea
- Un commit convencional por tarea (`feat(categorías): ...`)
- Marca tasks como completadas
- Crea `apply-progress.md` con estado

---

### Paso 7: Validación

Para verificar que la implementación cumple specs:

```bash
/sdd-verify
```

El agente Verifier:
- Compara código contra cada scenario GIVEN/WHEN/THEN
- Ejecuta tests (pytest, npm test)
- Reporte: ✅ CRÍTICO | ⚠️ ADVERTENCIA | 💡 SUGERENCIA

**Si hay issues**: Vuelve a Step 6 para fixes, NO es el Verifier quien arregla

---

### Paso 8: Archivar

Para finalizar el cambio:

```bash
/sdd-archive
```

El agente Archiver:
- Sincroniza delta specs → specs maestras
- Archiva change en `openspec/archive/2026-05-08-us-002-categorías/`
- Limpia estado de trabajo
- Documenta lecciones aprendidas

---

## 📋 Convenciones Quick Reference

### Nombres de Cambios

```
us-001-auth                  ← User story simplificada
us-002-categorías-jerárquicas
feature-checkout-flow
fix-stock-sync-race-condition
refactor-pedidos-fsm
```

**Formato**: `{tipo}-{slug}` (minúsculas, guiones, sin espacios)

### RFC 2119 Keywords (en Specs)

- **MUST**: Obligatorio, no hay excepción
- **SHALL**: Obligatorio (formal)
- **SHOULD**: Recomendado pero no obligatorio
- **MAY**: Opcional
- **MUST NOT**: Prohibido

### Scenarios GIVEN/WHEN/THEN

```gherkin
**Scenario**: {Nombre descriptivo}

GIVEN    {Condición inicial 1}
AND      {Condición inicial 2}
WHEN     {Acción que dispara}
THEN     {Resultado esperado}
AND      {Resultado adicional}
```

### Task Numbering

```
1. Fase 1: Setup
   1.1 Subtarea setup
   1.2 Otra subtarea setup
2. Fase 2: Implementation
   2.1 Feature X backend
   2.2 Feature X frontend
```

---

## 🎯 Ejemplos de Cambios Completados

Revisa archivos archivados para ver estructura completa:

```
openspec/archive/2026-04-29-backend-core-setup/
├── proposal.md      ← Cómo escribir propuestas
├── specs.md         ← Cómo escribir specs
├── design.md        ← Cómo estructurar diseño
└── tasks.md         ← Cómo desglosar en tasks
```

---

## 🔍 Validación de Artefactos

### Propuesta ✓
- [ ] QUÉ y POR QUÉ claro
- [ ] Scope definido (entra/no entra)
- [ ] Complejidad estimada
- [ ] < 300 palabras

### Specs ✓
- [ ] RFC 2119 keywords presente
- [ ] Mínimo 3 scenarios
- [ ] Inputs/outputs definidos
- [ ] Acceptance criteria testeable

### Design ✓
- [ ] Capas/módulos afectados
- [ ] Schema changes documentados
- [ ] Decisiones justificadas
- [ ] Performance & seguridad consideradas

### Tasks ✓
- [ ] Máximo 2 horas por task
- [ ] Numeración jerárquica
- [ ] Done criteria claro
- [ ] Commits convencionales listos

---

## 📚 Referencias

- **Convenciones detalladas**: `openspec/CONVENTIONS.md`
- **Configuración del proyecto**: `openspec/config.yaml`
- **Guía de desarrollo**: `AGENTS.md`
- **Documentación técnica**: `docs/Descripcion.txt`, `docs/Integrador.txt`

---

## 💬 Soporte

### Preguntas Frecuentes

**P: ¿Puedo saltarme la Exploración?**  
R: Sí, es opcional. Si ya sabes cómo hacerlo, ve directo a Propuesta.

**P: ¿Cuánto tiempo toma cada fase?**  
R: Propuesta (30 min) → Specs (1h) → Design (1h) → Tasks (1h) → Apply (depende) → Verify (30 min) → Archive (15 min)

**P: ¿Qué pasa si los tests fallan en Verify?**  
R: No arregle. Reporte al Verifier, que escalará al Orchestrator para volver a Apply.

**P: ¿Puedo cambiar un Spec después de comenzar la implementación?**  
R: Solo si cambio el requisito. Si es clarificación menor, documenta en apply-progress.

---

**Última actualización**: Mayo 8, 2026  
**Versión**: 1.0  
**Modo**: SDD Orchestrator — Operacional ✅
