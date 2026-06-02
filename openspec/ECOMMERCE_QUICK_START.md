# QUICK START GUIDE — Ecommerce Transformation (CH-026 to CH-032)

## 🎯 What Changed?

You now have **7 professionally planned changes** to transform FOOD-STORE from admin dashboard to real ecommerce.

```
BEFORE (Current)              AFTER (Planned)
───────────────────────────────────────────
❌ Shared sidebar for all   → ✅ Separate layouts
❌ No navbar                → ✅ Pro navbar (search, categories, cart)
❌ Can't browse categories  → ✅ Category navigation + filters
❌ Manual product search    → ✅ Advanced filters (price, allergens, etc)
❌ Kitchen = no real-time   → ✅ KDS with WebSocket updates
❌ Customer = no tracking   → ✅ Real-time order status + ETA
❌ Admin dashboard minimal  → ✅ Professional metrics dashboard
```

---

## 📋 The 7 Changes at a Glance

### **CH-026: Layout Separation** ⭐ START HERE
```
Status: 🟡 Planning
Effort: 6 hours
Role: Frontend
What: Split layouts for customer/admin/public
Why: Current shared sidebar breaks UX
Icon: 🎨
```

**Before**:
```
AppLayout (shared)
├── Sidebar (admin style)
├── Routes for customers
└── Routes for admin
```

**After**:
```
PublicLayout (public pages)
  ├── /home
  ├── /catalogo
  └── /productos/:id

CustomerLayout (navbar style)
  ├── /carrito
  ├── /checkout
  └── /mis-pedidos

AdminLayout (sidebar style)
  ├── /admin/dashboard
  ├── /admin/usuarios
  └── /admin/productos
```

---

### **CH-027: Navbar & Footer**
```
Status: 🟡 Planning
Effort: 6 hours
Role: Frontend (UX)
What: Professional ecommerce navbar
Why: Customers need search, categories, cart
Icon: 📱
```

**Navbar includes**:
- Logo (clickable → home)
- Search (real-time product suggestions)
- Categories dropdown (from API)
- Cart badge (item count)
- Profile menu (my orders, addresses, logout)

---

### **CH-028: Category Browsing**
```
Status: 🟡 Planning
Effort: 6 hours
Role: Full-stack
What: Navigate products by category
Why: Essential ecommerce feature
Icon: 📂
```

**Features**:
- `/categorias` page (list all)
- `/categorias/:slug` page (products in category)
- Subcategory filtering
- Breadcrumb navigation
- Backend: Add slug field to Categoria

---

### **CH-029: Filters & Sorting**
```
Status: 🟡 Planning
Effort: 8 hours
Role: Full-stack
What: Advanced product discovery
Why: Users need to narrow down 1000+ products
Icon: 🔍
```

**Filters**:
- Price range (slider)
- Allergens (checkboxes)
- Dietary (vegan, vegetarian, keto)
- In stock (toggle)
- Sorting (price, name, rating, newest)

---

### **CH-030: Kitchen Display System (KDS)**
```
Status: 🟡 Planning
Effort: 10.5 hours
Role: Full-stack
What: Real-time order queue for kitchen
Why: Kitchen staff needs to see orders as they arrive
Icon: 🍳
```

**Features**:
- Kanban board (Pending → In Prep → Ready)
- Order cards (items, instructions, urgency)
- WebSocket updates (real-time)
- Urgency by color (red > 30min, yellow 15-30, green < 15)
- Full-screen layout (TV/monitor optimized)

---

### **CH-031: Real-Time Order Tracking**
```
Status: 🟡 Planning
Effort: 9 hours
Role: Full-stack
What: Live updates for customers
Why: Customers want to know when order is ready
Icon: 📍
```

**Features**:
- Order timeline (visual progress)
- Current status + ETA
- Toast notifications (status changed)
- WebSocket updates (real-time)
- Fallback polling (if WebSocket fails)

---

### **CH-032: Admin Dashboard**
```
Status: 🟡 Planning
Effort: 11 hours
Role: Full-stack
What: Professional metrics dashboard
Why: Business needs visibility into sales, operations
Icon: 📊
```

**Metrics**:
- KPI cards (revenue, orders, customers, avg ticket)
- Sales chart (7d, 30d trends)
- Order status distribution (pie)
- Top products (best sellers)
- Low stock alerts
- Kitchen efficiency (avg prep time)
- Recent orders table

---

## 📅 Timeline (4 Weeks, Parallelizable)

```
WEEK 1: CH-026 + CH-027 (12h ecommerce)
        + CH-023 WebSocket setup (2h)
        Total: 14h/week

WEEK 2: CH-028 + CH-029 (14h ecommerce)
        + CH-023 finish (2h)
        Total: 16h/week

WEEK 3: CH-030 KDS (10.5h)
        + CH-031 Tracking (9h)
        Total: 19.5h/week

WEEK 4: CH-032 Dashboard (11h)
        + Testing/deployment (7h)
        Total: 18h/week

GRAND TOTAL: ~62.5 hours
Average: 15.6 hours/week
```

---

## 🔗 Dependencies (Who Blocks Who)

