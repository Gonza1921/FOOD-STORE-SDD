# FOOD-STORE Ecommerce Transformation — Changes Index

## Overview

Proyecto de transformación de FOOD-STORE de **panel administrativo a ecommerce profesional**.

**7 nuevos changes**: CH-026 a CH-032  
**Total effort**: 50–60 horas  
**Timeline**: 4 semanas  

---

## 📋 Changes Propuestos

### **CH-026: Ecommerce Layout Separation** 🔴 BLOQUEADOR
**Prioridad**: MÁXIMA | **Duración**: 6h | **Complejidad**: ⭐ Baja

Separa layouts frontend:
- `PublicLayout` — sin auth
- `CustomerLayout` — cliente (navbar, no sidebar)
- `AdminLayout` — admin (sidebar + dashboard)

**Bloqueador**: Sin esto, CH-027–032 no pueden proceder.

📄 Propuesta: `CH-026-ecommerce-layout-separation/proposal.md`

---

### **CH-027: Customer Navbar & Footer** 
**Prioridad**: MÁXIMA | **Duración**: 6h | **Complejidad**: ⭐ Baja

Crea navbar profesional:
- Logo + brand
- Search bar (productos)
- Dropdown categorías
- Carrito (con badge de items)
- Perfil/Login

Plus footer con links + copyright.

**Depende de**: CH-026

📄 Propuesta: `CH-027-customer-navbar-footer/proposal.md`

---

### **CH-028: Category Browsing**
**Prioridad**: ALTA | **Duración**: 6h | **Complejidad**: ⭐ Baja

Sistema de navegación por categoría:
- Página `/categorias` (lista todas)
- Página `/categorias/:slug` (productos en categoría)
- Subcategorías (si aplica)
- Breadcrumb navigation
- Backend: agregar campo `slug` a Categoria

**Depende de**: CH-026, CH-027

📄 Propuesta: `CH-028-category-browsing/proposal.md`

---

### **CH-029: Product Filters & Sorting**
**Prioridad**: ALTA | **Duración**: 8h | **Complejidad**: ⭐⭐ Media

Filtros avanzados:
- Precio (slider)
- Alergenos (checkboxes)
- Restricciones dietarias (vegano, vegetariano, keto)
- En stock (toggle)
- Rating
- Sort: precio, nombre, rating, más nuevo

**Depende de**: CH-028

📄 Propuesta: `CH-029-product-filters-sorting/proposal.md`

---

### **CH-030: Kitchen Display System (KDS)**
**Prioridad**: MEDIA | **Duración**: 10.5h | **Complejidad**: ⭐⭐⭐ Alta

Pantalla en tiempo real para cocina:
- Kanban board (Pendiente → En Prep → Listo)
- Order cards con items + instrucciones
- Urgencia por color (rojo > 30min, amarillo 15-30, verde < 15)
- Botones: Iniciar Prep, Marcar Listo
- WebSocket updates (desde CH-023)
- Full-screen layout (optimizado para TV)

**Depende de**: CH-022 (Rol COCINA) + CH-023 (WebSocket backend)

📄 Propuesta: `CH-030-kitchen-display-system/proposal.md`

---

### **CH-031: Real-Time Order Tracking**
**Prioridad**: MEDIA | **Duración**: 9h | **Complejidad**: ⭐⭐ Media

Seguimiento en vivo para clientes:
- Orden timeline (visual progress)
- Status badge + timestamp
- ETA (estimated delivery time)
- Toast notifications en cambios de estado
- WebSocket updates (desde CH-023)
- Fallback polling si WS falla

**Depende de**: CH-023 (WebSocket backend)

📄 Propuesta: `CH-031-realtime-order-tracking/proposal.md`

---

### **CH-032: Professional Admin Dashboard**
**Prioridad**: MEDIA | **Duración**: 11h | **Complejidad**: ⭐⭐⭐ Alta

