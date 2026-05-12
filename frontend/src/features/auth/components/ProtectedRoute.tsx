import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  roles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Authenticated but no specific role requirement — allow access
  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role(s)
  const hasRequiredRole = roles.some((role) => hasRole(role));

  if (!hasRequiredRole) {
    // Show 403 Unauthorized page
    return <Navigate to="/acceso-denegado" replace />;
  }

  // All checks passed — render children
  return <>{children}</>;
}
