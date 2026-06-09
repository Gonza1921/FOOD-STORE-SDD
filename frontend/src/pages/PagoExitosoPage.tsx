/**
 * PagoExitosoPage — Página de retorno cuando el pago en MercadoPago se aprueba.
 * Path: /pago-exitoso?pedido_id=:pedidoId&collection_status=approved
 *
 * Fase 1 — Solo muestra mensaje visual. Sin consultas a webhook ni actualización de estados.
 */

import { useSearchParams, Link } from 'react-router-dom';

export function PagoExitosoPage() {
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get('pedido_id');

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span
            className="material-symbols-outlined text-5xl text-success"
            style={{ fontVariationSettings: '"wght" 400' }}
          >
            check_circle
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-success mb-2">
          ¡Pago exitoso!
        </h1>

        {/* Message */}
        <p className="text-on-surface-variant mb-2">
          Tu pago fue procesado correctamente.
        </p>

        {pedidoId && (
          <p className="text-sm text-on-surface-variant/70 mb-8">
            Pedido #{pedidoId}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            to={pedidoId ? `/mis-pedidos/${pedidoId}` : '/mis-pedidos'}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 transition-all text-sm font-semibold"
          >
            Ver mi pedido
          </Link>
          <Link
            to="/"
            className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PagoExitosoPage;
