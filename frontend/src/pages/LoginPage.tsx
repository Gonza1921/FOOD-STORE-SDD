import { Link } from 'react-router-dom';
import PublicRoute from '@/features/auth/components/PublicRoute';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* ── Header ── */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Food Store</h1>
            <h2 className="mt-2 text-lg font-medium text-gray-600">Iniciar Sesión</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ingresá tus credenciales para acceder a tu cuenta
            </p>
          </div>

          {/* ── Form ── */}
          <div className="rounded-lg bg-white px-6 py-8 shadow-md">
            <LoginForm />
          </div>

          {/* ── Footer link ── */}
          <p className="text-center text-sm text-gray-500">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="font-medium text-blue-600 hover:text-blue-500">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </PublicRoute>
  );
}
