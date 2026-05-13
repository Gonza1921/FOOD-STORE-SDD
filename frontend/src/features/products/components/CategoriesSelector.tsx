/**
 * CategoriesSelector - Multi-select component for product categories
 * Phase 7.2: Component with checkboxes, es_principal toggle, eager loads from useCategories
 */

import { useEffect, useState } from 'react';
import { useCategories } from '@/features/categories/hooks/useCategories';

export interface CategoriesSelectorProps {
  /** Selected category IDs */
  value: number[];
  /** Callback when selection changes */
  onChange: (categoryIds: number[]) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show principal toggle */
  showPrincipal?: boolean;
  /** Currently selected as principal */
  principalId?: number | null;
  /** Callback when principal changes */
  onPrincipalChange?: (categoryId: number | null) => void;
}

interface CategoryOption {
  id: number;
  nombre: string;
}

export function CategoriesSelector({
  value,
  onChange,
  disabled = false,
  showPrincipal = true,
  principalId,
  onPrincipalChange,
}: CategoriesSelectorProps) {
  const { categories, isLoading, error, refetch } = useCategories();
  const [localCategories, setLocalCategories] = useState<CategoryOption[]>([]);

  // Flatten categories for display
  useEffect(() => {
    const flattened = categories.flatMap((cat) => [
      { id: cat.id, nombre: cat.nombre },
      ...(cat.children?.map((child) => ({
        id: child.id,
        nombre: `  └ ${child.nombre}`,
      })) || []),
    ]);
    setLocalCategories(flattened);
  }, [categories]);

  const handleToggle = (categoryId: number) => {
    if (disabled) return;

    const newValue = value.includes(categoryId)
      ? value.filter((id) => id !== categoryId)
      : [...value, categoryId];

    onChange(newValue);

    // If this is the first category added and principal not set, make it principal
    if (newValue.length === 1 && !principalId && showPrincipal) {
      onPrincipalChange?.(categoryId);
    }
  };

  const handlePrincipalChange = (categoryId: number) => {
    if (disabled) return;
    onPrincipalChange?.(principalId === categoryId ? null : categoryId);
  };

  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded bg-red-50">
        <p className="text-red-600 text-sm">Error al cargar categorías</p>
        <button type="button" onClick={() => refetch()} className="text-blue-600 text-sm underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
          <span className="text-sm">Cargando categorías...</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto border rounded p-2">
          {localCategories.map((category) => {
            const isSelected = value.includes(category.id);
            const isPrincipal = principalId === category.id;

            return (
              <div
                key={category.id}
                className={`flex items-center gap-2 p-1 rounded ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={isSelected}
                  onChange={() => handleToggle(category.id)}
                  disabled={disabled}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="flex-1 text-sm cursor-pointer"
                >
                  {category.nombre}
                </label>
                {showPrincipal && isSelected && (
                  <button
                    type="button"
                    onClick={() => handlePrincipalChange(category.id)}
                    disabled={disabled}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      isPrincipal
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isPrincipal ? 'Principal' : 'Hacer principal'}
                  </button>
                )}
              </div>
            );
          })}
          {localCategories.length === 0 && (
            <p className="text-gray-500 text-sm py-2">No hay categorías disponibles</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoriesSelector;
