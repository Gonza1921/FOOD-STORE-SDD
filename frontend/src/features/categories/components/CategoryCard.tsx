import { Link } from 'react-router-dom';
import type { PublicCategory } from '../hooks/usePublicCategories';

interface CategoryCardProps {
  category: PublicCategory;
}

const CATEGORY_COLORS = [
  'from-brand-400 to-secondary-500',
  'from-secondary-400 to-tertiary-500',
  'from-tertiary-400 to-error-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-sky-500',
];

function getColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const gradient = getColor(category.id);

  return (
    <Link
      to={`/categorias/${category.slug}`}
      className="group relative overflow-hidden rounded-2xl bg-surface p-6 shadow-premium-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-md"
    >
      {/* Decorative gradient bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`}
      />

      <div className="flex flex-col items-center gap-3 pt-3 text-center">
        {/* Icon placeholder */}
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
        >
          <span className="material-symbols-outlined text-2xl text-white">
            category
          </span>
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-on-surface">
          {category.nombre}
        </h3>

        {/* Product count */}
        <p className="text-sm text-on-surface-variant">
          {category.producto_count}{' '}
          {category.producto_count === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {/* Hover arrow indicator */}
      <span className="material-symbols-outlined absolute bottom-4 right-4 text-lg text-outline-variant opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-brand-600">
        arrow_forward
      </span>
    </Link>
  );
}
