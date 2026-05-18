import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../store';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a JWT token looks structurally valid (three base64 segments).
 * Does NOT verify the signature — that's the backend's job.
 */
function isWellFormedJwt(token: string | null): boolean {
  if (!token) return false;
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

/** Decode the payload of a JWT without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is expired (or has no exp claim).
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

// ---------------------------------------------------------------------------
// AuthProvider — initialises session on app load
// ---------------------------------------------------------------------------

export default function AuthProvider({ children }: AuthProviderProps) {
  const { accessToken, user, logout, isLoading, setLoading } =
    useAuthStore();

  // ── Token validation on mount ──
  useEffect(() => {
    const validateToken = async () => {
      // No token → nothing to validate
      if (!accessToken || !user) {
        if (isLoading) setLoading(false);
        return;
      }

      // Structural check first (fast, no network)
      if (!isWellFormedJwt(accessToken)) {
        logout();
        localStorage.removeItem('food-store-auth');
        setLoading(false);
        return;
      }

      // Expiration check (fast, no network)
      if (isTokenExpired(accessToken)) {
        // If we have a refresh token, the Axios interceptor will handle it
        // during the first API call. For now, just clear the loading state.
        setLoading(false);
        return;
      }

      // Signature check via /auth/me (network call)
      try {
        setLoading(true);
        await axiosClient.get(API.AUTH.ME);
      } catch {
        // /auth/me failed — token is invalid or expired beyond local check
        logout();
        localStorage.removeItem('food-store-auth');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

// Re-export helpers for use elsewhere
export { isWellFormedJwt, isTokenExpired };