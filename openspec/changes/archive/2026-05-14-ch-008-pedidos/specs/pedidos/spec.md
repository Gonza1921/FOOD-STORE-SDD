# Specification: Pedidos Module

## Overview

Este documento especifica la primera etapa del módulo de pedidos del proyecto Food Store. Define los modelos de datos, endpoints REST básicos, y la arquitectura inicial para la gestión de pedidos.

## Models

### Enum: EstadoPedido

```
PENDIENTE   = "pendiente"   # Pedido creado, esperando pago
PAGADO      = "pagado"      # Pago confirmado
PREPARANDO  = "preparando"  # En preparación
ENVIADO     = "enviado"     # En camino al cliente
ENTREGADO   = "entregado"   # Entregado al cliente
CANCELADO   = "cancelado"   # Cancelado (terminal)
```

### Model: Pedido

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key -> usuarios.id |
| estado | EstadoPedido | Default: PENDIENTE |
| total | Decimal(10,2) | NOT NULL |
| created_at | DateTime | TimestampMixin |
| updated_at | DateTime | TimestampMixin |

### Model: PedidoItem

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | Primary key |
| pedido_id | UUID | Foreign key -> pedidos.id (cascade) |
| producto_id | UUID | Foreign key -> productos.id |
| cantidad | Integer | NOT NULL, >= 1 |
| precio_unitario | Decimal(10,2) | NOT NULL |
| subtotal | Decimal(10,2) | NOT NULL |

### Relationships

- Pedido 1:N PedidoItem (cascade delete)
- PedidoItem -> Pedido (FK)
- PedidoItem -> Producto (FK)
- Pedido -> Usuario (FK)

---

## API Endpoints

### POST /pedidos

Crear un nuevo pedido.

**Request:**
```json
{
  "items": [
    {
      "producto_id": "uuid",
      "cantidad": 2
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "estado": "pendiente",
  "total": 1500.00,
  "items": [
    {
      "id": "uuid",
      "producto_id": "uuid",
      "cantidad": 2,
      "precio_unitario": 750.00,
      "subtotal": 1500.00
    }
  ],
  "created_at": "2026-05-13T12:00:00Z",
  "updated_at": "2026-05-13T12:00:00Z"
}
```

**Validation:**
- items NO debe estar vacío
- cantidad debe ser >= 1
- producto_id debe existir en la base de datos

**Errors:**
- 422: Validation error (items vacíos, cantidad inválida)
- 404: Producto no encontrado

---

### GET /pedidos

Listar pedidos del usuario autenticado.

**Response (200):**
```json
{
  "pedidos": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "estado": "pendiente",
      "total": 1500.00,
      "created_at": "2026-05-13T12:00:00Z"
    }
  ]
}
```

**Authorization:** Requiere JWT token válido.

---

### GET /pedidos/{pedido_id}

Obtener detalle de un pedido específico.

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "estado": "pendiente",
  "total": 1500.00,
  "items": [...],
  "created_at": "2026-05-13T12:00:00Z",
  "updated_at": "2026-05-13T12:00:00Z"
}
```

**Authorization:** Solo el propietario del pedido puede verlo.

**Errors:**
- 404: Pedido no encontrado
- 403: No autorizado

---

## Business Logic

### Cálculo de Totales

```
subtotal_item = cantidad * precio_unitario
total_pedido = SUM(subtotal_item for all items)
```

El precio_unitario se toma del producto en el momento de crear el pedido.

### Creación de Pedido

1. Validar que items no esté vacío
2. Por cada item:
   - Verificar que producto_id exista
   - Obtener precio actual del producto
   - Calcular subtotal = cantidad * precio_unitario
3. Calcular total = suma de subtotales
4. Crear pedido con estado inicial PENDIENTE
5. Crear items asociados
6. Retornar pedido completo

---

## Out of Scope (Esta Etapa)

- Validaciones de transición FSM (PENDIENTE -> PAGADO, etc.)
- Control de stock (decrementar inventario)
- Permisos de administrador
- Cancelación de pedidos
- Historial de cambios de estado
- Actualización de pedidos (PUT/PATCH)
- Eliminación de pedidos
- Integración con MercadoPago
- Tests unitarios/integración

---

## Acceptance Criteria

1. ✅ Modelos Pedido y PedidoItem creados con todos los campos especificados
2. ✅ Migración Alembic genera tablas correctas con FK
3. ✅ Enum de estados con los 6 valores definidos
4. ✅ POST /pedidos crea pedido correctamente
5. ✅ GET /pedidos retorna lista del usuario
6. ✅ GET /pedidos/{id} retorna detalle del pedido
7. ✅ Cálculo de subtotal y total automático y correcto
8. ✅ Relaciones correctamente establecidas (cascade delete)
9. ✅ Schemas Pydantic con validación básica funcionando
10. ✅ Arquitectura sigue patrones existentes del proyecto