import { Link } from 'react-router-dom';
import { useCartStore } from '@/features/cart/store';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalItems = useCartStore((s) => s.totalItems());
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  // ── Empty State ──
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-6">
          <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
            Mi Carrito
          </h1>
          <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
            Revisá y gestioná los productos antes de comprar
          </p>
        </header>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-12 text-center">
          <span
            className="material-symbols-outlined text-5xl text-outline-variant/50 mb-4 inline-block"
            style={{ fontVariationSettings: '"wght" 200' }}
          >
            shopping_cart
          </span>
          <h2 className="text-lg font-semibold text-on-surface mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Agregá productos desde el catálogo para iniciar una compra
          </p>
          <Link
            to="/catalogo"
            className="bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium inline-block"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* ── Page Header ── */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
            Mi Carrito
          </h1>
          <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
            {totalItems} producto{totalItems !== 1 ? 's' : ''} en tu carrito
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('¿Estás seguro de vaciar el carrito?')) {
              clearCart();
            }
          }}
          className="text-sm text-on-surface-variant hover:text-error transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-error-container/20"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '18px', fontVariationSettings: '"wght" 400' }}
          >
            delete_sweep
          </span>
          Vaciar carrito
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Cart Items ── */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6">
          <div className="space-y-4 divide-y divide-outline-variant/10">
            {items.map((item) => (
              <div key={item.productoId} className="flex items-center gap-4 pt-4 first:pt-0">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-surface-container overflow-hidden">
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-outline-variant/50"
                        style={{ fontSize: '24px', fontVariationSettings: '"wght" 300' }}
                      >
                        image
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-on-surface truncate">
                    {item.nombre}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    ${Number(item.precio).toFixed(2)} c/u
                  </p>
                  {item.ingredientes_excluidos && item.ingredientes_excluidos.length > 0 && (
                    <p className="text-xs text-brand-600 mt-0.5">
                      Personalizado
                    </p>
                  )}
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1 border border-outline-variant/30 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                    className="px-2 py-1 text-on-surface-variant hover:text-brand-600 transition-colors text-sm"
                    aria-label="Disminuir cantidad"
                  >
                    -
                  </button>
                  <span className="px-1 min-w-[24px] text-center text-sm font-medium text-on-surface">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                    className="px-2 py-1 text-on-surface-variant hover:text-brand-600 transition-colors text-sm"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-semibold text-on-surface">
                    ${(item.precio * item.cantidad).toFixed(2)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${item.nombre}" del carrito?`)) {
                      removeItem(item.productoId);
                    }
                  }}
                  className="text-on-surface-variant/50 hover:text-error transition-colors p-1"
                  aria-label={`Eliminar ${item.nombre}`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '20px', fontVariationSettings: '"wght" 400' }}
                  >
                    close
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cart Summary Sidebar ── */}
        <div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 sticky top-24">
            <h3 className="text-sm font-semibold text-on-surface mb-4">
              Resumen
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
              <div className="flex justify-between items-center mb-5">
                <span className="text-base font-semibold text-on-surface">
                  Total
                </span>
                <span className="text-xl font-bold text-brand-600">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <Link
                to="/checkout"
                className="block w-full text-center bg-brand-600 text-white px-4 py-2.5 rounded-lg hover:bg-brand-700 transition-colors text-sm font-semibold active:scale-[0.98] mb-2"
              >
                Ir al checkout
              </Link>
              <Link
                to="/catalogo"
                className="block w-full text-center text-brand-600 hover:text-brand-700 transition-colors text-sm font-medium"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}