import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../shared/api/axiosClient';
import { useAuthStore, AuthUser, AuthTokens } from '../store';

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasRole: (role: string) => boolean;
  login: (tokens: AuthTokens, user: AuthUser) => void;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const {
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    hasRole,
  } = useAuthStore();

  const isAuthenticated = accessToken !== null && user !== null;

  const login = useCallback(
    (tokens: AuthTokens, userData: AuthUser) => {
      storeLogin(tokens, userData);
    },
    [storeLogin]
  );

  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        try {
          // Attempt to revoke token on backend
          await axiosClient.post('/auth/logout', {
            refresh_token: refreshToken,
          });
        } catch (error) {
          // Ignore errors during logout HTTP request
          console.warn('Failed to revoke token on backend:', error);
        }
      }

      // Clean up local state
      storeLogout();

      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }, [refreshToken, storeLogout, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    hasRole,
    login,
    logout,
  };
}
