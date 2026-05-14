/**
 * OrdersPage — User's order history with premium glass UI.
 * Shows paginated list of order cards with status badges.
 * Path: /mis-pedidos
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePedidos } from '../hooks/usePedidos';
import { getStatusBadgeClasses, getStatusLabel } from './statusBadge';

export function OrdersPage() {
  const navigate = useNavigate();
  const [skip, setSkip] = useState(0);
  const limit = 10;

  const { data, isLoading, isError, error, refetch, total, page, totalPages } = usePedidos({
    skip,
    limit,
  });

  const orders = data?.items || [];

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
              Mis Pedidos
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Historial de tus compras
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-outline-variant/20 rounded-xl h-32"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (isError) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
              Mis Pedidos
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Historial de tus compras
            </p>
          </header>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-8 text-center">
            <span
              className="material-symbols-outlined text-4xl text-red-400 mb-3 inline-block"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              error_outline
            </span>
            <p className="text-on-surface-variant mb-4">
              {error?.message || 'Error al cargar los pedidos'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
              Mis Pedidos
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Historial de tus compras
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
              No tienes pedidos todavía
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Explora nuestro catálogo y hacé tu primer pedido
            </p>
            <button
              type="button"
              onClick={() => navigate('/catalogo')}
              className="bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Ver catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Data State ──
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Page Header ── */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
                Mis Pedidos
              </h1>
              <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
                Historial de tus compras
              </p>
            </div>
            {total !== undefined && (
              <span className="text-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                {total} pedido{total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </header>

        {/* ── Order Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => navigate(`/mis-pedidos/${order.id}`)}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 text-left hover:shadow-md hover:border-brand-200 transition-all duration-200 w-full"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    Pedido #{order.id}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {new Date(order.creado_en).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(order.estado)}`}
                >
                  {getStatusLabel(order.estado)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-on-surface-variant">
                  {order.items?.length || 0} producto{(order.items?.length || 0) !== 1 ? 's' : ''}
                </p>
                <p className="text-sm font-semibold text-brand-600">
                  ${parseFloat(order.total).toFixed(2)}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Pagination ── */}
        {totalPages && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/10">
            <p className="text-sm text-on-surface-variant">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - limit))}
                className="text-brand-600 hover:text-brand-700 border border-brand-600 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setSkip(skip + limit)}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
