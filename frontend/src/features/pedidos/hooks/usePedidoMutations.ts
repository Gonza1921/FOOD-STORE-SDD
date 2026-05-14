/**
 * usePedidoMutations - TanStack Query mutations for Pedidos
 * Create, Confirm, and Update Estado with proper cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPedido,
  confirmPedido,
  updatePedidoEstado,
  PEDIDO_QUERY_KEYS,
  PedidoCreate,
  PedidoResponse,
} from '../api/endpoints';

// ============================================================================
// useCreatePedido Mutation
// ============================================================================

export interface UseCreatePedidoParams {
  onSuccess?: (pedido: PedidoResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseCreatePedidoReturn {
  mutate: (data: PedidoCreate) => void;
  mutateAsync: (data: PedidoCreate) => Promise<PedidoResponse>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: PedidoResponse | undefined;
}

export function useCreatePedido({
  onSuccess,
  onError,
}: UseCreatePedidoParams = {}): UseCreatePedidoReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: PedidoCreate) => createPedido(data),
    onSuccess: (pedido) => {
      // Invalidate lists and admin
      queryClient.invalidateQueries({ queryKey: PEDIDO_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PEDIDO_QUERY_KEYS.admin() });
      onSuccess?.(pedido);
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
// useConfirmPedido Mutation
// ============================================================================

export interface UseConfirmPedidoParams {
  onSuccess?: (pedido: PedidoResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseConfirmPedidoReturn {
  mutate: (id: number) => void;
  mutateAsync: (id: number) => Promise<PedidoResponse>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: PedidoResponse | undefined;
}

export function useConfirmPedido({
  onSuccess,
  onError,
}: UseConfirmPedidoParams = {}): UseConfirmPedidoReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => confirmPedido(id),
    onSuccess: (pedido) => {
      // Invalidate detail, lists, and admin
      queryClient.invalidateQueries({
        queryKey: PEDIDO_QUERY_KEYS.detail(pedido.id),
      });
      queryClient.invalidateQueries({ queryKey: PEDIDO_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PEDIDO_QUERY_KEYS.admin() });
      onSuccess?.(pedido);
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
// useUpdatePedidoEstado Mutation
// ============================================================================

export interface UseUpdatePedidoEstadoParams {
  onSuccess?: (pedido: PedidoResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseUpdatePedidoEstadoReturn {
  mutate: (params: { id: number; estado: string }) => void;
  mutateAsync: (params: { id: number; estado: string }) => Promise<PedidoResponse>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: PedidoResponse | undefined;
}

export function useUpdatePedidoEstado({
  onSuccess,
  onError,
}: UseUpdatePedidoEstadoParams = {}): UseUpdatePedidoEstadoReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      updatePedidoEstado(id, estado),
    onSuccess: (pedido) => {
      // Invalidate detail, lists, and admin
      queryClient.invalidateQueries({
        queryKey: PEDIDO_QUERY_KEYS.detail(pedido.id),
      });
      queryClient.invalidateQueries({ queryKey: PEDIDO_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PEDIDO_QUERY_KEYS.admin() });
      onSuccess?.(pedido);
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
