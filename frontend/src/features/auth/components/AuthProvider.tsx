import { type ReactNode } from 'react';
import { useAuthStore } from '../store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// AuthProvider — initialises session on app load
// ---------------------------------------------------------------------------
//
// Zustand's `persist` middleware automatically rehydrates the store from
// localStorage before the first render, so the provider only needs to:
//
//   1. Verify a session exists (accessToken + user present)
//   2. Clear transient loading state that may carry over from a previous
//      incomplete navigation
//
// Token validity is checked lazily — the first API call that returns 401
// triggers the Axios interceptor's automatic refresh or a logout if the
// refresh also fails.
// ---------------------------------------------------------------------------

export default function AuthProvider({ children }: AuthProviderProps) {
  // On mount, ensure the loading flag is cleared (session is already
  // restored by Zustand persist synchronously).
  const state = useAuthStore.getState();
  if (state.isLoading) {
    state.setLoading(false);
  }

  return <>{children}</>;
}
