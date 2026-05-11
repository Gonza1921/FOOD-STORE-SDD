import axios from 'axios'

// Using non-null assertion to avoid TS issues with import.meta.env
const API_BASE_URL = (import.meta.env as Record<string, unknown>).VITE_API_URL || 'http://localhost:8000/api/v1'

export const axiosClient = axios.create({
  baseURL: API_BASE_URL as string,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach token (if exists)
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 (token refresh in CH-004)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token refresh logic: deferred to CH-004
      // eslint-disable-next-line no-console
      console.warn('401 Unauthorized — token refresh deferred to CH-004')
    }
    return Promise.reject(error)
  }
)

export default axiosClient
