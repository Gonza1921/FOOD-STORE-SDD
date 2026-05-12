import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '../../features/auth/store';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    // On mount, check if we have a persisted session from localStorage
    // Zustand persist middleware handles this automatically, so this is mostly
    // for logging/debugging. In a real app, you might want to validate the
    // token with the backend or refresh if it's close to expiration.
    if (accessToken && user) {
      console.debug('Auth session restored from localStorage');
    }
  }, [accessToken, user]);

  return <>{children}</>;
}
