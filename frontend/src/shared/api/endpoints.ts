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
    CONFIRM: (id: string): string => `/pedidos/${id}/confirmar`,
    ADMIN_LIST: '/pedidos/admin/todos',
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
  DIRECCIONES: {
    LIST: '/direcciones',
    DETAIL: (id: number): string => `/direcciones/${id}`,
    CREATE: '/direcciones',
    UPDATE: (id: number): string => `/direcciones/${id}`,
    DELETE: (id: number): string => `/direcciones/${id}`,
    SET_PRINCIPAL: (id: number): string => `/direcciones/${id}/principal`,
  },
  USUARIOS: {
    PERFIL: '/usuarios/perfil',
    CAMBIAR_CONTRASENA: '/usuarios/perfil/cambiar-contrasena',
  },
  ADMIN: {
    CONFIGURACION: '/admin/configuracion',
  },
  PAGOS: {
    CREAR_PREFERENCIA: '/pagos/crear-preferencia',
    DETALLE: (pedidoId: number): string => `/pagos/${pedidoId}`,
    WEBHOOK: '/pagos/webhook',
  },
  COCINA: {
    PEDIDOS_LIST: '/cocina/pedidos',
  },
} as const;
