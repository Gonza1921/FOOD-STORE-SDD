/**
 * usePedidoDetail - TanStack Query hook for single order detail
 */

import { useQuery } from '@tanstack/react-query';
import { getPedidoDetail, PEDIDO_QUERY_KEYS, PedidoResponse } from '../api/endpoints';

export interface UsePedidoDetailParams {
  /** Order ID to fetch */
  id: number;
  /** Enable the query (false to disable) */
  enabled?: boolean;
}

export interface UsePedidoDetailReturn {
  data: PedidoResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<
    import('@tanstack/react-query').QueryObserverResult<PedidoResponse, Error>
  >;
}

export function usePedidoDetail({
  id,
  enabled = true,
}: UsePedidoDetailParams): UsePedidoDetailReturn {
  const queryKey = PEDIDO_QUERY_KEYS.detail(id);

  const query = useQuery({
    queryKey,
    queryFn: () => getPedidoDetail(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
