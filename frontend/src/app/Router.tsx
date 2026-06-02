import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  UnauthorizedPage,
  CategoriesPage,
  CategoryDetailPage,
  CategoriesAdminPage,
  IngredientsAdminPage,
  ProductsAdminPage,
  PublicCatalogPage,
  ProductCatalogPage,
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
import AdminLayout from '@/widgets/Layout/AdminLayout';
import CustomerLayout from '@/widgets/Layout/CustomerLayout';
import PublicLayout from '@/widgets/Layout/PublicLayout';
import HomePage from '@/pages/HomePage';

export default function Router() {
  return (
    <Routes>
      {/* ── Auth pages (no layout) ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/acceso-denegado" element={<UnauthorizedPage />} />

      {/* ── Public routes (PublicLayout, no auth required) ── */}
      <Route element={<PublicLayout />}>
        <Route path="/catalogo" element={<PublicCatalogPage />} />
        <Route path="/productos" element={<ProductCatalogPage />} />
        <Route path="/productos/:id" element={<ProductoDetailPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/categorias/:slug" element={<CategoryDetailPage />} />
      </Route>

      {/* ── KDS Cocina (full-screen, no sidebar, no layout) ── */}
      <Route
        path="/cocina"
        element={
          <ProtectedRoute roles={['COCINA', 'PEDIDOS', 'ADMIN']}>
            <CocinaPage />
          </ProtectedRoute>
        }
      />

      {/* ── Customer routes (CustomerLayout, CLIENT role or any authenticated) ── */}
      <Route element={<ProtectedRoute><CustomerLayout /></ProtectedRoute>}>
        {/* Root path — role-based redirect handled by HomePage */}
        <Route path="/" element={<HomePage />} />

        {/* Cart & checkout */}
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Profile */}
        <Route path="/mi-perfil" element={<PerfilPage />} />

        {/* Payment routes */}
        <Route path="/pagar/:pedidoId" element={<PaymentPage />} />
        <Route path="/confirmacion/:pedidoId" element={<OrderConfirmationPage />} />
        <Route path="/pago/resultado/:pedidoId" element={<PaymentResultPage />} />

        {/* User address routes */}
        <Route path="/mis-direcciones" element={<DireccionesListPage />} />
        <Route path="/mis-direcciones/nueva" element={<DireccionesListPage />} />

        {/* User order routes */}
        <Route path="/mis-pedidos" element={<OrdersPage />} />
        <Route path="/mis-pedidos/:id" element={<OrderDetailPage />} />
      </Route>

      {/* ── Admin routes (AdminLayout, staff roles only) ── */}
      <Route element={<ProtectedRoute roles={['ADMIN', 'STOCK', 'PEDIDOS']}><AdminLayout /></ProtectedRoute>}>
        {/* Legacy /dashboard redirect */}
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />

        {/* Legacy /admin/dashboard redirect */}
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

        {/* Admin root */}
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
        <Route path="/admin/productos" element={<ProductsAdminPage />} />
        <Route path="/admin/categorias" element={<CategoriesAdminPage />} />
        <Route path="/admin/ingredientes" element={<IngredientsAdminPage />} />
        <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
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
