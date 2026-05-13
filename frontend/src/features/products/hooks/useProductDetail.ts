/**
 * useProductDetail - TanStack Query hook for single product detail (admin)
 * Phase 6.3: Eager load of categorias and ingredientes
 */

import { useQuery } from '@tanstack/react-query';
import {
  getProductDetail,
  PRODUCT_QUERY_KEYS,
  Producto,
} from '../api/endpoints';

export interface UseProductDetailParams {
  /** Product ID to fetch */
  id: number;
  /** Enable the query (false to disable) */
  enabled?: boolean;
}

export interface UseProductDetailReturn {
  data: Producto | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<import('@tanstack/react-query').QueryObserverResult<Producto, Error>>;
}

export function useProductDetail({
  id,
  enabled = true,
}: UseProductDetailParams): UseProductDetailReturn {
  const queryKey = PRODUCT_QUERY_KEYS.detail(id);

  const query = useQuery({
    queryKey,
    queryFn: () => getProductDetail(id),
    staleTime: 10 * 60 * 1000, // 10 minutes - less frequent changes
    enabled: enabled && !!id, // Only enable if id is truthy
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}