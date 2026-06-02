import { usePublicCategories } from '@/features/categories/hooks/usePublicCategories';
import CategoryCard from '@/features/categories/components/CategoryCard';

export default function CategoriesPage() {
  const { categories, isLoading, error, refetch } = usePublicCategories();

  // Root categories only (parent_id is null) for the main grid
  const rootCategories = categories.filter((c) => !c.parent_id);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-brand-600 via-secondary-600 to-tertiary-600 px-4 py-16 text-center text-white">
        <h1 className="mb-3 text-4xl font-bold md:text-5xl">
          Categorías
        </h1>
        <p className="mx-auto max-w-lg text-lg text-white/80">
          Explorá nuestros productos por categoría
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-surface-container-highest p-6"
              >
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-outline-variant/30" />
                <div className="mx-auto mb-2 h-5 w-24 rounded bg-outline-variant/30" />
                <div className="mx-auto h-4 w-16 rounded bg-outline-variant/20" />
              </div>
            ))}
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

        {/* Empty state */}
        {!isLoading && !error && rootCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined mb-4 text-5xl text-outline-variant">
              category
            </span>
            <p className="text-lg text-on-surface-variant">
              No hay categorías disponibles
            </p>
          </div>
        )}

        {/* Category grid */}
        {!isLoading && !error && rootCategories.length > 0 && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {rootCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
