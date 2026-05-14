# SKILLS.md — Registro de Agentes IA

Registro centralizado de todas las skills (agentes IA) disponibles en FOOD-STORE. Este archivo actúa como índice de referencia para el orchestrator y cualquier agente que necesite invocar skills especializadas.

---

## 📋 Tabla de Contenidos

1. [Skills SDD (Internas)](#skills-sdd-internas)
2. [Skills Externas](#skills-externas)
3. [Cómo Invocar](#cómo-invocar)
4. [Estado y Disponibilidad](#estado-y-disponibilidad)

---

## 🚀 Skills SDD (Internas)

Estas 6 skills implementan el ciclo completo de **Spec-Driven Development (SDD)** usando el framework **OpenSpec (OPSX)**. Son el core del workflow del proyecto.

| # | Skill | Propósito | Fase SDD | Archivo |
|---|-------|-----------|----------|---------|
| 1 | `sdd-explore` | Investigar ideas sin compromiso | Exploración | `skills/sdd-explore/SKILL.md` |
| 2 | `sdd-propose` | Crear propuesta de cambio | Propuesta | `skills/sdd-propose/SKILL.md` |
| 3 | `sdd-spec` | Escribir especificaciones | Especificación | `skills/sdd-spec/SKILL.md` |
| 4 | `sdd-design` | Diseño técnico | Diseño | `skills/sdd-design/SKILL.md` |
| 5 | `sdd-tasks` | Desglose en tareas | Planificación | `skills/sdd-tasks/SKILL.md` |
| 6 | `sdd-apply` | Implementar código | Implementación | `skills/sdd-apply/SKILL.md` |
| 7 | `sdd-verify` | Validar contra specs | Verificación | `skills/sdd-verify/SKILL.md` |
| 8 | `sdd-archive` | Cerrar y archivar cambio | Archivo | `skills/sdd-archive/SKILL.md` |

### Flujo SDD

```
Explore → Propose → Spec → Design → Tasks → Apply → Verify → Archive
```

> **Nota**: Las skills SDD del 2-8 también están disponibles como **comandos slash** (ej: `/sdd-explore`, `/sdd-spec`, etc.). Consulta la sección [Cómo Invocar](#cómo-invocar) para detalles.

---

## 🔌 Skills Externas

Skills reutilizables del ecosistema que complementan el workflow SDD core. Se instalan via npm y se integran cuando son necesarias.

### Disponibles

| Skill | Fuente | Propósito | Estado |
|-------|--------|-----------|--------|
| `find-skills` | vercel-labs/skills | Descubrir skills del ecosistema | ✅ Activo |
| `branch-pr` | opencode (built-in) | Crear pull requests siguiendo workflow de issues | ✅ Activo |
| `issue-creation` | opencode (built-in) | Crear issues de GitHub con workflow estructurado | ✅ Activo |
| `go-testing` | opencode (built-in) | Testing patterns para Go y Bubbletea TUI | ✅ Activo |
| `customize-opencode` | opencode (built-in) | Editar configuración de opencode | ✅ Activo |
| `judgment-day` | opencode (built-in) | Review adversarial paralelo | ✅ Activo |
| `skill-creator` | opencode (built-in) | Crear nuevas skills IA | ✅ Activo |

### Cómo Agregar Nueva Skill Externa

```bash
# 1. Descubrir skill con find-skills
/find-skills testing

# 2. Instalar
npx skills add <url> --skill <nombre>

# 3. Actualizar este archivo (agregar a tabla)
```

---

## 🎯 Cómo Invocar

### Slash Commands (Recomendado)

Desde cualquier contexto, invoca directamente:

```bash
# SDD Core
/sdd-explore <topic>              # Investigar tema
/sdd-propose <change-name>       # Crear propuesta
/sdd-spec                         # Escribir specs (usa change activo)
/sdd-design                       # Escribir diseño
/sdd-tasks                       # Desglose en tareas
/sdd-apply                       # Implementar tareas
/sdd-verify                      # Validar implementación
/sdd-archive                     # Cerrar y archivar change

# Externas
/find-skills <category>          # Buscar skills
/issue-creation                  # Crear issue
/branch-pr                       # Crear PR
/judgment-day                    # Review adversarial
```

### Vía Task Tool (Programático)

```typescript
// Invocar skill específica
task(
  prompt: "Investigar autenticación JWT vs sessions",
  subagent_type: "sdd-explore"
)
```

###through OpenSpec CLI

```bash
# Workflow SDD integrado
openspec new change "nombre-del-cambio"
openspec status --change "nombre" --json
openspec instructions apply --change "nombre" --json
```

---

## 📊 Estado y Disponibilidad

### Madurez

| Skill | Tipo | Madurez | Mantenimiento |
|-------|------|---------|---------------|
| sdd-explore | SDD Core | 🟢 Estable | Activo |
| sdd-propose | SDD Core | 🟢 Estable | Activo |
| sdd-spec | SDD Core | 🟢 Estable | Activo |
| sdd-design | SDD Core | 🟢 Estable | Activo |
| sdd-tasks | SDD Core | 🟢 Estable | Activo |
| sdd-apply | SDD Core | 🟢 Estable | Activo |
| sdd-verify | SDD Core | 🟢 Estable | Activo |
| sdd-archive | SDD Core | 🟢 Estable | Activo |
| find-skills | Externa | 🟢 Estable | Comunidad |
| branch-pr | Externa | 🟢 Estable | opencode |
| issue-creation | Externa | 🟢 Estable | opencode |
| go-testing | Externa | 🟢 Estable | opencode |
| customize-opencode | Externa | 🟢 Estable | opencode |
| judgment-day | Externa | 🟢 Estable | opencode |
| skill-creator | Externa | 🟢 Estable | opencode |

### Convenciones de Nombrado

- **Skills SDD**: Prefijo `sdd-` + nombre descriptivo (kebab-case)
- **Skills externas**: Nombre del paquete original (sin prefijos)

---

## 🔗 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `AGENTS.md` | Framework completo de colaboración IA |
| `skills/README.md` | Documentación detallada de skills SDD |
| `openspec/config.yaml` | Configuración del proyecto para OPSX |
| `.opencode/opencode.json` | Configuración de opencode |

---

## 📝 Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-05-14 | Versión inicial — 8 skills SDD + 7 externas |

---

**Última actualización**: Jueves 14 de Mayo de 2026  
**Versión**: 1.0  
**Owner**: SDD Orchestrator Framework  
**Status**: ✅ Operacional