import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthStore {
  // State
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (tokens: AuthTokens, user: AuthUser) => void;
  logout: () => void;
  updateTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors (computed via functions)
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ---- State ----
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoading: false,
      error: null,

      // ---- Actions ----

      login: (tokens: AuthTokens, user: AuthUser) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
          isLoading: false,
          error: null,
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isLoading: false,
          error: null,
        }),

      updateTokens: (tokens: AuthTokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      // ---- Selectors ----

      isAuthenticated: (): boolean => get().accessToken !== null && get().user !== null,

      hasRole: (role: string): boolean => {
        const { user } = get();
        if (!user) return false;
        return user.roles.includes(role);
      },
    }),
    {
      name: 'food-store-auth',
      // Only persist serializable auth data — exclude transient loading/error states
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
