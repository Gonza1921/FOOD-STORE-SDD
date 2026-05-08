# Proposal — change-auth

## Objetivo

Implementar el sistema completo de autenticación y autorización para FOOD STORE utilizando JWT y refresh tokens.

---

## Alcance

Este change incluirá:

- Registro de usuarios
- Inicio de sesión
- Refresh token
- Logout
- Protección de rutas
- Roles y permisos básicos
- Persistencia de sesión
- Integración frontend/backend

---

## Historias de Usuario Relacionadas

- US-001 Registro de usuario
- US-002 Inicio de sesión
- US-003 Cierre de sesión
- US-004 Persistencia de sesión
- US-005 Protección de rutas

---

## Dependencias

- PostgreSQL
- FastAPI
- React
- Zustand
- JWT utilities

---

## Riesgos

- Exposición de secretos JWT
- Manejo incorrecto de refresh tokens
- Problemas de expiración de sesión
- Dependencias circulares frontend

---

## Resultado Esperado

El usuario podrá autenticarse de forma segura y acceder únicamente a funcionalidades permitidas según su rol.