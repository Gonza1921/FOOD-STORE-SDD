import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/store';
import { useUiStore } from '@/features/ui/store';
import { API } from './endpoints';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ---------------------------------------------------------------------------
// Refresh queue — prevents concurrent refresh requests
// ---------------------------------------------------------------------------

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

export const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer access token
// ---------------------------------------------------------------------------

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — auto-refresh on 401 + user-friendly error toasts
// ---------------------------------------------------------------------------

// HTTP status → user-friendly message mapping
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Error de validación. Revisá los datos ingresados.',
  403: 'No tenés permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  429: 'Demasiadas solicitudes. Esperá un momento e intentá de nuevo.',
  500: 'Error interno del servidor. Intentá de nuevo más tarde.',
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't intercept auth endpoints (login, register, refresh — they must reach the server)
    const isAuthEndpoint = originalRequest.url?.startsWith('/auth/') ?? false;

    // ── Show user-friendly toasts for non-401 errors ──
    if (error.response?.status !== 401 && !isAuthEndpoint) {
      const status = error.response?.status;
      if (status && ERROR_MESSAGES[status]) {
        useUiStore.getState().addToast({
          type: 'error',
          message: ERROR_MESSAGES[status],
          duration: 5000,
        });
      } else if (!error.response) {
        // Network error (no response received)
        useUiStore.getState().addToast({
          type: 'warning',
          message: 'Error de conexión. Verificá tu internet e intentá de nuevo.',
          duration: 5000,
        });
      }
      return Promise.reject(error);
    }

    // ── 401 handling: skip auth endpoints and retried requests ──
    if (originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return axiosClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken } = useAuthStore.getState();

    if (!refreshToken) {
      useAuthStore.getState().logout();
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(`${baseURL}${API.AUTH.REFRESH}`, {
        refresh_token: refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      useAuthStore.getState().updateTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
