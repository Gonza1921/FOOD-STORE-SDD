# CH-029: Especificación de Filtros y Ordenamiento de Productos

## Propósito

Esta especificación define el comportamiento exacto del sistema de filtros avanzados y opciones de ordenamiento para productos. Permite a los clientes descubrir productos de forma eficiente usando criterios múltiples (precio, alergenos, restricciones dietarias, stock, calificación).

## Requisitos Funcionales

### Backend — Endpoint GET /api/v1/productos

#### Requisito: Filtrado por Rango de Precio

El sistema **DEBE** aceptar parámetros `precio_min` y `precio_max` como query params (ambos opcionales, enteros en centavos).

- El sistema **DEBE** validar que `precio_min` y `precio_max` sean números enteros
- El sistema **DEBE** rechazar con 400 si `precio_min > precio_max`
- El sistema **DEBE** retornar solo productos donde `precio >= precio_min` AND `precio <= precio_max`
- El sistema **DEBE** aceptar `precio_min=0` y `precio_max=999999` como rango válido

#### Requisito: Ordenamiento de Resultados

El sistema **DEBE** aceptar parámetro `sort_by` como enum con valores: `price_asc`, `price_desc`, `nombre_asc`, `nombre_desc`, `reciente`.

- Valor por defecto: `reciente` (más nuevos primero)
- El sistema **DEBE** rechazar con 400 si `sort_by` no está en el enum permitido
- El sistema **DEBE** ordenar por `precio_base ASC` cuando `sort_by=price_asc`
- El sistema **DEBE** ordenar por `precio_base DESC` cuando `sort_by=price_desc`
- El sistema **DEBE** ordenar por `nombre ASC` cuando `sort_by=nombre_asc`
- El sistema **DEBE** ordenar por `nombre DESC` cuando `sort_by=nombre_desc`
- El sistema **DEBE** ordenar por `creado_en DESC` cuando `sort_by=reciente`

#### Requisito: Filtrado por Alergenos

El sistema **DEBE** mantener compatibilidad con parámetro `excluir_alergenos` existente.

- El parámetro recibe lista CSV de IDs de alergenos (ej: `excluir_alergenos=1,3,5`)
- El sistema **DEBE** excluir productos que contengan CUALQUIERA de esos alergenos
- El sistema **DEBE** combinar con filtros de precio usando AND lógico
- El sistema **DEBE** ignorar alergeno IDs inválidos (no provocar error)

#### Requisito: Paginación

El sistema **DEBE** retornar resultados paginados con máximo 20 items por página.

- Parámetro `page` (opcional, default=1, base 1)
- Parámetro `limit` (opcional, default=20, máximo 100)
- El sistema **DEBE** rechazar con 400 si `page < 1`
- El sistema **DEBE** rechazar con 400 si `limit > 100`
- El sistema **DEBE** retornar campo `has_next: bool` indicando si hay más páginas
- El sistema **DEBE** retornar campo `has_prev: bool` indicando si hay páginas anteriores
- El sistema **DEBE** retornar campo `total: int` con cantidad total de items que coinciden

#### Requisito: Estructura de Respuesta

El sistema **DEBE** retornar respuesta JSON con estructura exacta:

```json
{
  "items": [
    {
      "id": 1,
      "nombre": "Leche descremada",
      "precio_base": 1500,
      "stock_cantidad": 10,
      "es_destacado": true,
      "categoria_id": 2
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "has_next": true,
  "has_prev": false
}
```

#### Requisito: Mantenimiento de Autenticación

El sistema **DEBE** mantener autenticación existente (sin cambios a endpoints públicos).

- Endpoint `/api/v1/productos` permanece **sin autenticación requerida**
- Endpoint retorna solo productos con `eliminado_en IS NULL`
- Endpoint retorna solo productos con `es_activo = true`

### Frontend — Componentes de Filtro

#### Requisito: Componente PriceRangeFilter

El sistema **DEBE** renderizar componente con controles min/max de precio.

- **DEBE** mostrar dos inputs numéricos: "Precio mínimo" y "Precio máximo"
- **DEBE** mostrar valores actuales en USD con símbolo $
- **DEBE** validar que `min <= max` antes de enviar query
- **DEBE** deshabilitar botón "Filtrar" si rango es inválido (min > max)
- **DEBE** mostrar error inline: "El mínimo no puede ser mayor al máximo"

#### Requisito: Componente SortDropdown

El sistema **DEBE** renderizar dropdown con 5 opciones de ordenamiento.

