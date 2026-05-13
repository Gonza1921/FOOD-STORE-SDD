/**
 * API route constants - single source of truth for endpoint paths.
 * Prevents typos and enables easy refactoring.
 */
export const API = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  PRODUCTS: {
    LIST: '/productos',
    DETAIL: (id: number): string => `/productos/${id}`,
    CREATE: '/productos',
    UPDATE: (id: number): string => `/productos/${id}`,
    DELETE: (id: number): string => `/productos/${id}`,
    UPDATE_STOCK: (id: number): string => `/productos/${id}/stock`,
    SEARCH: '/productos/search',
    BY_CATEGORY: (categoryId: string): string => `/productos/category/${categoryId}`,
    PUBLIC_CATALOG: '/productos/publico/catalogo',
  },
  ORDERS: {
    LIST: '/pedidos',
    DETAIL: (id: string): string => `/pedidos/${id}`,
    CREATE: '/pedidos',
    UPDATE_STATUS: (id: string): string => `/pedidos/${id}/estado`,
  },
  USERS: {
    ME: '/usuarios/me',
    PROFILE: (id: string): string => `/usuarios/${id}`,
    UPDATE_PROFILE: '/usuarios/me',
  },
  CATEGORIES: {
    LIST: '/categorias',
    DETAIL: (id: number): string => `/categorias/${id}`,
    CREATE: '/categorias',
    UPDATE: (id: number): string => `/categorias/${id}`,
    DELETE: (id: number): string => `/categorias/${id}`,
  },
  INGREDIENTS: {
    LIST: '/ingredientes',
    DETAIL: (id: number): string => `/ingredientes/${id}`,
    CREATE: '/ingredientes',
    UPDATE: (id: number): string => `/ingredientes/${id}`,
    DELETE: (id: number): string => `/ingredientes/${id}`,
  },
} as const;
