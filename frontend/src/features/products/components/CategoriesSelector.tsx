/**
 * CategoriesSelector — Multi-select component for product categories
 * Phase 7.2: Component with checkboxes, es_principal toggle, eager loads from useCategories
 * Stitch-inspired styling.
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
<<<<<<< HEAD
      <div className="p-4 rounded-xl bg-error-container/20 border border-error/20">
        <p className="text-error text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          Error al cargar categorías
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-brand-600 text-sm underline mt-1 hover:text-brand-700"
        >
=======
      <div className="p-4 border border-red-300 rounded bg-red-50">
        <p className="text-red-600 text-sm">Error al cargar categorías</p>
        <button type="button" onClick={() => refetch()} className="text-blue-600 text-sm underline">
>>>>>>> origin/main
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex items-center gap-2 text-on-surface-variant">
          <svg className="animate-spin h-4 w-4 text-brand-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Cargando categorías...</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2">
          {localCategories.map((category) => {
            const isSelected = value.includes(category.id);
            const isPrincipal = principalId === category.id;

            return (
              <div
                key={category.id}
                className={`flex items-center gap-2 p-1.5 rounded-lg ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container'
                } transition-colors`}
              >
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={isSelected}
                  onChange={() => handleToggle(category.id)}
                  disabled={disabled}
                  className="rounded border-outline-variant text-brand-600 focus:ring-brand-600/30"
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="flex-1 text-sm text-on-surface cursor-pointer"
                >
                  {category.nombre}
                </label>
                {showPrincipal && isSelected && (
                  <button
                    type="button"
                    onClick={() => handlePrincipalChange(category.id)}
                    disabled={disabled}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                      isPrincipal
                        ? 'bg-brand-600/10 border-brand-600/30 text-brand-700'
                        : 'bg-surface-container border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {isPrincipal ? 'Principal' : 'Hacer principal'}
                  </button>
                )}
              </div>
            );
          })}
          {localCategories.length === 0 && (
<<<<<<< HEAD
            <p className="text-on-surface-variant text-sm py-3 text-center">
              No hay categorías disponibles
            </p>
=======
            <p className="text-gray-500 text-sm py-2">No hay categorías disponibles</p>
>>>>>>> origin/main
          )}
        </div>
      )}
    </div>
  );
}

export default CategoriesSelector;
