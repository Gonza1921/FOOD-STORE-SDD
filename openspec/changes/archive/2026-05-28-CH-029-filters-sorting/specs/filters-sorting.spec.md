# CH-029 Especificaciones: Filtros y Ordenamiento de Productos

## 📋 Requisitos Funcionales

### Backend

| # | Requisito | Tipo | Descripción |
|---|-----------|------|-------------|
| 1 | Parámetro price_min | MUST | Aceptar `price_min` como query param (integer, cents, opcional) |
| 2 | Parámetro price_max | MUST | Aceptar `price_max` como query param (integer, cents, opcional) |
| 3 | Parámetro sort_by | MUST | Aceptar `sort_by` enum: `price_asc`, `price_desc`, `nombre_asc`, `nombre_desc`, `reciente` |
| 4 | Filtrado de rango | MUST | Retornar solo productos donde `precio_base >= price_min AND precio_base <= price_max` |
| 5 | Compatibilidad alérgenos | MUST | Mantener filtro existente `excluir_alergenos` funcionando sin cambios |
| 6 | Paginación | MUST | Retornar máx 20 items por página, incluir `has_next`, `has_prev`, `total` |
| 7 | Autenticación | MUST | NO requerir autenticación (endpoint público) |
| 8 | Validación | SHOULD | Rechazar si `price_min > price_max` con HTTP 400 |

### Frontend

| # | Requisito | Tipo | Descripción |
|---|-----------|------|-------------|
| 1 | Componente PriceRangeFilter | MUST | Renderizar inputs para min/max con validación USD |
| 2 | Componente SortDropdown | MUST | Mostrar 5 opciones de ordenamiento con labels claros |
| 3 | Aplicación sin recarga | MUST | Usar TanStack Query para refetch (no page reload) |
| 4 | Mensaje sin resultados | MUST | Mostrar "No hay productos que coincidan" si filtro retorna 0 items |
| 5 | Indicador de carga | SHOULD | Mostrar spinner mientras TanStack Query fetches |
| 6 | Persistencia de estado | SHOULD | Guardar filtros en localStorage para restaurar en refresh |
| 7 | Botón Limpiar | SHOULD | Reset de todos los filtros a valores default |

---

## 🎯 Escenarios GIVEN/WHEN/THEN

### Escenario 1: Aplicar filtro de rango de precio

```gherkin
GIVEN    usuario está en página de detalle de categoría viendo 50 productos
AND      rango de precios visible: $5 a $50
WHEN     usuario ingresa precio mínimo $10 en PriceRangeFilter
AND      ingresa precio máximo $30
AND      hace clic en "Filtrar"
THEN     TanStack Query refetch con ?price_min=1000&price_max=3000
AND      ProductList se re-renderiza solo con productos en ese rango
AND      contador de productos actualiza a 15 (ej)
AND      no hay recarga de página (client-side fetch)
```

### Escenario 2: Ordenar por precio ascendente

```gherkin
GIVEN    lista de 20 productos filtrados con varios precios
WHEN     usuario selecciona "Menor precio primero" del SortDropdown
THEN     TanStack Query refetch con ?sort_by=price_asc
AND      ProductList se re-renderiza ordenado por precio ascendente
AND      spinner de carga visible brevemente durante fetch
AND      orden es: [$5.99, $7.50, $12.00, $15.99, ...]
```

### Escenario 3: Combinar filtro de precio + ordenamiento

```gherkin
GIVEN    usuario ya tiene filtro activo: price_min=$5, price_max=$20
WHEN     usuario también selecciona sort_by=nombre_asc
THEN     query enviada: ?price_min=500&price_max=2000&sort_by=nombre_asc
AND      productos retornan: FILTRADOS (por precio) Y ORDENADOS (por nombre)
AND      UI resalta AMBOS filtros como activos en la interfaz
AND      ejemplo de resultado: [Agua purificada, Jugo de manzana, Leche descremada, ...]
```

### Escenario 4: Limpiar todos los filtros

```gherkin
GIVEN    usuario tiene filtros activos:
  - price_min=$10
  - price_max=$30
  - sort_by=price_desc
WHEN     usuario hace clic en botón "Limpiar filtros"
THEN     estado de filtros se resetea a defaults:
  - price_min=null
  - price_max=null
  - sort_by="reciente"
AND      TanStack Query refetch SIN parámetros de filtro
AND      ProductList re-renderiza con TODOS los productos del catálogo
```

### Escenario 5: Backend rechaza rango de precio inválido

```gherkin
GIVEN    usuario intenta aplicar filtro con min > max
AND      ingresa: price_min=$30, price_max=$10
WHEN     usuario envía el filtro
THEN     backend responde HTTP 400:
  {
    "detail": "price_min debe ser menor que price_max"
  }
AND      frontend captura error y muestra toast: "Rango de precio inválido"
AND      filtro NO se aplica (ProductList sigue mostrando resultados previos)
AND      campos de input mantienen valores ingresados para corrección
```

### Escenario 6: Paginación manteniendo filtros activos

```gherkin
GIVEN    usuario filtró productos: price_min=$5, price_max=$100
AND      resultado: 60 productos totales
AND      paginación: 20 items por página
AND      actualmente en página 1 (items 1-20)
WHEN     usuario hace clic en botón "Siguiente página"
THEN     TanStack Query refetch con MISMOS filtros + ?page=2
AND      items 21-40 se cargan y renderan
AND      botón "Anterior" se activa (está en página 2)
AND      indicador muestra "Página 2 de 3"
```

### Escenario 7: sort_by inválido devuelve error

