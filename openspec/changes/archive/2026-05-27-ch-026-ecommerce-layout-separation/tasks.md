## 1. Crear Layout Components

- [x] 1.1 Crear `PublicLayout.tsx` — wrapper mínimo para rutas públicas sin auth
- [x] 1.2 Crear `CustomerLayout.tsx` — wrapper limpio para clientes CLIENT sin sidebar
- [x] 1.3 Crear `AdminLayout.tsx` — copia del AppLayout actual con glass sidebar + topbar, renombrado

## 2. Router Restructuring

- [x] 2.1 Eliminar `AppLayout.js` (artifacto compilado obsoleto de JS)
- [x] 2.2 Actualizar imports en `Router.tsx`: reemplazar AppLayout por los 3 nuevos layouts
- [x] 2.3 Reestructurar rutas: rutas públicas bajo `<PublicLayout />`
- [x] 2.4 Reestructurar rutas: rutas de cliente bajo `<CustomerLayout />` con ProtectedRoute
- [x] 2.5 Reestructurar rutas: rutas admin bajo `<AdminLayout />` con roles explícitos
- [x] 2.6 Verificar que la ruta raíz `/` resuelve correctamente por rol (CLIENT → CustomerLayout, ADMIN → redirect)

## 3. Verificación de Regresiones

- [x] 3.1 Verificar que el build de TypeScript compila sin errores (`npm run type-check`)
- [x] 3.2 Verificar que todas las rutas públicas funcionan (catalogo, producto detail)
- [x] 3.3 Verificar rutas de admin con sidebar funcionan (dashboard, usuarios, productos, etc.)
- [x] 3.4 Verificar que `/cocina` sigue siendo full-screen sin layout
- [x] 3.5 Verificar que login/logout + auth pages no tienen layout wrapper
- [x] 3.6 Verificar 404 catch-all sigue funcionando
