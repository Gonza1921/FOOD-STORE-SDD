# CH-024: Frontend KDS + UI Cocina

## Propuesta

### Qué
Crear la **pantalla de Kitchen Display System** (KDS) en React/Vite con:
1. **Ruta `/cocina`** con layout **Kanban de 2 columnas**:
   - Columna izquierda: "Por preparar" (pedidos en `CONFIRMADO`)
   - Columna derecha: "En preparación" (pedidos en `EN_PREP`)
2. **Integración WebSocket**: suscripción a eventos en tiempo real
3. **Fallback polling**: si WebSocket cae, fetch manual cada 30 s
4. **Timer de urgencia**: resaltado visual por tiempo transcurrido
5. **Guard de ruta**: accesible solo para roles `COCINA`/`PEDIDOS`/`ADMIN`
6. **Indicador de conexión**: muestra estado "en vivo" o "sin conexión"
7. **Sin auto-logout**: la pantalla de cocina queda activa durante el turno

### Por qué
La interfaz es el **punto de contacto del cocinero con el sistema**. Una pantalla mal diseñada hace que los operarios dejen de confiar en la tecnología. Necesitamos:
- **Claridad**: qué cocinar ahora, en qué orden
- **Urgencia visual**: los pedidos viejos resaltados en rojo
- **Resiliencia**: si falla la red, la pantalla no colapsa
- **Persistencia**: no cierre sesión sin motivo (cocinero está en un turno)

### Alcance
**Incluye:**
- Componente KDS en `/frontend/src/pages/Cocina.tsx`
- Componentes reutilizables: `PedidoCard.tsx` (tarjeta de pedido), `ColumnaEstado.tsx` (columna Kanban)
- Hook `useWebSocketCocina()` para manejar WebSocket + fallback
- Hook `useUrgenciaTimer()` para recalcular urgencia cada 15 s
- Guard de ruta con `require_role`
- Menú/navegación actualizada con `/cocina`
- Tailwind styles + diseño responsive (funciona en pantallas grandes de 16:9)
- Tests: renderizado, WebSocket mock, polling

**No incluye:**
- Alerta sonora (eso es CH-025)
- Botón para marcar producto no disponible (eso es CH-025)
- Multi-sucursal / branch scoping (Food Store es single-store)

### Dependencias
- **C-02 auth**: requiere JWT, `require_role`, navegación con roles
- **CH-022**: requiere que rol `COCINA` exista en BD
- **CH-023**: requiere que WebSocket esté operativo en backend

### Decisiones de Diseño
1. **Layout Kanban vs Tabla**: elegimos columnas (Kanban) para visualización clara de fases
2. **Timer en cliente**: recalculado cada 15 s sin sync con backend (RN-CO07)
3. **Umbrales de urgencia**: 
   - < 10 min: gris normal
   - 10-20 min: naranja (advertencia)
   - > 20 min: rojo (urgente)
4. **Orden**: siempre por antigüedad (fecha de entrada a `CONFIRMADO`)
5. **Botones de avance**: al presionar "Iniciar" o "Listo", se envía PATCH al backend (CH-023 valida)

### Riesgos
- **Bajo**: React es familiar, componentes reutilizables de Tailwind
- **Bajo**: WebSocket mock en tests, no depende de backend real en jest
- **Conocido**: el timer es aproximado (depende de tiempo del cliente, puede estar desincronizado)

## Historias de Usuario Cubiertas
- **US-COCINA-01**: Ver pedidos en tiempo real (layout + WebSocket)
- **US-COCINA-02**: Tomar un pedido (botón "Iniciar" → PATCH /pedidos/{id}/estado)
- **US-COCINA-03**: Marcar terminado (botón "Listo" → PATCH)
- **US-COCINA-04** (parcial): Guard de ruta
- **US-COCINA-06**: Indicador de urgencia por tiempo
- **US-COCINA-08**: Resiliencia y fallback por polling

## Referencias de Entrada
- `openspec/feature-display-cocina-reference/02_modelo_y_reglas.md` (sección D — Frontend)
- `openspec/feature-display-cocina-reference/03_historias_de_usuario.md` (US-COCINA-01, 02, 03, 06, 08)
- `docs/knowledge-base/03_actores_y_roles.md` (navegación por rol)
- AGENTS.md de Food Store (sección React, TanStack Query, Zustand)

## Estimación
- **Tamaño**: Grande (28-32 horas)
- **Esfuerzo**: Componentes React, state management, WebSocket + polling
- **Testing**: Jest + Vitest para componentes, mocks de WebSocket

## Siguientes Steps
Después de este change aprobado:
1. **CH-025**: Features opcionales (alerta sonora, urgencia mejorada, disponibilidad de producto)
2. Lanzamiento a producción del KDS