- Opciones: "Más reciente", "Menor precio primero", "Mayor precio primero", "Nombre (A-Z)", "Nombre (Z-A)"
- **DEBE** mapear labels a valores backend: `reciente`, `price_asc`, `price_desc`, `nombre_asc`, `nombre_desc`
- **DEBE** aplicar ordenamiento sin recarga de página (TanStack Query)
- **DEBE** mostrar spinner de carga breve durante fetch

#### Requisito: Aplicación de Filtros

El sistema **DEBE** aplicar filtros sin recarga de página.

- **DEBE** usar TanStack Query `useQuery` con parámetros de filtro como dependencies
- **DEBE** re-ejecutar query cuando cambien `precio_min`, `precio_max`, `sort_by`, `excluir_alergenos`, `page`
- **DEBE** mostrar estado "Cargando..." mientras se fetcha
- **DEBE** mostrar mensaje "No hay productos" si array `items` está vacío
- **DEBE** deshabilitar botones de paginación cuando `has_next=false` o `has_prev=false`

#### Requisito: Persistencia de Estado de Filtro

El sistema **DEBE** persistir estado de filtro en localStorage (fase 1).

- **DEBE** guardar en localStorage con clave `ch029_filters`
- **DEBE** restaurar estado al cargar página (hidratación)
- **DEBE** limpiar localStorage cuando usuario hace clic en "Limpiar filtros"

#### Requisito: Manejo de Errores

El sistema **DEBE** capturar y mostrar errores de validación.

- 400: "Campo precio_min debe ser número entero"
- 400: "El precio mínimo no puede ser mayor al máximo"
- 400: "Parámetro sort_by inválido"
- 404: "Categoría no encontrada"
- El sistema **DEBE** mostrar toast error al usuario
- El sistema **DEBE** mantener resultados previos (no limpiar UI)
- El sistema **DEBE** permitir reintentar (botón retry o reintento automático)

## Escenarios (GIVEN/WHEN/THEN)

### Escenario 1: Aplicar Filtro de Rango de Precio

- **GIVEN** usuario está en página de detalle de categoría viendo 50 productos (rango $5–$50)
- **WHEN** usuario ingresa `precio_min=$10` y `precio_max=$30` 
- **AND** hace clic en botón "Filtrar"
- **THEN** ProductList re-consulta con query params `?precio_min=1000&precio_max=3000`
- **AND** solo productos con precio entre $10–$30 se renderizan
- **AND** contador de productos actualiza mostrando cantidad filtrada
- **AND** no ocurre recarga de página (fetch de TanStack Query async)

### Escenario 2: Ordenar por Precio Ascendente

- **GIVEN** lista de productos filtrados mostrando 20 items (precios variados)
- **WHEN** usuario selecciona "Menor precio primero" de dropdown de ordenamiento
- **THEN** TanStack Query re-fetcha con `sort_by=price_asc` en query params
- **AND** productos se re-renderizan ordenados por `precio_base` ascendente
- **AND** spinner de carga aparece brevemente durante fetch
- **AND** primer producto tiene precio menor que resto

### Escenario 3: Combinar Filtro de Precio + Ordenamiento

- **GIVEN** usuario ha establecido `precio_min=$5`, `precio_max=$20`
- **WHEN** usuario también selecciona `sort_by=nombre_asc` del dropdown
- **THEN** query backend incluye AMBOS filtros: `?precio_min=500&precio_max=2000&sort_by=nombre_asc`
- **AND** productos se renderizan: filtrados POR PRECIO Y ordenados POR NOMBRE
- **AND** UI de filtros muestra ambos activos (destacados visualmente)
- **AND** cambios se reflejan instantáneamente sin recarga

### Escenario 4: Limpiar Todos los Filtros

- **GIVEN** usuario ha aplicado `precio_min=$10`, `sort_by=price_desc`, `excluir_alergenos=1,2`
- **WHEN** usuario hace clic en botón "Limpiar filtros"
- **THEN** estado de filtros se resetea a defaults (sin restricciones)
- **AND** ProductList re-consulta sin parámetros de filtro
- **AND** todos los productos de categoría se renderizan nuevamente
- **AND** inputs de precio se vacían
- **AND** dropdown de ordenamiento vuelve a "Más reciente"

### Escenario 5: Rechazar Rango de Precio Inválido

- **GIVEN** usuario ingresa `precio_min=$30` y `precio_max=$10` (inválido, mín > máx)
- **WHEN** usuario intenta hacer clic en "Filtrar"
- **THEN** botón "Filtrar" permanece deshabilitado
- **AND** mensaje de error inline aparece: "El mínimo no puede ser mayor al máximo"
- **AND** query NO se envía al backend
- **AND** UI mantiene resultados previos intactos

