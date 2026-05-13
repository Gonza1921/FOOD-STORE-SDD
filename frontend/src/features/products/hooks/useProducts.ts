/**
 * useProducts - TanStack Query hook for products list (admin)
 * Phase 6.2: TanStack Query integration with pagination
 */

import { useQuery } from '@tanstack/react-query';
import {
  listProducts,
  PRODUCT_QUERY_KEYS,
  ProductoListResponse,
} from '../api/endpoints';

export interface UseProductsParams {
  skip?: number;
  limit?: number;
  include_deleted?: boolean;
  /** Enable the query */
  enabled?: boolean;
}

export interface UseProductsReturn {
  data: ProductoListResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<import('@tanstack/react-query').QueryObserverResult<ProductoListResponse, Error>>;
  /** Total count of all products (without pagination) */
  total: number | undefined;
  /** Current page number (1-indexed) */
  page: number | undefined;
  /** Total pages available */
  totalPages: number | undefined;
}

export function useProducts({
  skip = 0,
  limit = 20,
  include_deleted = false,
  enabled = true,
}: UseProductsParams = {}): UseProductsReturn {
  const queryKey = PRODUCT_QUERY_KEYS.list({ skip, limit, include_deleted });

  const query = useQuery({
    queryKey,
    queryFn: () => listProducts(skip, limit, include_deleted),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    total: query.data?.total,
    page: query.data?.page,
    totalPages: query.data?.total_pages,
  };
}