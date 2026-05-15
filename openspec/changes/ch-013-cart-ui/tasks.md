# CH-013: Carrito de Compras UI — Tareas

## Setup

- [x] Store Zustand existente y funcional
- [x] Estructura de directorios creada

## Implementación

### 1. Hook y componentes core (1 hora)
- [ ] **1.1** Reescribir `useCart` hook para que envuelva `useCartStore` real
- [ ] **1.2** Crear `AddToCartButton` componente
- [ ] **1.3** Reescribir `CartSummary` con datos reales del store

### 2. Página de carrito (1 hora)
- [ ] **2.1** Crear `CartPage` con listado de items, controles +/-, eliminar, vaciar
- [ ] **2.2** Crear componente `EmptyCart` para estado vacío
- [ ] **2.3** Agregar ruta `/carrito` en Router y exportar desde pages/index

### 3. Integración con catálogo (30 min)
- [ ] **3.1** Integrar `AddToCartButton` en `PublicCatalogPage` (cada card del grid)
- [ ] **3.2** Verificar que el badge del carrito en sidebar/topbar funciona correctamente

### 4. Verificación (30 min)
- [ ] **4.1** Ejecutar `pnpm type-check` y corregir errores
- [ ] **4.2** Verificar que el flujo completo funciona: catálogo → agregar → /carrito → checkout
