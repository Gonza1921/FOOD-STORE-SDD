/**
 * CheckoutPage — Cart → Order checkout flow.
 * Connects useCartStore with useCreatePedido to place orders.
 * Path: /checkout
 *
 * Flow:
 *   1. Show cart items with quantities and prices
 *   2. User clicks "Confirmar Compra"
 *   3. Create order via API (mutateAsync)
 *   4. On success: toast, clearCart(), navigate to /mis-pedidos/:id
 *   5. On error: toast with message, stay on page
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '@/features/cart/store';
import { useCreatePedido } from '@/features/pedidos';
import { useUiStore } from '@/features/ui/store';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, totalItems, removeItem, updateQuantity } = useCartStore();
  const { addToast } = useUiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: createPedido } = useCreatePedido({
    onSuccess: (pedido) => {
      // Clear cart after successful API response
      clearCart();
      addToast({
        message: `¡Pedido #${pedido.id} creado con éxito!`,
        type: 'success',
        duration: 4000,
      });
      navigate(`/mis-pedidos/${pedido.id}`);
    },
    onError: (error) => {
      addToast({
        message: error?.message || 'Error al crear el pedido. Intentalo de nuevo.',
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsSubmitting(true);

    try {
      await createPedido({
        items: items.map((item) => ({
          producto_id: item.productoId,
          cantidad: item.cantidad,
        })),
      });
    } catch {
      // Error handled by onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Empty State ──
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
              Finalizar Compra
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Revisá los productos antes de confirmar
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
      </div>
    );
  }

  // ── Data State ──
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Page Header ── */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
                Finalizar Compra
              </h1>
              <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
                Revisá los productos antes de confirmar
              </p>
            </div>
            <span className="text-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              {totalItems()} producto{totalItems() !== 1 ? 's' : ''}
            </span>
          </div>
        </header>

        {/* ── Cart Items ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-on-surface mb-4">
            Productos
          </h2>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left text-xs font-medium text-on-surface-variant pb-3 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="text-right text-xs font-medium text-on-surface-variant pb-3 uppercase tracking-wider">
                    Cant.
                  </th>
                  <th className="text-right text-xs font-medium text-on-surface-variant pb-3 uppercase tracking-wider">
                    Precio Unit.
                  </th>
                  <th className="text-right text-xs font-medium text-on-surface-variant pb-3 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {items.map((item) => (
                  <tr key={item.productoId}>
                    <td className="py-3 text-sm text-on-surface">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-container/80 overflow-hidden">
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt={item.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span
                                className="material-symbols-outlined text-outline-variant/50 text-lg"
                                style={{ fontVariationSettings: '"wght" 300' }}
                              >
                                image
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium truncate max-w-[200px]">
                          {item.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-on-surface-variant text-right">
                      <div className="inline-flex items-center gap-1 border border-outline-variant/30 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                          className="px-2 py-1 text-on-surface-variant hover:text-brand-600 transition-colors text-sm"
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-on-surface-variant text-right">
                      ${Number(item.precio).toFixed(2)}
                    </td>
                    <td className="py-3 text-sm font-medium text-on-surface text-right">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productoId)}
                        className="text-on-surface-variant/50 hover:text-red-500 transition-colors"
                        disabled={isSubmitting}
                        aria-label={`Eliminar ${item.nombre}`}
                      >
                        <span
                          className="material-symbols-outlined text-lg"
                          style={{ fontVariationSettings: '"wght" 400' }}
                        >
                          close
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {items.map((item) => (
              <div
                key={item.productoId}
                className="flex items-center gap-3 p-3 bg-surface-container/50 rounded-lg"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-surface-container/80 overflow-hidden">
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
                        style={{ fontSize: '20px', fontVariationSettings: '"wght" 300' }}
                      >
                        image
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {item.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="inline-flex items-center gap-1 border border-outline-variant/30 rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                        className="px-1.5 py-0.5 text-on-surface-variant hover:text-brand-600 transition-colors text-xs"
                        disabled={isSubmitting}
                      >
                        -
                      </button>
                      <span className="px-1 text-xs font-medium text-on-surface">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                        className="px-1.5 py-0.5 text-on-surface-variant hover:text-brand-600 transition-colors text-xs"
                        disabled={isSubmitting}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      x ${Number(item.precio).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-semibold text-on-surface">
                    ${(item.precio * item.cantidad).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productoId)}
                    className="text-on-surface-variant/50 hover:text-red-500 transition-colors"
                    disabled={isSubmitting}
                    aria-label={`Eliminar ${item.nombre}`}
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: '"wght" 400' }}
                    >
                      close
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Order Summary ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-on-surface mb-4">
            Resumen de la compra
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Productos</span>
              <span className="text-on-surface">{totalItems()} unidad{totalItems() !== 1 ? 'es' : ''}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="text-on-surface">${totalPrice().toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/10">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-on-surface">Total</span>
              <span className="text-xl font-bold text-brand-600">
                ${totalPrice().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            to="/catalogo"
            className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors inline-flex items-center gap-1"
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: '"wght" 400' }}
            >
              arrow_back
            </span>
            Seguir comprando
          </Link>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isSubmitting || items.length === 0}
            className="bg-brand-600 text-white px-8 py-3 rounded-xl hover:bg-brand-700 transition-all text-sm font-semibold
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-600
                       active:scale-[0.98] flex items-center justify-center gap-2 min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', fontVariationSettings: '"wght" 500' }}
                >
                  lock
                </span>
                Confirmar Compra
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
