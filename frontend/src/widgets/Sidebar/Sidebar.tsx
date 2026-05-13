/**
 * Sidebar - Admin navigation sidebar with role-based menu items
 * Phase 8.1-8.2: Navigation for Products, Categories, Ingredients based on user role
 */

import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';

export interface SidebarProps {
  /** Optional additional className */
  className?: string;
}

const navItems = [
  {
    path: '/admin/productos',
    label: 'Productos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    roles: ['ADMIN', 'STOCK'],
  },
  {
    path: '/admin/categorias',
    label: 'Categorías',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    roles: ['ADMIN'],
  },
  {
    path: '/admin/ingredientes',
    label: 'Ingredientes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.414 1.414.586 3.828 0 5.172V20" />
      </svg>
    ),
    roles: ['ADMIN'],
  },
];

export function Sidebar({ className = '' }: SidebarProps) {
  const { user } = useAuthStore();
  const userRoles = user?.roles || [];

  // Filter nav items based on user role
  const visibleItems = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.some((role) => userRoles.includes(role))
  );

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 min-h-screen ${className}`}>
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900">Food Store</h1>
        <p className="text-sm text-gray-500">Admin Panel</p>
      </div>

      <nav className="mt-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <span className="w-5 h-5">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Usuario: {user?.nombre || 'N/A'}</p>
          <p>Roles: {userRoles.join(', ') || 'N/A'}</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;