/**
 * Sidebar — Premium SaaS sidebar with glass effect and role-based navigation.
 * Responsive: desktop glass sidebar, mobile slide-out drawer.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';
import { useCartStore } from '@/features/cart/store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Navigation items — Role-based configuration
// ---------------------------------------------------------------------------

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: string[]; // Empty = all authenticated users, specific = only those roles
  badge?: 'cart';
}

// Menu configuration organized by user type
const menuConfig = {
  // CLIENTE: Basic shopping experience
  cliente: [
    { path: '/', label: 'Inicio', icon: 'home', roles: [] },
    { path: '/carrito', label: 'Carrito', icon: 'shopping_cart', roles: [], badge: 'cart' as const },
    { path: '/mis-pedidos', label: 'Mis Pedidos', icon: 'receipt_long', roles: [] },
    { path: '/mis-direcciones', label: 'Mis Direcciones', icon: 'home_pin', roles: [] },
  ],

  // ADMIN: Full access
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['ADMIN'] },
    { path: '/admin/productos', label: 'Productos', icon: 'inventory_2', roles: ['ADMIN', 'STOCK'] },
    { path: '/admin/categorias', label: 'Categorías', icon: 'category', roles: ['ADMIN'] },
    { path: '/admin/ingredientes', label: 'Ingredientes', icon: 'nutrition', roles: ['ADMIN'] },
    { path: '/admin/pedidos', label: 'Pedidos', icon: 'assignment', roles: ['ADMIN', 'PEDIDOS'] },
    { path: '/admin/usuarios', label: 'Usuarios', icon: 'people', roles: ['ADMIN'] },
    { path: '/admin/metricas', label: 'Métricas', icon: 'analytics', roles: ['ADMIN'] },
  ],

  // STOCK: Product management
  stock: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['ADMIN', 'STOCK'] },
    { path: '/admin/productos', label: 'Productos', icon: 'inventory_2', roles: ['ADMIN', 'STOCK'] },
  ],

  // PEDIDOS: Order management
  pedidos: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['ADMIN', 'PEDIDOS'] },
    { path: '/admin/pedidos', label: 'Pedidos', icon: 'assignment', roles: ['ADMIN', 'PEDIDOS'] },
  ],
};

// Flatten menu based on user roles
function getMenuForRoles(userRoles: string[]): NavItem[] {
  const items: NavItem[] = [];

  // Always add client items (all authenticated users)
  items.push(...menuConfig.cliente);

  // Add admin items if user has ADMIN role
  if (userRoles.includes('ADMIN')) {
    items.push(...menuConfig.admin);
  }
  // Add stock items if user has STOCK role (but not admin - they already see all)
  else if (userRoles.includes('STOCK')) {
    items.push(...menuConfig.stock);
  }
  // Add pedidos items if user has PEDIDOS role (but not admin - they already see all)
  else if (userRoles.includes('PEDIDOS')) {
    items.push(...menuConfig.pedidos);
  }

  // Remove duplicates by path
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function NavLinkItem({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const cartTotal = useCartStore((s) => s.totalItems());
  const totalItems = item.badge === 'cart' ? cartTotal : 0;

  const navLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base =
      'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-250 relative';

    if (isActive) {
      return (
        base +
        ' bg-brand-50 text-brand-700 shadow-sm ' +
        'after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:h-5 after:w-1 after:rounded-full after:bg-brand-600'
      );
    }

    return (
      base +
      ' text-on-surface-variant hover:bg-surface-container hover:text-on-surface ' +
      'hover:translate-x-0.5'
    );
  };

  return (
    <li>
      <NavLink to={item.path} className={navLinkClass} onClick={onClick}>
        <span
          className="material-symbols-outlined flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container/80 text-[18px]"
          style={{ fontVariationSettings: '"wght" 400' }}
        >
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {item.badge === 'cart' && totalItems > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white px-1.5 leading-none shadow-sm">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </NavLink>
    </li>
  );
}

function BrandSection() {
  const { user } = useAuthStore();
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('ADMIN');

  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand shadow-glow-sm">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '22px', fontVariationSettings: '"wght" 600' }}
        >
          {isAdmin ? 'admin_panel_settings' : 'store'}
        </span>
      </div>
      <div>
        <h1 className="text-base font-semibold text-on-surface leading-tight">Food Store</h1>
        <p className="text-xs text-on-surface-variant/70 leading-tight">
          {isAdmin ? 'Panel de Administración' : 'Tienda Online'}
        </p>
      </div>
    </div>
  );
}

function UserSection() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const userRoles = user?.roles || [];
  const initials = user?.nombre?.charAt(0)?.toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    localStorage.removeItem('food-store-auth');
    navigate('/login', { replace: true });
  };

  return (
    <div className="px-5 py-4 border-t border-outline-variant/10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-brand text-white text-sm font-semibold shadow-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">
            {user?.nombre || 'Usuario'}
          </p>
          <p className="text-[11px] text-on-surface-variant/60 truncate">
            {userRoles.join(' · ') || 'Sin roles'}
          </p>
        </div>
      </div>
      {/* Logout button */}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-all duration-200"
      >
        <span
          className="material-symbols-outlined flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container/80 text-[18px]"
          style={{ fontVariationSettings: '"wght" 400' }}
        >
          logout
        </span>
        <span>Cerrar sesión</span>
      </button>
    </div>
  );
}

function NavSection() {
  const { user } = useAuthStore();
  const userRoles = user?.roles || [];

  // Get menu items based on user roles
  const navItems = getMenuForRoles(userRoles);

  // Determine section label based on roles
  const isAdmin = userRoles.includes('ADMIN');
  const isStaff = userRoles.some((r) => ['STOCK', 'PEDIDOS'].includes(r));
  const sectionLabel = isAdmin ? 'Panel Admin' : isStaff ? 'Gestión' : 'Navegación';

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
      <p className="px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/40">
        {sectionLabel}
      </p>
      <ul className="space-y-1">
        {navItems.map((item) => (
          <NavLinkItem key={item.path} item={item} />
        ))}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sidebar({ className = '', isOpen, onClose }: SidebarProps) {
  // ── Desktop sidebar ──
  const desktopSidebar = (
    <aside
      className={`hidden lg:flex lg:flex-col w-64 min-h-screen bg-surface-container-lowest/80 backdrop-blur-xl border-r border-outline-variant/10 shadow-soft ${className}`}
    >
      <BrandSection />
      <NavSection />
      <UserSection />
    </aside>
  );

  // ── Mobile overlay ──
  const mobileOverlay = isOpen && (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden animate-fade-in"
      onClick={onClose}
      role="presentation"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.();
      }}
    />
  );

  // ── Mobile drawer ──
  const mobileDrawer = (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-container-lowest/95 backdrop-blur-xl border-r border-outline-variant/10 shadow-premium-lg transform transition-transform duration-300 ease-out lg:hidden ${
        isOpen ? 'translate-x-0 animate-slide-in-right' : '-translate-x-full'
      } ${className}`}
    >
      <div className="flex items-center justify-between px-5 py-6 border-b border-outline-variant/10">
        <BrandSection />
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Cerrar menú"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: '"wght" 500' }}>
            close
          </span>
        </button>
      </div>
      <NavSection />
      <UserSection />
    </aside>
  );

  return (
    <>
      {desktopSidebar}
      {mobileOverlay}
      {mobileDrawer}
    </>
  );
}
