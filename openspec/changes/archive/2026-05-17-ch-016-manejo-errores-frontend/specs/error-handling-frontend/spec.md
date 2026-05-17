## ADDED Requirements

### Requirement: Pantalla de error con reintento

Cuando un componente en el árbol de React produce un error no capturado, el sistema SHALL mostrar una pantalla de error amigable con opción de reintentar, en lugar de una pantalla blanca o un crash silencioso.

#### Scenario: Error de renderizado capturado por ErrorBoundary
- **WHEN** un componente lanza una excepción durante el renderizado
- **THEN** el ErrorBoundary captura el error y muestra una UI con mensaje "Algo salió mal" y un botón "Reintentar"
- **AND** el usuario puede hacer clic en "Reintentar" para recargar la página actual

#### Scenario: Error reseteable tras fallo transitorio
- **WHEN** ocurre un error capturado por ErrorBoundary
- **AND** el usuario hace clic en "Reintentar"
- **THEN** el estado de error se resetea y se reintenta el renderizado del árbol de componentes

### Requirement: ToastContainer visible

El sistema SHALL renderizar los toasts almacenados en el store global (`useUiStore.toasts`) en una posición fija en pantalla, visibles para el usuario hasta su auto-dismiss (según `duration`) o cierre manual.

#### Scenario: Toast aparece al agregarse al store
- **WHEN** se llama a `addToast` con un tipo y mensaje
- **THEN** el ToastContainer renderiza un toast en la esquina inferior derecha
- **AND** el toast se desvanece automáticamente después de la duración especificada (default 3s)

#### Scenario: Toast se cierra manualmente
- **WHEN** el usuario hace clic en el botón de cerrar del toast
- **THEN** el toast se remueve inmediatamente de la pantalla

#### Scenario: Toast type define estilo visual
- **WHEN** se muestra un toast de tipo `success`
- **THEN** tiene estilo verde/éxito
- **WHEN** se muestra un toast de tipo `error`
- **THEN** tiene estilo rojo/error
- **WHEN** se muestra un toast de tipo `info`
- **THEN** tiene estilo azul/informativo
- **WHEN** se muestra un toast de tipo `warning`
- **THEN** tiene estilo amarillo/advertencia

### Requirement: Interceptor de errores HTTP centralizado

El sistema SHALL interceptar respuestas HTTP con códigos de error (excepto 401, que ya tiene manejo propio) y mostrar un toast automático con un mensaje user-friendly según el código.

#### Scenario: Error 400 Bad Request
- **WHEN** el backend responde con HTTP 400
- **THEN** se muestra un toast con el mensaje del backend o "Error de validación. Revisá los datos ingresados."

#### Scenario: Error 403 Forbidden
- **WHEN** el backend responde con HTTP 403
- **THEN** se muestra un toast "No tenés permisos para realizar esta acción."

#### Scenario: Error 404 Not Found
- **WHEN** el backend responde con HTTP 404
- **THEN** se muestra un toast "El recurso solicitado no existe."

#### Scenario: Error 429 Too Many Requests
- **WHEN** el backend responde con HTTP 429
- **THEN** se muestra un toast "Demasiadas solicitudes. Esperá un momento e intentá de nuevo."

#### Scenario: Error 500 Internal Server Error
- **WHEN** el backend responde con HTTP 500
- **THEN** se muestra un toast "Error interno del servidor. Intentá de nuevo más tarde."

#### Scenario: Error de red (sin respuesta del servidor)
- **WHEN** la request falla sin respuesta del servidor (error de red, timeout)
- **THEN** se muestra un toast "Error de conexión. Verificá tu internet e intentá de nuevo."

#### Scenario: Error en endpoint auth no dispara toast duplicado
- **WHEN** un endpoint de auth (login, register, refresh) responde con error
- **THEN** el interceptor NO muestra toast automático (el manejo es responsabilidad del formulario)
