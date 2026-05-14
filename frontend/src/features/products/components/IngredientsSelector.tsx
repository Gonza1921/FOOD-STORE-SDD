/**
 * IngredientsSelector — Multi-select component for product ingredients
 * Phase 7.3: Component with checkboxes, es_removible toggle, eager loads from useIngredients
 * Stitch-inspired styling.
 */

import { useEffect, useState } from 'react';
import { useIngredients, type Ingredient } from '@/features/ingredients/hooks/useIngredients';

export interface IngredientsSelectorProps {
  /** Selected ingredient IDs */
  value: number[];
  /** Callback when selection changes */
  onChange: (ingredientIds: number[]) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show removable toggle */
  showRemovable?: boolean;
  /** Currently removable ingredients */
  removableIds?: number[];
  /** Callback when removable changes */
  onRemovableChange?: (ingredientIds: number[]) => void;
}

interface IngredientOption {
  id: number;
  nombre: string;
}

export function IngredientsSelector({
  value,
  onChange,
  disabled = false,
  showRemovable = true,
  removableIds = [],
  onRemovableChange,
}: IngredientsSelectorProps) {
  const { ingredients, isLoading, error, refetch } = useIngredients();
  const [localIngredients, setLocalIngredients] = useState<IngredientOption[]>([]);

  // Flatten ingredients for display
  useEffect(() => {
    const flattened = ingredients.map((ing: Ingredient) => ({
      id: ing.id,
      nombre: ing.nombre,
    }));
    setLocalIngredients(flattened);
  }, [ingredients]);

  const handleToggle = (ingredientId: number) => {
    if (disabled) return;

    const newValue = value.includes(ingredientId)
      ? value.filter((id) => id !== ingredientId)
      : [...value, ingredientId];

    onChange(newValue);

    // Also update removable list - add by default as false, remove if unselected
    if (showRemovable && !value.includes(ingredientId)) {
      onRemovableChange?.(removableIds.filter((id) => id !== ingredientId));
    }
  };

  const handleRemovableToggle = (ingredientId: number) => {
    if (disabled) return;

    const newRemovable = removableIds.includes(ingredientId)
      ? removableIds.filter((id) => id !== ingredientId)
      : [...removableIds, ingredientId];

    onRemovableChange?.(newRemovable);
  };

  if (error) {
    return (
<<<<<<< HEAD
      <div className="p-4 rounded-xl bg-error-container/20 border border-error/20">
        <p className="text-error text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          Error al cargar ingredientes
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-brand-600 text-sm underline mt-1 hover:text-brand-700"
        >
=======
      <div className="p-4 border border-red-300 rounded bg-red-50">
        <p className="text-red-600 text-sm">Error al cargar ingredientes</p>
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
          <span className="text-sm">Cargando ingredientes...</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2">
          {localIngredients.map((ingredient) => {
            const isSelected = value.includes(ingredient.id);
            const isRemovable = removableIds.includes(ingredient.id);

            return (
              <div
                key={ingredient.id}
                className={`flex items-center gap-2 p-1.5 rounded-lg ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container'
                } transition-colors`}
              >
                <input
                  type="checkbox"
                  id={`ingredient-${ingredient.id}`}
                  checked={isSelected}
                  onChange={() => handleToggle(ingredient.id)}
                  disabled={disabled}
                  className="rounded border-outline-variant text-brand-600 focus:ring-brand-600/30"
                />
                <label
                  htmlFor={`ingredient-${ingredient.id}`}
                  className="flex-1 text-sm text-on-surface cursor-pointer"
                >
                  {ingredient.nombre}
                </label>
                {showRemovable && isSelected && (
                  <button
                    type="button"
                    onClick={() => handleRemovableToggle(ingredient.id)}
                    disabled={disabled}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                      isRemovable
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-surface-container border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {isRemovable ? 'Removible' : 'Por defecto'}
                  </button>
                )}
              </div>
            );
          })}
          {localIngredients.length === 0 && (
<<<<<<< HEAD
            <p className="text-on-surface-variant text-sm py-3 text-center">
              No hay ingredientes disponibles
            </p>
=======
            <p className="text-gray-500 text-sm py-2">No hay ingredientes disponibles</p>
>>>>>>> origin/main
          )}
        </div>
      )}
    </div>
  );
}

export default IngredientsSelector;
