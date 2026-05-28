# Especificación de Productos — Filtros, Ordenamiento y Paginación

> **Source of Truth**: Comportamiento del módulo de productos (catálogo público)
> **Last updated**: 2026-05-28 (CH-029)
> **Metodología**: Spec-Driven Development (SDD) — RFC 2119

---

## 📋 Requisitos Funcionales — Backend

### GET /api/v1/public/productos

**Endpoint público** — no requiere autenticación.

#### Requisito: Filtrado por Rango de Precio

El sistema **DEBE** aceptar parámetros `price_min` y `price_max` como query params (ambos opcionales, enteros en centavos).

- El sistema **DEBE** retornar solo productos donde `precio_base >= price_min AND precio_base <= price_max`
- El sistema **DEBE** rechazar con HTTP 400 si `price_min > price_max`
- El sistema **DEBE** aceptar valores >= 0 para ambos parámetros

#### Requisito: Ordenamiento de Resultados

El sistema **DEBE** aceptar parámetro `sort_by` como enum con 5 valores:

| Valor | Ordenamiento | Default |
|-------|-------------|---------|
| `reciente` | `creado_en DESC` | ✅ Sí |
| `price_asc` | `precio_base ASC` | No |
| `price_desc` | `precio_base DESC` | No |
| `nombre_asc` | `nombre ASC` | No |
| `nombre_desc` | `nombre DESC` | No |

- El sistema **DEBE** rechazar con HTTP 400 si `sort_by` no está en el enum permitido

#### Requisito: Paginación

El sistema **DEBE** retornar resultados paginados con máximo 20 items por página.

- Parámetro `page` (opcional, default=1, 1-indexed, >= 1)
- Parámetro `limit` (opcional, default=20, max 100)
- El sistema **DEBE** retornar metadatos: `has_next`, `has_prev`, `total`, `page`, `limit`
- El sistema **DEBE** rechazar con 400 si `page < 1` o `limit > 100`

#### Requisito: Compatibilidad con Filtro de Alérgenos

El sistema **DEBE** mantener compatibilidad con el parámetro existente `excluir_alergenos`.

- Combina con filtros de precio usando AND lógico
- Funciona sin cambios en la lógica existente

#### Requisito: Estructura de Respuesta

El sistema **DEBE** retornar respuesta JSON con la estructura `PaginatedProductList`:

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
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "has_next": true,
  "has_prev": false
}
```

**Errores**:

```json
// 400: price_min > price_max
{ "detail": "price_min debe ser menor o igual a price_max" }

// 400: sort_by inválido
{ "detail": "sort_by debe ser uno de: price_asc, price_desc, nombre_asc, nombre_desc, reciente" }

// 400: page < 1
{ "detail": "page debe ser >= 1" }

