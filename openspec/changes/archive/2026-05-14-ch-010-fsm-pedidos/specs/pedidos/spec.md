# Specification: FSM Pedidos - Transiciones de Estado

## ADDED Requirements

### Requirement: Avanzar Estado del Pedido

El sistema DEBE permitir cambiar el estado de un pedido siguiendo la máquina de estados definida, validando transiciones permitidas, permisos del usuario, y actualizando el historial.

#### Scenario: Cliente intenta avanzar estado desde PENDIENTE

- **WHEN** el cliente autenticado intenta cambiar estado de un pedido en estado PENDIENTE
- **THEN** el sistema DEBE rechazar la transición con error 403 (solo el sistema puede avanzar desde PENDIENTE vía pago)

#### Scenario: Administrador avanza de PENDIENTE a CONFIRMADO

- **WHEN** usuario con rol ADMIN o PEDIDOS envía PATCH a `/pedidos/{id}/estado` con nuevo_estado="confirmado" para un pedido en estado PENDIENTE
- **THEN** el sistema DEBE cambiar estado a CONFIRMADO
- **AND** ejecutar decremento de stock para cada item del pedido
- **AND** crear registro en HistorialEstadoPedido con estado_desde="pendiente", estado_nuevo="confirmado"

#### Scenario: Transición inválida rechazada

- **WHEN** usuario envía PATCH con transición no válida (ej: PENDIENTE -> EN_CAMINO)
- **THEN** el sistema DEBE responder con error 400 "Transición no válida"

#### Scenario: Estado terminal no permite transiciones

- **WHEN** usuario intenta cambiar estado de un pedido en estado ENTREGADO o CANCELADO
- **THEN** el sistema DEBE responder con error 400 "El pedido está en estado terminal"

---

### Requirement: Cancelar Pedido

El sistema DEBE permitir cancelar pedidos en estados permitidos, restaurando el stock automáticamente.

#### Scenario: Cliente cancela su propio pedido en PENDIENTE

- **WHEN** cliente autenticado (propietario del pedido) envía PATCH a `/pedidos/{id}/cancelar` con observación para un pedido en estado PENDIENTE
- **THEN** el sistema DEBE cambiar estado a CANCELADO
- **AND** NO modificar el stock (nunca se descontó)
- **AND** crear registro en HistorialEstadoPedido con observación

#### Scenario: Administrador cancela pedido en CONFIRMADO

- **WHEN** usuario con rol ADMIN envía PATCH a `/pedidos/{id}/cancelar` con observación para un pedido en estado CONFIRMADO
- **THEN** el sistema DEBE cambiar estado a CANCELADO
- **AND** restaurar stock de todos los items del pedido

#### Scenario: Cancelación requiere observación

- **WHEN** usuario envía PATCH a `/pedidos/{id}/cancelar` sin campo observación
- **THEN** el sistema DEBE responder con error 422 "La observación es obligatoria al cancelar"

---

### Requirement: Control de Stock en Transiciones

El sistema DEBE decrementar stock al confirmar pedido y restaurarlo al cancelar, usando transacciones atómicas.

#### Scenario: Decremento de stock al confirmar

- **WHEN** un pedido avanza a estado CONFIRMADO
- **THEN** el sistema DEBE ejecutar: stock_producto = stock_producto - cantidad_item para cada item
- **AND** toda la operación DEBE ser atómica (rollback si falla)

#### Scenario: Stock insuficiente al confirmar

- **WHEN** al confirmar un pedido, algún item tiene stock menor a la cantidad solicitada
- **THEN** el sistema DEBE rechazar la transición con error 400 "Stock insuficiente para producto X"

---

### Requirement: Historial de Estados (Audit Trail)

El sistema DEBE mantener un historial inmutable de todos los cambios de estado en la tabla HistorialEstadoPedido.

#### Scenario: Obtener historial de un pedido

- **WHEN** usuario autenticado envía GET a `/pedidos/{id}/historial`
- **THEN** el sistema DEBE retornar lista de registros de historial ordenados por created_at ascendente

---

### Requirement: Validación de Permisos

El sistema DEBE validar que el usuario tenga los permisos adecuados según la operación y el estado del pedido.

#### Scenario: Solo ADMIN puede cancelar desde EN_PREPARACION

- **WHEN** usuario con rol PEDIDOS intenta cancelar un pedido en EN_PREPARACION
- **THEN** el sistema DEBE responder con error 403 "Solo un administrador puede cancelar pedidos en preparación"

#### Scenario: Roles ADMIN y PEDIDOS pueden avanzar estados

- **WHEN** usuario con rol ADMIN o PEDIDOS envía PATCH para avanzar estado
- **THEN** el sistema DEBE permitir la operación