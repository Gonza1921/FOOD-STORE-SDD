/**
 * API endpoints for Pedidos feature
 * Follows backend router: /api/v1/pedidos
 */

import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

// ============================================================================
// Types
// ============================================================================

export interface PedidoItemCreate {
  producto_id: number;
  cantidad: number;
  ingredientes_excluidos?: number[];
}

export interface PedidoCreate {
  items: PedidoItemCreate[];
  direccion_id: number;
  forma_pago_id: number;
}

export interface PedidoItemResponse {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  nombre_snapshot: string;
}

export interface PedidoResponse {
  id: number;
  usuario_id: number;
  estado: string;
  total: string;
  costo_envio: string;
  items: PedidoItemResponse[];
  creado_en: string;
  actualizado_en: string;
  direccion_snapshot?: string | null;
}

export interface PedidoListResponse {
  items: PedidoResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface PedidoEstadoUpdate {
  estado: string;
}

export interface PedidoSummary {
  id: number;
  usuario_id: number;
  estado: string;
  total: string;
  creado_en: string;
}

// ============================================================================
// Query Keys
// ============================================================================

export const PEDIDO_QUERY_KEYS = {
  all: ['pedidos'] as const,
  lists: () => [...PEDIDO_QUERY_KEYS.all, 'list'] as const,
  list: (params: { skip?: number; limit?: number }) =>
    [...PEDIDO_QUERY_KEYS.lists(), params] as const,
  details: () => [...PEDIDO_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PEDIDO_QUERY_KEYS.details(), id] as const,
  admin: () => [...PEDIDO_QUERY_KEYS.all, 'admin'] as const,
  adminList: (params: { skip?: number; limit?: number; estado?: string }) =>
    [...PEDIDO_QUERY_KEYS.admin(), params] as const,
} as const;

// ============================================================================
// API Functions
// ============================================================================

/**
 * List current user's orders (paginated)
 */
export async function listPedidos(
  skip: number = 0,
  limit: number = 20
): Promise<PedidoListResponse> {
  const response = await axiosClient.get<PedidoListResponse>(API.ORDERS.LIST, {
    params: { skip, limit },
  });
  return response.data;
}

/**
 * Get single order detail
 */
export async function getPedidoDetail(id: number): Promise<PedidoResponse> {
  const response = await axiosClient.get<PedidoResponse>(API.ORDERS.DETAIL(String(id)));
  return response.data;
}

/**
 * Create a new order from cart items
 */
export async function createPedido(data: PedidoCreate): Promise<PedidoResponse> {
  const response = await axiosClient.post<PedidoResponse>(API.ORDERS.CREATE, data);
  return response.data;
}

/**
 * Confirm a pending order (admin) — PENDIENTE → CONFIRMADO with stock decrement
 */
export async function confirmPedido(id: number): Promise<PedidoResponse> {
  const response = await axiosClient.post<PedidoResponse>(
    API.ORDERS.CONFIRM(String(id))
  );
  return response.data;
}

/**
 * Update order estado (admin) — follows FSM transitions
 */
export async function updatePedidoEstado(
  id: number,
  estado: string
): Promise<PedidoResponse> {
  const response = await axiosClient.patch<PedidoResponse>(
    API.ORDERS.UPDATE_STATUS(String(id)),
    { estado }
  );
  return response.data;
}

/**
 * List all orders (admin) — paginated with optional estado filter
 */
export async function listAllPedidos(
  skip: number = 0,
  limit: number = 20,
  estado?: string
): Promise<PedidoListResponse> {
  const response = await axiosClient.get<PedidoListResponse>(
    API.ORDERS.ADMIN_LIST,
    {
      params: { skip, limit, ...(estado && { estado }) },
    }
  );
  return response.data;
}