### Escenario 6: Paginación Manteniendo Filtros

- **GIVEN** usuario filtra productos: `precio_max=50`, obtiene 60 resultados coincidentes
- **AND** paginación establecida a 20 items por página (3 páginas totales)
- **WHEN** usuario está en página 1 (items 1–20)
- **AND** hace clic en botón "Siguiente página"
- **THEN** TanStack Query fetcha página 2 CON MISMOS FILTROS aplicados
- **AND** query params incluyen: `?page=2&limit=20&precio_max=5000&sort_by=reciente`
- **AND** items 21–40 se renderizan
- **AND** botón "Anterior página" ahora está habilitado
- **AND** botón "Siguiente página" permanece habilitado (hay página 3)

### Escenario 7: Validación de Parámetro sort_by Inválido

- **GIVEN** usuario intenta manipular URL directamente: `/productos?sort_by=precio_crazy`
- **WHEN** navegador realiza fetch con parámetro inválido
- **THEN** backend retorna 400 Bad Request
- **AND** response body incluye mensaje: `"error": "sort_by debe ser uno de: price_asc, price_desc, nombre_asc, nombre_desc, reciente"`
- **AND** frontend captura error y muestra toast: "Parámetro de ordenamiento no válido"
- **AND** lista de productos mantiene último estado válido mostrado

### Escenario 8: Compatibilidad con Filtro de Alergenos Existente

- **GIVEN** usuario ya aplica filtro de alergenos: `excluir_alergenos=leche,huevo` (IDs: 2,4)
- **WHEN** usuario además filtra por precio: `precio_min=500&precio_max=3000`
- **THEN** backend consulta usa AMBOS filtros: excluye productos con alergenos 2 o 4, Y filtra por precio
- **AND** resultados mostrados NO contienen productos con leche ni huevo dentro del rango $5–$30
- **AND** filtros funcionan con lógica AND (todas las restricciones aplican)

### Escenario 9: Respuesta Vacía (Sin Resultados)

- **GIVEN** usuario aplica filtros muy restrictivos: `precio_max=100` (0.01 USD) en categoría de productos caros
- **WHEN** backend ejecuta query y no encuentra coincidencias
- **THEN** respuesta retorna: `{"items": [], "total": 0, "page": 1, ...}`
- **AND** frontend detecta `items.length === 0` y muestra mensaje: "No hay productos que coincidan con tus filtros"
- **AND** no ocurre error HTTP (200 OK es válido)

### Escenario 10: Persistencia y Restauración de Estado en localStorage

- **GIVEN** usuario aplica filtros: `precio_min=1000, precio_max=2500, sort_by=price_asc`
- **WHEN** usuario recarga página (F5)
- **THEN** localStorage `ch029_filters` restaura estado previo
- **AND** inputs de precio muestran valores previos
- **AND** dropdown de ordenamiento muestra "Menor precio primero"
- **AND** query se re-ejecuta con parámetros restaurados
- **AND** productos renderizados mantienen filtros (experiencia seamless)

## Validación de Datos

| Campo | Tipo | Validación | Ejemplo |
|-------|------|-----------|---------|
| `precio_min` | int | Opcional, >= 0, < precio_max | 1000 |
| `precio_max` | int | Opcional, > precio_min, <= 999999 | 5000 |
| `sort_by` | enum | Uno de: price_asc, price_desc, nombre_asc, nombre_desc, reciente | price_asc |
| `page` | int | Opcional, default=1, >= 1 | 2 |
| `limit` | int | Opcional, default=20, 1-100 | 50 |
| `excluir_alergenos` | CSV | Opcional, lista de IDs válidos | "1,3,5" |

## Criterios de Aceptación

- ✅ Filtro de rango de precio filtra correctamente (inclusive en ambos extremos)
- ✅ Dropdown de ordenamiento aplica sort correcto en 5 direcciones
- ✅ Múltiples filtros funcionan juntos con lógica AND
- ✅ Paginación mantiene filtros aplicados
- ✅ Validación rechaza parámetros inválidos con 400
- ✅ Mensaje "No hay productos" aparece cuando resultados vacíos
- ✅ Sin recarga de página (TanStack Query async)
- ✅ localStorage persiste y restaura estado
- ✅ Botón "Limpiar filtros" reseta completamente
- ✅ Alergenos existentes mantienen compatibilidad total
