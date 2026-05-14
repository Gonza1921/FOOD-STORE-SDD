# CH-009: Direcciones de Entrega

## Qué
Módulo completo de direcciones de entrega para usuarios del Food Store. Permite a los usuarios autenticados gestionar sus direcciones (CRUD) con soporte para dirección principal, soft delete y ownership validation.

## Por qué
Los pedidos (CH-008) necesitan una dirección de entrega asociada. No existía un módulo de direcciones funcional — solo el modelo de datos sin endpoints ni UI.

## Alcance
- Backend: CRUD completo con 6 endpoints protegidos
- Frontend: página de gestión /mis-direcciones con TanStack Query
- Migración: columnas referencia + deleted_at en direccion_entrega
- Bugfix: link_model string → class en Categoria, Ingrediente, Pedido
