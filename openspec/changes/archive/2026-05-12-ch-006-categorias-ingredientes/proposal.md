# CH-006 — Catálogo: Categorías + Ingredientes

> **Estado**: Propuesta
> **Fecha**: 2026-05-12

## Qué

Implementar los módulos de **Categorías** (jerarquía autoreferenciada) e **Ingredientes** (con alérgenos) como base del catálogo de productos, incluyendo backend CRUD y frontend de administración.

## Por qué

Sin categorías e ingredientes no se pueden crear productos, y sin productos no hay carrito, pedidos ni pagos. Es la puerta de entrada al dominio de negocio. Los modelos ya existen desde CH-002 y los patrones base (BaseRepository, UoW) ya están probados con auth.

## Alcance

| Módulo | Backend | Frontend |
|--------|---------|----------|
| Categorías | CRUD + CTE recursiva + anti-ciclos + soft delete con verificación de asociaciones | Lista jerárquica, formulario crear/editar con selector de padre |
| Ingredientes | CRUD + validación nombre único + hard delete con verificación de asociaciones | Lista con filtro de alérgenos, formulario crear/editar |

## Roles requeridos

- **ADMIN**: acceso completo a ambos módulos (gestión de catálogo)

## Dependencias

- ✅ CH-004 (BaseRepository, UoW) — resuelto
- ✅ Modelos `Categoria` e `Ingrediente` — existen desde CH-002

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| CTE recursiva compleja | Tests con fixture de árbol de 3 niveles |
| Categorías huérfanas al eliminar padre | Validación: reasignar hijos o bloquear |
| Nombres duplicados | Validación de unicidad por nivel |

## Complejidad

- Backend: Alta (CTE recursiva, anti-ciclos)
- Frontend: Media (CRUD estándar)
- Total estimado: ~24h
