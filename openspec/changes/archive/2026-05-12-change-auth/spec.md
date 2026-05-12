# Spec — change-auth

## Requisitos

### AUTH-001

El sistema MUST permitir registro de usuarios.

### AUTH-002

El sistema MUST permitir inicio de sesión mediante email y contraseña.

### AUTH-003

El sistema MUST generar JWT access token.

### AUTH-004

El sistema MUST soportar refresh tokens.

### AUTH-005

El sistema MUST proteger rutas autenticadas.

---

# Scenarios

## Scenario: Registro exitoso

GIVEN un usuario nuevo  
WHEN envía email y contraseña válidos  
THEN el sistema debe crear la cuenta correctamente.

---

## Scenario: Login exitoso

GIVEN un usuario registrado  
WHEN ingresa credenciales válidas  
THEN el sistema debe retornar access token y refresh token.

---

## Scenario: Acceso denegado

GIVEN un usuario no autenticado  
WHEN intenta acceder a una ruta protegida  
THEN el sistema debe responder Unauthorized.

---

## Scenario: Refresh token válido

GIVEN un refresh token válido  
WHEN el usuario solicita renovación  
THEN el sistema debe generar un nuevo access token.