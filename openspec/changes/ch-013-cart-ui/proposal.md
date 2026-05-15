# CH-013: Carrito de Compras UI (EPIC 08)

## Qué
Implementar la interfaz de usuario completa del carrito de compras, incluyendo página dedicada, botón de agregar desde el catálogo, controles de cantidad, eliminación de items, personalización de ingredientes, y resumen de compra.

## Por qué
El carrito es el paso intermedio fundamental entre el catálogo y el checkout. Actualmente el store Zustand existe (con persistencia en localStorage y todas las acciones necesarias) pero los componentes UI son placeholders que no renderizan nada. Sin UI de carrito, el flujo de compra está roto: los usuarios pueden agregar items programáticamente pero no verlos, modificarlos ni gestionarlos.

## Alcance
- Página dedicada `/carrito` con listado de items, controles +/- de cantidad, botón de eliminar por item, botón de vaciar carrito, y resumen del total
- Botón "Agregar al carrito" en cada card del catálogo público (`/catalogo`)
- Componente `CartSummary` funcional (reemplazar placeholder)
- Hook `useCart` funcional que envuelve `useCartStore` (reemplazar placeholder)
- Badge del carrito en sidebar y topbar con contador de items
- Integración del carrito con el flujo existente de checkout (`/checkout`)

## No incluye
- Personalización de ingredientes vía UI (US-030) — se hará en cambio posterior
- Validaciones pre-checkout (US-069, US-070) — serán CH-014
- Notificaciones toast globales (US-071) — serán parte de EPIC 14

## Roles requeridos
- **Frontend**: React + TypeScript + Tailwind + Zustand

## Complejidad
- Media (store ya existe, solo UI faltante)

## Riesgos
- Bajo: la store está probada y funcional, solo agregamos capa de presentación
