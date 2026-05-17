# Spec: admin-metricas-avanzadas

## Overview

Endpoints de métricas avanzadas para el panel de administración. Provee ranking de productos más vendidos y consulta de ventas en un período con granularidad configurable (día, semana, mes). Ambos endpoints requieren rol ADMIN y son accesibles bajo el prefijo `/api/v1/admin`.

## ADDED Requirements

### Requirement: Endpoint GET /api/v1/admin/metricas/productos-top

El sistema SHALL proveer un endpoint `GET /api/v1/admin/metricas/productos-top` que retorne los N productos más vendidos con su cantidad total vendida. Requiere rol ADMIN.

**Query parameters**:
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limite` | int | 10 | Cantidad máxima de productos a retornar (max 50) |

**Response 200** (ProductosTopResponse):
```json
{
  "productos": [
    {
      "id": "uuid",
      "nombre": "string",
      "cantidad_vendida": 150,
      "precio_actual": 1500.00,
      "ingreso_total": 225000.00
    }
  ]
}
```

**Error responses**:
| Status | Error Code | Condición |
|--------|-----------|-----------|
| 401 | UNAUTHORIZED | Token no provisto o inválido |
| 403 | FORBIDDEN | Usuario no tiene rol ADMIN |

#### Scenario: ADMIN obtiene top 10 productos más vendidos
- **WHEN** un usuario con rol ADMIN hace GET /api/v1/admin/metricas/productos-top con limite=10
- **THEN** el sistema retorna 200 OK
- **AND** la respuesta contiene un array `productos` con hasta 10 productos
- **AND** cada producto incluye id, nombre, cantidad_vendida, precio_actual, ingreso_total
- **AND** los productos están ordenados por cantidad_vendida descendente

#### Scenario: ADMIN solicita top 3 específico
- **WHEN** un usuario con rol ADMIN hace GET /api/v1/admin/metricas/productos-top?limite=3
- **THEN** el sistema retorna exactamente 3 productos (o menos si hay menos productos con ventas)
- **AND** los productos están ordenados por cantidad_vendida descendente

#### Scenario: Cliente sin rol ADMIN recibe 403
- **WHEN** un usuario con rol CLIENT (o cualquier rol no ADMIN) hace GET /api/v1/admin/metricas/productos-top
- **THEN** el sistema retorna 403 Forbidden con error_code "FORBIDDEN"

#### Scenario: Límite excede máximo permitido
- **WHEN** un ADMIN hace GET /api/v1/admin/metricas/productos-top?limite=100
- **THEN** el sistema retorna 422 Unprocessable Entity
- **AND** el mensaje indica que el máximo permitido es 50

#### Scenario: No hay productos vendidos retorna array vacío
- **WHEN** no existen pedidos con estado ENTREGADO (o PAGADO) en el sistema
- **THEN** el sistema retorna 200 OK con un array `productos` vacío `[]`

---

### Requirement: Endpoint GET /api/v1/admin/metricas/ventas

El sistema SHALL proveer un endpoint `GET /api/v1/admin/metricas/ventas` que retorne las ventas en un período con granularidad configurable. Requiere rol ADMIN.

**Query parameters**:
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `desde` | string (ISO date) | — (required) | Fecha de inicio del período |
| `hasta` | string (ISO date) | — (required) | Fecha de fin del período |
| `granularidad` | enum | `dia` | Agrupación: `dia`, `semana`, `mes` |

**Response 200** (VentasResponse):
```json
{
  "periodo": {
    "desde": "2026-01-01",
    "hasta": "2026-01-31",
    "granularidad": "dia"
  },
  "ventas": [
    {
      "periodo": "2026-01-01",
      "total_ventas": 15,
      "ingreso_total": 75000.00,
      "costo_envio_total": 7500.00
    },
    {
      "periodo": "2026-01-02",
      "total_ventas": 22,
      "ingreso_total": 110000.00,
      "costo_envio_total": 11000.00
    }
  ],
  "resumen": {
    "total_ventas": 37,
    "ingreso_total": 185000.00,
    "promedio_por_dia": 18500.00
  }
}
```

**Error responses**:
| Status | Error Code | Condición |
|--------|-----------|-----------|
| 401 | UNAUTHORIZED | Token no provisto o inválido |
| 403 | FORBIDDEN | Usuario no tiene rol ADMIN |
| 422 | VALIDATION_ERROR | desde o hasta faltantes, formato inválido, o hasta < desde |
| 422 | VALIDATION_ERROR | granularidad no es uno de: dia, semana, mes |

#### Scenario: ADMIN consulta ventas por día en un mes
- **WHEN** un usuario con rol ADMIN hace GET /api/v1/admin/metricas/ventas?desde=2026-01-01&hasta=2026-01-31&granularidad=dia
- **THEN** el sistema retorna 200 OK
- **AND** la respuesta incluye un array `ventas` con una entrada por día en el período
- **AND** cada entrada tiene periodo, total_ventas, ingreso_total, costo_envio_total
- **AND** la respuesta incluye un objeto `resumen` con total_ventas, ingreso_total, promedio_por_dia
- **AND** los días sin ventas NO aparecen en el array (solo días con actividad)

#### Scenario: ADMIN consulta ventas por semana
- **WHEN** un ADMIN hace GET /api/v1/admin/metricas/ventas?desde=2026-01-01&hasta=2026-03-31&granularidad=semana
- **THEN** el sistema retorna 200 OK
- **AND** las ventas están agrupadas por semana (ISO week)
- **AND** el campo `periodo` contiene la fecha de inicio de cada semana

#### Scenario: ADMIN consulta ventas por mes
- **WHEN** un ADMIN hace GET /api/v1/admin/metricas/ventas?desde=2026-01-01&hasta=2026-12-31&granularidad=mes
- **THEN** el sistema retorna 200 OK
- **AND** las ventas están agrupadas por mes (YYYY-MM)
- **AND** el campo `periodo` contiene "2026-01", "2026-02", etc.

#### Scenario: Faltan parámetros obligatorios
- **WHEN** un ADMIN hace GET /api/v1/admin/metricas/ventas sin desde o sin hasta
- **THEN** el sistema retorna 422 Unprocessable Entity
- **AND** el mensaje indica qué parámetros faltan

#### Scenario: hasta es anterior a desde
- **WHEN** un ADMIN hace GET /api/v1/admin/metricas/ventas?desde=2026-06-01&hasta=2026-01-01
- **THEN** el sistema retorna 422 Unprocessable Entity
- **AND** el mensaje indica que "hasta debe ser posterior a desde"

#### Scenario: Granularidad inválida
- **WHEN** un ADMIN hace GET /api/v1/admin/metricas/ventas?desde=2026-01-01&hasta=2026-01-31&granularidad=anual
- **THEN** el sistema retorna 422 Unprocessable Entity
- **AND** el mensaje indica que granularidad debe ser uno de: dia, semana, mes

#### Scenario: Período sin ventas retorna array vacío
- **WHEN** no existen pedidos en el período consultado
- **THEN** el sistema retorna 200 OK
- **AND** el array `ventas` está vacío `[]`
- **AND** `resumen.total_ventas` es 0 y `resumen.ingreso_total` es 0.00
