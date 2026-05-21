# Spec: RBAC — Rol Cocinero (COCINA)

## Overview

Agregar el rol `COCINA` al catálogo de roles del sistema Food Store, permitiendo su asignación a usuarios operativos de cocina. Este spec cubre exclusivamente la capa de datos y seed necesaria para que el rol exista en el sistema y pueda ser referenciado por cambios posteriores (CH-023, CH-024).

## Requirements

### REQ-001: Nuevo rol COCINA en tabla catálogo

El sistema SHALL contener el registro `COCINA` en la tabla `rol` con los siguientes valores:

| Campo | Valor |
|-------|-------|
| `codigo` | `COCINA` |
| `nombre` | `Cocinero` |
| `descripcion` | `Operación de cocina: recibe pedidos confirmados y gestiona su preparación` |

**Scenarios:**

**Scenario: COCINA existe como rol válido**
- Given: la base de datos tiene la tabla `rol` con los roles existentes (ADMIN, STOCK, PEDIDOS, CLIENT)
- When: se ejecuta la migración que agrega el rol COCINA
- Then: la tabla `rol` contiene un registro con `codigo = 'COCINA'`
- And: el rol es asignable a usuarios vía `UsuarioRol.rol_codigo`
- And: el rol puede ser referenciado por `require_role(["COCINA"])` en dependencias FastAPI

**Scenario: Idempotencia del seed**
- Given: la migración ya fue ejecutada y el rol COCINA existe en la tabla `rol`
- When: se ejecuta la migración nuevamente
- Then: no se lanza error (ON CONFLICT DO NOTHING)
- And: no se duplica el registro en la tabla

### REQ-002: Seed de usuario de prueba con rol COCINA

El sistema SHALL incluir un seed de desarrollo con un usuario de prueba que tenga el rol `COCINA`, facilitando el testing manual y automatizado del Kitchen Display System.

| Campo | Valor |
|-------|-------|
| email | `cocina@foodstore.com` |
| password | `cocina123` |
| nombre | `Cocinero` |
| apellido | `Prueba` |
| rol | `COCINA` |

**Scenarios:**

**Scenario: Usuario cocina existe y tiene rol COCINA**
- Given: la migración seed se ejecutó correctamente
- When: se consulta el usuario con email `cocina@foodstore.com`
- Then: el usuario existe con nombre "Cocinero" y apellido "Prueba"
- And: el usuario tiene al menos el rol `COCINA` asignado vía `UsuarioRol`

**Scenario: Idempotencia del seed de usuario**
- Given: el usuario `cocina@foodstore.com` ya existe en la base de datos
- When: se ejecuta la migración nuevamente
- Then: no se lanza error
- And: no se duplica el usuario ni su asignación de rol

### REQ-003: Migración numerada como 008

La migración SHALL seguir la convención del proyecto: archivo `008_add_cocina_role.py` en `backend/migrations/versions/`, con `down_revision` apuntando a la última migración existente (`007_add_configuracion`).

**Scenarios:**

**Scenario: Migración se aplica correctamente**
- Given: la base de datos está en la revisión `007_add_configuracion`
- When: se ejecuta `alembic upgrade head`
- Then: la base de datos avanza a la nueva revisión 008
- And: los registros COCINA y el usuario de prueba existen en la base de datos

**Scenario: Rollback funciona**
- Given: la migración 008 fue aplicada
- When: se ejecuta `alembic downgrade -1`
- Then: la base de datos vuelve a la revisión 007
- And: el rol COCINA y el usuario de prueba ya no existen

## Out of Scope

- Cambios en el FSM de pedidos (CH-023)
- Endpoints de cocina o KDS (CH-023/024)
- Validación de transiciones FSM por rol (CH-023)
- Frontend guards de ruta (CH-024)
- Modificaciones a `require_role` o `core/dependencies.py`