```gherkin
GIVEN    frontend tiene bug y intenta enviar sort_by=INVALID
WHEN     TanStack Query envía query con parámetro inválido
THEN     backend responde HTTP 400:
  {
    "detail": "sort_by debe ser uno de: price_asc, price_desc, nombre_asc, nombre_desc, reciente"
  }
AND      frontend muestra toast error
AND      ProductList mantiene último resultado válido
```

### Escenario 8: Mantener compatibilidad con filtro de alérgenos

```gherkin
GIVEN    usuario tiene feature flag excluir_alergenos=true
AND      ha ingresado: excluir_alergenos=cacahuete,nueces
WHEN     también aplica filtro de precio: price_min=$5, price_max=$20
THEN     query final: ?price_min=500&price_max=2000&sort_by=reciente&excluir_alergenos=cacahuete,nueces
AND      backend ejecuta AMBOS filtros (price AND allergen exclusion)
AND      resultado: productos en rango de precio SIN alérgenos especificados
```

### Escenario 9: Sin resultados con filtro aplicado

```gherkin
GIVEN    usuario aplica filtro muy restrictivo
AND      por ej: price_min=$100, price_max=$200 en categoría con max $50
WHEN     TanStack Query fetch completa
THEN     backend retorna 200 OK:
  {
    "items": [],
    "total": 0,
    "page": 1,
    "has_next": false,
    "has_prev": false
  }
AND      frontend renderiza mensaje: "No hay productos que coincidan con tus filtros"
AND      botón "Limpiar filtros" es destacado para facilitar reset
```

### Escenario 10: Restaurar filtros desde localStorage en refresh

```gherkin
GIVEN    usuario ha aplicado filtros en sesión actual
  - price_min=$10
  - price_max=$30
  - sort_by=nombre_asc
WHEN     filters se guardaron en localStorage
AND      usuario hace F5 o cierra pestaña y regresa
THEN     localStorage se recupera y filtros se restauran automáticamente
AND      TanStack Query refetch automático con filtros previos
AND      ProductList renderiza con MISMOS resultados que antes del refresh
```

---

## 🔌 Especificación del Endpoint Backend

### GET /api/v1/public/productos

**Parámetros Query**:

| Parámetro | Tipo | Requerido | Rango | Descripción |
|-----------|------|----------|-------|-------------|
| `categoria_id` | int | No | > 0 | Filtrar por categoría |
| `price_min` | int | No | >= 0 | Precio mínimo en centavos (ej: 1000 = $10.00) |
| `price_max` | int | No | >= price_min | Precio máximo en centavos |
| `sort_by` | enum | No | {price_asc, price_desc, nombre_asc, nombre_desc, reciente} | Default: reciente |
| `page` | int | No | >= 1 | Page number (1-indexed), default: 1 |
| `limit` | int | No | 1–100 | Items per page, default: 20 |
| `excluir_alergenos` | string | No | CSV | Lista de alérgenos a excluir (mantener compatibilidad) |

**Response (200 OK)**:

```json
{
  "items": [
    {
      "id": 1,
      "nombre": "Leche descremada La Serenísima",
      "descripcion": "1 litro, fresca",
      "precio_base": 1500,
      "stock_cantidad": 45,
      "es_destacado": true,
      "categoria_id": 2,
      "imagen_url": "https://...",
      "tiene_oferta": false
    },
    {
      "id": 2,
      "nombre": "Yogur Natural",
      "descripcion": "500ml",
      "precio_base": 800,
      "stock_cantidad": 120,
      "es_destacado": false,
      "categoria_id": 2,
      "imagen_url": "https://...",
      "tiene_oferta": true
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "has_next": true,
  "has_prev": false
}
```

**Error Responses**:

```json
// 400: price_min > price_max
{
  "detail": "price_min debe ser menor o igual a price_max"
}

// 400: sort_by inválido
{
  "detail": "sort_by debe ser uno de: price_asc, price_desc, nombre_asc, nombre_desc, reciente"
}

// 400: page < 1
{
  "detail": "page debe ser >= 1"
}

// 404: categoria_id inválida (si se especifica)
{
  "detail": "Categoría no encontrada"
}
```

---

## 🎣 Hook Frontend

```typescript
// Signature en frontend/hooks/useProducts.ts

interface ProductFilters {
  categoria_id?: number;
  price_min?: number;
  price_max?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'nombre_asc' | 'nombre_desc' | 'reciente';
  page?: number;
  limit?: number;
}

interface UseProductsResult {
  data: ProductoOutPublic[];
  total: number;
  page: number;
  has_next: boolean;
  has_prev: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
}

export function useProducts(filters: ProductFilters): UseProductsResult {
  // Implementación con TanStack Query v5+
  // Mantiene cache de queries
  // Refetch automático en cambio de filtros
}
```

---

## ✅ Criterios de Aceptación

- [ ] Backend acepta `price_min`, `price_max`, `sort_by` sin errores
- [ ] Frontend renderiza PriceRangeFilter + SortDropdown
- [ ] Filtros se aplican sin recarga de página (TanStack Query)
- [ ] Índice en `precio_base` mejora query time en >50%
- [ ] Paginación funciona correctamente (20 items/página)
- [ ] Validación rechaza price_min > price_max con HTTP 400
- [ ] localStorage persiste filtros entre refreshes
- [ ] Compatibilidad alérgenos mantiene trabajo (no regression)
- [ ] Tests unitarios backend: 3 escenarios mínimo
- [ ] Tests E2E frontend: filtro + sort + paginación
- [ ] Performance: query compleja < 200ms en dataset 5k+ productos
- [ ] Mensaje "Sin resultados" renderiza cuando hay 0 items
