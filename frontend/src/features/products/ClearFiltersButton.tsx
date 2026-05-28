import React from 'react';
import { useProductFilters } from './useProductFilters';

/**
 * ClearFiltersButton — Component to reset all filters to defaults
 *
 * Features:
 * - Only visible when filters are active
 * - Calls clearFilters() on Zustand store
 */
export function ClearFiltersButton(): React.ReactElement {
  const { categoria_id, price_min, price_max, sort_by } = useProductFilters();
  const clearFilters = useProductFilters((state) => state.clearFilters);

  // Check if any filters are active (not default values)
  const hasActiveFilters =
    categoria_id !== undefined ||
    price_min !== undefined ||
    price_max !== undefined ||
    sort_by !== 'reciente';

  if (!hasActiveFilters) {
    return <></>;
  }

  return (
    <button
      onClick={clearFilters}
      className="w-full px-4 py-2 bg-gray-300 text-gray-900 font-medium rounded-md hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      aria-label="Limpiar todos los filtros"
    >
      Limpiar filtros
    </button>
  );
}
