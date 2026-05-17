# Specification: pedido-checkout

## ADDED Requirements

### Requirement: Crear pedido desde el carrito con dirección y forma de pago

El sistema SHALL permitir a un cliente autenticado crear un pedido utilizando los items del carrito, especificando una dirección de entrega y forma de pago.

#### Scenario: Cliente crea pedido exitosamente
- **GIVEN** el cliente está autenticado, tiene items en el carrito, y tiene al menos una dirección guardada
- **WHEN** envía POST /api/v1/pedidos con items, direccion_id válido, y forma_pago_id
- **THEN** el sistema crea el pedido en estado PENDIENTE
- **AND** crea los detalles del pedido con precio snapshot
- **AND** registra el historial de estado inicial
- **AND** devuelve el pedido creado con ID, estado, total

#### Scenario: Cliente intenta crear pedido sin dirección
- **GIVEN** el cliente está autenticado y tiene items en el carrito
- **WHEN** envía POST /api/v1/pedidos sin direccion_id
- **THEN** el sistema responde con error 422 (validation error)
- **AND** no se crea ningún pedido

#### Scenario: Cliente intenta crear pedido con dirección de otro usuario
- **GIVEN** el cliente está autenticado
- **WHEN** envía POST /api/v1/pedidos con direccion_id que pertenece a otro usuario
- **THEN** el sistema responde con error 403 (forbidden)
- **AND** no se crea ningún pedido

#### Scenario: Cliente crea pedido pero stock insuficiente
- **GIVEN** el cliente está autenticado y tiene items en el carrito
- **WHEN** envía POST /api/v1/pedidos pero uno de los productos no tiene stock suficiente
- **THEN** el sistema revierte la transacción (rollback)
- **AND** responde con error 400: "Stock insuficiente para producto X"
- **AND** no se crea ningún pedido

---

### Requirement: Validar stock disponible antes de crear pedido

El sistema SHALL verificar que cada producto del pedido tenga stock disponible suficiente antes de confirmar la creación.

#### Scenario: Stock suficiente para todos los productos
- **GIVEN** el producto "Pizza Margarita" tiene stock de 10 unidades
- **WHEN** el cliente envía un pedido con cantidad 5 de ese producto
- **THEN** la validación de stock pasa exitosamente
- **AND** el pedido se crea correctamente

#### Scenario: Stock insuficiente en un producto
- **GIVEN** el producto "Leche" tiene stock de 2 unidades
- **WHEN** el cliente envía un pedido con cantidad 5 de ese producto
- **THEN** la validación de stock falla
- **AND** el sistema lanza error 400: "Stock insuficiente para producto Leche. Disponible: 2"
- **AND** no se crea ningún pedido

---

### Requirement: Generar snapshots inmutables al crear pedido

El sistema SHALL capturar el precio actual del producto y los datos de la dirección en el momento de crear el pedido, sin que cambios posteriores afecten el pedido.

#### Scenario: Precio se snapshottea al crear pedido
- **GIVEN** el producto "Pizza" cuesta $1500
- **WHEN** el cliente crea un pedido con 2 unidades
- **THEN** el detalle del pedido guarda precio_snapshot = 1500
- **AND** si el precio del producto cambia después, el pedido mantiene $1500

#### Scenario: Dirección se snapshottea al crear pedido
- **GIVEN** el cliente tiene una dirección "Casa" con calle "Av. Rivadavia 100"
- **WHEN** el cliente crea un pedido usando esa dirección
- **AND** luego modifica la dirección en su perfil
- **THEN** el pedido mantiene el snapshot de la dirección original
- **AND** el pedido muestra "Av. Rivadavia 100" aunque la dirección actual sea diferente

---

### Requirement: Integrar personalización de ingredientes en el pedido

El sistema SHALL permitir que el cliente excluya ingredientes específicos de cada producto al crear el pedido.

#### Scenario: Cliente excluye ingredientes de un producto
- **GIVEN** el producto "Hamburguesa" tiene ingredientes [carne, queso, lechuga, tomate]
- **WHEN** el cliente agrega el producto al carrito excluyendo [queso]
- **AND** crea el pedido
- **THEN** el detalle del pedido registra ingredientes_excluidos = [ID del queso]
- **AND** la cocina ve la pedido sin queso

#### Scenario: Personalización referencing ingrediente no existente en producto
- **GIVEN** el cliente envía personalizacion con ingredient ID 99 que no existe en el producto
- **WHEN** el sistema intenta crear el pedido
- **THEN** responde con error 400: "El ingrediente ID 99 no pertenece al producto"
- **AND** no se crea ningún pedido

---

### Requirement: Calcular total con costo de envío

El sistema SHALL calcular el total del pedido incluyendo el subtotal de productos más el costo de envío.

#### Scenario: Total incluye costo de envío
- **GIVEN** el carrito tiene productos por $5000 y el costo de envío es $500
- **WHEN** el cliente crea el pedido
- **THEN** el total del pedido es $5500
- **AND** se almacena separately: subtotal = 5000, costo_envio = 500, total = 5500

#### Scenario: Costo de envío se adiciona al snapshot
- **GIVEN** el costo de envío es $500
- **WHEN** el cliente crea un pedido
- **THEN** el campo costo_envio del pedido es 500
- **AND** no se modifica si el costo de envío global cambia después

---

### Requirement: Transacción atómica en creación de pedido

El sistema SHALL crear el pedido, los detalles y el historial de estado en una única transacción atómica.

#### Scenario: Creación atómica exitosa
- **WHEN** el cliente crea un pedido con 3 items
- **THEN** se crea 1 Pedido + 3 DetallePedido + 1 HistorialEstadoPedido
- **AND** todas las operaciones se confirman juntas (commit)
- **AND** si una falla, todas se revierten (rollback)

#### Scenario: Creación atómica falla por validación
- **GIVEN** se van a crear 3 items pero el segundo tiene stock insuficiente
- **WHEN** el sistema procesa el primer item exitosamente
- **AND** falla en el segundo por stock insuficiente
- **THEN** se revierte la creación del primer item
- **AND** no se crea ningún pedido en la base de datos
- **AND** el stock permanece sin cambios