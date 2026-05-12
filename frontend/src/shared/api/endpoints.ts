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
    DETAIL: (id: string): string => `/productos/${id}`,
    SEARCH: '/productos/search',
    BY_CATEGORY: (categoryId: string): string => `/productos/category/${categoryId}`,
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
    DETAIL: (id: string): string => `/categorias/${id}`,
  },
} as const;
