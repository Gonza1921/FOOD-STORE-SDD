import { Routes, Route } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  UnauthorizedPage,
  DashboardPage,
} from '@/pages/index';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';

export default function Router() {
  return (
    <Routes>
      {/* ── Public routes ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/acceso-denegado" element={<UnauthorizedPage />} />

      {/* ── Protected routes ── */}
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

      {/* ── Catch-all (404) ── */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300">404</h1>
              <p className="mt-2 text-gray-600">Página no encontrada</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
