# Spec: REST Fallback Endpoint para KDS

## Overview

Endpoint REST de respaldo para el Kitchen Display System. Usado para carga inicial de datos y como fallback por polling cuando el WebSocket no está disponible.

## Requirements

### REQ-001: GET /api/v1/cocina/pedidos

El sistema SHALL exponer un endpoint `GET /api/v1/cocina/pedidos` protegido con `require_role(["COCINA", "PEDIDOS", "ADMIN"])` que retorne los pedidos activos en cocina.

**Scenarios:**

**Scenario: Retorna pedidos activos en cocina**
- Given: existen pedidos en estados `CONFIRMADO` y `EN_PREP` en la base de datos
- When: un usuario autorizado hace GET a `/api/v1/cocina/pedidos`
- Then: retorna status 200
- And: el body contiene un array de pedidos
- And: solo incluye pedidos en estado `CONFIRMADO` o `EN_PREP`
- And: no incluye pedidos en `PENDIENTE`, `EN_CAMINO`, `ENTREGADO` ni `CANCELADO`

**Scenario: Ordenado por antigüedad ascendente**
- Given: múltiples pedidos en `CONFIRMADO` y `EN_PREP`
- When: se consulta el endpoint
- Then: los pedidos están ordenados por antigüedad ascendente (el que entró primero a cocina aparece primero)
- And: el criterio de orden es `HistorialEstadoPedido.created_at` del registro donde el pedido entró al estado actual

**Scenario: Sin pedidos activos**
- Given: no hay pedidos en `CONFIRMADO` ni `EN_PREP`
- When: un usuario autorizado hace GET al endpoint
- Then: retorna status 200
- And: el body contiene un array vacío

**Scenario: 401 sin autenticación**
- Given: un request sin token JWT
- When: se hace GET al endpoint
- Then: retorna status 401

**Scenario: 403 con rol insuficiente**
- Given: un usuario con rol `CLIENT` autenticado
- When: se hace GET al endpoint
- Then: retorna status 403

### REQ-002: Formato de respuesta

Cada pedido en la respuesta SHALL incluir los campos necesarios para que el KDS muestre la información sin llamadas adicionales.

**Scenarios:**

**Scenario: Campos del pedido**
- Given: una respuesta exitosa del endpoint
- Then: cada pedido contiene: `id`, `estado_codigo`, `subtotal`, `total`, `notas`, `creado_en`
- And: contiene `items` (array con `nombre_snapshot`, `cantidad`, `precio_snapshot`, `ingredientes_excluidos`)
- And: contiene `tiempo_en_estado` (segundos desde que entró al estado actual)
- And: contiene `cliente_nombre` (nombre del usuario que creó el pedido)
