/**
 * AdminOrdersPage — Admin order management dashboard.
 * Status filter, paginated order list, confirm and transition actions.
 * Path: /admin/pedidos
 * Role: ADMIN, PEDIDOS
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listAllPedidos,
  PEDIDO_QUERY_KEYS,
  PedidoResponse,
  PedidoListResponse,
} from '../api/endpoints';
import { useConfirmPedido, useUpdatePedidoEstado } from '../hooks/usePedidoMutations';
import { getStatusBadgeClasses, getStatusLabel } from './statusBadge';

// ============================================================================
// Constants
// ============================================================================

const STATUSES = ['PENDIENTE', 'CONFIRMADO', 'EN_PREP', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'];

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  CONFIRMADO: ['EN_PREP', 'CANCELADO'],
  EN_PREP: ['EN_CAMINO', 'CANCELADO'],
  EN_CAMINO: ['ENTREGADO'],
};

const TERMINAL_STATES = ['ENTREGADO', 'CANCELADO'];

const PAGINATION_LIMIT = 15;

// ============================================================================
// Sub-components
// ============================================================================

function EstadoTransitionSelect({
  order,
  onTransition,
  isPending,
}: {
  order: PedidoResponse;
  onTransition: (id: number, estado: string) => void;
  isPending: boolean;
}) {
  const nextStates = ALLOWED_TRANSITIONS[order.estado];
  if (!nextStates || nextStates.length === 0) return null;

  return (
    <select
      value=""
      onChange={(e) => {
        if (e.target.value) {
          onTransition(order.id, e.target.value);
          e.target.value = ''; // Reset after selection
        }
      }}
      disabled={isPending}
      className="text-xs border border-outline-variant/30 rounded-lg px-2 py-1.5 bg-surface-container-lowest text-on-surface 
                 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
                 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <option value="" disabled>
        Cambiar estado...
      </option>
      {nextStates.map((state) => (
        <option key={state} value={state}>
          {getStatusLabel(state)}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [skip, setSkip] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState<string>('');

  // Queries
  const queryKey = PEDIDO_QUERY_KEYS.adminList({ skip, limit: PAGINATION_LIMIT, estado: estadoFilter || undefined });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PedidoListResponse>({
    queryKey,
    queryFn: () => listAllPedidos(skip, PAGINATION_LIMIT, estadoFilter || undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Mutations
  const confirmMutation = useConfirmPedido({
    onError: (err) => {
      alert(err?.message || 'Error al confirmar el pedido');
    },
  });

  const transitionMutation = useUpdatePedidoEstado({
    onError: (err) => {
      alert(err?.message || 'Error al actualizar el estado');
    },
  });

  const orders = data?.items || [];
  const total = data?.total || 0;
  const page = data ? Math.floor((data.skip || 0) / (data.limit || PAGINATION_LIMIT)) + 1 : 1;
  const totalPages = data ? Math.ceil(total / (data.limit || PAGINATION_LIMIT)) : 1;

  // Handlers
  const handleConfirm = (id: number) => {
    confirmMutation.mutate(id);
  };

  const handleTransition = (id: number, estado: string) => {
    transitionMutation.mutate({ id, estado });
  };

  const handleFilterChange = (newEstado: string) => {
    setEstadoFilter(newEstado);
    setSkip(0);
  };

  const isMutating = confirmMutation.isPending || transitionMutation.isPending;

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
              Gestión de Pedidos
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Administrá y supervisá todos los pedidos del sistema
            </p>
          </header>
          {/* Filter skeleton */}
          <div className="animate-pulse bg-outline-variant/20 rounded-xl h-12 mb-6" />
          {/* Table skeleton */}
          <div className="animate-pulse bg-outline-variant/20 rounded-xl h-96" />
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
              Gestión de Pedidos
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Administrá y supervisá todos los pedidos del sistema
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

  // ── Data State ──
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Page Header ── */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
                Gestión de Pedidos
              </h1>
              <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
                Administrá y supervisá todos los pedidos del sistema
              </p>
            </div>
            <span className="text-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full self-start sm:self-center">
              {total} pedido{total !== 1 ? 's' : ''}
            </span>
          </div>
        </header>

        {/* ── Filter Bar ── */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="status-filter" className="text-sm font-medium text-on-surface-variant">
              Filtrar por estado:
            </label>
            <select
              id="status-filter"
              value={estadoFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="border border-outline-variant/30 rounded-lg px-3 py-2 bg-surface-container-lowest text-on-surface text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="">Todos los estados</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Empty State ── */}
        {orders.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-12 text-center">
            <span
              className="material-symbols-outlined text-5xl text-outline-variant/50 mb-4 inline-block"
              style={{ fontVariationSettings: '"wght" 200' }}
            >
              receipt_long
            </span>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              {estadoFilter
                ? `No hay pedidos en estado "${getStatusLabel(estadoFilter)}"`
                : 'No hay pedidos registrados'}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {estadoFilter
                ? 'Probá con otro filtro'
                : 'Los pedidos aparecerán aquí cuando los clientes realicen compras'}
            </p>
          </div>
        ) : (
          <>
            {/* ── Orders Table (Desktop) ── */}
            <div className="hidden lg:block bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container/50">
                    <th className="text-left text-xs font-medium text-on-surface-variant px-4 py-3 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left text-xs font-medium text-on-surface-variant px-4 py-3 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="text-left text-xs font-medium text-on-surface-variant px-4 py-3 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-right text-xs font-medium text-on-surface-variant px-4 py-3 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-center text-xs font-medium text-on-surface-variant px-4 py-3 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-right text-xs font-medium text-on-surface-variant px-4 py-3 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-on-surface">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">
                        #{order.usuario_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">
                        {new Date(order.creado_en).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-on-surface">
                        ${parseFloat(order.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(order.estado)}`}
                        >
                          {getStatusLabel(order.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AdminActions
                          order={order}
                          onConfirm={handleConfirm}
                          onTransition={handleTransition}
                          isMutating={isMutating}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Orders Cards (Mobile) ── */}
            <div className="lg:hidden space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-on-surface">
                      Pedido #{order.id}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(order.estado)}`}
                    >
                      {getStatusLabel(order.estado)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant mb-3">
                    <span>Usuario: #{order.usuario_id}</span>
                    <span className="text-right">
                      {new Date(order.creado_en).toLocaleDateString('es-AR')}
                    </span>
                    <span className="font-semibold text-on-surface">
                      ${parseFloat(order.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/10">
                    <AdminActions
                      order={order}
                      onConfirm={handleConfirm}
                      onTransition={handleTransition}
                      isMutating={isMutating}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/10">
                <p className="text-sm text-on-surface-variant">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={skip === 0}
                    onClick={() => setSkip(Math.max(0, skip - PAGINATION_LIMIT))}
                    className="text-brand-600 hover:text-brand-700 border border-brand-600 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setSkip(skip + PAGINATION_LIMIT)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AdminActions — Renders action buttons per order based on estado
// ============================================================================

function AdminActions({
  order,
  onConfirm,
  onTransition,
  isMutating,
}: {
  order: PedidoResponse;
  onConfirm: (id: number) => void;
  onTransition: (id: number, estado: string) => void;
  isMutating: boolean;
}) {
  const isTerminal = TERMINAL_STATES.includes(order.estado);

  if (isTerminal) {
    return (
      <span className="text-xs text-on-surface-variant/50 italic">
        Sin acciones
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {order.estado === 'PENDIENTE' && (
        <button
          type="button"
          onClick={() => onConfirm(order.id)}
          disabled={isMutating}
          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        >
          Confirmar
        </button>
      )}
      {ALLOWED_TRANSITIONS[order.estado] && (
        <EstadoTransitionSelect
          order={order}
          onTransition={onTransition}
          isPending={isMutating}
        />
      )}
    </div>
  );
}
