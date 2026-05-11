export interface UseAuthReturn {
  isAuthenticated: boolean;
  user: null | { id: string; name: string };
}

export function useAuth(): UseAuthReturn {
  return {
    isAuthenticated: false,
    user: null,
  };
}
