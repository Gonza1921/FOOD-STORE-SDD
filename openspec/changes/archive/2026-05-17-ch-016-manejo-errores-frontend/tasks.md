## 1. ErrorBoundary Component

- [x] 1.1 Crear `frontend/src/shared/ui/ErrorBoundary.tsx` — class component con `componentDidCatch` y `getDerivedStateFromError`
- [x] 1.2 Renderizar UI amigable con icono, mensaje y botón "Reintentar" (Tailwind, mismo diseño system)

## 2. ToastContainer Component

- [x] 2.1 Crear `frontend/src/shared/ui/ToastContainer.tsx` — componente que se suscribe a `useUiStore.toasts` y renderiza toasts en `fixed bottom-4 right-4`
- [x] 2.2 Implementar variantes visuales por tipo (success=verde, error=rojo, info=azul, warning=amarillo) con iconos Material Symbols
- [x] 2.3 Agregar animación de entrada (slide-in desde derecha) y botón de cierre manual con cross icon
- [x] 2.4 Exportar desde `frontend/src/shared/ui/index.ts`

## 3. Axios Interceptor — Manejo de Errores Centralizado

- [x] 3.1 Extender `frontend/src/shared/api/axiosClient.ts` con lógica de mapeo de códigos HTTP a mensajes user-friendly
- [x] 3.2 Agregar mapeo para: 400 (validación), 403 (permisos), 404 (no encontrado), 429 (rate limit), 500 (error interno), error de red
- [x] 3.3 Disparar `addToast()` automático desde el interceptor con el mensaje correspondiente
- [x] 3.4 Ignorar endpoints de auth (login, register, refresh) para evitar toasts duplicados en formularios

## 4. Integración en App

- [x] 4.1 Envolver `frontend/src/app/App.tsx` con ErrorBoundary
- [x] 4.2 Agregar ToastContainer en el árbol de render (fuera del Router de rutas pero dentro de BrowserRouter)

## 5. Verificación

- [x] 5.1 Verificar que TypeScript compila sin errores
- [x] 5.2 Verificar que el build de producción compila sin errores

## 6. Fixes adicionales

- [x] 6.1 Arreglar errores pre-existentes en CheckoutPage.tsx (paymentStatus unused, total rename, producto→nombre/precio, useEffect cleanup)
- [x] 6.2 Arreglar error pre-existente en PaymentPage.tsx (preferencia state unused)
- [x] 6.3 Agregar color `info` al Tailwind config y CSS variables en globals.css
