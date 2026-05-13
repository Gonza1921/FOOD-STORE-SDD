/**
 * useProductMutations - TanStack Query mutations for product CRUD operations
 * Phase 6.5-6.8: Create, Update, Delete, Stock Update mutations with invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  PRODUCT_QUERY_KEYS,
  ProductoCreate,
  ProductoUpdate,
  Producto,
} from '../api/endpoints';

// ============================================================================
// useProductCreate Mutation
// ============================================================================

export interface UseProductCreateParams {
  /** Callback on successful creation */
  onSuccess?: (product: Producto) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseProductCreateReturn {
  mutate: (data: ProductoCreate) => void;
  mutateAsync: (data: ProductoCreate) => Promise<Producto>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: Producto | undefined;
}

export function useProductCreate({
  onSuccess,
  onError,
}: UseProductCreateParams = {}): UseProductCreateReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: ProductoCreate) => createProduct(data),
    onSuccess: (product) => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
      onSuccess?.(product);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}

// ============================================================================
// useProductUpdate Mutation
// ============================================================================

export interface UseProductUpdateParams {
  /** Callback on successful update */
  onSuccess?: (product: Producto) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseProductUpdateReturn {
  mutate: (params: { id: number; data: ProductoUpdate }) => void;
  mutateAsync: (params: { id: number; data: ProductoUpdate }) => Promise<Producto>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: Producto | undefined;
}

export function useProductUpdate({
  onSuccess,
  onError,
}: UseProductUpdateParams = {}): UseProductUpdateReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoUpdate }) => updateProduct(id, data),
    onSuccess: (product) => {
      // Invalidate detail and list
      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.detail(product.id),
      });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
      onSuccess?.(product);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}

// ============================================================================
// useProductDelete Mutation (Soft Delete)
// ============================================================================

export interface UseProductDeleteParams {
  /** Callback on successful deletion */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseProductDeleteReturn {
  mutate: (id: number) => void;
  mutateAsync: (id: number) => Promise<void>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

export function useProductDelete({
  onSuccess,
  onError,
}: UseProductDeleteParams = {}): UseProductDeleteReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      // Invalidate detail and list
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
  };
}

// ============================================================================
// useProductStockUpdate Mutation
// ============================================================================

export interface UseProductStockUpdateParams {
  /** Callback on successful update */
  onSuccess?: (product: Producto) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseProductStockUpdateReturn {
  mutate: (params: { id: number; nueva_cantidad: number }) => void;
  mutateAsync: (params: { id: number; nueva_cantidad: number }) => Promise<Producto>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: Producto | undefined;
}

export function useProductStockUpdate({
  onSuccess,
  onError,
}: UseProductStockUpdateParams = {}): UseProductStockUpdateReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, nueva_cantidad }: { id: number; nueva_cantidad: number }) =>
      updateProductStock(id, nueva_cantidad),
    onSuccess: (product) => {
      // Invalidate detail and list
      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.detail(product.id),
      });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
      onSuccess?.(product);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}
