# ANÁLISIS EXHAUSTIVO: FEATURE DISPLAY COCINA (KDS) — Food Store

## Contexto del Análisis
No existe una carpeta 'feature-display-cocina' en el repositorio.
Este análisis sintetiza: Descripcion.txt + Historias_de_usuario.txt + Integrador.txt + CHANGES.md
para proponer cómo implementar KDS como un conjunto de changes OPSX independientes y secuenciados.

---

## 1. RESUMEN EJECUTIVO

### ¿Qué es un KDS (Kitchen Display System)?

Un **KDS** es una pantalla en tiempo real que muestra a los cocineros qué pedidos están pendientes de preparación. En Food Store:

- **Objetivo**: Mejorar eficiencia operativa
- **Usuario**: Gestor de Cocina (nuevo rol, sub-conjunto de PEDIDOS)
- **Visualización**: Pantalla con pedidos EN_PREPARACIÓN, filtrados por urgencia/hora
- **Interacción**: Marcar ítems como "completados", cambiar estado del pedido
- **Tiempo real**: WebSocket o SSE (decisión pendiente)

### Scope del Feature KDS

✅ **Incluye**:
- Nuevo rol COCINA con permisos limitados a KDS
- Backend: Endpoints para obtener pedidos en preparación (REST poll + WebSocket opcional)
- Frontend: Pantalla React dedicada con layout optimizado para TV/monitor
- Notificaciones: Alerta sonora al llegar pedido urgente (opcional)
- Estado de disponibilidad: Marcar ingredientes como sin stock

❌ **No incluye** (v1):
- Integración con impresoras de cocina
- Sistema de llamadas de meseros
- Manejo de sobrecarga de cocina
- Exportación de reportes de cocina

---

## 2. ANÁLISIS DE DEPENDENCIAS

### Changes que KDS REQUIERE (ya implementados)

| Change | Nombre | Historias | Status |
|--------|--------|-----------|--------|
| CH-002 | Base de datos | US-000b | ✅ Completo |
| CH-004 | Patrones base | US-000d/e | ✅ Completo |
| CH-005 | Auth + RBAC | US-001-006 | ✅ Completo |
| CH-033 | Máquina de estados | US-039-044 | ✅ Completo |

### Changes que KDS HABILITA (nuevos)

KDS abre puerta a:
- Notificaciones push en tiempo real
- Reportes operacionales de cocina
- Metricas de velocidad de preparación
- Integración con sistemas de point-of-sale (POS)

---

## 3. PROPUESTA DE DIVISIÓN EN CHANGES OPSX

### Estructura de Implementación (4 changes)

\\\
Change A: ch-080-kds-base-role-security
    ↓
Change B: ch-081-kds-backend-websocket
    ↓
Change C: ch-082-kds-frontend-display
    ↓
Change D: ch-083-kds-enhancements-optional
\\\

---

### CHANGE A: ch-080-kds-base-role-security
**Duración**: 1.5-2 horas

**Funcionalidad**:
- Crear rol COCINA
- Tabla CocinaPreferencias (alertas sonoras, temas, idioma)
- Endpoint GET /api/v1/auth/roles — listar roles disponibles
- Seed data: rol COCINA con ID 5 (IDs estables)

**Historias**:
- Creación del rol COCINA
- Asignación de rol COCINA a usuarios

**Dependencias**:
- ✅ CH-002 (BD — Rol, UsuarioRol)
- ✅ CH-004 (patrones — baseRepository)

**Criterios clave**:
- [ ] Migración Alembic crea tabla Rol con COCINA (id=5, código='COCINA')
- [ ] Tabla CocinaPreferencias: usuario_id → {alertaSonora:bool, tema:enum, idioma:str}
- [ ] Seed: COCINA role cargado idempotentemente
- [ ] ADMIN puede asignar rol COCINA a usuarios
- [ ] JWT contiene rol COCINA en claims