Dashboard profesional con métricas:
- KPI cards (ingresos, órdenes, clientes, ticket promedio)
- Sales chart (7d, 30d)
- Order status distribution
- Top products
- Low stock alerts
- Recent orders
- Staff metrics (kitchen efficiency)
- Date range filters

**Depende de**: CH-026 (AdminLayout)

📄 Propuesta: `CH-032-admin-dashboard-professional/proposal.md`

---

## 📅 Roadmap Recomendado

```
SEMANA 1: CH-026 + CH-027 (12h ecommerce)
          + CH-023 setup (2h backend WebSocket)

SEMANA 2: CH-028 + CH-029 (14h ecommerce)
          + CH-023 finish (2h backend)

SEMANA 3: CH-023 + CH-030 + CH-031 (21.5h real-time)

SEMANA 4: CH-032 + testing (15h admin + QA)

TOTAL: ~62.5 horas en 4 semanas
```

---

## 🔗 Dependencias

```
CH-022 (Rol COCINA)
    ↓
CH-026 (Layout Separation) ← BLOQUEADOR
    ↓
┌─────────────────────────────────────────────────┐
│ Parallelizable                                   │
├─────────┬──────────┬──────────┬────────────────┤
│         │          │          │                │
CH-027   CH-028    CH-029    CH-032              │
(6h)     (6h) →    (8h)      (11h)               │
         ↓                                        │
    CH-029                                        │
    (8h)                                          │
                       ↓                          │
                  CH-023 (WebSocket)              │
                  (4h)                            │
                       ↓                          │
            ┌──────────┴──────────┐              │
        CH-030 (KDS)          CH-031 (Tracking)  │
        (10.5h)               (9h)               │
            └──────────┬──────────┘              │
                       Fin
```

---

## ✅ Implementation Order

### Phase 1: Foundation (Semana 1)
1. **CH-026** (6h) — Layout separation (blocker)
2. **CH-027** (6h) — Navbar + footer
3. **CH-023 setup** (2h) — Backend WebSocket infrastructure

**Result**: Ecommerce basic navigation + auth separation

### Phase 2: Discovery (Semana 2)
4. **CH-028** (6h) — Category browsing
5. **CH-029** (8h) — Filters + sorting
6. **CH-023 finish** (2h) — Complete WebSocket

**Result**: Full product discovery + backend real-time ready

### Phase 3: Operations (Semana 3)
7. **CH-030** (10.5h) — Kitchen Display System
8. **CH-031** (9h) — Customer real-time tracking

**Result**: Real-time operations (kitchen + customer)

### Phase 4: Analytics (Semana 4)
9. **CH-032** (11h) — Admin dashboard
10. **Testing + deployment** (4h)

**Result**: Complete ecommerce transformation + metrics

---

## 📚 Key Documents

| Documento | Propósito |
|-----------|-----------|
| `ECOMMERCE_TRANSFORMATION_STRATEGY.md` | Estrategia global, timeline, riesgos |
| `CH-026-*/proposal.md` | Propuesta: Layout separation |
| `CH-027-*/proposal.md` | Propuesta: Navbar + footer |
| `CH-028-*/proposal.md` | Propuesta: Categories |
| `CH-029-*/proposal.md` | Propuesta: Filters |
| `CH-030-*/proposal.md` | Propuesta: KDS |
| `CH-031-*/proposal.md` | Propuesta: Real-time tracking |
| `CH-032-*/proposal.md` | Propuesta: Admin dashboard |
| `README-KDS-STRATEGY.md` | Contexto KDS (CH-022 a CH-025) |
| `ANALISIS_KDS_FEATURE.md` | Análisis detallado KDS |

---

## 🎯 Success Metrics

### Technical
- [ ] Zero 404 errors on ecommerce routes
- [ ] Dashboard loads < 2 seconds
- [ ] WebSocket connects < 1 second
- [ ] Filters respond < 500ms
- [ ] Mobile Core Web Vitals all green