// 404: categoria_id inválida
{ "detail": "Categoría no encontrada" }
```

---

## 🎨 Requisitos Funcionales — Frontend

#### Requisito: Componente PriceRangeFilter

El sistema **DEBE** renderizar un componente con dos inputs numéricos para precio mínimo y máximo.

- Inputs muestran valores en USD con símbolo $
- Validación inline: rechazar si min > max (deshabilitar botón "Filtrar")
- Mensaje de error: "El mínimo no puede ser mayor al máximo"
- Convierte USD a centavos antes de enviar al backend (ej: $10 → 1000)
- Botón "Filtrar" actualiza el store de filtros

#### Requisito: Componente SortDropdown

El sistema **DEBE** renderizar un dropdown con 5 opciones de ordenamiento:

| Label | Valor backend |
|-------|--------------|
| Más reciente | `reciente` |
| Menor precio primero | `price_asc` |
| Mayor precio primero | `price_desc` |
| Nombre A-Z | `nombre_asc` |
| Nombre Z-A | `nombre_desc` |

- Default: "Más reciente"
- onChange actualiza el store de filtros

#### Requisito: Hook useProducts (TanStack Query)

El sistema **DEBE** proporcionar un hook `useProducts` que:
- Use TanStack Query v5+ con `queryKey: ["productos", filters]`
- Refetch automático cuando los filtros cambian
- `staleTime: 5 minutos`
- Retorne: `{ items, total, page, has_next, has_prev, isLoading, error, refetch }`

#### Requisito: Persistencia de Filtros (localStorage)

El sistema **DEBE** persistir el estado de filtros en localStorage usando Zustand `persist` middleware.

- Clave en localStorage: `product-filters`
- Restaurar filtros al recargar página (hidratación automática)
- Botón "Limpiar filtros" resetea todos los filtros a valores default

#### Requisito: Estados de UI

El sistema **DEBE** manejar los siguientes estados visuales:
- **Loading**: Spinner/indicador mientras TanStack Query fetcha
- **Empty**: Mensaje "No hay productos que coincidan con tus filtros" si `items.length === 0`
- **Error**: Toast con mensaje de error + botón de retry
- **Filtros activos**: Indicador visual de filtros aplicados

---

## 🎯 Escenarios GIVEN/WHEN/THEN

### Escenario 1: Aplicar filtro de rango de precio

```gherkin
GIVEN    usuario está en página de catálogo viendo 50 productos
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
```

### Escenario 4: Limpiar todos los filtros

```gherkin
GIVEN    usuario tiene filtros activos: price_min=$10, price_max=$30, sort_by=price_desc
WHEN     usuario hace clic en botón "Limpiar filtros"
THEN     estado de filtros se resetea a defaults
AND      TanStack Query refetch SIN parámetros de filtro
AND      ProductList re-renderiza con TODOS los productos del catálogo
```

### Escenario 5: Backend rechaza rango de precio inválido

```gherkin
GIVEN    usuario intenta aplicar filtro con min > max
AND      ingresa: price_min=$30, price_max=$10
WHEN     usuario envía el filtro
THEN     backend responde HTTP 400: { "detail": "price_min debe ser menor que price_max" }
AND      frontend captura error y muestra toast: "Rango de precio inválido"
AND      filtro NO se aplica (ProductList sigue mostrando resultados previos)
```

### Escenario 6: Paginación manteniendo filtros activos

```gherkin
GIVEN    usuario filtró productos: price_min=$5, price_max=$100
AND      resultado: 60 productos totales (20 por página)
AND      actualmente en página 1
WHEN     usuario hace clic en botón "Siguiente página"
THEN     TanStack Query refetch con MISMOS filtros + ?page=2
AND      items 21-40 se cargan y renderan
AND      botón "Anterior" se activa
AND      indicador muestra "Página 2 de 3"
```

### Escenario 7: sort_by inválido devuelve error

```gherkin
GIVEN    frontend tiene bug y intenta enviar sort_by=INVALID
WHEN     TanStack Query envía query con parámetro inválido
THEN     backend responde HTTP 400 con mensaje de validación
AND      frontend muestra toast error
AND      ProductList mantiene último resultado válido
```

### Escenario 8: Mantener compatibilidad con filtro de alérgenos

```gherkin
GIVEN    usuario tiene filtro activo: excluir_alergenos=cacahuete,nueces
WHEN     también aplica filtro de precio: price_min=$5, price_max=$20
THEN     backend ejecuta AMBOS filtros (price AND allergen exclusion)
AND      resultado: productos en rango de precio SIN alérgenos especificados
```

### Escenario 9: Sin resultados con filtro aplicado

```gherkin
GIVEN    usuario aplica filtro muy restrictivo
WHEN     TanStack Query fetch completa
THEN     backend retorna 200 OK con items vacío y total=0
AND      frontend renderiza mensaje: "No hay productos que coincidan con tus filtros"
AND      botón "Limpiar filtros" es destacado para facilitar reset
```

### Escenario 10: Restaurar filtros desde localStorage en refresh

```gherkin
GIVEN    usuario ha aplicado filtros en sesión actual
WHEN     usuario hace F5 o cierra pestaña y regresa
THEN     localStorage se recupera y filtros se restauran automáticamente
AND      TanStack Query refetch automático con filtros previos
AND      ProductList renderiza con MISMOS resultados que antes del refresh
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
- [ ] Mensaje "Sin resultados" renderiza cuando hay 0 items
- [ ] TypeScript type-check zero errors
- [ ] 15+ tests backend pasando