**Arquitectura**:
\\\
backend/
├── auth/
│   └── router.py   ← GET /roles endpoint (público)
├── cocina/
│   ├── model.py    ← CocinaPreferencias
│   ├── repository.py
│   └── service.py
└── migrations/
    └── versions/    ← Alembic migration
\\\

---

### CHANGE B: ch-081-kds-backend-websocket
**Duración**: 3-4 horas

**Funcionalidad**:
- WebSocket endpoint: WS /api/v1/cocina/pedidos (alternativa: SSE GET /api/v1/cocina/pedidos/stream)
- Endpoint REST GET /api/v1/cocina/pedidos — obtener pedidos EN_PREPARACIÓN
- Pub/Sub in-memory (single-instance, v1 sin Redis)
- Broadcast cuando pedido entra a EN_PREPARACIÓN

**Decisión Arquitectónica: WebSocket vs SSE**

| Aspecto | WebSocket | SSE |
|--------|-----------|-----|
| Bidireccional | ✅ | ❌ |
| Fallbacks | Necesita | Nativo |
| Complejidad | Mayor | Menor |
| Casos de uso | Chat, gaming | Notificaciones |
| Recomendación | Mejor para KDS | OK si simple |

**Nota**: Vamos con **WebSocket** porque KDS es bidireccional (cocina → servidor).

**Historias**:
- Ver pedidos en tiempo real
- Recibir notificación de nuevo pedido
- Actualizar estado de preparación

**Dependencias**:
- ✅ CH-033 (FSM — pedidos en EN_PREP)
- ✅ CH-002 (BD — Pedido, DetallePedido)

**Criterios clave**:
- [ ] WebSocket WS /api/v1/cocina/pedidos requiere rol COCINA (valida JWT)
- [ ] Al conectar: devuelve lista actual de pedidos EN_PREPARACIÓN
- [ ] Al nuevo pedido → EN_PREP: broadcast a todos los clientes conectados
- [ ] Conexión rechazada si rol ≠ COCINA (403 before upgrade)
- [ ] Manejo de desconexión graceful (no errores de servidor)
- [ ] Pub/Sub manager (single-instance, dict con ConnectionManager)

**Arquitectura**:
\\\
backend/
├── cocina/
│   ├── router.py        ← WebSocket endpoint @app.websocket()
│   ├── schemas.py       ← PedidoCocinaResponse (ítem simple)
│   ├── service.py       ← lógica de broadcast
│   └── ws_manager.py    ← ConnectionManager (dict[str, WebSocket])
└── core/
    └── pubsub.py        ← Manager de pub/sub in-memory
\\\

**Flujo WebSocket**:
\\\
1. Frontend: ws = WebSocket('ws://localhost:8000/api/v1/cocina/pedidos', headers={Authorization: Bearer token})
2. Backend: valida JWT, extrae usuario.id y rol
3. Backend: si rol ≠ COCINA → cierra conexión (403)
4. Backend: devuelve lista actual de pedidos EN_PREP (JSON)
5. Backend: agrega conexión a ConnectionManager
6. Cambio de estado en BD (ej: pago aprobado → PENDIENTE→CONFIRMADO→EN_PREP)
7. Backend: broadcastea a todas las conexiones en ConnectionManager
8. Frontend: recibe mensaje y actualiza UI
\\\

---

### CHANGE C: ch-082-kds-frontend-display
**Duración**: 4-5 horas

**Funcionalidad**:
- Página /cocina/display — layout optimizado para TV (sin navegación, full-width)
- Conexión WebSocket y fallback REST polling (si WS falla)
- Tablero Kanban: columnas por estado (Pendiente, Preparando, Listo)
- Tarjetas de pedido con:
  - Número de pedido
  - Hora de creación + urgencia (color)
  - Lista de ítems con estado (checkbox)
  - Botón "Listo para entregar"
- Alerta sonora configurable (settings panel)
- Tema oscuro por defecto (para cansancio visual)

