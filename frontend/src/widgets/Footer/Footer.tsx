/**
 * Footer — Simple ecommerce footer with company info and links.
 */

import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── Brand ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: '18px', fontVariationSettings: '"wght" 600' }}
                >
                  store
                </span>
              </div>
              <span className="text-base font-bold text-on-surface">Food Store</span>
            </div>
            <p className="text-sm text-on-surface-variant/70 leading-relaxed max-w-xs">
              Tu tienda de confianza para productos alimenticios. Calidad y frescura garantizada.
            </p>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-3">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/catalogo" className="text-sm text-on-surface-variant/70 hover:text-brand-600 transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/carrito" className="text-sm text-on-surface-variant/70 hover:text-brand-600 transition-colors">
                  Carrito
                </Link>
              </li>
              <li>
                <Link to="/mis-pedidos" className="text-sm text-on-surface-variant/70 hover:text-brand-600 transition-colors">
                  Mis Pedidos
                </Link>
              </li>
              <li>
                <Link to="/mi-perfil" className="text-sm text-on-surface-variant/70 hover:text-brand-600 transition-colors">
                  Mi Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Contact ── */}
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-3">Contacto</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-on-surface-variant/70">
                <span className="material-symbols-outlined text-[16px]">mail</span>
                contacto@foodstore.com
              </li>
              <li className="flex items-center gap-2 text-sm text-on-surface-variant/70">
                <span className="material-symbols-outlined text-[16px]">call</span>
                +54 11 1234-5678
              </li>
              <li className="flex items-center gap-2 text-sm text-on-surface-variant/70">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                Buenos Aires, Argentina
              </li>
            </ul>
          </div>
        </div>

        {/* ── Copyright ── */}
        <div className="border-t border-outline-variant/10 mt-8 pt-6 text-center">
          <p className="text-xs text-on-surface-variant/50">
            &copy; {currentYear} Food Store. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
