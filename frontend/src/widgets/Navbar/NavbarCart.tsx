/**
 * NavbarCart — Cart icon with item count badge.
 *
 * Reads from Zustand cart store and navigates to /carrito on click.
 */

import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/features/cart/store';

export default function NavbarCart() {
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <button
      type="button"
      onClick={() => navigate('/carrito')}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-brand-600 transition-all duration-200"
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
  );
}
