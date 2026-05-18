/**
 * CheckoutPage — Cart → Order checkout flow.
 * Connects useCartStore with useCreatePedido to place orders.
 * Path: /checkout
 *
 * Flow:
 *   1. Show cart items with quantities and prices
 *   2. User selects delivery address and payment method
 *   3. User clicks "Confirmar Compra"
 *   4. Create order via API (mutateAsync)
 *   5. On success: toast, clearCart(), navigate to /mis-pedidos/:id
 *   6. On error: toast with message, stay on page
 */

import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore, CartItem } from '@/features/cart/store';
import { useCreatePedido, PedidoCreate } from '@/features/pedidos';
import { useDirecciones } from '@/features/direcciones';
import { useUiStore } from '@/features/ui/store';
import { Modal, Button } from '@/shared/ui';
import type { AxiosError } from 'axios';

const COSTO_ENVIO = 500;

const FORMA_PAGO_OPTIONS = [
  { id: 1, label: 'Efectivo', desc: 'Pagas al recibir' },
  { id: 2, label: 'Tarjeta', desc: 'Crédito/Débito' },
  { id: 3, label: 'MercadoPago', desc: 'MercadoPago' },
];

interface PriceConflictProduct {
  id: number;
  nombre: string;
  precio_carrito: number;
  precio_actual: number;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, totalItems, removeItem, updateQuantity, clearCart } = useCartStore();
  const { addToast } = useUiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceConflict, setPriceConflict] = useState<{
    productos: PriceConflictProduct[];
  } | null>(null);

  // Address and payment state
  const [direccionId, setDireccionId] = useState<number | null>(null);
  const [formaPagoId, setFormaPagoId] = useState<number | null>(null);

  // Get user's addresses
  const { data: direcciones, isLoading: loadingDirecciones } = useDirecciones();

  const { mutateAsync: createPedido } = useCreatePedido({
    onSuccess: (pedido) => {
      clearCart();
      addToast({
        message: `¡Pedido #${pedido.id} creado con éxito!`,
        type: 'success',
        duration: 4000,
      });
      navigate(`/confirmacion/${pedido.id}`);
    },
    onError: (error) => {
      addToast({
        message: error?.message || 'Error al crear el pedido. Intentalo de nuevo.',
        type: 'error',
        duration: 5000,
      });
    },
  });

  const canCheckout = direccionId && formaPagoId && items.length > 0;

  const handleCheckout = async () => {
    if (!canCheckout) return;

    setIsSubmitting(true);

    // Read fresh state from store to avoid stale closures
    const freshItems = useCartStore.getState().items;

    try {
      const pedidoData: PedidoCreate = {
        items: freshItems.map((item) => ({
          producto_id: item.productoId,
          cantidad: item.cantidad,
          precio_carrito: item.precioCarrito,
          ingredientes_excluidos: (item as CartItem & { ingredientes_excluidos?: number[] }).ingredientes_excluidos,
        })),
        direccion_id: direccionId!,
        forma_pago_id: formaPagoId!,
      };
      await createPedido(pedidoData);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{
        detail?: string;
        details?: { productos?: PriceConflictProduct[] };
      }>;
      if (axiosErr?.response?.status === 409 && axiosErr.response.data?.details?.productos) {
        setPriceConflict({
          productos: axiosErr.response.data.details.productos,
        });
      }
      // Other errors handled by onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCart = useCallback(() => {
    if (!priceConflict) return;
    for (const p of priceConflict.productos) {
      useCartStore.getState().updatePrice(p.id, p.precio_actual);
    }
    setPriceConflict(null);
    // Retry checkout after prices are updated
    setTimeout(() => handleCheckout(), 100);
  }, [priceConflict]);

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

  // ── No Addresses State ──
  if (!loadingDirecciones && (!direcciones || direcciones.length === 0)) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
              Finalizar Compra
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Seleccioná tu dirección de entrega
            </p>
          </header>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-12 text-center">
            <span
              className="material-symbols-outlined text-5xl text-outline-variant/50 mb-4 inline-block"
              style={{ fontVariationSettings: '"wght" 200' }}
            >
              location_on
            </span>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              Necesitás agregar una dirección
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Agregá una dirección de entrega para continuar con la compra
            </p>
            <Link
              to="/mis-direcciones/nueva"
              className="bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium inline-block"
            >
              Agregar Dirección
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Price conflict modal ──
  const renderPriceConflictModal = () => {
    if (!priceConflict) return null;
    return (
      <Modal
        open
        onClose={() => setPriceConflict(null)}
        title="Precios actualizados"
        maxWidth="max-w-lg"
      >
        <p className="text-sm text-on-surface-variant mb-4">
          Algunos productos en tu carrito cambiaron de precio desde que los agregaste:
        </p>
        <div className="space-y-3 mb-6">
          {priceConflict.productos.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-variant/20"
            >
              <div>
                <p className="text-sm font-medium text-on-surface">{p.nombre}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-on-surface-variant line-through">
                    ${Number(p.precio_carrito).toFixed(2)}
                  </span>
                  <span className="material-symbols-outlined text-xs text-on-surface-variant" style={{ fontSize: '14px' }}>
                    arrow_forward
                  </span>
                  <span className="text-xs font-semibold text-brand-600">
                    ${Number(p.precio_actual).toFixed(2)}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                p.precio_actual > p.precio_carrito
                  ? 'bg-red-50 text-red-600'
                  : 'bg-green-50 text-green-600'
              }`}>
                {p.precio_actual > p.precio_carrito ? '↑' : '↓'} {Math.abs(Number(p.precio_actual) - Number(p.precio_carrito)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="premium"
            onClick={handleUpdateCart}
            className="flex-1"
          >
            Actualizar carrito
          </Button>
          <Link
            to="/catalogo"
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
            onClick={() => setPriceConflict(null)}
          >
            Volver al catálogo
          </Link>
        </div>
      </Modal>
    );
  };

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
                Seleccioná cómo recibir y pagar tu pedido
              </p>
            </div>
            <span className="text-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              {totalItems()} producto{totalItems() !== 1 ? 's' : ''}
            </span>
          </div>
        </header>

        {/* ── Delivery Address Section ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"wght" 400' }}>
              location_on
            </span>
            Dirección de Entrega
          </h2>

          {loadingDirecciones ? (
            <div className="animate-pulse h-20 bg-surface-container/50 rounded-lg" />
          ) : (
            <div className="space-y-2">
              {direcciones?.map((dir) => (
                <label
                  key={dir.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    direccionId === dir.id
                      ? 'border-brand-600 bg-brand-600/5'
                      : 'border-outline-variant/30 hover:border-brand-600/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="direccion"
                    value={dir.id}
                    checked={direccionId === dir.id}
                    onChange={() => setDireccionId(dir.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-on-surface">
                        {dir.alias || 'Dirección'}
                      </span>
                      {dir.es_principal && (
                        <span className="text-xs bg-brand-600/10 text-brand-600 px-2 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      {dir.linea1}{dir.linea2 && `, ${dir.linea2}`}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {dir.ciudad}, {dir.provincia} {dir.codigo_postal}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <Link
            to="/mis-direcciones/nueva"
            className="mt-3 text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"wght" 400' }}>
              add
            </span>
            Agregar nueva dirección
          </Link>
        </div>

        {/* ── Payment Method Section ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"wght" 400' }}>
              payment
            </span>
            Forma de Pago
          </h2>

          <div className="space-y-2">
            {FORMA_PAGO_OPTIONS.map((fp) => (
              <label
                key={fp.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  formaPagoId === fp.id
                    ? 'border-brand-600 bg-brand-600/5'
                    : 'border-outline-variant/30 hover:border-brand-600/50'
                }`}
              >
                <input
                  type="radio"
                  name="formaPago"
                  value={fp.id}
                  checked={formaPagoId === fp.id}
                  onChange={() => setFormaPagoId(fp.id)}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium text-on-surface">{fp.label}</span>
                  <span className="text-sm text-on-surface-variant ml-2">- {fp.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

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
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Costo de envío</span>
              <span className="text-on-surface">${COSTO_ENVIO.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/10">
            <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-on-surface">Total</span>
            <span className="text-xl font-bold text-brand-600">
              ${(totalPrice() + COSTO_ENVIO).toFixed(2)}
            </span>
          </div>
        </div>
        </div>

        {renderPriceConflictModal()}

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
            disabled={!canCheckout || isSubmitting}
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