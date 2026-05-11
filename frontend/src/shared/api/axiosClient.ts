import axios, { AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Axios instance for API requests.
 * Base URL configured from VITE_API_URL environment variable.
 * Request/response interceptors are stubs (implemented in CH-004 auth guard).
 */
export const axiosClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor stub.
 * TODO CH-004: Attach JWT token from Zustand auth store.
 */
axiosClient.interceptors.request.use(
  (config) => {
    // TODO: Attach Bearer token from useAuthStore()
    // const { token } = useAuthStore.getState();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor stub.
 * TODO CH-004: Handle 401 Unauthorized, refresh token, retry request.
 */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Handle 401, attempt refresh, retry original request
    // if (error.response?.status === 401) {
    //   // Attempt token refresh
    //   // If refresh fails, redirect to login
    // }
    return Promise.reject(error);
  }
);

export default axiosClient;
