/**
 * HomePage — Role-based home redirect
 * 
 * - ADMIN/STOCK/PEDIDOS → Admin Dashboard
 * - CLIENT only → Public Catalog
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';

export default function HomePage() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];

  // If user has any admin role, show admin dashboard
  if (roles.some((r) => ['ADMIN', 'STOCK', 'PEDIDOS'].includes(r))) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Otherwise (CLIENT only), show public catalog
  return <Navigate to="/catalogo" replace />;
}