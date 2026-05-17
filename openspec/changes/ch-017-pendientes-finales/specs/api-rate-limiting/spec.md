# Spec: api-rate-limiting

## Overview

Extensión del sistema de rate limiting existente para cubrir dos endpoints críticos que actualmente no tienen protección: registro de usuarios y creación de pedidos. Estos límites complementan el rate limiting ya existente en login (5 intentos cada 15 minutos por IP).

## ADDED Requirements

### Requirement: Rate limiting en registro (US-073)

El sistema SHALL limitar las solicitudes de registro `POST /api/v1/auth/register` a un máximo de 3 solicitudes por hora por IP.

#### Scenario: Registros dentro del límite
- **WHEN** un cliente hace POST /api/v1/auth/register desde una IP por primera vez
- **THEN** el sistema permite el registro normalmente
- **AND** retorna 201 Created si los datos son válidos
- **AND** el contador de rate limit se incrementa

#### Scenario: Excede 3 registros en una hora desde la misma IP
- **GIVEN** un cliente ha realizado 3 registros desde la IP 192.168.1.1 en la última hora
- **WHEN** intenta un cuarto registro desde la misma IP
- **THEN** el sistema retorna 429 Too Many Requests
- **AND** el mensaje indica "Demasiados registros. Intente nuevamente en X minutos."
- **AND** el registro NO se procesa aunque los datos sean válidos

#### Scenario: Límite se resetea después de una hora
- **GIVEN** un cliente excedió el límite de registros desde la IP 192.168.1.1
- **WHEN** pasan más de 60 minutos desde el primer registro
- **THEN** el contador se resetea
- **AND** el cliente puede registrar nuevamente

#### Scenario: Rate limit de registro es independiente del de login
- **WHEN** un cliente excede el límite de registro (3/hora)
- **THEN** el endpoint de login NO se ve afectado
- **AND** el cliente puede seguir intentando login hasta su propio límite (5/15min)

---

### Requirement: Rate limiting en creación de pedido (US-073)

El sistema SHALL limitar las solicitudes de creación de pedido `POST /api/v1/pedidos` a un máximo de 10 solicitudes por hora por usuario autenticado.

#### Scenario: Creaciones de pedido dentro del límite
- **WHEN** un usuario autenticado crea hasta 10 pedidos en una hora
- **THEN** todos los pedidos se crean normalmente
- **AND** cada solicitud incrementa el contador del usuario

#### Scenario: Excede 10 pedidos en una hora
- **GIVEN** un usuario autenticado ha creado 10 pedidos en la última hora
- **WHEN** intenta crear un undécimo pedido
- **THEN** el sistema retorna 429 Too Many Requests
- **AND** el mensaje indica "Demasiados pedidos. Intente nuevamente en X minutos."
- **AND** el pedido NO se crea

#### Scenario: Rate limit por usuario, no por IP
- **GIVEN** dos usuarios autenticados diferentes (user A y user B) desde la misma IP
- **WHEN** user A ha creado 10 pedidos en la última hora
- **THEN** user A recibe 429 en el undécimo intento
- **AND** user B puede seguir creando pedidos sin restricción (su contador es independiente)
- **AND** el límite se basa en user_id (JWT subject), no en IP

#### Scenario: Rate limit de pedido no afecta otros endpoints
- **WHEN** un usuario excede el límite de creación de pedidos
- **THEN** otros endpoints autenticados (GET /api/v1/pedidos, etc.) NO se ven afectados
- **AND** el usuario puede listar sus pedidos sin restricción

#### Scenario: Rate limit usa ventana deslizante
- **GIVEN** un usuario creó 10 pedidos entre las 10:00 y las 10:45
- **WHEN** intenta crear un pedido a las 10:50
- **THEN** recibe 429 (aún hay 10 pedidos en la ventana de 60 minutos)
- **WHEN** intenta crear un pedido a las 11:01
- **THEN** el primer pedido (10:00) ya está fuera de la ventana
- **AND** el contador baja a 9
- **AND** el pedido se permite (si el contador es < 10)
