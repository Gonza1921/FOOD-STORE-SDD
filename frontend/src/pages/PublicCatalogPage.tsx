/**
 * PublicCatalogPage - Public product catalog (no auth required)
 * Phase 8.6: Validar catálogo público
 * Uses usePublicCatalog hook with filters: search, categoria_id, pagination
 */

import { useState } from 'react';
import { usePublicCatalog } from '@/features/products';

export default function PublicCatalogPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const limit = 12;

  // Fetch data
  const { data, isLoading, isError, refetch, total } = usePublicCatalog({
    skip,
    limit,
    search: search || undefined,
  });

  // Calculate pagination
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = total ? Math.ceil(total / limit) : 0;
  const hasNext = skip + limit < (total || 0);
  const hasPrev = skip > 0;

  const handlePrevPage = () => {
    if (hasPrev) setSkip((prev) => Math.max(0, prev - limit));
  };

  const handleNextPage = () => {
    if (hasNext) setSkip((prev) => prev + limit);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSkip(0);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <p className="text-red-600">Error al cargar productos</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-blue-600 underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !isError && (
          <>
            {data?.items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No se encontraron productos</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data?.items.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {product.nombre}
                      </h3>
                      {product.descripcion && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {product.descripcion}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-bold text-green-600">
                          ${product.precio_base}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.disponible
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                      {product.categorias.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {product.categorias.map((cat) => (
                            <span
                              key={cat.id}
                              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                            >
                              {cat.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {total !== undefined && total > 0 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {skip + 1} - {Math.min(skip + limit, total)} de {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={!hasPrev}
                    className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={!hasNext}
                    className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