**Historias**:
- Ver KDS en pantalla
- Marcar ítem como completado
- Cambiar pedido a "Listo"
- Recibir alerta de pedido urgente

**Dependencias**:
- ✅ CH-081 (WebSocket backend)
- ✅ CH-005 (Auth — rol COCINA)

**Criterios clave**:
- [ ] Página /cocina/display requiere rol COCINA (ProtectedRoute)
- [ ] WebSocket conecta automáticamente al cargar
- [ ] Si WS cae: fallback a polling REST cada 5 segundos
- [ ] Tarjetas muestran: #Pedido, creado_en, ítems con descripción
- [ ] Urgencia: rojo si > 30 min, amarillo si > 15 min, verde < 15 min
- [ ] Checkbox marcar ítem (actualizacion local, sin enviar al servidor)
- [ ] Botón "Listo para entregar" cambia estado a EN_CAMINO (POST /pedidos/{id}/estado)
- [ ] Sonido personalizable: silencio, beep, alerta completa
- [ ] Tema dark mode con contraste alto
- [ ] Responsive: funciona en TV 1080p + tablets

**Arquitectura FSD**:
\\\
frontend/src/
├── pages/
│   └── CocinaDisplayPage.tsx      ← Layout full-screen
├── features/
│   └── kds/
│       ├── hooks/
│       │   ├── useKdsWebSocket.ts ← conexión WS + fallback
│       │   └── useKdsData.ts      ← store local + polling
│       ├── components/
│       │   ├── KdsBoard.tsx       ← Kanban board
│       │   ├── PedidoCard.tsx     ← Tarjeta pedido
│       │   ├── PedidoItemCheckbox.tsx
│       │   ├── UrgenciaIndicator.tsx
│       │   └── AlertaConfig.tsx
│       ├── store.ts               ← Zustand para KDS state
│       └── types.ts
├── shared/
│   └── audio/
│       └── beep.mp3 + alerta.mp3
\\\

**Store KDS (Zustand)**:
\\\	ypescript
useKdsStore = {
  pedidos: PedidoCocina[],
  conexion: 'conectado' | 'desconectado' | 'fallback',
  ultimaActualizacion: timestamp,
  settings: { 
    alertaSonora: bool, 
    volumen: number,
    tema: 'oscuro' | 'claro'
  }
  
  // Actions
  setPedidos(pedidos),
  marcarItemCompletado(pedidoId, detalleId),
  cambiarEstado(pedidoId, estadoNuevo),
  setConexion(estado),
  actualizarSettings(settings)
}
\\\

---

### CHANGE D: ch-083-kds-enhancements-optional
**Duración**: 2-3 horas (opcional)

**Funcionalidad**:
- Disponibilidad de ingredientes (marca como "sin stock" temporalmente)
- Reportes: tiempo promedio de preparación, velocidad de cocina
- Histórico de pedidos completados hoy
- Integración de audio con librería (zzfx, tone.js)

**Historias**:
- Marcar ingrediente como sin stock
- Ver métricas de cocina
- Histórico de preparación

**Dependencias**:
- ✅ CH-082 (KDS frontend ya existe)

**Criterios clave** (opcional v1):
- [ ] Modal "Sin stock" permite marcar ingredientes temporalmente
- [ ] Pedidos con ingredientes sin stock muestran ⚠️ badge
- [ ] Dashboard de métricas: promedio tiempo, pedidos/hora, velocidad
- [ ] Tabla histórica: pedidos completados hoy con duraciones

---

## 4. TIMELINE Y COMPLEJIDAD

| Change | Horas | Complejidad | Puntos |
|--------|-------|-------------|--------|
| **CH-080** (Base role) | 1.5-2 | ⭐ Baja | 15 |
| **CH-081** (Backend WS) | 3-4 | ⭐⭐⭐ Media | 30 |
| **CH-082** (Frontend KDS) | 4-5 | ⭐⭐⭐⭐ Alta | 40 |
| **CH-083** (Enhancements) | 2-3 | ⭐⭐ Baja | 15 |
| **TOTAL** | **10.5-14 h** | | **100 pts** |

