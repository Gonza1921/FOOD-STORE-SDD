## 1. Navbar Components

- [x] 1.1 Crear `NavbarSearch.tsx` — input con debounce 300ms, suggestions dropdown con fetch a productos, navegación a detalle y enter a catálogo
- [x] 1.2 Crear `NavbarCategories.tsx` — dropdown que fetchea categorías desde GET /categorias y navega a /catalogo?categoria_id=
- [x] 1.3 Crear `NavbarCart.tsx` — icono carrito con badge de cantidad desde useCartStore
- [x] 1.4 Crear `NavbarProfile.tsx` — avatar + nombre + dropdown con links (perfil, pedidos, direcciones) + logout
- [x] 1.5 Crear `Navbar.tsx` — container principal responsive: desktop horizontal, mobile hamburger + drawer
- [x] 1.6 Crear `Navbar/index.ts` — re-export de todos los componentes

## 2. Footer Component

- [x] 2.1 Crear `Footer.tsx` — layout con info de compañía, links rápidos, copyright
- [x] 2.2 Crear `Footer/index.ts` — re-export

## 3. Integración en CustomerLayout

- [x] 3.1 Modificar `CustomerLayout.tsx` — importar Navbar y Footer, reemplazar placeholders
- [x] 3.2 Verificar que el build de TypeScript compila sin errores (`npm run type-check`)
- [x] 3.3 Verificar responsive: navbar se ve correctamente en mobile y desktop
