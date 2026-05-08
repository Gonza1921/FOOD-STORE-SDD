# SDD Quick Start — Food Store

Guía rápida de 5 minutos para empezar a trabajar con SDD.

---

## 🎯 Los 8 Pasos del SDD

```
1️⃣ /sdd-explore (opcional)       ← Investigar viabilidad
       ↓
2️⃣ /sdd-new us-XXX               ← Crear propuesta (< 300 palabras)
       ↓
3️⃣ /sdd-spec                     ← Escribir specs (GIVEN/WHEN/THEN)
       ↓
4️⃣ /sdd-design                   ← Arquitectura y decisiones
       ↓
5️⃣ /sdd-tasks                    ← Desglosar en tasks (max 2h cada una)
       ↓
6️⃣ /sdd-apply                    ← Implementar + commits
       ↓
7️⃣ /sdd-verify                   ← Validar contra specs
       ↓
8️⃣ /sdd-archive                  ← Cerrar y documentar
```

---

## 📝 Plantillas Mínimas

### Propuesta (Paso 2)
```markdown
# Propuesta: {nombre}

## Intención
{2 párrafos: QUÉ y POR QUÉ}

## Scope
**Entra**: Item 1, Item 2
**NO entra**: Item 3, Item 4

## Complejidad Estimada
[Baja | Media | Alta]

## Riesgos
{3-5 puntos principales}
```

### Specs (Paso 3)
```markdown
# Especificaciones: {nombre}

## Requisitos Funcionales

### RF-001: {Descripción}
**MUST** | **SHOULD**
- Criterio 1
- Criterio 2

### Scenario: {Nombre}
**GIVEN** condición inicial  
**WHEN** acción  
**THEN** resultado esperado

#### Error Case:
**GIVEN** error condition  
**WHEN** acción  
**THEN** HTTP 400 "mensaje claro"
```

### Design (Paso 4)
```markdown
# Diseño Técnico: {nombre}

## Arquitectura General
```
Router → Service → UoW → Repository → Model
```

## Cambios en Backend
- Nueva tabla: `tabla_nueva`
- Nuevo servicio: `ProductoService.nueva_operación()`

## Cambios en Frontend
- Nuevo componente: `src/widgets/NuevoWidget/`
- Nuevo hook: `useNuevaFeature()`

## Decisiones Arquitectónicas
| Decisión | Problema | Solución | Trade-off |
|----------|----------|----------|-----------|
| Zustand vs Redux | State mgmt | Zustand | Comunidad pequeña |

## Performance & Seguridad
- Query con índice en `categoria_id`
- Rol ADMIN requerido para crear
```

### Tasks (Paso 5)
```markdown
# Tasks: {nombre}

## Estimado Total
7 horas (1 persona)

## Tareas

### 1. Setup
#### 1.1 Crear migración
- 30 min
- `alembic revision --autogenerate -m "..."`
- Done: migración ejecuta sin errores

#### 1.2 Definir modelo
- 45 min
- `backend/models/producto.py`
- Done: tipo hints completos, tests pasan

### 2. Implementation
#### 2.1 Service
- 1 hora
- `backend/services/producto.py`
- Done: lógica implementada, coverage > 80%

### 3. Testing
#### 3.1 Tests unitarios
- 1 hora
- `backend/tests/test_producto.py`
- Done: 80%+ coverage
```

---

## 🔑 Palabras Clave RFC 2119

Usa en Specs (Paso 3):

| Palabra | Significado | Uso |
|---------|------------|-----|
| **MUST** | Obligatorio, sin excepción | Requisitos críticos |
| **SHALL** | Obligatorio (formal) | Requisitos formales |
| **SHOULD** | Recomendado, excepciones posibles | Buenas prácticas |
| **MAY** | Opcional | Características futuras |
| **MUST NOT** | Prohibido | Restricciones críticas |

Ejemplo:
```markdown
### RF-001: Login con JWT

- RF-001.1: El usuario MUST proporcionar email y contraseña
- RF-001.2: El servidor MUST responder en < 200ms
- RF-001.3: La contraseña SHOULD tener 8+ caracteres
- RF-001.4: El token MAY incluir información adicional
```

---

## ✍️ Formato GIVEN/WHEN/THEN (Specs)

**Regla**: Cada Scenario debe tener GIVEN, WHEN, THEN

```gherkin
**Scenario**: Cliente agrega producto al carrito

GIVEN    el cliente está autenticado
AND      visualiza la página de producto "Pizza"
WHEN     hace clic en "Agregar al Carrito"
AND      selecciona cantidad 2
THEN     el carrito se incrementa a 2 ítems
AND      se muestra notificación "Agregado ✓"
AND      el estado se persiste en localStorage

---

**Scenario**: Error — Stock insuficiente

GIVEN    el producto tiene 1 unidad disponible
AND      el cliente intenta agregar 2 unidades
WHEN     hace clic en "Agregar al Carrito"
THEN     respuesta HTTP 400
AND      mensaje: "Stock insuficiente (disponible: 1)"
AND      el carrito no cambia
```

---

## 📂 Archivos Clave

```
AGENTS.md                       ← Guía completa del proyecto
openspec/
  ├── config.yaml              ← Contexto y reglas del proyecto
  ├── README.md                ← Setup OpenSpec
  ├── CONVENTIONS.md           ← Estándares detallados
  └── changes/
      └── us-002-ejemplo/
          ├── proposal.md      ← Intención (paso 2)
          ├── specs.md         ← Requirements (paso 3)
          ├── design.md        ← Arquitectura (paso 4)
          └── tasks.md         ← Checklist (paso 5)
```

---

## ✅ Checklist Antes de Pasar de Fase

