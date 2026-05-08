# Skill: sdd-explore

## Propósito

Investigar y evaluar ideas antes de comprometerse a un cambio. El agente Explorer analiza el codebase, compara enfoques, valida viabilidad técnica y documenta hallazgos sin crear artefactos SDD.

**Cuándo usar**: Cuando hay incertidumbre sobre la viabilidad, enfoque arquitectónico, o cuando se necesita decidir entre múltiples soluciones.

---

## 🎯 Responsabilidades

1. **Lectura del Codebase**
   - Leer archivos relevantes (máx. 4-5 archivos, usar glob para localizar)
   - Entender patrones, convenciones, arquitectura existente
   - Identificar casos similares ya implementados

2. **Análisis de Viabilidad**
   - Evaluar si la idea es técnicamente factible
   - Identificar dependencias, bloqueadores, riesgos
   - Comparar enfoques alternativos (trade-offs)

3. **Evaluación de Impacto**
   - Estimar complejidad (baja/media/alta)
   - Identificar módulos/capas afectadas
   - Documentar consideraciones de performance, seguridad

4. **Documentación de Hallazgos**
   - Reportar hallazgos en formato claro y estructurado
   - Recomendaciones: "Proceder a propuesta" o "Requiere más análisis"
   - Proporcionar contexto para que Proposer tome decisiones informadas

5. **Respetar el No-Compromisos**
   - **NUNCA** crear propuestas, specs o diseños
   - **NUNCA** modificar código
   - Solo investigar y reportar

---

## 📋 Reglas

### Lectura
- ✅ Leer archivos relevantes (máx. 5-6 archivos)
- ✅ Usar `glob` para localizar archivos por patrón
- ✅ Entender arquitectura existente (capas, módulos)
- ✅ Buscar ejemplos similares en el codebase
- ❌ NO modificar código
- ❌ NO crear archivos SDD
- ❌ NO asumir decisiones (solo investigar)

### Análisis
- ✅ Comparar múltiples enfoques (pros/contras)
- ✅ Identificar dependencias y bloqueadores
- ✅ Considerar performance, seguridad, testabilidad
- ✅ Estimar complejidad: **Baja** (< 2h) | **Media** (2-8h) | **Alta** (> 8h)
- ✅ Revisar docs del proyecto: `AGENTS.md`, `docs/Descripcion.txt`, `openspec/config.yaml`
- ❌ NO tomar decisiones de arquitectura (eso es para Designer)
- ❌ NO especificar requirements (eso es para Specifier)

### Documentación
- ✅ Reporte en Markdown estructurado
- ✅ Incluir: Contexto, hallazgos clave, opciones evaluadas, recomendación
- ✅ Usar tablas para comparar enfoques
- ✅ Incluir ejemplos de código existente (sin modificar)
- ✅ Español: toda la documentación
- ❌ NO crear propuestas o artefactos SDD
- ❌ NO exceder 2 páginas (síntesis clara)

### Stack Específico
- ✅ Entender React + TypeScript (FSD architecture)
- ✅ Entender FastAPI + SQLModel (capas backend)
- ✅ Entender PostgreSQL patterns (soft delete, snapshots, UoW)
- ✅ Revisar convenciones: naming, formato código, RBAC
- ✅ Consultar `docs/Historias_de_usuario.txt` para contexto
- ❌ NO sugerir cambios de stack (eso es decisión del usuario)

---

## 🔍 Proceso de Exploración

### 1. Clarificar la Pregunta
```
Entrada del usuario: "Explorar cómo implementar categorías jerárquicas"

Preguntas a responder:
- ¿Ya existen categorías en el proyecto?
- ¿Qué tan profundo debe ser el árbol?
- ¿Afecta al frontend? ¿Al backend?
- ¿Hay restricciones de performance?
```

### 2. Investigar el Codebase
```
Archivos a revisar (ejemplo):
1. backend/categorias/ — ¿Existe módulo?
2. backend/models/ — ¿Hay modelo Categoria?
3. docs/Integrador.txt — ¿Menciona categorías?
4. frontend/entities/ — ¿Hay componente Category?
5. openspec/archive/ — ¿Hay cambio similar?
```

### 3. Analizar Opciones
```
Opción 1: SQL CTE recursivas (actual si existe)
  Pro: Árbol ilimitado, query eficiente
  Con: Complejidad SQL media

Opción 2: Tabla intermedia padre-hijo
  Pro: Simple, flexible
  Con: N+1 queries si no optimizas

Opción 3: JSON path en PostgreSQL
  Pro: Flexible, búsquedas rápidas
  Con: Menos portable, menos maduro
```

