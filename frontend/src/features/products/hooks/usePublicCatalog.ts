/**
 * usePublicCatalog - TanStack Query hook for public product catalog (no auth)
 * Phase 6.4: Public catalog with filters
 */

import { useQuery } from '@tanstack/react-query';
import { getPublicCatalog, PRODUCT_QUERY_KEYS, ProductoPublicListResponse } from '../api/endpoints';

export interface UsePublicCatalogParams {
  skip?: number;
  limit?: number;
  /** Search term - filters by nombre or descripcion */
  search?: string;
  /** Filter by category ID */
  categoria_id?: number;
  /** Exclude products containing these ingredient IDs (allergens) */
  excluirAlergenos?: number[];
  /** Enable the query */
  enabled?: boolean;
}

export interface UsePublicCatalogReturn {
  data: ProductoPublicListResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<
    import('@tanstack/react-query').QueryObserverResult<ProductoPublicListResponse, Error>
  >;
  /** Total count of all matching products */
  total: number | undefined;
  /** Current page number (1-indexed) */
  page: number | undefined;
  /** Total pages available */
  totalPages: number | undefined;
}

export function usePublicCatalog({
  skip = 0,
  limit = 20,
  search,
  categoria_id,
  excluirAlergenos,
  enabled = true,
}: UsePublicCatalogParams = {}): UsePublicCatalogReturn {
  const queryKey = PRODUCT_QUERY_KEYS.publicCatalog({ skip, limit, search, categoria_id, excluirAlergenos });

  const query = useQuery({
    queryKey,
    queryFn: () => getPublicCatalog(skip, limit, search, categoria_id, excluirAlergenos),
    staleTime: 30 * 60 * 1000, // 30 minutes - public catalog changes infrequently
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
