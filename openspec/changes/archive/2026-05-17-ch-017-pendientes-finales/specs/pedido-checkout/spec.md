# Spec: pedido-checkout

## Overview

Este spec extiende el flujo de checkout de pedidos con verificación de precios actualizados. Antes de crear un pedido, el backend debe comparar los precios del carrito contra los precios actuales en base de datos. Si hay diferencias, se notifica al cliente con un 409 Conflict y la lista de productos cuyo precio cambió.

## ADDED Requirements

### Requirement: Price check antes de crear pedido (US-070)

El sistema SHALL verificar que los precios de los productos en el carrito coincidan con los precios actuales en la base de datos antes de crear el pedido. Si hay diferencias, el sistema SHALL rechazar la creación con 409 Conflict y devolver la lista de productos con cambios de precio.

**Request body** (CrearPedidoRequest, extendido):
```json
{
  "items": [
    {
      "producto_id": "uuid",
      "cantidad": 2,
      "precio_cliente": 1500.00
    }
  ],
  "direccion_id": "uuid",
  "forma_pago_id": "uuid"
}
```

**Response 409** (PriceConflictResponse):
```json
{
  "error_code": "PRICE_CONFLICT",
  "title": "Precios desactualizados",
  "detail": "Algunos productos cambiaron de precio. Revisá el carrito antes de continuar.",
  "productos": [
    {
      "id": "uuid",
      "nombre": "Pizza Margarita",
      "precio_actual": 1800.00,
      "precio_cliente": 1500.00,
      "diferencia": 300.00
    }
  ]
}
```

**Comportamiento**:
- Si todos los precios coinciden → flujo normal (se crea el pedido)
- Si hay diferencias → 409 Conflict, no se crea el pedido
- El frontend MUST mostrar una notificación al cliente con los productos cuyo precio cambió
- El frontend SHOULD actualizar los precios en el carrito después de la notificación
- El frontend SHOULD permitir al cliente confirmar el nuevo precio y reintentar

#### Scenario: Precios coinciden — pedido se crea normalmente
- **WHEN** el cliente envía POST /api/v1/pedidos con items cuyos precios coinciden exactamente con los precios actuales en BD
- **THEN** el sistema crea el pedido normalmente
- **AND** retorna 201 Created con el pedido

#### Scenario: Precio de un producto cambió — 409 Conflict
- **GIVEN** el producto "Pizza Margarita" tiene precio_actual = 1800 en BD
- **WHEN** el cliente envía POST /api/v1/pedidos con un item producto_id="Pizza Margarita", precio_cliente=1500
- **THEN** el sistema retorna 409 Conflict
- **AND** la respuesta incluye error_code "PRICE_CONFLICT"
- **AND** la respuesta incluye array `productos` con: id, nombre, precio_actual, precio_cliente, diferencia
- **AND** la diferencia es 300 (1800 - 1500)
- **AND** no se crea ningún pedido

#### Scenario: Múltiples productos con cambios de precio
- **GIVEN** "Pizza Margarita" subió de 1500 a 1800, y "Pizza Napolitana" bajó de 2000 a 1800
- **WHEN** el cliente envía POST /api/v1/pedidos con ambos productos usando precios anteriores
- **THEN** el sistema retorna 409 Conflict
- **AND** el array `productos` incluye AMBOS productos con sus respectivas diferencias
- **AND** una diferencia puede ser positiva (subió) o negativa (bajó)
- **AND** no se crea ningún pedido

#### Scenario: Todos los precios coinciden pero stock insuficiente
- **WHEN** los precios son correctos pero hay stock insuficiente
- **THEN** el price check pasa exitosamente
- **AND** la validación de stock falla después
- **AND** el sistema retorna 400 "Stock insuficiente" (el price check es previo al stock check)

#### Scenario: Frontend muestra notificación de cambio de precio
- **WHEN** el frontend recibe respuesta 409 PRICE_CONFLICT
- **THEN** muestra una notificación/alerta al cliente indicando que algunos precios cambiaron
- **AND** lista los productos con: nombre, precio anterior, precio actual, diferencia
- **AND** ofrece opciones: "Aceptar nuevos precios" (reintenta) o "Volver al carrito"
- **AND** si el cliente acepta, actualiza los precios en el carrito y reintenta la creación

#### Scenario: Producto ya no existe en BD
- **GIVEN** un producto en el carrito fue eliminado de la base de datos
- **WHEN** el cliente envía POST /api/v1/pedidos
- **THEN** el sistema retorna 409 Conflict
- **AND** el error_code es "PRICE_CONFLICT"
- **AND** el producto aparece en la lista con precio_actual = null y diferencia = null
- **AND** el campo nombre indica "Producto no disponible"
