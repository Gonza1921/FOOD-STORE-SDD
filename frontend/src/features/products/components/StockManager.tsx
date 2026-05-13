/**
 * StockManager - Component for updating product stock
 * Phase 7.5: Input (min=0), +/- buttons, save button, validates stock >= 0, triggers useStockUpdate
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

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isLoading || stockValue <= 0}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        <input
          type="number"
          value={stockValue}
          onChange={handleInputChange}
          disabled={isLoading}
          min="0"
          className="w-20 text-center border border-gray-300 rounded py-1 px-2 focus:border-blue-500 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={isLoading}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || stockValue === currentStock}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-900">{currentStock}</span>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        disabled={disabled}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        Editar
      </button>
    </div>
  );
}

export default StockManager;