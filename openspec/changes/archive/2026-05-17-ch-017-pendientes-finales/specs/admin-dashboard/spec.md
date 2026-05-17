# Spec: admin-dashboard

## Overview

Widgets y visualizaciones para el panel de administración. Agrega indicadores clave de rendimiento al dashboard existente: ranking de productos más vendidos, selector de ventas por período con gráfico de barras/líneas, y gráfico de ingresos con opción día/semana/mes. Estos componentes consumen los endpoints definidos en `admin-metricas-avanzadas`.

## ADDED Requirements

### Requirement: Widget de top productos más vendidos en dashboard

El sistema SHALL mostrar un widget en el dashboard de administración que liste los productos más vendidos, consumiendo `GET /api/v1/admin/metricas/productos-top`.

**Comportamiento**:
- El widget SHALL mostrar el top 5 productos más vendidos por defecto
- Cada entrada MUST mostrar: nombre del producto, cantidad total vendida, ingreso total generado
- El widget SHOULD tener un enlace "Ver más" que muestre el top completo (hasta 50)
- El widget SHALL actualizarse al cargar la página del dashboard
- Si no hay datos, SHALL mostrar un mensaje "No hay ventas registradas"

#### Scenario: Widget carga top 5 al abrir dashboard
- **WHEN** un ADMIN navega al dashboard de administración
- **THEN** el frontend hace GET /api/v1/admin/metricas/productos-top?limite=5
- **AND** muestra una tabla/lista con los 5 productos más vendidos
- **AND** cada fila muestra: nombre, cantidad_vendida, ingreso_total

#### Scenario: Widget muestra mensaje si no hay datos
- **WHEN** no existen pedidos completados en el sistema
- **THEN** el widget muestra "No hay ventas registradas" como mensaje informativo
- **AND** no muestra error ni tabla vacía

#### Scenario: Error en API se maneja gracefulmente
- **WHEN** el endpoint de top productos retorna error (500, timeout, etc.)
- **THEN** el widget muestra un mensaje "Error al carrar productos más vendidos"
- **AND** el resto del dashboard sigue funcionando normalmente

---

### Requirement: Widget de ventas por período con gráfico

El sistema SHALL proveer un widget en el dashboard que permita consultar ventas en un período con granularidad configurable (día/semana/mes), mostrando un gráfico de barras o líneas.

**Comportamiento**:
- El widget SHALL incluir un selector de fechas (desde / hasta)
- El widget SHALL incluir un selector de granularidad con opciones: día, semana, mes
- El widget SHALL mostrar un gráfico (barras o líneas) con los datos de ventas
- El widget SHALL mostrar un resumen con: total de ventas en el período, ingreso total, promedio por período
- El gráfico SHALL actualizarse automáticamente al cambiar fechas o granularidad
- Por defecto, SHALL mostrar los últimos 30 días con granularidad "día"

#### Scenario: ADMIN selecciona un período con granularidad día
- **WHEN** un ADMIN selecciona desde=2026-01-01, hasta=2026-01-15, granularidad=dia
- **THEN** el frontend hace GET /api/v1/admin/metricas/ventas?desde=2026-01-01&hasta=2026-01-15&granularidad=dia
- **AND** renderiza un gráfico de barras/líneas con un punto por día
- **AND** el eje X muestra las fechas, el eje Y muestra el ingreso_total
- **AND** debajo del gráfico se muestra el resumen: total ventas, ingreso total, promedio por día

#### Scenario: ADMIN cambia granularidad a semana
- **WHEN** un ADMIN cambia el selector de granularidad de "día" a "semana"
- **THEN** el frontend re-hace la request con granularidad=semana
- **AND** el gráfico se actualiza mostrando datos agrupados por semana
- **AND** el resumen se actualiza mostrando promedio por semana

#### Scenario: ADMIN cambia granularidad a mes
- **WHEN** un ADMIN cambia el selector de granularidad a "mes"
- **THEN** el frontend re-hace la request con granularidad=mes
- **AND** el gráfico se actualiza mostrando datos agrupados por mes (YYYY-MM)
- **AND** el resumen se actualiza mostrando promedio por mes

#### Scenario: Dashboard carga con defaults de últimos 30 días
- **WHEN** un ADMIN navega al dashboard por primera vez
- **THEN** el widget de ventas se inicializa con desde = hoy - 30 días, hasta = hoy, granularidad = "dia"
- **AND** automáticamente hace la request con esos parámetros
- **AND** muestra el gráfico correspondiente

---

### Requirement: Gráfico de ingresos con opción día/semana/mes

El sistema SHALL mostrar un gráfico de ingresos (revenue) integrado con el widget de ventas por período, que permita visualizar la evolución de ingresos con las mismas opciones de granularidad.

**Comportamiento**:
- Es el MISMO gráfico del widget de ventas por período, no uno separado
- El eje Y MUST representar el ingreso_total (en pesos argentinos, formateado con $ y separador de miles)
- El gráfico SHOULD usar color verde/azul para ingresos positivos
- El gráfico SHOULD mostrar tooltip al hacer hover con: período, cantidad de ventas, ingreso total
- Si el período no tiene ventas, el gráfico SHALL estar vacío (sin puntos/barras) con mensaje "Sin datos en este período"

#### Scenario: Tooltip muestra detalle al hacer hover
- **WHEN** un ADMIN hace hover sobre una barra/punto en el gráfico
- **THEN** se muestra un tooltip con: período específico, cantidad de ventas en ese período, ingreso total formateado (ej: "$ 15,000.00")

#### Scenario: Gráfico formatea moneda correctamente
- **WHEN** el gráfico muestra valores de ingreso
- **THEN** los valores se formatean con símbolo $, separador de miles, y 2 decimales
- **AND** el formato es consistente con el resto del dashboard

#### Scenario: Período sin datos
- **WHEN** el período seleccionado no tiene ventas registradas
- **THEN** el gráfico se muestra vacío (sin barras/puntos)
- **AND** un mensaje "Sin datos en este período" se muestra en el área del gráfico
- **AND** el resumen muestra total_ventas=0, ingreso_total=$0.00