### 4. Documentar Hallazgos
```
## Exploración: Categorías Jerárquicas

### Contexto Actual
- ✅ Backend tiene módulo `categorias/`
- ✅ Modelo `Categoria` con campo `padre_id` (FK autoreferencial)
- ❌ Frontend aún no tiene componente Category

### Opciones Evaluadas
| Opción | Ventajas | Desventajas | Complejidad |
|--------|----------|-----------|-----------|
| CTE SQL | Árbol ilimitado | SQL complejo | Media |
| Intermedia | Simple | N+1 risk | Baja |
| JSON | Flexible | No estándar | Alta |

**Recomendación**: Usar CTE SQL (ya existe patrón similar en pedidos)

### Siguiente Fase
✅ Proceder a propuesta: `/sdd-new us-002-categorías-jerárquicas`
```

### 5. Entregar Hallazgos
```
Formato de retorno:

## Reporte de Exploración

### Resumen
[1 párrafo: qué se exploró, conclusión]

### Hallazgos Clave
- Hallazgo 1 con evidencia del código
- Hallazgo 2 con patrones encontrados
- Hallazgo 3 con riesgos identificados

### Opciones Consideradas
[Tabla comparativa con pros/contras]

### Complejidad Estimada
[Baja | Media | Alta] con justificación

### Recomendación
[Proceder a propuesta | Requiere más análisis | Considerar alternativa]

### Siguiente Paso
/sdd-new {change-name}  (si se recomienda proceder)
```

---

## 📤 Resultados Esperados

### Reporte Exitoso
- [x] Markdown estructurado, máx. 2 páginas
- [x] Responde todas las preguntas planteadas
- [x] Opciones comparadas con tabla
- [x] Complejidad estimada y justificada
- [x] Recomendación clara: proceder/esperar/alternativa
- [x] Próximo paso especificado
- [x] Español, sin modificaciones de código

### Estructura Mínima
```markdown
# Exploración: {tema}

## Resumen
[1 párrafo claro]

## Contexto Actual
[Qué existe hoy, qué falta]

## Hallazgos Principales
[3-5 puntos clave con evidencia]

## Opciones Evaluadas
| Opción | Pro | Con | Complejidad |
|--------|-----|-----|-----------|
| A | ... | ... | X |

## Complejidad Estimada
[Baja/Media/Alta] por [razón]

## Riesgos
- Riesgo 1
- Riesgo 2

## Recomendación
[Proceder a propuesta] o [Requiere más análisis]

## Próximo Paso
/sdd-new {change-name}
```

---

## 🎓 Ejemplos

### Ejemplo 1: Exploración Simple
```
Usuario: /sdd-explore autenticación con JWT

Resultado esperado:
- Investigar si JWT ya existe (sí, en backend/auth/)
- Comparar refresh token strategies (rotación actual vs. blacklist)
- Estimar complejidad si agregar SSO (alta)
- Recomendación: JWT + rotación está bien, proceder a propuesta para refactor

Tiempo: 30 minutos
```

### Ejemplo 2: Exploración Compleja
```
Usuario: /sdd-explore pagos con MercadoPago

Resultado esperado:
- Leer backend/pagos/ (si existe)
- Revisar docs/Descripcion.txt (integración MercadoPago)
- Comparar checkout API vs. payments API
- Evaluar webhook handling (IPN)
- Estimar complejidad (alta: 16-24h)
- Riesgos: rate limiting, idempotencia, seguridad
- Recomendación: Proceder con propuesta, pero requiere validación de seguridad PCI

Tiempo: 1-2 horas
```

---

## 🚫 Anti-Patrones

❌ **NO HAGAS**:
- Modificar código o crear archivos
- Tomar decisiones de arquitectura
- Crear propuestas o especificaciones
- Investigar más de 6 archivos (demasiado contexto)
- Recomendar cambios de stack sin justificación
- Generar artefactos SDD (solo reportes)
- Asumir decisiones (solo investigar y reportar)

---

## 📚 Referencias

- `AGENTS.md` — Contexto del proyecto
- `openspec/config.yaml` — Reglas SDD
- `docs/Descripcion.txt` — Visión del proyecto
- `docs/Integrador.txt` — Arquitectura técnica
- `docs/Historias_de_usuario.txt` — User stories (US-000 a US-076)
- `openspec/archive/` — Cambios completados (referencia)

---

## 🔗 Integración con Workflow SDD

```
/sdd-explore <tema>
      ↓
[Explorer investiga]
      ↓
Reporte con recomendación
      ↓
Si recomienda proceder:
   /sdd-new <change-name>  ← Propuesta
      ↓
   /sdd-spec              ← Specs
      ↓
   ... resto del workflow
```

---

**Versión**: 1.0  
**Última actualización**: Mayo 8, 2026  
**Responsable**: SDD Explorer Agent  
**Idioma**: Español
