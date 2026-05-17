# Spec: productos

## Overview

Este spec define las capacidades del módulo de productos del catálogo, incluyendo las nuevas funcionalidades agregadas en CH-017: filtro por alérgenos en el catálogo público y endpoint público de detalle de producto.

## MODIFIED Requirements

### Requirement: Filtro excluirAlergenos en catálogo público (US-023)

El sistema SHALL permitir filtrar productos del catálogo público `GET /api/v1/productos/publico/catalogo` excluyendo aquellos que contengan ciertos ingredientes alérgenos mediante el query parameter `excluirAlergenos`.

**Query parameter**:
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `excluirAlergenos` | string (comma-separated IDs) | — (opcional) | IDs de ingredientes a excluir. Ej: `1,3,7` |

**Comportamiento**: Cuando se provee `excluirAlergenos`, el sistema SHALL excluir del resultado cualquier producto que tenga AL MENOS UNO de los ingredientes cuyos IDs estén en la lista. Es decir, se filtran productos que contengan cualquiera de los alérgenos especificados.

#### Scenario: Catálogo sin filtro de alérgenos (comportamiento existente)
- **WHEN** un cliente hace GET /api/v1/productos/publico/catalogo sin parámetro excluirAlergenos
- **THEN** el sistema retorna todos los productos disponibles, sin filtrar por alérgenos
- **AND** el comportamiento es idéntico al actual

#### Scenario: Catálogo excluye un alérgeno específico
- **GIVEN** existen productos: "Pizza Margarita" (contiene ingrediente "Queso" con ID 1), "Pizza Napolitana" (no contiene queso), y "Pizza Vegana" (no contiene queso)
- **WHEN** un cliente hace GET /api/v1/productos/publico/catalogo?excluirAlergenos=1
- **THEN** el sistema retorna "Pizza Napolitana" y "Pizza Vegana"
- **AND** "Pizza Margarita" NO aparece en los resultados
- **AND** la respuesta mantiene la misma estructura que el catálogo normal

#### Scenario: Catálogo excluye múltiples alérgenos
- **GIVEN** "Pizza Margarita" contiene queso (ID 1) y "Pizza Pepperoni" contiene gluten (ID 3)
- **WHEN** un cliente hace GET /api/v1/productos/publico/catalogo?excluirAlergenos=1,3
- **THEN** se excluyen productos que contengan queso O gluten
- **AND** solo se muestran productos que no contengan NINGUNO de esos ingredientes

#### Scenario: excluirAlergenos con ID inexistente
- **WHEN** un cliente hace GET /api/v1/productos/publico/catalogo?excluirAlergenos=99999
- **THEN** el sistema procesa la request normalmente
- **AND** como ningún producto tiene el ingrediente 99999, no hay filtrado adicional
- **AND** se retorna el catálogo completo

#### Scenario: excluirAlergenos con formato inválido
- **WHEN** un cliente hace GET /api/v1/productos/publico/catalogo?excluirAlergenos=abc
- **THEN** el sistema retorna 422 Unprocessable Entity
- **AND** el mensaje indica que el formato debe ser IDs numéricos separados por coma

---

### Requirement: Endpoint público GET /api/v1/productos/{id}/publico

El sistema SHALL proveer un endpoint público `GET /api/v1/productos/{id}/publico` que no requiera autenticación y devuelva el detalle completo de un producto.

Ver spec completo en `catalogo-publico-detalle/spec.md`.

#### Scenario: Producto existente devuelve detalle completo
- **WHEN** un cliente hace GET /api/v1/productos/{id}/publico con ID válido existente
- **THEN** el sistema retorna 200 OK con nombre, descripción, precio, imagen, disponible, categorías e ingredientes con es_alergeno

#### Scenario: Producto no existe retorna 404
- **WHEN** un cliente hace GET /api/v1/productos/{id}/publico con ID inexistente
- **THEN** el sistema retorna 404 Not Found

#### Scenario: Producto eliminado retorna 404
- **WHEN** un cliente hace GET /api/v1/productos/{id}/publico con ID de producto soft-deleted
- **THEN** el sistema retorna 404 Not Found