### Antes de Specs (después Propuesta)
- [ ] Propuesta < 300 palabras
- [ ] Scope claro (qué entra/no)
- [ ] Complejidad estimada
- [ ] Riesgos identificados

### Antes de Design (después Specs)
- [ ] Mínimo 3 scenarios GIVEN/WHEN/THEN
- [ ] RFC 2119 keywords presentes
- [ ] Inputs/outputs definidos
- [ ] Acceptance criteria testeable

### Antes de Tasks (después Design)
- [ ] Capas/módulos afectados claros
- [ ] Schema changes documentados
- [ ] Decisiones arquitectónicas justificadas
- [ ] Performance considerado

### Antes de Apply (después Tasks)
- [ ] Cada task ≤ 2 horas
- [ ] Numeración jerárquica (1.1, 1.2, etc.)
- [ ] Done criteria específico para cada task
- [ ] Commits convencionales preparados

### Antes de Verify (después Apply)
- [ ] Código implementado según specs
- [ ] Tests unitarios (coverage > 80%)
- [ ] Linter sin errores
- [ ] Type checking limpio

### Antes de Archive (después Verify)
- [ ] Todos los tests pasan
- [ ] Código mergeado a develop
- [ ] Documentación actualizada
- [ ] No hay issues abiertos

---

## 🚀 Comando Rápido para Empezar

```bash
# 1. Investigar (opcional)
/sdd-explore [tema]

# 2. Crear propuesta
/sdd-new us-001-login

# 3. Ver qué crear a continuación
# El orchestrator sugerirá /sdd-spec

# 4. Cuando esté todo listo: verificar
/sdd-verify

# 5. Finalizar
/sdd-archive
```

---

## 📊 Estimaciones Típicas

| Fase | Tiempo | Dependencias |
|------|--------|--------------|
| Explore | 30 min | Ninguna |
| Propose | 30 min | Exploración (opt) |
| Spec | 1-2 h | Propuesta |
| Design | 1-2 h | Propuesta + Spec |
| Tasks | 1 h | Spec + Design |
| Apply | 3-10 h | Tasks (depende complejidad) |
| Verify | 30 min | Apply completo |
| Archive | 15 min | Verify OK |

**Total**: 8-20 horas por cambio (depende tamaño)

---

## 🎓 Ejemplo Completo: Login con JWT

### Paso 1 - Propuesta (30 min)

```markdown
# Propuesta: Autenticación JWT

## Intención
Implementar login seguro con JWT dual-token (access + refresh).
Permite a clientes autenticarse y acceder a endpoints protegidos.

## Scope
**Entra**: Login, registro, refresh token, logout, RBAC
**NO entra**: OAuth/SSO, 2FA, biometría

## Complejidad
Media (2-3 días)
```

### Paso 2 - Specs (1-2 h)

```markdown
# Specs: Autenticación JWT

## RF-001: Login
**MUST** retornar access token (30 min) y refresh token (7 días)
**MUST** validar credenciales contra bcrypt
**MUST** rate limit: 5 intentos / 15 minutos

**Scenario**: Login exitoso
**GIVEN** usuario existe y contraseña correcta
**WHEN** POST /api/v1/auth/login {"email", "password"}
**THEN** 200 OK con {"access_token", "refresh_token", "user"}

**Scenario**: Credenciales inválidas
**GIVEN** email correcto, contraseña incorrecta
**WHEN** POST /api/v1/auth/login
**THEN** 401 Unauthorized
```

### Paso 3 - Design (1-2 h)

```markdown
# Design: Autenticación JWT

## Backend
- Router: POST /auth/login
- Service: verificar credenciales, generar tokens
- Repository: buscar usuario, guardar refresh token
- Model: Usuario, RefreshToken

## Frontend
- Hook: useLogin()
- Store Zustand: authStore (tokens, user)
- Axios interceptor: adjuntar Bearer token

## Decision: JWT vs Session
**Problema**: Servidor stateless, múltiples instancias
**Solución**: JWT (token auto-validado)
**Trade-off**: Token en client, puede ser interceptado
```

### Paso 4 - Tasks (1 h)

```markdown
# Tasks: Autenticación JWT

### 1. Backend
#### 1.1 Models & Schema (30 min)
- Crear User, RefreshToken models
- Pydantic schemas: LoginRequest, TokenResponse

#### 1.2 Service (1 h)
- Validar credenciales
- Generar tokens JWT
- Guardar refresh token

#### 1.3 Router (1 h)
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

#### 1.4 Tests (1.5 h)
- Test login exitoso
- Test credenciales inválidas
- Test refresh token

### 2. Frontend
#### 2.1 Hook & Store (1 h)
- useLogin hook
- authStore (Zustand)

#### 2.2 Axios interceptor (30 min)
- Adjuntar Bearer token
- Renovar en 401

#### 2.3 Components (1 h)
- LoginForm component
- Tests

**Total**: 7 horas
```

### Paso 5-8 - Apply, Verify, Archive

El orchestrator coordina implementación, validación y archivo del cambio.

---

## 💡 Tips

✅ **Haz**: Propuestas concisas, specs detalladas, tasks pequeñas  
❌ **No hagas**: Tasks > 2 horas, specs sin scenarios, diseños sin justificación  
✅ **Verifica**: RFC 2119 en specs, GIVEN/WHEN/THEN en scenarios  
❌ **No confundas**: Propuesta (intención) ≠ Spec (reqs) ≠ Design (arquitectura)  
✅ **Documenta**: Decisiones, trade-offs, riesgos  
❌ **No improvises**: Sigue specs al pie de la letra en Apply

---

**Última actualización**: Mayo 8, 2026  
**Versión**: 1.0 Quick Start
