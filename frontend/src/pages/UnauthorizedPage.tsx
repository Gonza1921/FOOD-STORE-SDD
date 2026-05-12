import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">403</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">
          Acceso Denegado
        </h2>
        <p className="mt-2 text-gray-600">
          No tenés permisos suficientes para acceder a esta página.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
