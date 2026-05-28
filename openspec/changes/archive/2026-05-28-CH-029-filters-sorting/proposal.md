# Propuesta: CH-029 Filtros y Ordenamiento de Productos

## Intent

Actualmente los usuarios no pueden refinar su búsqueda de productos más allá de navegar por categorías. Ven TODO el catálogo de una categoría de golpe sin opciones para filtrar por precio o ordenar resultados. Esto genera fricción en la experiencia: clientes de presupuesto ajustado no pueden ver solo productos económicos, y sin ordenamiento por precio/nombre/reciente, encontrar lo que buscan es tedioso. Una vez que CH-028 (Categorías) está operativo, necesitamos que los usuarios puedan refinar esa oferta.

## Scope

### Incluido ✅
- Backend: Parámetros de filtro (`price_min`, `price_max`) y ordenamiento (`sort_by`: precio, nombre, reciente)
- Endpoint mejorado: `GET /productos?categoria_id=X&price_min=Y&price_max=Z&sort_by=price_asc`
- Frontend: Migración a TanStack Query con paginación
- Base de datos: Índice en `precio_base` para performance de sort
- Exclusión de alérgenos en el filtro (mantener lógica existente)

### Excluido ❌
- Preferencias dietarias (diferir a CH-031)
- Sincronización de estado de filtros en URL (diferir a pulido UX)
- UI de filtros en panel de admin (solo cliente-facing)

## Approach

**Híbrido Backend + Frontend**: Backend provee filtros + sort completos; frontend usa TanStack Query con paginación de 12-20 items por página (sin sincronización de URL state aún).

1. **Backend (FastAPI)**: Extender router `/productos` para aceptar `price_min`, `price_max`, `sort_by`
2. **Base de datos**: Crear índice en `precio_base` y `categoria_id` para queries rápidas
3. **Frontend**: Reemplazar lógica client-side con TanStack Query, componentes de filtro en ProductCard
4. **No incluir**: URL state sync (próxima iteración de UX)

## Affected Areas

| Área | Cambio | Descripción |
|------|--------|-------------|
| `backend/routers/productos.py` | Modificado | Agregar parámetros `price_min`, `price_max`, `sort_by` al endpoint |
| `backend/services/product_service.py` | Modificado | Implementar lógica de filtro + sort |
| `backend/models/producto.py` | Sin cambios | (índice via migración) |
| `migrations/` | Nueva | Alembic: Crear índice en `precio_base` |
| `frontend/pages/ProductList.tsx` | Modificado | Migrar a TanStack Query pagination |
| `frontend/features/filters/` | Nueva | Componentes: PriceRangeFilter, SortDropdown |
| `frontend/hooks/useProducts.ts` | Nueva | Hook custom para queries con filtros |

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|-----------|
| Query N+1 con categorías/alérgenos | Media | Verificar `joinedload` en SQLAlchemy, tests de performance |
| URL state desincronizado (futura feature) | Baja | Documentar que esto se aplica en CH-032 |
| Índice en `precio_base` fragmenta writes | Baja | Índice simple, no composite; monitorear durante load test |

## Rollback Plan

1. Backend: Revertir commits de `routers/productos.py` y `services/`
2. Base de datos: `alembic downgrade -1` (remove índice)
3. Frontend: Revertir a lógica client-side de sort (sin filtros backend)
4. Test: Verificar que endpoint viejo sigue respondiendo

## Dependencies

- **Requiere**: CH-026 (Separación de Layout), CH-028 (Browsing Categorías ya completo)
- **Habilita**: CH-031 (Real-Time Tracking puede reutilizar patrones de filtro)

## Success Criteria

- [ ] Backend acepta `price_min`, `price_max`, `sort_by` sin errores
- [ ] Frontend renderiza filtros + ordenamiento y los aplica sin reload
- [ ] Índice en `precio_base` mejora query time en >50% vs sin índice
- [ ] TanStack Query paginación muestra máx 20 items por página
- [ ] Tests backend + frontend cubren 3 escenarios por filtro (happy path, edge, error)
- [ ] Desempeño: query con filtro complejo <200ms en dataset 5k+ productos
