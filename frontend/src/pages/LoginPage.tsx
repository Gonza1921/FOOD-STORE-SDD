import { Link } from 'react-router-dom';
import PublicRoute from '@/features/auth/components/PublicRoute';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <PublicRoute>
<<<<<<< HEAD
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface via-surface-container-low to-surface-container px-4 py-12">
        {/* ── Decorative background blobs ── */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-brand-400/5 blur-3xl" />

        <div className="relative w-full max-w-sm animate-fade-in-up">
          {/* ── Brand header ── */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand shadow-glow-sm mb-5 animate-float">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '30px', fontVariationSettings: '"wght" 600' }}
              >
                store
              </span>
            </div>
            <h1 className="text-[28px] leading-[36px] font-bold text-on-surface">
              Food Store
            </h1>
            <p className="mt-1.5 text-sm text-on-surface-variant">
              Iniciá sesión para acceder al panel
=======
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* ── Header ── */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Food Store</h1>
            <h2 className="mt-2 text-lg font-medium text-gray-600">Iniciar Sesión</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ingresá tus credenciales para acceder a tu cuenta
>>>>>>> origin/main
            </p>
          </div>

          {/* ── Glass form card ── */}
          <div className="glass-card p-6 sm:p-8">
            <LoginForm />
          </div>

          {/* ── Footer link ── */}
          <p className="mt-8 text-center text-sm text-on-surface-variant">
            ¿No tenés cuenta?{' '}
<<<<<<< HEAD
            <Link
              to="/registro"
              className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
=======
            <Link to="/registro" className="font-medium text-blue-600 hover:text-blue-500">
>>>>>>> origin/main
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </PublicRoute>
  );
}
