/**
 * OrderDetailPage — Single order detail view with real-time tracking.
 * Shows order header, timeline, ETA, items table, and total summary.
 * Path: /mis-pedidos/:id
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePedidoDetail } from '../hooks/usePedidoDetail';
import { getStatusBadgeClasses, getStatusLabel } from './statusBadge';
import { useOrderWebSocket, useOrderTrackingStore } from '@/features/orders';
import {
  OrderTimeline,
  OrderEstimatedTime,
  LiveUpdatesIndicator,
} from '@/features/orders/components';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pedidoId = parseInt(id || '0', 10);

  const { data: queryOrder, isLoading, isError, error } = usePedidoDetail({
    id: pedidoId,
    enabled: !!pedidoId && pedidoId > 0,
  });

  useOrderWebSocket(pedidoId);

  const liveOrder = useOrderTrackingStore((s) => s.order);
  const connectionStatus = useOrderTrackingStore((s) => s.connectionStatus);

  const order = liveOrder ?? queryOrder;

  function buildTimestamps(ord: typeof order): Record<string, string> {
    const ts: Record<string, string> = {};
    if (!ord) return ts;
    if ('confirmado_en' in ord && ord.confirmado_en) ts.CONFIRMADO = ord.confirmado_en;
    if ('en_preparacion_en' in ord && ord.en_preparacion_en) ts.EN_PREPARACION = ord.en_preparacion_en;
    if ('listo_en' in ord && ord.listo_en) ts.LISTO = ord.listo_en;
    if ('en_camino_en' in ord && ord.en_camino_en) ts.EN_CAMINO = ord.en_camino_en;
    if ('entregado_en' in ord && ord.entregado_en) ts.ENTREGADO = ord.entregado_en;
    return ts;
  }

  // ── Invalid ID ──
  if (!pedidoId || pedidoId <= 0) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-12 text-center">
            <span
              className="material-symbols-outlined text-4xl text-red-400 mb-3 inline-block"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              error_outline
            </span>
            <h2 className="text-lg font-semibold text-on-surface mb-2">Pedido no válido</h2>
            <Link
              to="/mis-pedidos"
              className="text-brand-600 hover:text-brand-700 text-sm font-medium"
            >
              Volver a mis pedidos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Back button skeleton */}
          <div className="animate-pulse bg-outline-variant/20 rounded-lg h-10 w-32 mb-6" />
          {/* Header skeleton */}
          <div className="animate-pulse bg-outline-variant/20 rounded-xl h-24 mb-6" />
          {/* Timeline skeleton */}
          <div className="animate-pulse bg-outline-variant/20 rounded-xl h-24 mb-6" />
          {/* Table skeleton */}
          <div className="animate-pulse bg-outline-variant/20 rounded-xl h-64 mb-6" />
          {/* Total skeleton */}
          <div className="animate-pulse bg-outline-variant/20 rounded-xl h-20" />
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (isError || !order) {
    const isNotFound =
      (error as { response?: { status?: number } })?.response?.status === 404 ||
      (error as { response?: { status?: number } })?.response?.status === 403;

    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-12 text-center">
            <span
              className="material-symbols-outlined text-4xl text-red-400 mb-3 inline-block"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              {isNotFound ? 'search_off' : 'error_outline'}
            </span>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              {isNotFound ? 'Pedido no encontrado' : 'Error al cargar el pedido'}
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              {isNotFound
                ? 'El pedido que buscas no existe o no tenés acceso'
                : error?.message || 'Ocurrió un error inesperado'}
            </p>
            <Link
              to="/mis-pedidos"
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium inline-block"
            >
              Volver a mis pedidos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Data State ──
  const items = order.items || [];
  const timestamps = buildTimestamps(order);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Back Button ── */}
        <button
          type="button"
          onClick={() => navigate('/mis-pedidos')}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-brand-600 transition-colors mb-6"
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: '"wght" 400' }}
          >
            arrow_back
          </span>
          Volver a mis pedidos
        </button>

         {/* ── Order Header ── */}
         <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-6">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
             <div>
               <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
                 Pedido #{order.id}
               </h1>
               <p className="text-sm text-on-surface-variant mt-1">
                 {new Date(order.creado_en).toLocaleDateString('es-AR', {
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit',
                 })}
               </p>
             </div>
             <div className="flex items-center gap-3 self-start">
               <span
                 className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(order.estado)}`}
               >
                 {getStatusLabel(order.estado)}
               </span>
               <LiveUpdatesIndicator status={connectionStatus} />
             </div>
           </div>
         </div>

        {/* ── Timeline Section ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-6">
          <OrderTimeline currentState={order.estado} timestamps={timestamps} />
        </div>

        {/* ── Estimated Time ── */}
        <div className="mb-6">
          <OrderEstimatedTime
            estado={order.estado}
            creado_en={order.creado_en}
            timestamps={timestamps}
          />
        </div>

        {/* ── Delivery Address ── */}
        {'direccion_snapshot' in order && order.direccion_snapshot ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-on-surface-variant mt-0.5"
                style={{ fontSize: '20px', fontVariationSettings: '"wght" 400' }}
              >
                location_on
              </span>
              <div>
                <p className="text-sm font-medium text-on-surface mb-1">Dirección de entrega</p>
                <p className="text-sm text-on-surface-variant">{order.direccion_snapshot}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Items Section ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-on-surface mb-4">
            Productos ({items.length})
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
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-sm text-on-surface">
                      {item.nombre_snapshot || `Producto #${item.producto_id}`}
                    </td>
                    <td className="py-3 text-sm text-on-surface-variant text-right">
                      {item.cantidad}
                    </td>
                    <td className="py-3 text-sm text-on-surface-variant text-right">
                      ${parseFloat(item.precio_unitario).toFixed(2)}
                    </td>
                    <td className="py-3 text-sm font-medium text-on-surface text-right">
                      ${parseFloat(item.subtotal).toFixed(2)}
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
                key={item.id}
                className="flex items-center justify-between p-3 bg-surface-container/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {item.nombre_snapshot || `Producto #${item.producto_id}`}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {item.cantidad} x ${parseFloat(item.precio_unitario).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-on-surface ml-3">
                  ${parseFloat(item.subtotal).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Total Summary ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-on-surface">Total</p>
            <p className="text-xl font-bold text-brand-600">
              ${parseFloat(order.total).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
