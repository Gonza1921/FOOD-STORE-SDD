/**
 * usePedidos - TanStack Query hook for user's order list
 */

import { useQuery } from '@tanstack/react-query';
import { listPedidos, PEDIDO_QUERY_KEYS, PedidoListResponse } from '../api/endpoints';

export interface UsePedidosParams {
  skip?: number;
  limit?: number;
  /** Enable the query */
  enabled?: boolean;
}

export interface UsePedidosReturn {
  data: PedidoListResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<
    import('@tanstack/react-query').QueryObserverResult<PedidoListResponse, Error>
  >;
  /** Total count of all orders */
  total: number | undefined;
  /** Current page number (1-indexed) */
  page: number | undefined;
  /** Total pages available */
  totalPages: number | undefined;
}

export function usePedidos({
  skip = 0,
  limit = 20,
  enabled = true,
}: UsePedidosParams = {}): UsePedidosReturn {
  const queryKey = PEDIDO_QUERY_KEYS.list({ skip, limit });

  const query = useQuery({
    queryKey,
    queryFn: () => listPedidos(skip, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    total: query.data?.total,
    page: query.data ? Math.floor((query.data.skip || 0) / (query.data.limit || 20)) + 1 : undefined,
    totalPages: query.data
      ? Math.ceil((query.data.total || 0) / (query.data.limit || 20))
      : undefined,
  };
}
