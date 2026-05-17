# Spec: catalogo-publico-detalle

## Overview

Endpoint público de detalle de producto accesible sin autenticación. Devuelve información completa del producto incluyendo categorías, ingredientes con indicación de alérgenos, y disponibilidad. Sirve para que clientes no autenticados (o autenticados) puedan ver el detalle completo de un producto desde el catálogo público.

## ADDED Requirements

### Requirement: Endpoint público GET /api/v1/productos/{id}/publico

El sistema SHALL proveer un endpoint público `GET /api/v1/productos/{id}/publico` que no requiera autenticación y devuelva el detalle completo de un producto.

**Response 200** (ProductoDetallePublicoResponse):
```json
{
  "id": "uuid",
  "nombre": "string",
  "descripcion": "string",
  "precio": 1500.00,
  "imagen": "string (url)",
  "disponible": true,
  "categorias": [
    {
      "id": "uuid",
      "nombre": "string"
    }
  ],
  "ingredientes": [
    {
      "id": "uuid",
      "nombre": "string",
      "es_alergeno": true
    }
  ]
}
```

**Error responses**:
| Status | Error Code | Condición |
|--------|-----------|-----------|
| 404 | NOT_FOUND | Producto no existe o está eliminado (soft delete) |

#### Scenario: Producto existente devuelve detalle completo
- **WHEN** un cliente (autenticado o no) hace GET /api/v1/productos/{id}/publico con un ID de producto que existe y no está eliminado
- **THEN** el sistema retorna 200 OK
- **AND** la respuesta incluye nombre, descripción, precio, imagen, disponible
- **AND** la respuesta incluye array de categorías con id y nombre
- **AND** la respuesta incluye array de ingredientes con id, nombre, y es_alergeno
- **AND** no se requiere header Authorization

#### Scenario: Producto no disponible igual se muestra
- **WHEN** un cliente accede al detalle de un producto con `disponible = false`
- **THEN** el sistema retorna 200 OK
- **AND** el campo `disponible` es `false`
- **AND** se devuelve toda la información del producto igualmente

#### Scenario: Producto no existe retorna 404
- **WHEN** un cliente hace GET /api/v1/productos/{id}/publico con un ID que no existe en la base de datos
- **THEN** el sistema retorna 404 Not Found con error_code "NOT_FOUND"

#### Scenario: Producto eliminado retorna 404
- **WHEN** un cliente hace GET /api/v1/productos/{id}/publico con un ID de un producto que fue eliminado (soft delete)
- **THEN** el sistema retorna 404 Not Found con error_code "NOT_FOUND"

#### Scenario: ID con formato inválido retorna 422
- **WHEN** un cliente hace GET /api/v1/productos/{id}/publico con un ID que no es un UUID válido
- **THEN** el sistema retorna 422 Unprocessable Entity

#### Scenario: Producto sin categorías devuelve array vacío
- **WHEN** un producto existe pero no tiene categorías asignadas
- **THEN** el campo `categorias` es un array vacío `[]`

#### Scenario: Producto sin ingredientes devuelve array vacío
- **WHEN** un producto existe pero no tiene ingredientes registrados
- **THEN** el campo `ingredientes` es un array vacío `[]`
