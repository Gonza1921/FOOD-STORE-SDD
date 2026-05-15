import { Link } from 'react-router-dom';
import { useCartStore } from '../store';

export interface CartSummaryProps {
  showCheckoutButton?: boolean;
  className?: string;
}

export function CartSummary({ showCheckoutButton = true, className = '' }: CartSummaryProps) {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const totalPrice = useCartStore((s) => s.totalPrice());

  if (items.length === 0) {
    return (
      <div className={`bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-8 text-center ${className}`}>
        <span
          className="material-symbols-outlined text-5xl text-outline-variant/50 mb-4 inline-block"
          style={{ fontVariationSettings: '"wght" 200' }}
        >
          shopping_cart
        </span>
        <h3 className="text-base font-semibold text-on-surface mb-1">
          Tu carrito está vacío
        </h3>
        <p className="text-sm text-on-surface-variant mb-5">
          Agregá productos desde el catálogo
        </p>
        <Link
          to="/catalogo"
          className="inline-block bg-brand-600 text-white px-5 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className={`bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-on-surface mb-3">
        Resumen del carrito
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Productos</span>
          <span className="text-on-surface font-medium">
            {totalItems} unidad{totalItems !== 1 ? 'es' : ''}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Subtotal</span>
          <span className="text-on-surface font-medium">
            ${totalPrice.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-outline-variant/10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-semibold text-on-surface">Total</span>
          <span className="text-lg font-bold text-brand-600">
            ${totalPrice.toFixed(2)}
          </span>
        </div>
        {showCheckoutButton && (
          <Link
            to="/checkout"
            className="block w-full text-center bg-brand-600 text-white px-4 py-2.5 rounded-lg hover:bg-brand-700 transition-colors text-sm font-semibold active:scale-[0.98]"
          >
            Ir al checkout
          </Link>
        )}
      </div>
    </div>
  );
}

export default CartSummary;