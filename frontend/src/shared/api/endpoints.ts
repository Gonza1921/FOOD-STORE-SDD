// Auth endpoints
export const AUTH_LOGIN = '/auth/login';
export const AUTH_LOGOUT = '/auth/logout';
export const AUTH_REFRESH = '/auth/refresh';

// Products endpoints
export const PRODUCTS_LIST = '/products';
export const PRODUCTS_GET = (id: string) => `/products/${id}`;
export const PRODUCTS_CREATE = '/products';
export const PRODUCTS_UPDATE = (id: string) => `/products/${id}`;
export const PRODUCTS_DELETE = (id: string) => `/products/${id}`;

// Orders endpoints
export const ORDERS_LIST = '/orders';
export const ORDERS_GET = (id: string) => `/orders/${id}`;
export const ORDERS_CREATE = '/orders';
export const ORDERS_UPDATE = (id: string) => `/orders/${id}`;

// Categorías endpoints
export const CATEGORIES_LIST = '/categories';
export const CATEGORIES_GET = (id: string) => `/categories/${id}`;
