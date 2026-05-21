# CH-027: Customer Navbar & Footer — Ecommerce Navigation

## Executive Summary

Create a professional **ecommerce navbar** for customers (replaces admin sidebar). The navbar includes:

- **Logo** (clickable → homepage)
- **Search bar** (products by name/ingredients)
- **Category dropdown** (navigation by category)
- **Cart button** (with item count badge)
- **Login/Profile button** (shows username if logged in)

Plus a simple **footer** with company info and links.

## Problem Statement

- **Current state**: No customer navbar; customers see admin sidebar after login
- **Customer pain**: "I don't know where to search for products or see my cart"
- **UX issue**: Navbar doesn't look like an ecommerce site

## Solution

Create `CustomerNavbar` component with:

```
┌─────────────────────────────────────────────────────────┐
│ Logo    Search [___________]  Categories ▼              │
│                                    Cart(3)  Profile ▼    │
└─────────────────────────────────────────────────────────┘
```

And simple footer with links.

## Scope

✅ **Include**:
- `Navbar` component (logo, search, categories, cart, profile)
- `Footer` component (links, copyright, company info)
- Navbar responsive design (hamburger menu on mobile)
- Search functionality (client-side filtering, debounced)
- Cart badge showing item count
- Profile dropdown (shows logged-in user)
- Logout button in profile dropdown

❌ **Exclude**:
- Category filtering logic (that's CH-028)
- Product filtering (that's CH-029)
- Styling design overhaul (use Tailwind, keep it simple)

## Dependencies

| Change | Dependency | Reason |
|--------|-----------|--------|
| **CH-026** | BLOCKING | Navbar needs `CustomerLayout` |
| **CH-028** | Optional | Navbar includes categories dropdown |
| **CH-029** | Optional | Navbar search can trigger filters |

## Technical Approach

### Component Structure

```
frontend/src/widgets/
├── Navbar/
│   ├── Navbar.tsx              (main navbar)
│   ├── NavbarSearch.tsx        (search input + suggestions)
│   ├── NavbarCategories.tsx    (dropdown with categories)
│   ├── NavbarCart.tsx          (cart icon + badge)
│   ├── NavbarProfile.tsx       (user profile + logout)
│   └── index.ts
├── Footer/
│   ├── Footer.tsx              (main footer)
│   └── index.ts
```

### Navbar Features

1. **Logo** — Links to `/` (homepage)
2. **Search** — Real-time search, shows product suggestions as user types
3. **Categories dropdown** — Fetch from `/api/v1/categorias`, navigate to category page
4. **Cart button** — Shows number of items, links to `/carrito`
5. **Profile** — Shows user name (from Zustand auth store), dropdown with:
   - "Mi Perfil" → `/mi-perfil`
   - "Mis Pedidos" → `/mis-pedidos`
   - "Mis Direcciones" → `/mis-direcciones`
   - "Logout" → logout + redirect to home

### Footer Content

```
├── Company Info (About, Contact, FAQs)
├── Legal (Privacy Policy, Terms)
├── Follow us (Social media links)
└── Copyright © 2026
```

## Backend Changes

**No backend changes required** — navbar uses existing endpoints:
- `GET /api/v1/categorias` (already exists)
- `GET /api/v1/productos?search=...` (already exists)
- Cart stored in Zustand (client-side)
- Auth from existing JWT system

## Frontend Changes

```tsx
// src/widgets/Navbar/Navbar.tsx
export default function Navbar() {
  const user = useAuthStore(s => s.user);
  const cartItems = useCartStore(s => s.items);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false); // mobile menu
  
  return (
    <nav className="bg-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">
          FOOD STORE
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <NavbarSearch />
          <NavbarCategories />
          <NavbarCart count={cartItems.length} />
          {user ? <NavbarProfile /> : <LoginButton />}
        </div>
        
        {/* Mobile Hamburger */}
        <button 
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-4 py-2 border-t">
          <NavbarSearch />
          <NavbarCategories />
          <NavbarCart count={cartItems.length} />
          {user ? <NavbarProfile /> : <LoginButton />}
        </div>
      )}
    </nav>
  );
}
```

## Effort Estimate

- **Navbar component**: 3 hours
  - Logo + navigation structure: 0.5h
  - Search component: 1h
  - Categories dropdown: 1h
  - Cart badge + profile dropdown: 0.5h

- **Footer component**: 1 hour
  - Links + layout: 0.5h
  - Responsive: 0.5h

- **Testing & refinement**: 2 hours
  - Manual testing on mobile/desktop
  - Responsive design validation
  - Search functionality
  - Profile dropdown behavior

**Total**: 6 hours

## Acceptance Criteria

- [ ] Navbar displays logo (clickable)
- [ ] Search bar works (filters products real-time)
- [ ] Categories dropdown loads and works
- [ ] Cart badge shows correct item count
- [ ] Profile dropdown shows logged-in user's name
- [ ] Logout button works correctly
- [ ] Mobile hamburger menu works
- [ ] Navbar responsive on all device sizes
- [ ] Footer displays and links work
- [ ] No console errors
- [ ] Tailwind styles applied correctly

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Search performance (1000+ products) | MEDIUM | LOW | Add debounce + limit results to 10 |
| Categories dropdown slow | LOW | LOW | Cache categories in Zustand |
| Mobile menu doesn't close | MEDIUM | LOW | Add click-outside handler |
| Cart count out of sync | LOW | MEDIUM | Subscribe to cart store updates |

## Timeline

- **Start**: After CH-026 is merged
- **Duration**: 6 hours (can be same day as CH-026)
- **Delivery**: Feature branch, 2 commits (navbar + footer)
- **Merge**: When all components tested and responsive

## Next Steps (After This Change)

1. **CH-028** — Add category browsing page
2. **CH-029** — Add product filters (price, allergens, dietary)
3. **CH-031** — Connect navbar to real-time order updates

---

**Change Owner**: Frontend team (UI/UX)  
**Status**: 🟡 Planning  
**Created**: 2026-05-21  
**Last Updated**: 2026-05-21
