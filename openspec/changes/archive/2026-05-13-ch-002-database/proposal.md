# Proposal — ch-002-database

## What Changes

Establishes the foundational PostgreSQL database layer with 13 complete entities (SQLModel), versioned migrations (Alembic), seed data catalogs (roles, order states, payment methods), and full referential integrity with indexes for production performance.

---

## Why

FOOD-STORE requires a robust, auditable data layer as the foundation for all business logic. This change:
- Locks in schema contract across services (APIs, workers)
- Enables reversible migrations for safe deployment
- Provides soft delete audit trail for compliance
- Implements hierarchical categories via PostgreSQL CTE
- Snapshots product prices at order time (immutable history)
- Enables fast queries with strategic indexes on FK + foreign keys

---

## Objetivo

Establecer la base de datos PostgreSQL con esquema completo (13 entidades), migraciones Alembic, seed data crítica (roles, estados de pedido, formas de pago) y validaciones de integridad referencial.

---

## Alcance

Este change incluirá:

- Configuración de PostgreSQL connection pool
- 13 tablas SQLModel con relaciones N:M, soft delete y constraints
- Alembic migrations (inicial + seed data)
- Seed data: Rol (4 registros), EstadoPedido (6), FormaPago (3), Usuario admin
- Health check y validación de BD en startup
- Fixtures para testing

---

## Historias de Usuario Relacionadas

- US-000b: Infraestructura de base de datos

---

## Dependencias

- **Upstream**: CH-001 (Backend Config) ✅ completado
- **Bloqueado por**: Ninguna
- **Parallelizable con**: CH-003 (Frontend Config)

---

## Riesgos

- ⚠️ Soft delete en consultas: olvidar agregar `WHERE deleted_at IS NULL`
- ⚠️ Constraints de integridad referencial en CTE recursiva (categorías)
- ⚠️ Snapshot Pattern en pedidos: cambios posteriores en producto no afectan historial
- ⚠️ Migración inicial puede fallar si BD existe previa

---

## Resultado Esperado

Base de datos PostgreSQL 100% funcional con todas las entidades, sin datos de negocio pero con catálogos de sistema listos para CH-004 (patrones base).

---

## Estimación

**4 horas** (~3 horas implement + 1 hora testing)
