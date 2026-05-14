import { useCallback } from 'react';
import { useAuthStore, type AuthTokens, type AuthUser } from '../store';
import axiosClient from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const {
    user,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    setLoading,
    setError,
    isAuthenticated: checkAuth,
    hasRole: checkRole,
  } = useAuthStore();

  const isAuthenticated = checkAuth();
  const hasRole = (role: string): boolean => checkRole(role);

  // ---- Login ----

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.post(API.AUTH.LOGIN, {
          email,
          password,
        });
        const {
          accessToken,
          refreshToken,
          user: userData,
        }: {
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        } = response.data;
        const tokens: AuthTokens = { accessToken, refreshToken };
        storeLogin(tokens, userData);
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: { detail?: string } } };
        const message = apiError.response?.data?.detail || 'Error al iniciar sesión';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [storeLogin, setLoading, setError]
  );

  // ---- Register ----

  const register = useCallback(
    async (data: {
      nombre: string;
      apellido: string;
      email: string;
      password: string;
    }): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.post(API.AUTH.REGISTER, data);
        const {
          accessToken,
          refreshToken,
          user: userData,
        }: {
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        } = response.data;
        const tokens: AuthTokens = { accessToken, refreshToken };
        storeLogin(tokens, userData);
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: { detail?: string } } };
        const message = apiError.response?.data?.detail || 'Error al registrarse';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [storeLogin, setLoading, setError]
  );

  // ---- Logout ----

  const logout = useCallback(async (): Promise<void> => {
    const state = useAuthStore.getState();
    const currentRefreshToken = state.refreshToken;
    setLoading(true);
    try {
      if (currentRefreshToken) {
        await axiosClient.post(API.AUTH.LOGOUT, {
          refresh_token: currentRefreshToken,
        });
      }
    } catch {
      // Best-effort: clear local session regardless of API response
    } finally {
      storeLogout();
      setLoading(false);
    }
  }, [storeLogout, setLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    hasRole,
  };
}
