# CH-025: Optional Features — KDS Phase 2

## Propuesta

### Qué
Tres features opcionales para mejorar la experiencia del KDS post-MVP:
1. **Alerta sonora** al llegar un pedido nuevo (`PEDIDO_CONFIRMADO`) — Web Audio API
2. **Flash visual** (destello breve) al llegar pedido — CSS animation
3. **Botón para marcar producto no disponible** desde la pantalla de cocina (`Producto.disponible = false`)

### Por qué
Estas features **no son bloqueadores** para lanzar el KDS, pero **mejoran la UX operativa**:
- **Alerta sonora**: el cocinero no necesita mirar la pantalla 100% del tiempo; un beep le avisa
- **Flash**: refuerzo visual de la alerta
- **Marcar no disponible**: cuando se agota un ingrediente, la cocina puede pausar la venta al instante (alternativa: avisar a STOCK, pero esto es más ágil)

### Alcance
**Incluye:**
- Hook `useAudioAlert()` con Web Audio API (genera beep, sin archivos externos)
- CSS keyframe para flash visual
- Toggle `<SoundToggle>` que persiste en localStorage
- Endpoint backend `PATCH /api/v1/cocina/productos/{id}/disponibilidad` con autorización `COCINA`/`ADMIN`
- Botón en la tarjeta de pedido para marcar producto (UI mínima)
- Tests de alerta y disponibilidad

**No incluye:**
- Reordenamiento de columnas (drag-and-drop)
- Estimación de tiempo de preparación
- Estaciones de cocina (BAR, GRILL, etc.) — nivel de sobre-ingeniería
- Multi-sucursal

### Dependencias
- **CH-024**: requiere que pantalla KDS exista

### Decisiones de Diseño
1. **Web Audio API sin archivos**: generamos un beep sintetizado (no descargamos MP3)
2. **localStorage para sound toggle**: persiste entre sesiones
3. **Permiso de COCINA para marcar disponibilidad**: deliberado (RN-CO08), no obliga a COCINA a hacerlo
4. **No modifica stock_cantidad**: solo toca `Producto.disponible` (diferencia clara respecto a STOCK)

### Riesgos
- **Bajo**: son refinamientos, no infraestructura crítica
- **Conocido**: autoplay de audio requiere user interaction previa (política de navegadores)

### Opcional (considerar para v3)
- Configuración de umbrales de urgencia en UI (hoy están hardcoded)
- Historial de acciones (quién marcó qué disponible cuándo)
- Estimación de tiempo de preparación basada en histórico

## Historias de Usuario Cubiertas
- **US-COCINA-05**: Alerta visual y sonora
- **US-COCINA-07**: Marcar producto no disponible

## Referencias de Entrada
- `openspec/feature-display-cocina-reference/03_historias_de_usuario.md` (US-COCINA-05, US-COCINA-07)
- MDN Web Audio API documentation
- RN-CO08 en reference/02_modelo_y_reglas.md

## Estimación
- **Tamaño**: Pequeño (12-16 horas)
- **Esfuerzo**: Frontend hook + endpoint backend simple
- **Testing**: Alerta mock, endpoint PATCH

## Siguientes Steps
Después de este change:
- KDS completamente funcional
- Evaluación de feedback de usuarios reales
- Posibles ajustes de UX (umbrales, colores, tamaños)
