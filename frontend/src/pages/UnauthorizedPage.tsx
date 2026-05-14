import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface via-surface-container-low to-surface-container px-4">
      {/* ── Decorative blobs ── */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-error/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[25rem] w-[25rem] rounded-full bg-error/5 blur-3xl" />

      <div className="relative text-center max-w-sm animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-error-container shadow-sm">
            <span
              className="material-symbols-outlined text-error"
              style={{ fontSize: '44px', fontVariationSettings: '"wght" 600' }}
            >
              lock
            </span>
          </div>
        </div>
        <h1 className="text-6xl font-bold text-outline-variant/60">403</h1>
        <h2 className="mt-4 text-2xl font-semibold text-on-surface">
          Acceso Denegado
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
          No tenés permisos suficientes para acceder a esta página.
        </p>
        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-medium text-white hover:shadow-glow transition-all duration-250 shadow-sm active:scale-[0.98]"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', fontVariationSettings: '"wght" 500' }}
            >
              arrow_back
            </span>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
