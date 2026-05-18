/**
 * API endpoints for Products feature
 * Follows backend router: /api/v1/productos
 */

import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

// ============================================================================
// Types
// ============================================================================

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  precio_base: string; // Decimal as string "19.99"
  stock_cantidad: number;
  disponible: boolean;
  categoria_id: number;
  categorias?: number[];
  ingredientes?: number[];
}

export interface ProductoUpdate {
  nombre?: string;
  descripcion?: string;
  precio_base?: string;
  disponible?: boolean;
  categorias?: number[];
  ingredientes?: number[];
}

export interface StockUpdateRequest {
  nueva_cantidad: number;
}

export interface CategoriaRef {
  id: number;
  nombre: string;
}

export interface IngredienteRef {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_base: string;
  stock_cantidad: number;
  disponible: boolean;
  categorias: CategoriaRef[];
  ingredientes: IngredienteRef[];
  creado_en: string;
  actualizado_en: string;
}

export interface IngredientePublicRef {
  id: number;
  nombre: string;
  es_alergeno: boolean;
}

export interface ProductoPublic {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_base: string;
  disponible: boolean;
  categorias: CategoriaRef[];
  ingredientes: IngredienteRef[];
}

export interface ProductoPublicDetail {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  disponible: boolean;
  categorias: CategoriaRef[];
  ingredientes: IngredientePublicRef[];
}

export interface ProductoListResponse {
  items: Producto[];
  total: number;
  skip: number;
  limit: number;
  page: number;
  total_pages: number;
}

export interface ProductoPublicListResponse {
  items: ProductoPublic[];
  total: number;
  skip: number;
  limit: number;
  page: number;
  total_pages: number;
}

// ============================================================================
// Query Options (for TanStack Query)
// ============================================================================

export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, 'list'] as const,
  list: (params: { skip?: number; limit?: number; include_deleted?: boolean }) =>
    [...PRODUCT_QUERY_KEYS.lists(), params] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
  public: () => [...PRODUCT_QUERY_KEYS.all, 'public'] as const,
  publicCatalog: (params: {
    skip?: number;
    limit?: number;
    search?: string;
    categoria_id?: number;
    excluirAlergenos?: number[];
  }) => [...PRODUCT_QUERY_KEYS.public(), 'catalog', params] as const,
} as const;

// ============================================================================
// API Functions
// ============================================================================

/**
 * List products (admin) - paginated with optional soft deleted filter
 */
export async function listProducts(
  skip: number = 0,
  limit: number = 20,
  include_deleted: boolean = false
): Promise<ProductoListResponse> {
  const response = await axiosClient.get<ProductoListResponse>(API.PRODUCTS.LIST, {
    params: { skip, limit, include_deleted },
  });
  return response.data;
}

/**
 * Get product detail by ID (admin)
 */
export async function getProductDetail(id: number): Promise<Producto> {
  const response = await axiosClient.get<Producto>(API.PRODUCTS.DETAIL(id));
  return response.data;
}

/**
 * Create new product (requires STOCK or ADMIN role)
 */
export async function createProduct(data: ProductoCreate): Promise<Producto> {
  const response = await axiosClient.post<Producto>(API.PRODUCTS.CREATE, data);
  return response.data;
}

/**
 * Update product (requires STOCK or ADMIN role)
 */
export async function updateProduct(id: number, data: ProductoUpdate): Promise<Producto> {
  const response = await axiosClient.put<Producto>(API.PRODUCTS.UPDATE(id), data);
  return response.data;
}

/**
 * Delete (soft delete) product (requires ADMIN role)
 */
export async function deleteProduct(id: number): Promise<void> {
  await axiosClient.delete(API.PRODUCTS.DELETE(id));
}

/**
 * Update product stock (requires STOCK or ADMIN role)
 */
export async function updateProductStock(id: number, nueva_cantidad: number): Promise<Producto> {
  const response = await axiosClient.patch<Producto>(API.PRODUCTS.UPDATE_STOCK(id), {
    nueva_cantidad,
  });
  return response.data;
}

/**
 * Get public catalog (no auth required)
 * Filters: disponible=true, deleted_at IS NULL
 */
export async function getPublicCatalog(
  skip: number = 0,
  limit: number = 20,
  search?: string,
  categoria_id?: number,
  excluirAlergenos?: number[]
): Promise<ProductoPublicListResponse> {
  const params: Record<string, unknown> = { skip, limit, search, categoria_id };
  if (excluirAlergenos && excluirAlergenos.length > 0) {
    params.excluir_alergenos = excluirAlergenos.join(',');
  }
  const response = await axiosClient.get<ProductoPublicListResponse>(API.PRODUCTS.PUBLIC_CATALOG, { params });
  return response.data;
}

/**
 * Get public product detail (no auth required)
 */
export async function getPublicProductoDetail(productoId: number): Promise<ProductoPublicDetail> {
  const response = await axiosClient.get<ProductoPublicDetail>(
    `/productos/${productoId}/publico`
  );
  return response.data;
}
