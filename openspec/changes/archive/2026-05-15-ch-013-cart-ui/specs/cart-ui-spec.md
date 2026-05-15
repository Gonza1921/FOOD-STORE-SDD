# CH-013: Carrito de Compras UI — Especificación

## Requirements (RFC 2119)

### REQ-01: Página de carrito dedicada
El sistema DEBE tener una página `/carrito` accesible desde la navegación principal (sidebar) y desde el badge del carrito en el header. La página DEBE mostrar la lista completa de items del carrito con nombre, precio unitario, cantidad, subtotal por item, y el total general.

### REQ-02: Agregar al carrito desde catálogo
El sistema DEBE mostrar un botón "Agregar al carrito" en cada card del catálogo público. Al hacer clic, el producto DEBE agregarse al store de Zustand con cantidad 1. Si el producto ya existe en el carrito, DEBE incrementar la cantidad en 1.

### REQ-03: Control de cantidad en carrito
Cada item en la página de carrito DEBE tener controles para incrementar (+) y decrementar (-) la cantidad. Si la cantidad llega a 0, el item DEBE eliminarse del carrito.

### REQ-04: Eliminar item del carrito
Cada item DEBE tener un botón de eliminar. El sistema DEBE mostrar un diálogo de confirmación antes de eliminar. Al confirmar, el item DEBE eliminarse del carrito y el total DEBE recalcularse.

### REQ-05: Vaciar carrito
El sistema DEBE tener un botón "Vaciar carrito" con confirmación. Al confirmar, DEBEN eliminarse todos los items y el contador del badge DEBE mostrar 0.

### REQ-06: Resumen del carrito (CartSummary)
El componente CartSummary DEBE mostrar: cantidad total de items, subtotal (suma de precio × cantidad de cada item), y un botón "Ir al checkout" que navegue a `/checkout`. Si el carrito está vacío, DEBE mostrar un mensaje "Tu carrito está vacío" con un link al catálogo.

### REQ-07: Hook useCart funcional
El hook `useCart` DEBE envolver `useCartStore` y exponer: `items`, `totalItems`, `totalPrice`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `isEmpty`.

### REQ-08: Badge del carrito
El sistema DEBE mostrar un badge rojo con el contador de items en el icono del carrito (sidebar y topbar). El badge DEBE actualizarse en tiempo real al agregar/eliminar items.

### REQ-09: Estado vacío
Cuando el carrito está vacío, la página `/carrito` DEBE mostrar un estado vacío con un mensaje amigable y un botón "Ver catálogo" que navegue a `/catalogo`.

### REQ-10: Estado del carrito en checkout
La página de checkout (`/checkout`) DEBE consumir `useCart` en lugar de acceder directamente al store, usando el hook real (no placeholder).

## Scenarios GIVEN/WHEN/THEN

### US-029: Agregar producto al carrito
GIVEN un cliente navegando el catálogo público
WHEN hace clic en "Agregar al carrito" en un producto
THEN el producto se agrega con cantidad 1
AND el badge del carrito se incrementa
AND el carrito persiste en localStorage

### US-029b: Agregar producto duplicado
GIVEN un producto ya existente en el carrito
WHEN el cliente hace clic en "Agregar al carrito" de nuevo
THEN la cantidad del producto se incrementa en 1
AND no se duplica el item

### US-031: Modificar cantidad
GIVEN un item en la página de carrito
WHEN el cliente hace clic en el botón "+"
THEN la cantidad se incrementa en 1
AND el subtotal y total se recalculan

GIVEN un item con cantidad > 1
WHEN el cliente hace clic en "-"
THEN la cantidad se decrementa en 1

GIVEN un item con cantidad 1
WHEN el cliente hace clic en "-"
THEN el item se elimina del carrito

### US-032: Eliminar item
GIVEN un item en el carrito
WHEN el cliente hace clic en el botón de eliminar
AND confirma en el diálogo
THEN el item se elimina del carrito
AND el badge se actualiza

### US-033: Ver resumen del carrito
GIVEN items en el carrito
WHEN el cliente navega a `/carrito`
THEN ve todos los items con nombre, precio, cantidad, subtotal
AND ve el total general
AND ve un botón "Ir al checkout"

### US-034: Vaciar carrito
GIVEN un carrito con items
WHEN el cliente hace clic en "Vaciar carrito"
AND confirma en el diálogo
THEN todos los items se eliminan
AND se muestra el estado vacío
AND el badge muestra 0
