/**
 * Navbar — Main responsive navigation bar for customers.
 *
 * Desktop: logo | search | categories | cart | profile
 * Mobile:  logo + hamburger → drawer with all items
 */

import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavbarSearch from './NavbarSearch';
import NavbarCategories from './NavbarCategories';
import NavbarCart from './NavbarCart';
import NavbarProfile from './NavbarProfile';
import { useAuthStore } from '@/features/auth/store';

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <nav className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* ── Logo ── */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          onClick={closeMobileMenu}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-glow-sm">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: '20px', fontVariationSettings: '"wght" 600' }}
            >
              store
            </span>
          </div>
          <span className="text-lg font-bold text-on-surface hidden sm:block">
            Food Store
          </span>
        </Link>

        {/* ── Desktop right section ── */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
          <NavbarSearch />
          <NavbarCategories />
          <NavbarCart />
          {user ? (
            <NavbarProfile />
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '18px', fontVariationSettings: '"wght" 400' }}
              >
                login
              </span>
              <span className="hidden sm:inline">Ingresar</span>
            </button>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '24px', fontVariationSettings: '"wght" 500' }}
          >
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={closeMobileMenu}
            role="presentation"
          />

          {/* Drawer */}
          <div className="fixed top-16 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/10 md:hidden animate-slide-in-down shadow-premium-lg">
            <div className="px-4 py-4 space-y-4">
              <NavbarSearch />

              <div className="border-t border-outline-variant/10 pt-4 space-y-1">
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/40">
                  Navegación
                </p>
                <NavbarCategories />
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    navigate('/carrito');
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span
                    className="material-symbols-outlined text-[18px] text-on-surface-variant"
                    style={{ fontVariationSettings: '"wght" 400' }}
                  >
                    shopping_cart
                  </span>
                  Carrito
                </button>
              </div>

              {user ? (
                <div className="border-t border-outline-variant/10 pt-4 space-y-1">
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/40">
                    Mi Cuenta
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/mi-perfil');
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      person
                    </span>
                    Mi Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/mis-pedidos');
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      receipt_long
                    </span>
                    Mis Pedidos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/mis-direcciones');
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      home_pin
                    </span>
                    Mis Direcciones
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      localStorage.removeItem('food-store-auth');
                      navigate('/login', { replace: true });
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface hover:bg-error-container/20 hover:text-error transition-colors mt-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      logout
                    </span>
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="border-t border-outline-variant/10 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/login');
                    }}
                    className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      login
                    </span>
                    Ingresar
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
