## Context

El frontend de Food Store carece de manejo de errores global. Actualmente:

- **Toast Store**: Existe `useUiStore` con estado `toasts: Toast[]`, método `addToast()`, `removeToast()`, y auto-dismiss por timeout. Sin embargo, **no hay componente que renderice los toasts** — el store acumula toasts que nunca se ven.
- **ErrorBoundary**: No existe. Cualquier error de renderizado en un componente produce pantalla blanca sin recuperación posible.
- **Interceptor HTTP**: El interceptor de Axios maneja exclusivamente errores 401 (refresh automático). Los demás códigos HTTP (400, 403, 404, 429, 500) se manejan manualmente en cada página con lógica duplicada, o directamente no se manejan.
- **Error en queries**: TanStack Query maneja errores a nivel de hook individual, sin una estrategia centralizada.

El cambio implementa 3 elementos que cubren todas las capas de error en el frontend: errores de render (ErrorBoundary), errores HTTP (interceptor Axios), y feedback visual (ToastContainer).

## Goals / Non-Goals

**Goals:**
- Capturar errores de renderizado con un ErrorBoundary que muestre UI amigable y permita reintentar
- Renderizar los toasts del store global con posicionamiento, animaciones y tipos (success/error/info/warning)
- Extender el interceptor de Axios para mapear códigos HTTP a mensajes user-friendly con toasts automáticos
- Integrar ErrorBoundary y ToastContainer en la raíz de la aplicación sin afectar el layout existente

**Non-Goals:**
- No se modifican los stores existentes (solo se consume `useUiStore`)
- No se agregan nuevas dependencias externas
- No se modifica el backend
- No se reemplaza el manejo de errores manual existente — se agrega una capa base que funciona como fallback y mejora progresiva

## Decisions

### 1. ErrorBoundary como Class Component

**Decisión**: Usar `React.Component` (class component) con `componentDidCatch` y `getDerivedStateFromError` para el ErrorBoundary.

**Rationale**: Los ErrorBoundary REQUIEREN class components — React no soporta hooks para `componentDidCatch`. Usar una librería externa (`react-error-boundary`) agregaría una dependencia innecesaria para 30 líneas de código.

**Alternativa considerada**: Envolver con `react-error-boundary`. Descartada por simplicidad — el componente es trivially small y mantener cero dependencias es preferible.

### 2. ToastContainer como Fixed Overlay

**Decisión**: Posicionar los toasts en `fixed bottom-4 right-4` con stack vertical, animación de entrada (slide-in desde derecha) y auto-dismiss usando el timeout ya implementado en el store.

**Rationale**: La posición bottom-right es la más común en SaaS y no interfiere con el sidebar ni el topbar. El store ya maneja auto-dismiss vía `setTimeout` — el componente solo necesita suscribirse al estado `toasts` y renderizar.

**Alternativa considerada**: Posicionamiento top-right o top-center. Bottom-right evita solaparse con el topbar sticky y es más natural para notificaciones no bloqueantes.

### 3. Interceptor Centralizado con Middleware Pattern

**Decisión**: Agregar un segundo `response.use()` en el interceptor de Axios (después del existente de refresh 401) que:
- Ignora requests exitosos y errores 401 (ya manejados por el interceptor anterior)
- Mapea códigos HTTP a mensajes user-friendly según tabla definida
- Dispara `addToast({ type: 'error', message })` automáticamente
- No interfiere con endpoints de auth (login, register, refresh)

**Rationale**: Separar responsabilidades — el primer interceptor maneja refresh 401, el segundo maneja feedback al usuario. Esto mantiene el código limpio y cada interceptor con una única responsabilidad.

**Alternativa considerada**: Un solo interceptor gigante que hace todo. Descartado — viola Single Responsibility y dificulta testing.

## Risks / Trade-offs

- **[Duplicación temporal]**: Las páginas que ya manejan errores manualmente (CheckoutPage, AdminUsuariosPage) mostrarán toasts duplicados hasta que se migren progresivamente. → **Mitigación**: El interceptor NO interfiere con el manejo existente; los toasts del interceptor son adicionales. Se migrarán página por página en cambios posteriores.
- **[Toast overflow]**: Múltiples errores rápidos podrían apilar muchos toasts. → **Mitigación**: El store mantiene máximo implícito (sin límite duro, pero cada toast tiene auto-dismiss de 3-5 segundos).
- **[ErrorBoundary muy general]**: Un ErrorBoundary en la raíz captura DEMASIADO — incluye errores de navegación que deberían manejarse localmente. → **Mitigación**: Se posiciona DENTRO de BrowserRouter pero FUERA del Router de rutas, permitiendo agregar boundaries más específicos en el futuro.

## Open Questions

- ¿Debe el interceptor ignorar ciertos endpoints específicos? Por ahora solo ignora auth endpoints. Se puede extender si surgen casos particulares.
