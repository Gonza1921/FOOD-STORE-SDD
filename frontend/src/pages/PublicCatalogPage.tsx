/**
 * PublicCatalogPage — Public product catalog (no auth required).
 * Premium SaaS styling with gradient hero, glass cards, and staggered animations.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicCatalog } from '@/features/products';
import { useCartStore } from '@/features/cart/store';
import { Button, Badge, Skeleton } from '@/shared/ui';

export default function PublicCatalogPage() {
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const limit = 12;

  const { data, isLoading, isError, refetch, total } = usePublicCatalog({
    skip,
    limit,
    search: search || undefined,
  });

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

  // ── Loading skeleton grid ──
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-premium overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
          <Skeleton variant="rectangular" height="h-40" rounded="rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton variant="text" width="w-3/4" />
            <Skeleton variant="text" width="w-full" height="h-3" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton variant="text" width="w-16" height="h-5" />
              <Skeleton variant="text" width="w-20" height="h-5" rounded="rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Hero section ── */}
      <div className="relative overflow-hidden gradient-hero border-b border-outline-variant/10">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[25rem] w-[25rem] rounded-full bg-brand-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 -bottom-20 h-[20rem] w-[20rem] rounded-full bg-brand-400/5 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-1 animate-fade-in-up">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-brand text-white shadow-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: '"wght" 600' }}>
                store
              </span>
            </div>
            <div>
              <h1 className="text-[24px] sm:text-[28px] font-bold text-on-surface leading-tight">
                Catálogo de Productos
              </h1>
              <p className="text-sm text-on-surface-variant">Explorá nuestros productos disponibles</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Search ── */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <span
                className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none"
                style={{ fontSize: '20px', fontVariationSettings: '"wght" 400' }}
              >
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 pl-10 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:border-brand-600 focus:ring-brand-600/20 transition-all shadow-sm"
              />
            </div>
            <Button type="submit" variant="premium" icon="search">
              Buscar
            </Button>
          </form>
        </div>

        {/* ── Loading ── */}
        {isLoading && renderSkeletons()}

        {/* ── Error ── */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error-container mb-5">
              <span className="material-symbols-outlined text-error" style={{ fontSize: '36px', fontVariationSettings: '"wght" 500' }}>
                error
              </span>
            </div>
            <p className="text-sm text-on-surface-variant">Error al cargar productos</p>
            <Button variant="outline" size="sm" className="mt-5" onClick={() => refetch()} icon="refresh">
              Reintentar
            </Button>
          </div>
        )}

        {/* ── Content ── */}
        {!isLoading && !isError && (
          <>
              {data?.items.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-container mb-5">
                  <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: '48px', fontVariationSettings: '"wght" 300' }}>
                    search_off
                  </span>
                </div>
                <p className="text-base font-medium text-on-surface mb-1">Sin resultados</p>
                <p className="text-sm text-on-surface-variant">
                  No se encontraron productos para tu búsqueda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {data?.items.map((product, i) => (
                  <div
                    key={product.id}
                    className="group rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-premium overflow-hidden 
                               transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-1 active:scale-[0.99] animate-fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Image area */}
                    <div className="h-40 bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="material-symbols-outlined text-outline-variant/50" style={{ fontSize: '48px', fontVariationSettings: '"wght" 300' }}>
                        image
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-on-surface truncate group-hover:text-brand-600 transition-colors">
                        {product.nombre}
                      </h3>
                      {product.descripcion && (
                        <p className="mt-1 text-xs text-on-surface-variant/70 line-clamp-2 leading-relaxed">
                          {product.descripcion}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-lg font-bold text-brand-600">
                          ${Number(product.precio_base).toFixed(2)}
                        </span>
                        <Badge variant={product.disponible ? 'success' : 'neutral'} size="sm" dot>
                          {product.disponible ? 'Disponible' : 'No disponible'}
                        </Badge>
                      </div>

                      {product.categorias && product.categorias.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {product.categorias.map((cat) => (
                            <Badge key={cat.id} variant="info" size="sm">
                              {cat.nombre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Pagination ── */}
            {total !== undefined && total > 0 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="text-sm text-on-surface-variant/70 order-2 sm:order-1">
                  Mostrando <span className="font-medium text-on-surface">{skip + 1}</span> –{' '}
                  <span className="font-medium text-on-surface">{Math.min(skip + limit, total)}</span> de{' '}
                  <span className="font-medium text-on-surface">{total}</span>
                </div>
                <div className="flex items-center gap-3 order-1 sm:order-2">
                  <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={!hasPrev} icon="chevron_left">
                    Anterior
                  </Button>
                  <span className="text-xs text-on-surface-variant tabular-nums px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasNext} icon="chevron_right">
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
