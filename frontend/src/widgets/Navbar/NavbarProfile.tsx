/**
 * NavbarProfile — User avatar, name, and dropdown menu.
 *
 * Shows user initial + name, dropdown with links to profile, orders,
 * addresses, and logout button.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';

export default function NavbarProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const initials = user?.nombre?.charAt(0)?.toUpperCase() || '?';
  const userName = user?.nombre || 'Usuario';
  const userRoles = user?.roles || [];
  const roleLabel = userRoles.includes('ADMIN')
    ? 'Admin'
    : userRoles.includes('COCINA')
      ? 'Cocina'
      : userRoles.includes('STOCK')
        ? 'Stock'
        : userRoles.includes('PEDIDOS')
          ? 'Pedidos'
          : 'Cliente';

  // ── Click outside ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    localStorage.removeItem('food-store-auth');
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-container transition-colors"
        aria-label="Menú de perfil"
        aria-expanded={isOpen}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-white text-xs font-semibold shadow-sm">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-on-surface leading-tight">
            {userName}
          </p>
          <p className="text-[11px] text-on-surface-variant/60 leading-tight">
            {roleLabel}
          </p>
        </div>
        <span
          className={`material-symbols-outlined hidden sm:inline-block transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ fontSize: '16px', fontVariationSettings: '"wght" 400' }}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-1 w-56 bg-surface-container-lowest rounded-xl shadow-premium-lg border border-outline-variant/10 overflow-hidden z-50 animate-fade-in"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-outline-variant/10">
            <p className="text-sm font-medium text-on-surface">{userName}</p>
            <p className="text-xs text-on-surface-variant/60">{user?.email}</p>
          </div>

          {/* Navigation links */}
          <div className="py-1">
            <Link
              to="/mi-perfil"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                person
              </span>
              Mi Perfil
            </Link>
            <Link
              to="/mis-pedidos"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                receipt_long
              </span>
              Mis Pedidos
            </Link>
            <Link
              to="/mis-direcciones"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                home_pin
              </span>
              Mis Direcciones
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-outline-variant/10" />

          {/* Logout */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                handleLogout();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-error-container/20 hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                logout
              </span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
