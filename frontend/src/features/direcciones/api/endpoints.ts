/**
 * API endpoints for Direcciones feature
 * Follows backend router: /api/v1/direcciones
 */

import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

// ============================================================================
// Types — mirrors backend DireccionOut schema
// ============================================================================

export interface DireccionResponse {
  id: number;
  usuario_id: number;
  alias: string | null;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  referencia: string | null;
  es_principal: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface DireccionCreatePayload {
  alias?: string | null;
  linea1: string;
  linea2?: string | null;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  referencia?: string | null;
  es_principal?: boolean;
}

export interface DireccionUpdatePayload {
  alias?: string | null;
  linea1?: string;
  linea2?: string | null;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  referencia?: string | null;
  es_principal?: boolean;
}

export interface DireccionSetPrincipalPayload {
  es_principal: boolean;
}

// ============================================================================
// Query Keys
// ============================================================================

export const DIRECCION_QUERY_KEYS = {
  all: ['direcciones'] as const,
  lists: () => [...DIRECCION_QUERY_KEYS.all, 'list'] as const,
  list: (params?: { skip?: number; limit?: number }) =>
    [...DIRECCION_QUERY_KEYS.lists(), params] as const,
  details: () => [...DIRECCION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...DIRECCION_QUERY_KEYS.details(), id] as const,
} as const;

// ============================================================================
// API Functions
// ============================================================================

/**
 * List current user's delivery addresses
 */
export async function listDirecciones(): Promise<DireccionResponse[]> {
  const response = await axiosClient.get<DireccionResponse[]>(API.DIRECCIONES.LIST);
  return response.data;
}

/**
 * Get a single delivery address by ID
 */
export async function getDireccionDetail(id: number): Promise<DireccionResponse> {
  const response = await axiosClient.get<DireccionResponse>(API.DIRECCIONES.DETAIL(id));
  return response.data;
}

/**
 * Create a new delivery address
 */
export async function createDireccion(
  data: DireccionCreatePayload
): Promise<DireccionResponse> {
  const response = await axiosClient.post<DireccionResponse>(
    API.DIRECCIONES.CREATE,
    data
  );
  return response.data;
}

/**
 * Update an existing delivery address
 */
export async function updateDireccion(
  id: number,
  data: DireccionUpdatePayload
): Promise<DireccionResponse> {
  const response = await axiosClient.put<DireccionResponse>(
    API.DIRECCIONES.UPDATE(id),
    data
  );
  return response.data;
}

/**
 * Set or unset an address as primary
 */
export async function setDireccionPrincipal(
  id: number,
  data: DireccionSetPrincipalPayload
): Promise<DireccionResponse> {
  const response = await axiosClient.patch<DireccionResponse>(
    API.DIRECCIONES.SET_PRINCIPAL(id),
    data
  );
  return response.data;
}

/**
 * Soft delete a delivery address
 */
export async function deleteDireccion(id: number): Promise<void> {
  await axiosClient.delete(API.DIRECCIONES.DELETE(id));
}
