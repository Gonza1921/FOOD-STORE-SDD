# CH-013: Carrito de Compras UI — Diseño

## Árbol de Componentes

```
pages/CartPage                    ← Ruta /carrito (ProtectedRoute + AppLayout)
└── features/cart/components/
    ├── CartItemRow               ← Fila individual: nombre, precio, +/- cantidad, eliminar, subtotal
    ├── CartSummary               ← Resumen: total items, total precio, botón ir al checkout
    └── EmptyCart                 ← Estado vacío con mensaje + link al catálogo

pages/PublicCatalogPage           ← Ruta /catalogo (público)
└── features/cart/components/
    └── AddToCartButton           ← Botón "Agregar al carrito" en cada ProductCard
```

## Flujo de Datos

```
PublicCatalogPage
  └── ProductCard
       └── AddToCartButton
            └── onClick → useCartStore.addItem({ productoId, nombre, precio, imagen })
                    │
                    ▼
              Zustand persist → localStorage("food-store-cart")
                    │
                    ▼
              Badge se actualiza (totalItems selector)
                    │
                    ▼
              CartPage → useCart → useCartStore
                    │
                    ▼
              CartItemRow × N
              CartSummary → totalPrice, totalItems
```

## Decisiones de Diseño

1. **Hook useCart como wrapper**: En lugar de acceder directamente a `useCartStore` desde los componentes, creamos un hook `useCart` que abstrae la implementación. Esto permite cambiar la source de truth en el futuro sin modificar componentes.

2. **Sin personalización en esta fase**: La UI de personalización de ingredientes (US-030) queda fuera de CH-013. El store ya soporta `personalizacion` pero la interfaz se implementará en un cambio posterior.

3. **Badge vía store selector**: El badge del carrito en sidebar y topbar usa `useCartStore(s => s.totalItems())` para suscripción granular (solo se re-renderiza cuando cambia el contador, no con todo el store).

4. **Confirmación antes de eliminar/vaciar**: Usamos `window.confirm()` por simplicidad y consistencia con el código existente. En futuros cambios se reemplazará por un modal global.

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `frontend/src/features/cart/hooks/useCart.ts` | Reescribir — wrapper real de useCartStore |
| `frontend/src/features/cart/hooks/index.ts` | Actualizar exports |
| `frontend/src/features/cart/components/CartSummary.tsx` | Reescribir — componente funcional |
| `frontend/src/features/cart/components/index.ts` | Agregar exports |
| `frontend/src/pages/CartPage.tsx` | Crear — página de carrito |
| `frontend/src/features/cart/components/AddToCartButton.tsx` | Crear — botón de agregar |
| `frontend/src/pages/PublicCatalogPage.tsx` | Integrar AddToCartButton en cada card |
| `frontend/src/app/Router.tsx` | Agregar ruta `/carrito` |
| `frontend/src/pages/index.ts` | Exportar CartPage |