---

## 5. NOTAS TÉCNICAS CLAVE

### WebSocket vs SSE: Decisión Final

**Vamos con WebSocket** porque:
- ✅ Bidireccional: cocina puede mandar "item completado" sin esperar polling
- ✅ Eventos en tiempo real (< 100ms latencia)
- ✅ Soporte nativo en FastAPI con starlette.websockets
- ✅ Escalable con Redis Pub/Sub en v2 sin cambios de API

**Fallback SSE** si WS falla:
\\\	ypescript
// useKdsWebSocket.ts
export function useKdsWebSocket() {
  const [conexion, setConexion] = useState('conectando');
  
  useEffect(() => {
    let ws = null;
    let reconnectInterval = null;
    
    const conectar = () => {
      try {
        ws = new WebSocket('ws://...', {
          headers: { Authorization: Bearer  }
        });
        // listeners...
      } catch (e) {
        setConexion('fallback');
        // polling REST
        reconnectInterval = setInterval(reconnectar, 5000);
      }
    };
    
    conectar();
    return () => clearInterval(reconnectInterval);
  }, []);
}
\\\

### Single-Instance Pub/Sub (v1, sin Redis)

\\\python
# backend/core/pubsub.py
class PubSubManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
    
    async def connect(self, channel: str, websocket: WebSocket):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
    
    async def broadcast(self, channel: str, message: dict):
        if channel in self.active_connections:
            for ws in self.active_connections[channel]:
                try:
                    await ws.send_json(message)
                except Exception:
                    # desconexión
                    pass

manager = PubSubManager()

# En service.py: cuando pedido entra a EN_PREP
await manager.broadcast('cocina', {
    'tipo': 'nuevo_pedido',
    'pedido': pedido_dict,
    'urgencia': calcular_urgencia(pedido.creado_en)
})
\\\

### Reutilización de Modelos Existentes

✅ **Modelos que reutilizamos**:
- Pedido — estado, total, creado_en
- DetallePedido — producto, cantidad, personalizacion
- HistorialEstadoPedido — auditoría de cambios
- Usuario — quién está viendo el KDS
- Rol — COCINA (nuevo)

❌ **No creamos nuevas tablas complejas**:
- Los detalles de preparación viven en la sesión del navegador
- Las preferencias de cocina van en CocinaPreferencias (simple)

---

## 6. PROPUESTA DE CHANGES COMPLETA (MARKDOWN PARA OPSX)

Cada change sigue este esquema:

### **CH-080: KDS Base Role y Seguridad**

**Propuesta** (~250 palabras):
\\\
KDS requiere un nuevo rol COCINA para gestionar acceso a la pantalla de cocina.
Creamos tabla CocinaPreferencias para configuraciones de usuario (alerta sonora, tema).
Migramos data de test: rol COCINA asignado a usuario demo.

Decisiones:
- ID estable COCINA=5 para referenciar desde código
- CocinaPreferencias linkedA Usuario (1:1 relationship)
- Endpoint público GET /auth/roles para que frontend sepa qué roles existen

Riesgos: Ninguno (no toca lógica existente)
Complejidad: Baja (1 tabla + seed)
\\\

**Specs** (~150 líneas):
- MUST crear tabla Rol con COCINA (id=5)
- MUST crear tabla CocinaPreferencias (usuario_id, alerta_sonora, tema, idioma)
- MUST ser idempotente (ejecutar seed 2 veces = resultado igual)
- SHOULD exponer GET /auth/roles (publico)
- SHOULD validar que solo ADMIN asigna rol COCINA

**Design** (~200 líneas):
- ERD delta: nuevas tablas y relaciones
- Arquitectura: dónde viven migración + seed
- Secuencia: ¿cuándo se ejecuta seed? (en startup o manual?)

