## Goal
Analyze Food Store SDD domain docs to define Kitchen Display System (KDS) as independent OPSX changes with architecture, timeline, and technical decisions.

## Instructions
- WebSocket over SSE (bidirectional, < 100ms latency)
- Single-instance pub/sub in v1 (dict-based, Redis migration in v2 without API changes)
- Reuse existing models (Pedido, DetallePedido, HistorialEstadoPedido)
- Divide into 4 atomic changes: CH-080 (role) → CH-081 (backend) → CH-082 (frontend) → CH-083 (enhancements)
- Output as structured markdown for conversion to OPSX proposals

## Discoveries
- No feature-display-cocina folder exists in repo; KDS requirements scattered across 4 domain docs
- Rol COCINA implicit in documentation but not yet created
- EN_PREPARACIÓN state already defined in FSM (CH-033) — KDS maps directly to this
- WebSocket architecture needs graceful fallback to REST polling (5s interval)
- Full-screen layout required (no navbar) optimized for TV/monitor display in cocina
- Urgency coloring: red >30min, yellow >15min, green <15min
- Zustand store essential for client state: pedidos[], conexion status, settings
- ConnectionManager (dict-based pub/sub) sufficient for v1 single-instance; scales to Redis v2

## Accomplished
- ✅ Read and analyzed 4 domain docs in depth
- ✅ Identified KDS scope from scattered requirements
- ✅ Generated 11-section exhaustive analysis document (ANALISIS_KDS_FEATURE.md)
- ✅ Proposed 4-change division with dependencies and timeline
- ✅ Estimated total effort: 10.5–14 hours (100 story points)
- ✅ Documented architecture decisions with tradeoffs
- ✅ Created feature-sliced design structure for frontend
- ✅ Defined Zustand store contract and WebSocket hook with fallback

## Next Steps (AWAITING USER CLARIFICATION)
1. Should I proceed to generate OPSX artifacts (proposal.md, specs.md, design.md, tasks.md) for all 4 changes?
2. Should CH-082 frontend be a separate widget tree or integrated into existing admin/cocina routes?
3. Should we create openspec/changes directories immediately, or explore first?
4. Ready to execute /sdd-apply phase starting with CH-080 (seed COCINA role into DB)?

## Relevant Files
- ANALISIS_KDS_FEATURE.md (ready for review, 1600+ lines)
- docs/{Descripcion,Historias_de_usuario,Integrador,CHANGES}.txt (analyzed)
- openspec/changes/ (ready for new CH-080, CH-081, CH-082, CH-083 artifacts)

Status: Analysis complete. Awaiting guidance.
