/**
 * useDireccionDetail - TanStack Query hook for single delivery address detail
 */

import { useQuery } from '@tanstack/react-query';
import {
  getDireccionDetail,
  DIRECCION_QUERY_KEYS,
  DireccionResponse,
} from '../api/endpoints';

export interface UseDireccionDetailParams {
  /** Address ID to fetch */
  id: number;
  /** Enable the query */
  enabled?: boolean;
}

export interface UseDireccionDetailReturn {
  data: DireccionResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<
    import('@tanstack/react-query').QueryObserverResult<
      DireccionResponse,
      Error
    >
  >;
}

export function useDireccionDetail({
  id,
  enabled = true,
}: UseDireccionDetailParams): UseDireccionDetailReturn {
  const queryKey = DIRECCION_QUERY_KEYS.detail(id);

  const query = useQuery({
    queryKey,
    queryFn: () => getDireccionDetail(id),
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
