import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCategoryDetail } from '@/features/categories/hooks/useCategoryDetail';
import BreadcrumbNav from '@/features/categories/components/BreadcrumbNav';
import CategorySidebar from '@/features/categories/components/CategorySidebar';

type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'newest';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'newest', label: 'Más nuevos' },
];

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { category, isLoading, error, refetch } = useCategoryDetail(slug ?? '');
  const [selectedSubcatIds, setSelectedSubcatIds] = useState<Set<number>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');

  if (!slug) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-on-surface-variant">Slug de categoría no válido</p>
      </div>
    );
  }

  // Build breadcrumb segments from category
  const breadcrumbSegments = category
    ? [{ label: category.nombre, slug: category.slug }]
    : [];

  // Filter products by selected subcategories
  // Note: Currently all products shown when no filter selected.
  // When backend adds categoria_ids to ProductoOutPublic, refine to:
  // p.categorias.some(c => selectedSubcatIds.has(c.id))
  const filteredProductos =
    category?.productos.filter(() => selectedSubcatIds.size === 0) ?? [];

  // Sort products
  const sortedProductos = [...filteredProductos].sort((a, b) => {
    const priceA = parseFloat(a.precio_base);
    const priceB = parseFloat(b.precio_base);

    switch (sortOption) {
      case 'price-asc':
        return priceA - priceB;
      case 'price-desc':
        return priceB - priceA;
      case 'name-asc':
        return a.nombre.localeCompare(b.nombre);
      case 'newest':
      default:
        return b.id - a.id; // Higher ID = newer
    }
  });

  return (
    <div className="min-h-screen bg-surface">
      {/* Loading state */}
      {isLoading && (
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-8 h-5 w-72 animate-pulse rounded bg-outline-variant/30" />
          <div className="flex gap-8">
            <div className="hidden h-64 w-64 animate-pulse rounded-2xl bg-outline-variant/20 md:block" />
            <div className="flex-1">
              <div className="mb-6 h-8 w-48 animate-pulse rounded bg-outline-variant/30" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-2xl bg-outline-variant/20"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined mb-4 text-5xl text-error">
            error_outline
          </span>
          <p className="mb-4 text-on-surface-variant">{error}</p>
          <button
            onClick={refetch}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && category && (
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Breadcrumb */}
          <BreadcrumbNav segments={breadcrumbSegments} />

          <div className="flex flex-col gap-8 md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 md:shrink-0">
              <CategorySidebar
                title="Subcategorías"
                subcategorias={category.subcategorias}
                selectedIds={selectedSubcatIds}
                onSelectionChange={setSelectedSubcatIds}
              />
            </div>

            {/* Main content */}
            <div className="min-w-0 flex-1">
              {/* Header row */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-on-surface md:text-3xl">
                    {category.nombre}
                  </h1>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {category.productos.length} producto
                    {category.productos.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-sm text-on-surface-variant">
                    Ordenar:
                  </label>
                  <select
                    id="sort-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Empty state */}
              {sortedProductos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="material-symbols-outlined mb-4 text-5xl text-outline-variant">
                    inventory_2
                  </span>
                  <p className="text-lg text-on-surface-variant">
                    No hay productos en esta categoría
                  </p>
                </div>
              )}

              {/* Product grid */}
              {sortedProductos.length > 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedProductos.map((producto) => (
                    <Link
                      key={producto.id}
                      to={`/productos/${producto.id}`}
                      className="group rounded-2xl bg-surface p-5 shadow-premium-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-md"
                    >
                      {/* Product image placeholder */}
                      <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-surface-container-highest">
                        <span className="material-symbols-outlined text-4xl text-outline-variant">
                          restaurant
                        </span>
                      </div>

                      <h3 className="mb-2 font-semibold text-on-surface transition-colors group-hover:text-brand-600">
                        {producto.nombre}
                      </h3>

                      <p className="text-lg font-bold text-brand-600">
                        ${parseFloat(producto.precio_base).toFixed(2)}
                      </p>

                      {!producto.disponible && (
                        <span className="mt-2 inline-block rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error">
                          No disponible
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Not found */}
      {!isLoading && !error && !category && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined mb-4 text-5xl text-outline-variant">
            search_off
          </span>
          <p className="text-lg text-on-surface-variant">
            Categoría no encontrada
          </p>
        </div>
      )}
    </div>
  );
}