### Business
- [ ] Conversion rate tracking enabled
- [ ] Average order value visible
- [ ] Kitchen efficiency metrics live
- [ ] Customer satisfaction (via tracking)

---

## 🚨 Critical Path

**Blocking order** (must follow):

1. **CH-026** first (enables all others)
2. **CH-027 after CH-026** (navbar needs layout)
3. **CH-023** parallel with CH-028/029 (WebSocket backend)
4. **CH-030 + CH-031** after CH-023 (depends on WebSocket)
5. **CH-032** anytime after CH-026

**Flexible order**: CH-027, CH-028, CH-029 can move around after CH-026.

---

## 🔐 Security Checklist

- [ ] Role guards on all protected routes
- [ ] WebSocket auth validates JWT before upgrade
- [ ] SQL injection prevention in filter queries
- [ ] XSS prevention in product names, instructions
- [ ] CSRF tokens on POST endpoints
- [ ] Rate limiting on API endpoints
- [ ] Sensitive data (prices, addresses) only to authorized users

---

## 📈 Performance Targets

| Métrica | Target | How to Achieve |
|---------|--------|----------------|
| Home page load | < 2s | Lazy load categories, cache navbar |
| Product search | < 300ms | Database indexes on nombre, alergenos |
| Filter response | < 500ms | Query optimization, pagination |
| WebSocket connect | < 1s | Optimized auth, connection pooling |
| Dashboard load | < 2s | Database aggregates, caching |
| Mobile FCP | < 2.5s | Minimize critical CSS, defer JS |

---

## 📞 Decision Points Pending

### Q1: CH-023 Real-Time Protocol?
- [ ] WebSocket (current choice — bidirectional, < 100ms)
- [ ] Server-Sent Events (unidirectional, simpler)
- [ ] Decision: **WebSocket** ✓

### Q2: CH-029 Filter Strategy?
- [ ] Database queries (current choice — scalable)
- [ ] Client-side filtering (simpler, slower with 1000+ products)
- [ ] Decision: **Database** ✓

### Q3: CH-032 Caching?
- [ ] Database only (v1 — no external dep)
- [ ] Redis (faster, ops overhead)
- [ ] Decision: **Database v1, Redis v2** ✓

### Q4: Deployment Strategy?
- [ ] Direct merge per change (current choice)
- [ ] Feature flags (safer control)
- [ ] Decision: **Direct merge** ✓

---

## 🎓 Learning Outcomes

**Después de completar CH-026 a CH-032, el equipo habrá aprendido**:

1. ✅ Layout-based routing patterns (instead of role-scattered routes)
2. ✅ WebSocket integration with auth + fallback
3. ✅ Real-time state sync (frontend + backend)
4. ✅ Query optimization for filters (indexes, pagination)
5. ✅ ETA calculation for delivery systems
6. ✅ Admin dashboard best practices (metrics, charts, caching)
7. ✅ Mobile-first responsive design
8. ✅ Clean architecture at scale (50+ components, 10+ APIs)

---

## 📞 Next Steps

### Immediately (Today)

- [ ] Product owner reviews all 7 proposals
- [ ] Design team approves Navbar, KDS, Dashboard mockups
- [ ] Backend team confirms WebSocket capacity

### Phase 1 Start (Monday)

- [ ] Create specs + design for CH-026
- [ ] Create tasks for CH-026
- [ ] Begin implementation (sdd-apply)
- [ ] Parallel: Design CH-027 specs

### Phase 1 Complete (Friday)

- [ ] CH-026 merged to main (layout swap)
- [ ] CH-027 merged (navbar)
- [ ] Start Phase 2

---

## 📝 Approvals Needed

**Product**: ______________________  
**Tech Lead**: ______________________  
**Design**: ______________________  
**QA**: ______________________  

---

**Documento creado**: 2026-05-21  
**Status**: 🟡 PLANNING — Awaiting approval  
**Owner**: Full-stack team + Orchestrator  

Para comenzar implementación: Aprobar y ejecutar `/sdd-continue CH-026` en orchestrator.
