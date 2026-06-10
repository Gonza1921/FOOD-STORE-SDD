# Spec: Audio Alert for KDS

## Overview

Audio alert system for the Kitchen Display System (KDS). Plays a synthesized beep via Web Audio API when a new order (`PEDIDO_CONFIRMADO`) arrives. Persists mute preference in localStorage.

## ADDED Requirements

### Requirement: Audio beep on new order

The KDS SHALL play an audible beep using the Web Audio API when a new `PEDIDO_CONFIRMADO` event is received.

#### Scenario: Beep plays when new confirmed order arrives
- **WHEN** a WebSocket message with `tipo: "PEDIDO_CONFIRMADO"` is received
- **THEN** the system SHALL create an `OscillatorNode` at 800 Hz frequency
- **AND** the beep SHALL last 150 ms
- **AND** the audio SHALL be synthesized (no external audio files)

### Requirement: Mute toggle with persistence

The KDS SHALL provide a mute toggle that persists across sessions.

#### Scenario: User toggles sound off
- **WHEN** the user clicks the sound toggle button
- **THEN** the audio alert SHALL NOT play on new orders
- **AND** the mute preference SHALL be saved to `localStorage` key `kds-muted`

#### Scenario: User toggles sound on
- **WHEN** the user clicks the sound toggle button while muted
- **THEN** the audio alert SHALL play on subsequent new orders
- **AND** the `localStorage` key `kds-muted` SHALL be set to `false`

#### Scenario: Mute state persists on page reload
- **GIVEN** the user muted the audio
- **WHEN** the page is reloaded
- **THEN** the mute state SHALL be restored from `localStorage`

### Requirement: Browser autoplay policy handling

The system SHALL handle browser autoplay restrictions gracefully.

#### Scenario: First interaction required
- **GIVEN** the browser blocks autoplay (no user gesture yet)
- **WHEN** a new order arrives
- **THEN** the system SHALL NOT throw an error
- **AND** the beep SHALL play on the next user interaction
