# CH-019: Fix direcciones CRUD y checkout — bugs de conexión y ruta

**Fecha**: 2026-05-18
**Actor**: CLIENTE
**Tipo**: fix
**Complejidad**: media

## Problema

La sección "Mis Direcciones" y el flujo Carrito → Checkout mostraban "ERROR DE CONEXIÓN" y no era posible crear direcciones nuevas. El sistema de direcciones estaba completamente roto tanto en frontend como en backend.

## Síntomas Reportados

1. **Mis Direcciones** → muestra "Error de conexión"
2. **Carrito → Checkout** → muestra "Error de conexión"
3. **Crear nueva dirección** → devuelve 404

## Causas Raíz Identificadas

### Backend (2 bugs críticos)

1. **Missing `__tablename__` en modelo SQLModel**: El modelo `DireccionEntrega` no declaraba `__tablename__`, lo que hacía que SQLModel infiriera el nombre de tabla como `direccionentrega` (lowercase concatenado). Pero la migración Alembic creó la tabla como `direccion_entrega`. Cada consulta a direcciones fallaba con `UndefinedTableError: "direccionentrega"`.

2. **Timezone-aware datetime en soft_delete**: El método `soft_delete` en `Repository` usaba `datetime.now(timezone.utc)` que genera un datetime offset-aware. La columna `deleted_at` es `TIMESTAMP WITHOUT TIME ZONE`, lo que causaba un `DataError` de asyncpyg al intentar DELETE.

### Frontend (1 bug, 1 mejora)

3. **Ruta `/mis-direcciones/nueva` inexistente**: El `CheckoutPage` enlaza a `/mis-direcciones/nueva` cuando el usuario no tiene direcciones, pero esa ruta no existía en `Router.tsx`.

4. **Modal de creación no se abría automáticamente**: Aún si la ruta existiera, `DireccionesListPage` no detectaba que venía de una navegación "nueva dirección" para abrir el modal.

## Scope del Fix

- Backend: modelo `DireccionEntrega` en `backend/models/direccion.py`
- Backend: `Repository.soft_delete` en `backend/core/repository.py`
- Frontend: `Router.tsx` — agregar ruta `/mis-direcciones/nueva`
- Frontend: `DireccionesListPage.tsx` — auto-open modal desde `/nueva`

## Entregables

- Backend CRUD de direcciones funcionando (GET, POST, PUT, PATCH principal, DELETE)
- Ruta `/mis-direcciones/nueva` funcional
- Modal de creación auto-abierto desde checkout
- Build frontend y backend OK
