/**
 * IngredientsSelector - Multi-select component for product ingredients
 * Phase 7.3: Component with checkboxes, es_removible toggle, eager loads from useIngredientes
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
      onRemovableChange?.(
        removableIds.filter((id) => id !== ingredientId)
      );
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
      <div className="p-4 border border-red-300 rounded bg-red-50">
        <p className="text-red-600 text-sm">Error al cargar ingredientes</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-blue-600 text-sm underline"
        >
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
          <span className="text-sm">Cargando ingredientes...</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto border rounded p-2">
          {localIngredients.map((ingredient) => {
            const isSelected = value.includes(ingredient.id);
            const isRemovable = removableIds.includes(ingredient.id);

            return (
              <div
                key={ingredient.id}
                className={`flex items-center gap-2 p-1 rounded ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  id={`ingredient-${ingredient.id}`}
                  checked={isSelected}
                  onChange={() => handleToggle(ingredient.id)}
                  disabled={disabled}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`ingredient-${ingredient.id}`}
                  className="flex-1 text-sm cursor-pointer"
                >
                  {ingredient.nombre}
                </label>
                {showRemovable && isSelected && (
                  <button
                    type="button"
                    onClick={() => handleRemovableToggle(ingredient.id)}
                    disabled={disabled}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      isRemovable
                        ? 'bg-orange-100 border-orange-300 text-orange-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isRemovable ? 'Removible' : 'Por defecto'}
                  </button>
                )}
              </div>
            );
          })}
          {localIngredients.length === 0 && (
            <p className="text-gray-500 text-sm py-2">
              No hay ingredientes disponibles
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default IngredientsSelector;