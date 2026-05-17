/**
 * OrderConfirmationPage — Post-order creation confirmation screen.
 * Shows a summary of the created order with a call-to-action to pay.
 * Path: /confirmacion/:pedidoId
 *
 * Flow:
 *   1. Receive pedidoId from URL params
 *   2. Load pedido detail via usePedidoDetail hook
 *   3. Show order summary: items, totals, address, status
 *   4. User clicks "Ir a pagar ahora" → /pagar/{pedidoId}
 *   5. User clicks "Ver detalle del pedido" → /mis-pedidos/{pedidoId}
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePedidoDetail } from '@/features/pedidos';

const COSTO_ENVIO = 500;

export function OrderConfirmationPage() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();
  const pedidoIdNum = pedidoId ? parseInt(pedidoId, 10) : 0;

  const { data: pedido, isLoading, isError } = usePedidoDetail({
    id: pedidoIdNum,
    enabled: pedidoIdNum > 0,
  });

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4" />
          <p className="text-on-surface-variant">Cargando confirmación...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError || !pedido) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="max-w-md bg-surface-container-lowest rounded-xl border border-error/30 p-6 text-center">
          <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
          <h2 className="text-lg font-semibold text-on-surface mb-2">Pedido no encontrado</h2>
          <p className="text-on-surface-variant mb-4">
            No pudimos cargar los datos del pedido. Verificá el número e intentá de nuevo.
          </p>
          <Link
            to="/dashboard"
            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 inline-block"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = pedido.items.reduce(
    (sum, item) => sum + parseFloat(item.subtotal),
    0
  );
  const total = subtotal + COSTO_ENVIO;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Success Header ── */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-success" style={{ fontVariationSettings: '"wght" 400' }}>
              check_circle
            </span>
          </div>
          <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface mb-1">
            ¡Pedido creado con éxito!
          </h1>
          <p className="text-[14px] leading-[20px] text-on-surface-variant">
            Tu pedido <span className="font-medium text-on-surface">#{pedido.id}</span> está en estado{' '}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning/10 text-warning rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
              PENDIENTE — Esperando pago
            </span>
          </p>
        </div>

        {/* ── Order Items ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-4">
          <h2 className="text-base font-semibold text-on-surface mb-4">
            Productos
          </h2>
          <div className="divide-y divide-outline-variant/10">
            {pedido.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {item.nombre_snapshot || `Producto #${item.producto_id}`}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Cant: {item.cantidad} x ${parseFloat(item.precio_unitario).toFixed(2)}
                  </p>
                </div>
                <span className="text-sm font-medium text-on-surface ml-4">
                  ${parseFloat(item.subtotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Order Summary ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-4">
          <h2 className="text-base font-semibold text-on-surface mb-4">
            Resumen
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="text-on-surface">${subtotal.toFixed(2)}</span>
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
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Delivery Address ── */}
        {pedido.direccion_snapshot && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-4">
            <h2 className="text-base font-semibold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"wght" 400' }}>
                location_on
              </span>
              Dirección de entrega
            </h2>
            <p className="text-sm text-on-surface-variant">
              {pedido.direccion_snapshot}
            </p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate(`/pagar/${pedido.id}`)}
            className="flex-1 bg-brand-600 text-white px-8 py-3 rounded-xl hover:bg-brand-700 transition-all text-sm font-semibold
                       active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: '"wght" 500' }}>
              payments
            </span>
            Ir a pagar ahora
          </button>
          <Link
            to={`/mis-pedidos/${pedido.id}`}
            className="flex-1 bg-surface-container-high text-on-surface px-8 py-3 rounded-xl hover:bg-surface-container-highest transition-all text-sm font-semibold text-center"
          >
            Ver detalle del pedido
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
