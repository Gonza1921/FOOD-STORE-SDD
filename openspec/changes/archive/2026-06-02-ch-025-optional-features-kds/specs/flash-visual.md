# Spec: Flash Visual for KDS

## Overview

Visual flash effect that activates on the KDS header when a new confirmed order arrives. Provides an immediate visual cue complementing the audio alert.

## ADDED Requirements

### Requirement: Flash animation on new order

The KDS header SHALL flash briefly when a new `PEDIDO_CONFIRMADO` event is received.

#### Scenario: Header flashes on new confirmed order
- **WHEN** a WebSocket message with `tipo: "PEDIDO_CONFIRMADO"` is received
- **THEN** the header SHALL apply a CSS `flash` keyframe animation
- **AND** the animation SHALL last 300 ms
- **AND** the animation SHALL NOT affect layout or clickability of header elements

### Requirement: Flash does not stack

If multiple new orders arrive in quick succession, the flash SHALL reset its timer instead of stacking.

#### Scenario: Rapid orders reset flash timer
- **WHEN** a flash animation is already playing (within 300 ms)
- **AND** another `PEDIDO_CONFIRMADO` message arrives
- **THEN** the flash timeout SHALL be cleared and restarted
- **AND** the animation SHALL play for the full 300 ms from the last arrival
