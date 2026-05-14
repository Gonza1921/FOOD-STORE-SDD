/**
 * StockManager — Component for inline product stock editing in card view.
 * Phase 7.5: Input (min=0), +/- buttons, save button, validates stock >= 0, triggers useStockUpdate
 * Stitch-inspired styling.
 */

import { useState, useEffect } from 'react';
import { useProductStockUpdate } from '../hooks';

export interface StockManagerProps {
  /** Current stock quantity */
  currentStock: number;
  /** Product ID */
  productId: number;
  /** Callback on successful update */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Disabled state */
  disabled?: boolean;
}

export function StockManager({
  currentStock,
  productId,
  onSuccess,
  onError,
  disabled = false,
}: StockManagerProps) {
  const [stockValue, setStockValue] = useState(currentStock);
  const [isEditing, setIsEditing] = useState(false);

  const stockMutation = useProductStockUpdate({
    onSuccess: () => {
      setIsEditing(false);
      onSuccess?.();
    },
    onError: (error) => {
      setStockValue(currentStock); // Revert on error
      onError?.(error);
    },
  });

  // Reset stock value when currentStock changes externally
  useEffect(() => {
    setStockValue(currentStock);
  }, [currentStock]);

  const handleIncrement = () => {
    if (disabled || stockMutation.isPending) return;
    setStockValue((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (disabled || stockMutation.isPending) return;
    if (stockValue > 0) {
      setStockValue((prev) => prev - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setStockValue(value);
    } else if (e.target.value === '') {
      setStockValue(0);
    }
  };

  const handleSave = () => {
    if (disabled || stockMutation.isPending) return;
    if (stockValue === currentStock) {
      setIsEditing(false);
      return;
    }
    stockMutation.mutate({ id: productId, nueva_cantidad: stockValue });
  };

  const handleCancel = () => {
    setStockValue(currentStock);
    setIsEditing(false);
  };

  const isLoading = stockMutation.isPending;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isEditing ? (
        <>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={isLoading || stockValue <= 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            -
          </button>
          <input
            type="number"
            value={stockValue}
            onChange={handleInputChange}
            disabled={isLoading}
            min="0"
            className="w-16 text-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest py-1 px-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
          />
          <button
            type="button"
            onClick={handleIncrement}
            disabled={isLoading}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-40 transition-colors text-sm font-medium"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || stockValue === currentStock}
            className="px-2.5 py-1 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Guardar'
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancelar
          </button>
        </>
      ) : (
        <>
          <span className="text-sm font-medium text-on-surface">{currentStock}</span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
            className="text-xs text-brand-600 hover:text-brand-700 underline disabled:opacity-50 transition-colors"
          >
            Editar
          </button>
        </>
      )}
    </div>
  );
}

export default StockManager;
