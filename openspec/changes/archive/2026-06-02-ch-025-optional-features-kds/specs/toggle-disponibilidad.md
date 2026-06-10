# Spec: Toggle Product Availability from KDS

## Overview

Allows kitchen staff to mark a product as `disponible` / `no disponible` directly from the KDS order cards. Uses a backend `PATCH` endpoint and updates UI optimistically.

## ADDED Requirements

### Requirement: PATCH endpoint for product availability

The API SHALL expose an endpoint to toggle product availability.

#### Scenario: Successfully toggle availability
- **WHEN** a `PATCH /api/v1/cocina/productos/{id}/disponibilidad` request is sent with body `{ "disponible": false }`
- **AND** the user has role `COCINA` or `ADMIN`
- **THEN** the product's `disponible` field SHALL be updated in the database
- **AND** the response SHALL return `{ "id", "nombre", "disponible" }` with HTTP 200

#### Scenario: Product not found
- **WHEN** a `PATCH /api/v1/cocina/productos/{id}/disponibilidad` request is sent
- **AND** the product ID does not exist or was soft-deleted
- **THEN** the API SHALL return HTTP 404 with `{ "detail": "Producto no encontrado" }`

#### Scenario: Unauthorized role
- **WHEN** a user without `COCINA` or `ADMIN` role attempts to toggle availability
- **THEN** the API SHALL return HTTP 403

### Requirement: Toggle button per product in KDS card

Each order item in the KDS SHALL have a button to toggle its product availability.

#### Scenario: Mark product as no disponible
- **GIVEN** the KDS displays an order card with items
- **WHEN** the kitchen staff clicks the "No disponible" button on an item
- **THEN** a confirmation dialog SHALL appear
- **AND** upon confirmation, the item SHALL appear with reduced opacity (50%) and strikethrough
- **AND** a `PATCH` request SHALL be sent to mark the product as `disponible: false`
- **AND** the button label SHALL change to "Disponible"

#### Scenario: Re-enable a previously disabled product
- **GIVEN** an item was previously marked as no disponible
- **WHEN** the kitchen staff clicks the "Disponible" button
- **THEN** a confirmation dialog SHALL appear
- **AND** upon confirmation, the item SHALL return to full opacity
- **AND** a `PATCH` request SHALL be sent to mark the product as `disponible: true`
- **AND** the button label SHALL change to "No disponible"

### Requirement: UI reflects current disponibilidad state

On error, the optimistic UI SHALL revert and pedidos SHALL be refetched.

#### Scenario: Backend error reverts optimistic state
- **GIVEN** the optimistic UI was updated optimistically
- **WHEN** the `PATCH` request fails (network error, 404, 403)
- **THEN** the KDS pedidos query SHALL be invalidated to refetch correct state
- **AND** an error message SHALL be shown to the user
