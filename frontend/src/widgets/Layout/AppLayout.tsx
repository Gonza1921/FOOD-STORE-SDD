/**
 * AppLayout — Premium SaaS layout with glass sidebar and topbar.
 *
 * Structure:
 *   Desktop : [Glass Sidebar] [Main with Topbar + Outlet]
 *   Mobile  : [Hamburger → Drawer] [Main with Topbar + Outlet]
 */

import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/widgets/Sidebar/Sidebar';
import { useAuthStore } from '@/features/auth/store';
import { useCartStore } from '@/features/cart/store';

// ---------------------------------------------------------------------------
// Route titles
// ---------------------------------------------------------------------------

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/admin/productos': 'Productos',
  '/admin/categorias': 'Categorías',
  '/admin/ingredientes': 'Ingredientes',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());

  const pageTitle = routeTitles[location.pathname] || 'Food Store';
  const initials = user?.nombre?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Sidebar ── */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* ── Topbar ── */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/10 bg-surface-container-lowest/70 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
          {/* Left: hamburger + title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors lg:hidden"
              aria-label="Abrir menú"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '22px', fontVariationSettings: '"wght" 500' }}
              >
                menu
              </span>
            </button>
            <h1 className="text-lg font-semibold text-on-surface hidden sm:block">
              {pageTitle}
            </h1>
          </div>

          {/* Right: cart icon + user area */}
          <div className="flex items-center gap-2">
            {/* ── Cart icon with badge ── */}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-brand-600 transition-all duration-200"
              aria-label={`Carrito con ${totalItems} producto${totalItems !== 1 ? 's' : ''}`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '22px', fontVariationSettings: '"wght" 500' }}
              >
                shopping_cart
              </span>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white px-1 shadow-sm leading-none animate-scale-in">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-white text-xs font-semibold shadow-sm">
              {initials}
            </div>
            <span className="text-sm font-medium text-on-surface hidden sm:block">
              {user?.nombre || 'Usuario'}
            </span>
          </div>
        </header>

        {/* ── Page content via Outlet ── */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
