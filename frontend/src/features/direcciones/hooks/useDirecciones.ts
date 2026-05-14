/**
 * useDirecciones - TanStack Query hook for user's delivery address list
 */

import { useQuery } from '@tanstack/react-query';
import {
  listDirecciones,
  DIRECCION_QUERY_KEYS,
  DireccionResponse,
} from '../api/endpoints';

export interface UseDireccionesParams {
  /** Enable the query */
  enabled?: boolean;
}

export interface UseDireccionesReturn {
  data: DireccionResponse[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<
    import('@tanstack/react-query').QueryObserverResult<
      DireccionResponse[],
      Error
    >
  >;
}

export function useDirecciones({
  enabled = true,
}: UseDireccionesParams = {}): UseDireccionesReturn {
  const queryKey = DIRECCION_QUERY_KEYS.list();

  const query = useQuery({
    queryKey,
    queryFn: () => listDirecciones(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