**Tasks** (checklist):
1. (30m) Crear migración Alembic: add Rol COCINA
2. (30m) Crear migración: add CocinaPreferencias table
3. (30m) Update seed.py: insert COCINA role idempotent
4. (30m) Crear endpoint GET /auth/roles (schemas + service)
5. (30m) Test: Asignar rol COCINA a usuario de prueba

---

## 7. ALTERNATIVAS CONSIDERADAS

### ¿Por qué no usar solo REST polling en v1?

**Ventajas de polling**:
- ✅ Más simple (no requiere WebSocket)
- ✅ Funciona detrás de proxies/firewalls
- ✅ Estadeless

**Desventajas de polling**:
- ❌ Latencia fija (ej: 5 segundos = 5 segundos de delay en alerta)
- ❌ Carga en servidor (N users × polling cada 5s = tráfico)
- ❌ Mala UX para cocina (pedido "sorpresa" sin notificación)

**Decisión**: WebSocket + fallback polling = lo mejor de ambos mundos

### ¿Por qué no Redis Pub/Sub en v1?

**Ventajas Redis**:
- ✅ Escalable a múltiples instancias
- ✅ Persistencia de mensajes
- ✅ Soporte de canales complejos

**Desventajas en v1**:
- ❌ Complejidad operacional (otra dependencia)
- ❌ Costo (-10/mes en cloud)
- ❌ v1 es single-instance (un servidor = un cocina)

**Plan v2**: Migrar a Redis sin cambios de API client

---

## 8. ROADMAP FUTURO (v2, v3)

### v2 - Escalabilidad
- [ ] Redis Pub/Sub reemplaza manager in-memory
- [ ] Soporte multi-cocina (ej: 2 estaciones)
- [ ] Integración con impresoras de recibos

### v3 - Inteligencia
- [ ] IA predice qué ítems van juntos (agrupar)
- [ ] Sugerencias de orden de preparación por urgencia
- [ ] Métricas de eficiencia por cocinero

---

## 9. RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|------------|--------|-----------|
| WebSocket cae → UI frozena | Media | Alto | Fallback a polling + try/catch |
| Rol COCINA no asignado a usuarios | Baja | Alto | Seed data de test |
| Broadcast a 10+ usuarios lento | Baja | Medio | Monitoreo latencia |
| Token JWT expirado mid-sesión | Media | Bajo | Refresh automático (já existe) |

---

## 10. CRITERIOS DE ACEPTACIÓN FINALES

### Por Change

**CH-080**:
- [x] alembic upgrade head sin errores
- [x] Rol COCINA en BD
- [x] GET /auth/roles incluye COCINA
- [x] Seed es idempotente

**CH-081**:
- [x] WS /api/v1/cocina/pedidos funciona
- [x] Valida JWT antes de upgrade
- [x] Rechaza si rol ≠ COCINA (403)
- [x] Broadcast en tiempo real

**CH-082**:
- [x] Página /cocina/display solo accesible con rol COCINA
- [x] Layout full-screen sin navbar
- [x] Tarjetas muestran urgencia con colores
- [x] Botón "Listo" cambia estado a EN_CAMINO
- [x] Fallback a polling si WS falla

**CH-083**:
- [x] Modal de ingredientes sin stock
- [x] Dashboard con métricas (opcional)

---

## CONCLUSIÓN

El KDS de Food Store es una **extensión funcional** que:
1. No requiere cambios en modelos existentes (reutiliza Pedido/DetallePedido/HistorialEstadoPedido)
2. Se divide en 4 changes independientes (80-83)
3. Tiene un costo de ~11-14 horas de desarrollo (100 puntos)
4. Es preparada para v2 escalable con Redis (sin cambios de API)

**Próximo paso**: Crear archivos proposal.md, design.md, tasks.md en openspec/changes/CH-080 y ejecutar con /sdd-apply.

