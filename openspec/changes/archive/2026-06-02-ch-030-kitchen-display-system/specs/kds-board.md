# Spec: KDS Board

## Overview

Kitchen Display System (KDS) board showing active orders grouped by status. Provides real-time WebSocket updates, urgency indicators, and action buttons for kitchen staff.

## ADDED Requirements

### Requirement: Display active orders in columns

The KDS SHALL display active kitchen orders grouped by status column (CONFIRMADO and EN_PREP).

#### Scenario: Orders shown in correct columns
- **GIVEN** there are orders in CONFIRMADO and EN_PREP states
- **WHEN** the KDS page loads
- **THEN** CONFIRMADO orders SHALL appear in the "Por preparar" column
- **AND** EN_PREP orders SHALL appear in the "En preparación" column
- **AND** orders SHALL be ordered by oldest first (FIFO)

### Requirement: Real-time updates via WebSocket

The KDS SHALL receive real-time order updates via WebSocket.

#### Scenario: New order appears without refresh
- **GIVEN** the KDS is connected via WebSocket
- **WHEN** a new order transitions to CONFIRMADO
- **THEN** the order SHALL appear in the "Por preparar" column automatically
- **AND** no manual page refresh SHALL be required

#### Scenario: WebSocket fallback to polling
- **GIVEN** the WebSocket connection fails or is unavailable
- **WHEN** the KDS detects the disconnection
- **THEN** the connection status indicator SHALL show "Desconectado"
- **AND** the KDS SHALL fall back to polling via REST endpoint every 5 seconds

### Requirement: Urgency indicator

Each order card SHALL display an urgency level based on time elapsed in current state.

#### Scenario: Urgency color coding
- **GIVEN** an order has been in its current state for less than 15 minutes
- **THEN** the card SHALL show a green border (normal)
- **WHEN** the order has been in state 15-30 minutes
- **THEN** the card SHALL show a yellow/amber border (warning)
- **WHEN** the order has been in state more than 30 minutes
- **THEN** the card SHALL show a red border (urgent)

### Requirement: Action buttons for state transitions

Each order card SHALL provide action buttons appropriate to its current state.

#### Scenario: Start preparing an order
- **GIVEN** an order is in CONFIRMADO state
- **WHEN** the kitchen staff clicks "Iniciar"
- **AND** confirms the action
- **THEN** a `PATCH` request SHALL be sent to transition the order to EN_PREP
- **AND** the order SHALL move to the "En preparación" column

#### Scenario: Mark order as ready
- **GIVEN** an order is in EN_PREP state
- **WHEN** the kitchen staff clicks "Listo"
- **AND** confirms the action
- **THEN** a `PATCH` request SHALL be sent to transition the order to EN_CAMINO
- **AND** the order SHALL be removed from the KDS board

### Requirement: Connection status indicator

The KDS header SHALL display the WebSocket connection status.

#### Scenario: Connected status
- **GIVEN** the WebSocket connection is active
- **THEN** the status indicator SHALL show "Conectado" with a green color

#### Scenario: Disconnected status
- **GIVEN** the WebSocket connection is lost
- **THEN** the status indicator SHALL show "Desconectado" with a red color

### Requirement: Fallback REST endpoint for KDS

The backend SHALL provide a REST endpoint for initial KDS load and polling fallback.

#### Scenario: Initial load
- **WHEN** the KDS page loads
- **THEN** a `GET /api/v1/cocina/pedidos` request SHALL be made
- **AND** the response SHALL include all active orders with items, time-in-state, and client name

#### Scenario: Polling fallback
- **GIVEN** the WebSocket is disconnected
- **WHEN** 5 seconds have elapsed since the last update
- **THEN** a `GET /api/v1/cocina/pedidos` request SHALL be made to refresh the board
