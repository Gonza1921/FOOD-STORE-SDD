/**
 * PagoFallidoPage — Página de retorno cuando el pago en MercadoPago es rechazado.
 * Path: /pago-fallido?pedido_id=:pedidoId&collection_status=rejected
 *
 * Fase 1 — Solo muestra mensaje visual. Sin consultas a webhook ni actualización de estados.
 */

import { useSearchParams, Link } from 'react-router-dom';

export function PagoFallidoPage() {
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get('pedido_id');

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span
            className="material-symbols-outlined text-5xl text-error"
            style={{ fontVariationSettings: '"wght" 400' }}
          >
            cancel
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-error mb-2">
          Pago rechazado
        </h1>

        {/* Message */}
        <p className="text-on-surface-variant mb-2">
          El pago no pudo ser procesado. Podés intentar nuevamente.
        </p>

        {pedidoId && (
          <p className="text-sm text-on-surface-variant/70 mb-8">
            Pedido #{pedidoId}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            to={pedidoId ? `/pagar/${pedidoId}` : '/'}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 transition-all text-sm font-semibold"
          >
            Reintentar pago
          </Link>
          <Link
            to={pedidoId ? `/mis-pedidos/${pedidoId}` : '/mis-pedidos'}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
          >
            Ver mi pedido
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PagoFallidoPage;
