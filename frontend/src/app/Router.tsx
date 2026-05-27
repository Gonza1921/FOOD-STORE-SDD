import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  UnauthorizedPage,
  DashboardPage,
  CategoriesAdminPage,
  IngredientsAdminPage,
  ProductsAdminPage,
  PublicCatalogPage,
  ProductoDetailPage,
  OrdersPage,
  OrderDetailPage,
  AdminOrdersPage,
  CheckoutPage,
  CartPage,
  DireccionesListPage,
  PerfilPage,
  OrderConfirmationPage,
  PaymentResultPage,
  CocinaPage,
} from '@/pages/index';
import AdminDashboardPage from '@/features/admin/pages/AdminDashboardPage';
import AdminUsuariosPage from '@/features/admin/pages/AdminUsuariosPage';
import { PaymentPage } from '@/features/payment/pages/PaymentPage';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import AppLayout from '@/widgets/Layout/AppLayout';
import HomePage from '@/pages/HomePage';

export default function Router() {
  return (
    <Routes>
      {/* ── Public routes (no layout) ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/acceso-denegado" element={<UnauthorizedPage />} />
      <Route path="/catalogo" element={<PublicCatalogPage />} />
      <Route path="/productos/:id" element={<ProductoDetailPage />} />

      {/* ── KDS Cocina (full-screen, no sidebar) ── */}
      <Route
        path="/cocina"
        element={
          <ProtectedRoute roles={['COCINA', 'PEDIDOS', 'ADMIN']}>
            <CocinaPage />
          </ProtectedRoute>
        }
      />

      {/* ── Protected routes (with AppLayout sidebar) ── */}
      <Route element={<AppLayout />}>
        {/* Root path redirects based on role */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard - for staff roles */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['ADMIN', 'STOCK', 'PEDIDOS']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Legacy /dashboard also redirects to admin */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['ADMIN', 'STOCK', 'PEDIDOS']}>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* Admin routes (ADMIN role) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminUsuariosPage />
            </ProtectedRoute>
          }
        />
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

        {/* Cart route */}
        <Route
          path="/carrito"
          element={
            <ProtectedRoute>
              <CartPage />
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

        {/* Profile route */}
        <Route
          path="/mi-perfil"
          element={
            <ProtectedRoute>
              <PerfilPage />
            </ProtectedRoute>
          }
        />

        {/* Payment route - MercadoPago checkout */}
        <Route
          path="/pagar/:pedidoId"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />

        {/* User address routes */}
        <Route
          path="/mis-direcciones"
          element={
            <ProtectedRoute>
              <DireccionesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-direcciones/nueva"
          element={
            <ProtectedRoute>
              <DireccionesListPage />
            </ProtectedRoute>
          }
        />

        {/* Order confirmation route (post-checkout) */}
        <Route
          path="/confirmacion/:pedidoId"
          element={
            <ProtectedRoute>
              <OrderConfirmationPage />
            </ProtectedRoute>
          }
        />

        {/* Payment result route (return from MercadoPago) */}
        <Route
          path="/pago/resultado/:pedidoId"
          element={
            <ProtectedRoute>
              <PaymentResultPage />
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
