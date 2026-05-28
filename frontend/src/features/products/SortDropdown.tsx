import React from 'react';
import { useProductFilters } from '../useProductFilters';

type SortOption = 'reciente' | 'nombre_asc' | 'nombre_desc' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'reciente', label: 'Más reciente' },
  { value: 'nombre_asc', label: 'Nombre A-Z' },
  { value: 'nombre_desc', label: 'Nombre Z-A' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
];

/**
 * SortDropdown — Component for sorting products
 *
 * Features:
 * - 5 sorting options
 * - Default: "Más reciente"
 * - Updates Zustand store on change
 */
export function SortDropdown(): React.ReactElement {
  const sort_by = useProductFilters((state) => state.sort_by);
  const setFilters = useProductFilters((state) => state.setFilters);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SortOption;
    setFilters({ sort_by: value });
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <label htmlFor="sort-by" className="font-semibold text-gray-900">
        Ordenar por
      </label>

      <select
        id="sort-by"
        value={sort_by}
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
        aria-label="Opción de ordenamiento"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
