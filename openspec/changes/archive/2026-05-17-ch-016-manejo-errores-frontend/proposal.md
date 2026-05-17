## Why

El frontend no tiene manejo de errores global. Hoy:
- Los toasts se almacenan en el store (`useUiStore`) pero **nadie los renderiza** — hay Toast Store pero no ToastContainer.
- No existe un ErrorBoundary que capture errores de renderizado — cualquier crash de componente produce pantalla blanca sin feedback.
- El manejo de errores HTTP se hace manual, página por página, sin un interceptor centralizado que mapee códigos (400, 403, 404, 429, 500) a mensajes user-friendly.

Esto afecta directamente la experiencia de usuario y viola los criterios de aceptación de US-067 (Manejo de errores global en frontend, prioridad Alta).

## What Changes

- **ErrorBoundary**: Componente React que captura errores de renderizado en el árbol de componentes y muestra una UI amigable con opción de reintentar.
- **ToastContainer**: Componente que renderiza los toasts del store global (`useUiStore`) con posicionamiento, animaciones y auto-dismiss.
- **Axios Interceptor extendido**: Interceptor de respuesta que mapea códigos HTTP (400, 403, 404, 429, 500) a mensajes user-friendly y dispara toasts automáticos.
- **App Layout modificado**: Integración del ErrorBoundary y ToastContainer en la raíz de la aplicación.

## Capabilities

### New Capabilities
- `error-handling-frontend`: Manejo global de errores en el frontend — ErrorBoundary, ToastContainer visible, interceptor Axios con mapeo de códigos HTTP a mensajes user-friendly.

### Modified Capabilities
- (ninguna — no cambian requirements de specs existentes)

## Impact

- **Frontend**: 3 nuevos archivos, 1 archivo modificado
  - `frontend/src/shared/ui/ErrorBoundary.tsx` (nuevo)
  - `frontend/src/shared/ui/ToastContainer.tsx` (nuevo)
  - `frontend/src/shared/api/axiosClient.ts` (modificado — interceptor extendido)
  - `frontend/src/app/App.tsx` (modificado — wrapper ErrorBoundary + ToastContainer)
- **Backend**: Sin cambios
- **Especificaciones**: Se crea `openspec/specs/error-handling-frontend/spec.md`
