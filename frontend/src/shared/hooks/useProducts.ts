import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api';

/**
 * ProductFilters — Interface for filtering and sorting products
 */
export interface ProductFilters {
  categoria_id?: number;
  price_min?: number;
  price_max?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'nombre_asc' | 'nombre_desc' | 'reciente';
  page?: number;
  limit?: number;
}

/**
 * ProductoOutPublic — Response schema for public products
 */
export interface ProductoOutPublic {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  disponible: boolean;
  categorias: Array<{ id: number; nombre: string }>;
  ingredientes: Array<{ id: number; nombre: string }>;
}

/**
 * PaginatedProductList — Response from backend
 */
export interface PaginatedProductList {
  items: ProductoOutPublic[];
  total: number;
  skip: number;
  limit: number;
  page?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

/**
 * UseProductsResult — Return type for useProducts hook
 */
export interface UseProductsResult {
  data: ProductoOutPublic[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * useProducts — TanStack Query hook for fetching products with filters
 *
 * Features:
 * - Automatic refetch when filters change
 * - 5-minute cache (staleTime)
 * - Retry on failure (max 2 attempts)
 * - Proper TypeScript types
 *
 * @param filters — Product filter criteria
 * @returns UseProductsResult with loading, error, and data states
 */
export function useProducts(filters: ProductFilters): UseProductsResult {
  const {
    data,
    isLoading,
    error,
    refetch: tanstackRefetch,
  } = useQuery({
    queryKey: ['productos', filters],
    queryFn: async () => {
      // Convert page (1-indexed) to skip (0-indexed)
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Build query params
      const params = new URLSearchParams();
      params.append('skip', String(skip));
      params.append('limit', String(limit));

      if (filters.categoria_id) {
        params.append('categoria_id', String(filters.categoria_id));
      }
      if (filters.price_min !== undefined) {
        params.append('price_min', String(filters.price_min));
      }
      if (filters.price_max !== undefined) {
        params.append('price_max', String(filters.price_max));
      }
      if (filters.sort_by) {
        params.append('sort_by', filters.sort_by);
      }

      const response = await api.get<PaginatedProductList>(
        `/api/v1/productos/publico/catalogo?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: true,
  });

  // Calculate pagination info
  const page = (data?.skip ?? 0) / (data?.limit ?? 20) + 1;
  const has_next = data?.has_next ?? false;
  const has_prev = data?.has_prev ?? false;

  const refetch = async () => {
    await tanstackRefetch();
  };

  return {
    data: data?.items || [],
    total: data?.total || 0,
    page: Math.max(1, page),
    limit: data?.limit || 20,
    has_next,
    has_prev,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
