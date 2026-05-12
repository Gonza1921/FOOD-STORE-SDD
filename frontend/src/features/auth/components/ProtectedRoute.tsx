import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional — if specified, the user must have at least one of these roles */
  roles?: string[];
  /** Path to redirect unauthenticated users (default: /login) */
  redirectTo?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProtectedRoute({
  children,
  roles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { accessToken, user, hasRole } = useAuthStore();
  const location = useLocation();

  // Not authenticated → redirect to login, preserving return URL
  if (!accessToken || !user) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Authenticated but wrong role → 403
  if (roles && roles.length > 0) {
    const authorized = roles.some((role) => hasRole(role));
    if (!authorized) {
      return <Navigate to="/acceso-denegado" replace />;
    }
  }

  return <>{children}</>;
}
