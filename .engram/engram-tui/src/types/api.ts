/**
 * API response types
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  message: string;
  timestamp: string;
}