```
Must-Do First:
    CH-026 (Layout Separation) ← EVERYONE depends on this

Then, can do in parallel:

GROUP A (Discovery)      GROUP B (Admin)       GROUP C (Real-time)
├─ CH-027 (6h)          ├─ CH-032 (11h)       ├─ CH-023 (4h)
├─ CH-028 (6h) ────┐    │                     │
└─ CH-029 (8h) ────┼──→ (separate db queries) │
                   │                     ┌─────┘
                   └────────────────────→ CH-030 (10.5h)
                                         CH-031 (9h)

Total: ~56 hours
Can be done in parallel (not sequential)
```

---

## ✅ What You Need to Do

### **Step 1: Review** (Today)
- [ ] Read all 7 proposals in `/openspec/changes/CH-026*/proposal.md`
- [ ] Check `ECOMMERCE_TRANSFORMATION_STRATEGY.md` for full context
- [ ] Ask questions about any change

### **Step 2: Approve** (Tomorrow)
- [ ] Product owner approves order
- [ ] Tech lead confirms architecture
- [ ] Design team approves mockups
- [ ] QA team reviews test strategy

### **Step 3: Implement** (Next week)
- [ ] Start with CH-026 (specs + design)
- [ ] Parallel: CH-023 backend setup
- [ ] Then: CH-027, CH-028, CH-029
- [ ] Finally: CH-030, CH-031, CH-032

---

## 🎯 Success Criteria

### For Each Change
- [ ] Proposal reviewed ✓
- [ ] Specs written ✓
- [ ] Design documented ✓
- [ ] Tasks broken down ✓
- [ ] Code implemented ✓
- [ ] Tests pass ✓
- [ ] PR reviewed ✓
- [ ] Merged to main ✓

### For Entire Project
- [ ] Zero 404s on ecommerce routes
- [ ] Dashboard loads < 2s
- [ ] WebSocket connects < 1s
- [ ] Filters respond < 500ms
- [ ] Mobile UX passes Core Web Vitals
- [ ] Staging deployment successful
- [ ] Production rollout smooth

---

## 📚 Where Are the Documents?

```
openspec/
├── ECOMMERCE_TRANSFORMATION_STRATEGY.md ← Start here (full roadmap)
├── ECOMMERCE_CHANGES_INDEX.md ← Quick reference
└── changes/
    ├── CH-026-ecommerce-layout-separation/
    │   └── proposal.md
    ├── CH-027-customer-navbar-footer/
    │   └── proposal.md
    ├── CH-028-category-browsing/
    │   └── proposal.md
    ├── CH-029-product-filters-sorting/
    │   └── proposal.md
    ├── CH-030-kitchen-display-system/
    │   └── proposal.md
    ├── CH-031-realtime-order-tracking/
    │   └── proposal.md
    └── CH-032-admin-dashboard-professional/
        └── proposal.md
```

---

## 🚀 How to Start

### Option A: Full Deep Dive
1. Read `ECOMMERCE_TRANSFORMATION_STRATEGY.md` (30 min)
2. Read all 7 proposals (1.5 hours)
3. Review dependency graph
4. Approve timeline

### Option B: Quick Review
1. Skim this quick start (10 min)
2. Read `ECOMMERCE_CHANGES_INDEX.md` (10 min)
3. Review tables above
4. Ask questions + approve

### Option C: Immediate Execution
1. Trust the planning ✓
2. Run: `sdd-continue CH-026` in orchestrator
3. Work will proceed

---

## 💡 Why This Approach Works

✅ **No risk** — Architecture already clean, no breaking changes  
✅ **Parallelizable** — Can work on multiple changes at once  
✅ **Progressive** — Each week adds value (Week 1: navbar, Week 2: discovery, Week 3: real-time, Week 4: analytics)  
✅ **Documented** — Every decision documented for future reference  
✅ **Tested** — Strategy includes testing + staging before prod  
✅ **Maintainable** — Follows existing patterns (FSD, clean architecture, SOLID)  

---

## ❓ FAQ

**Q: Why is CH-026 blocking everything?**  
A: Layout separation is foundational. Without it, customer UX stays broken. Everything else builds on proper layouts.

**Q: Can we skip CH-030 (KDS)?**  
A: No, it's already proposed (CH-023+). But it's independent — doesn't block customer features.

**Q: Can we deploy week by week?**  
A: Yes! Each change is independently deployable. Suggested order is just optimal, not required.

**Q: What if WebSocket fails?**  
A: Fallback polling (5s interval) keeps system working. No data loss.

**Q: How much will this cost?**  
A: ~4 weeks of 1 full-time dev (or 2 devs × 2 weeks). Infrastructure costs same (no new services).

---

## 📞 Contact

Need clarification on any change?

```
CH-026 (Layout): Ask @frontend-team
CH-027 (Navbar): Ask @ui-team
CH-028 (Categories): Ask @backend-team
CH-029 (Filters): Ask @full-stack-team
CH-030 (KDS): Ask @kitchen-tech
CH-031 (Tracking): Ask @customer-experience
CH-032 (Dashboard): Ask @analytics-team
```

---

**Status**: 🟡 PLANNING - Ready for execution  
**Created**: 2026-05-21  
**Approved by**: ____________________  
**Start date**: ____________________  

To begin: Read proposals, approve, and say "let's go!" 🚀
