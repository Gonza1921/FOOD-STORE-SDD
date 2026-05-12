import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../features/auth/store';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Axios instance for API requests.
 * Base URL configured from VITE_API_URL environment variable.
 */
export const axiosClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Refresh token retry queue (prevents concurrent refresh requests)
// ---------------------------------------------------------------------------

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ---------------------------------------------------------------------------
// Request interceptor: attach Bearer token
// ---------------------------------------------------------------------------

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor: handle 401 with automatic refresh
// ---------------------------------------------------------------------------

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If not a 401 or already retried, reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If currently refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Start refresh process
    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint
      const response = await axios.post(`${baseURL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      // Update auth store with new tokens
      useAuthStore.getState().updateTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      // Retry original request with new token
      originalRequest.headers!.Authorization = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken);

      return axiosClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed — logout user
      useAuthStore.getState().logout();
      processQueue(refreshError, null);

      // Redirect to login
      window.location.href = '/login';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
