import { Routes, Route } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  UnauthorizedPage,
  DashboardPage,
  CategoriesAdminPage,
  IngredientsAdminPage,
  ProductsAdminPage,
  PublicCatalogPage,
  OrdersPage,
  OrderDetailPage,
  AdminOrdersPage,
  CheckoutPage,
} from '@/pages/index';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import AppLayout from '@/widgets/Layout/AppLayout';

export default function Router() {
  return (
    <Routes>
      {/* ── Public routes (no layout) ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/acceso-denegado" element={<UnauthorizedPage />} />
      <Route path="/catalogo" element={<PublicCatalogPage />} />

      {/* ── Protected routes (with AppLayout sidebar) ── */}
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes (ADMIN or STOCK roles) */}
        <Route
          path="/admin/productos"
          element={
            <ProtectedRoute roles={['ADMIN', 'STOCK']}>
              <ProductsAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <CategoriesAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ingredientes"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <IngredientsAdminPage />
            </ProtectedRoute>
          }
        />

        {/* Checkout route */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        {/* User order routes */}
        <Route
          path="/mis-pedidos"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-pedidos/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Admin order routes */}
        <Route
          path="/admin/pedidos"
          element={
            <ProtectedRoute roles={['ADMIN', 'PEDIDOS']}>
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ── 404 catch-all ── */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-surface px-4">
            <div className="text-center">
              <h1 className="text-7xl font-bold text-outline-variant">404</h1>
              <p className="mt-3 text-on-surface-variant">
                Página no encontrada
              </p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
