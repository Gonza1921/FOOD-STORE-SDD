/**
 * useDireccionMutations - TanStack Query mutations for Direcciones
 * Create, Update, SetPrincipal, and Delete with proper cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDireccion,
  updateDireccion,
  setDireccionPrincipal,
  deleteDireccion,
  DIRECCION_QUERY_KEYS,
  DireccionCreatePayload,
  DireccionUpdatePayload,
  DireccionSetPrincipalPayload,
  DireccionResponse,
} from '../api/endpoints';

// ============================================================================
// useCreateDireccion Mutation
// ============================================================================

export interface UseCreateDireccionParams {
  onSuccess?: (direccion: DireccionResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseCreateDireccionReturn {
  mutate: (data: DireccionCreatePayload) => void;
  mutateAsync: (data: DireccionCreatePayload) => Promise<DireccionResponse>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: DireccionResponse | undefined;
}

export function useCreateDireccion({
  onSuccess,
  onError,
}: UseCreateDireccionParams = {}): UseCreateDireccionReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: DireccionCreatePayload) => createDireccion(data),
    onSuccess: (direccion) => {
      queryClient.invalidateQueries({ queryKey: DIRECCION_QUERY_KEYS.lists() });
      onSuccess?.(direccion);
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
// useUpdateDireccion Mutation
// ============================================================================

export interface UseUpdateDireccionParams {
  onSuccess?: (direccion: DireccionResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseUpdateDireccionReturn {
  mutate: (params: { id: number; data: DireccionUpdatePayload }) => void;
  mutateAsync: (
    params: { id: number; data: DireccionUpdatePayload }
  ) => Promise<DireccionResponse>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: DireccionResponse | undefined;
}

export function useUpdateDireccion({
  onSuccess,
  onError,
}: UseUpdateDireccionParams = {}): UseUpdateDireccionReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DireccionUpdatePayload }) =>
      updateDireccion(id, data),
    onSuccess: (direccion) => {
      queryClient.invalidateQueries({
        queryKey: DIRECCION_QUERY_KEYS.detail(direccion.id),
      });
      queryClient.invalidateQueries({ queryKey: DIRECCION_QUERY_KEYS.lists() });
      onSuccess?.(direccion);
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
// useSetDireccionPrincipal Mutation
// ============================================================================

export interface UseSetDireccionPrincipalParams {
  onSuccess?: (direccion: DireccionResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseSetDireccionPrincipalReturn {
  mutate: (params: { id: number; data: DireccionSetPrincipalPayload }) => void;
  mutateAsync: (
    params: { id: number; data: DireccionSetPrincipalPayload }
  ) => Promise<DireccionResponse>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: DireccionResponse | undefined;
}

export function useSetDireccionPrincipal({
  onSuccess,
  onError,
}: UseSetDireccionPrincipalParams = {}): UseSetDireccionPrincipalReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: DireccionSetPrincipalPayload;
    }) => setDireccionPrincipal(id, data),
    onSuccess: (direccion) => {
      // Invalidate list (to reflect primary order change) and detail
      queryClient.invalidateQueries({ queryKey: DIRECCION_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: DIRECCION_QUERY_KEYS.detail(direccion.id),
      });
      onSuccess?.(direccion);
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
// useDeleteDireccion Mutation
// ============================================================================

export interface UseDeleteDireccionParams {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseDeleteDireccionReturn {
  mutate: (id: number) => void;
  mutateAsync: (id: number) => Promise<void>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

export function useDeleteDireccion({
  onSuccess,
  onError,
}: UseDeleteDireccionParams = {}): UseDeleteDireccionReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteDireccion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIRECCION_QUERY_KEYS.lists() });
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
