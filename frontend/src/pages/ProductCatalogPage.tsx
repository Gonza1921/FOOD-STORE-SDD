/**
 * ProductCatalogPage — Advanced product catalog with filters, sorting, and pagination
 *
 * Phase 6: Frontend Integration — New page separate from CategoryDetailPage
 *
 * Features:
 * - Price range filtering (min/max in USD, converted to cents)
 * - Multiple sorting options (reciente, price_asc/desc, nombre_asc/desc)
 * - Pagination with "Anterior/Siguiente" controls
 * - localStorage persistence of filter state
 * - Responsive design (sidebar on desktop, accordion on mobile)
 * - Loading spinner and error handling
 * - "No hay productos" message when results empty
 */

import React from 'react';
import { useProductFilters } from '@/features/products/useProductFilters';
import { FilterContainer } from '@/features/products/FilterContainer';
import { ProductList } from '@/features/products/ProductList';
import { useProducts } from '@/shared/hooks/useProducts';

export default function ProductCatalogPage() {
  // Get filters from Zustand store
  const filters = useProductFilters();

  // Build filter params from Zustand store
  const { data: items, total, page, has_next, has_prev, isLoading, error, refetch } = useProducts({
    page: filters.page,
    limit: 20,
    price_min: filters.price_min,
    price_max: filters.price_max,
    sort_by: filters.sort_by,
    categoria_id: filters.categoria_id,
  });

  // Handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      filters.setPage(newPage);
      // Scroll to top on page change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearFilters = () => {
    filters.clearFilters();
  };

  // Don't render until store is hydrated from localStorage (wait 1 tick)
  const [isHydrated, setIsHydrated] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-on-surface-variant">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero section */}
      <div className="relative overflow-hidden border-b border-outline-variant/10 bg-gradient-to-r from-brand-500/5 to-brand-400/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: '"wght" 600' }}>
                store
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">
                Catálogo de Productos
              </h1>
              <p className="text-sm text-on-surface-variant">
                Explorá todos nuestros productos con filtros avanzados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar filters (desktop) / Accordion (mobile) */}
          <FilterContainer />

          {/* Main content: loading, error, or product list */}
          <div className="flex-1">
            {/* Loading spinner */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-600 mb-4"></div>
                <p className="text-on-surface-variant">Cargando productos...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error-container mb-4">
                  <span
                    className="material-symbols-outlined text-error"
                    style={{ fontSize: '36px', fontVariationSettings: '"wght" 500' }}
                  >
                    error
                  </span>
                </div>
                <p className="text-on-surface font-medium mb-2">Error al cargar productos</p>
                <p className="text-sm text-on-surface-variant mb-4">
                  {error.message || 'Ocurrió un error al buscar los productos. Intenta nuevamente.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
                  aria-label="Reintentar carga"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Products list (success state) */}
            {!isLoading && !error ? (
              <>
                <ProductList
                  items={items}
                  total={total}
                  page={page}
                  limit={20}
                  has_next={has_next}
                  has_prev={has_prev}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />

                {/* Clear filters button (shown when filters are active) */}
                {(filters.price_min !== undefined ||
                  filters.price_max !== undefined ||
                  filters.sort_by !== 'reciente') && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleClearFilters}
                      className="px-6 py-2 border border-brand-600 text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition-colors"
                      aria-label="Limpiar todos los filtros"
                    >
                      Limpiar todos los filtros
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
