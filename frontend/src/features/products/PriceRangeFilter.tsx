import React, { useState } from 'react';
import { useProductFilters } from './useProductFilters';

/**
 * PriceRangeFilter — Component for filtering products by price range
 *
 * Features:
 * - Input fields for min/max prices (in USD, converted to cents)
 * - Validation: min price cannot be > max price
 * - Error message display
 * - Integration with Zustand store
 */
export function PriceRangeFilter(): React.ReactElement {
  const setFilters = useProductFilters((state: any) => state.setFilters);
  
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Parse inputs (USD to cents)
    const min = minPrice ? Math.round(parseFloat(minPrice) * 100) : undefined;
    const max = maxPrice ? Math.round(parseFloat(maxPrice) * 100) : undefined;

    // Validation
    if (min !== undefined && max !== undefined && min > max) {
      setError('El precio mínimo no puede ser mayor que el máximo');
      return;
    }

    // Update store
    setFilters({
      price_min: min,
      price_max: max,
    });

    // Optional: clear inputs after successful filter
    // setMinPrice('');
    // setMaxPrice('');
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-900">Rango de Precio</h3>
      
      <form onSubmit={handleFilter} className="flex flex-col gap-3">
        {/* Min Price Input */}
        <div className="flex flex-col gap-1">
          <label htmlFor="price-min" className="text-sm font-medium text-gray-700">
            Precio Mínimo ($)
          </label>
          <input
            id="price-min"
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Precio mínimo en dólares"
          />
        </div>

        {/* Max Price Input */}
        <div className="flex flex-col gap-1">
          <label htmlFor="price-max" className="text-sm font-medium text-gray-700">
            Precio Máximo ($)
          </label>
          <input
            id="price-max"
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Precio máximo en dólares"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="p-2 bg-red-100 text-red-700 text-sm rounded border border-red-300"
          >
            {error}
          </div>
        )}

        {/* Filter Button */}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Filtrar
        </button>
      </form>
    </div>
  );
}
