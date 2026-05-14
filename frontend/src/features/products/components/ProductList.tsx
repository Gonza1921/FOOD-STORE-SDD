/**
 * ProductList — Card-based product list with pagination, stock editing, and CRUD actions.
 * Refactored from table layout to Stitch-inspired responsive cards.
 */

import { useState } from 'react';
import { useProducts, useProductDelete, type Producto } from '../hooks';
import { StockManager } from './StockManager';
import { ProductCard } from './ProductCard';

export interface ProductListProps {
  /** Callback when edit button clicked */
  onEdit?: (product: Producto) => void;
  /** Callback when new product button clicked */
  onNew?: () => void;
}

export function ProductList({ onEdit, onNew }: ProductListProps) {
  // Pagination state
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Selection state for stock editing
  const [editingStockId, setEditingStockId] = useState<number | null>(null);

  // Data fetching
  const { data, isLoading, isError, refetch, total } = useProducts({
    skip,
    limit,
    include_deleted: includeDeleted,
  });

  // Delete mutation
  const deleteMutation = useProductDelete({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error al eliminar: ${error.message}`);
    },
  });

  // Calculate pagination
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = total ? Math.ceil(total / limit) : 0;
  const hasNext = skip + limit < (total || 0);
  const hasPrev = skip > 0;

  const handlePrevPage = () => {
    if (hasPrev) {
      setSkip((prev) => Math.max(0, prev - limit));
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      setSkip((prev) => prev + limit);
    }
  };

  const handleDelete = (product: Producto) => {
    if (confirm(`¿Estás seguro de eliminar "${product.nombre}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleStockSaveSuccess = () => {
    setEditingStockId(null);
    refetch();
  };

  const handleStockEdit = (product: Producto) => {
    setEditingStockId(product.id);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface">Productos</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-surface-container flex-shrink-0" />
                <div className="flex-grow space-y-3">
                  <div className="h-4 w-3/4 bg-surface-container rounded" />
                  <div className="h-3 w-1/2 bg-surface-container rounded" />
                  <div className="h-2 w-1/3 bg-surface-container rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface">Productos</h2>
        </div>
        <div className="bg-error-container/20 p-6 rounded-xl border border-error/10 text-center">
          <span className="material-symbols-outlined text-error text-[32px] mb-2">error_outline</span>
          <p className="text-on-error-container font-medium mb-3">Error al cargar productos</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface">Productos</h2>
          {onNew && (
            <button
              type="button"
              onClick={onNew}
              className="px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setIncludeDeleted(e.target.checked);
              setSkip(0);
            }}
            className="rounded border-outline-variant text-brand-600 focus:ring-brand-600/30"
          />
          Incluir eliminados
        </label>
      </div>

      {/* Product Cards */}
      {data?.items.length === 0 ? (
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 text-center">
          <span className="material-symbols-outlined text-on-surface-variant text-[40px] mb-3">inventory_2</span>
          <p className="text-on-surface-variant font-medium">
            {includeDeleted
              ? 'No hay productos registrados'
              : 'No hay productos activos'}
          </p>
          {onNew && !includeDeleted && (
            <button
              type="button"
              onClick={onNew}
              className="mt-3 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Crear primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data?.items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={onEdit}
              onDelete={(p) => handleDelete(p)}
              onStockEdit={handleStockEdit}
              isEditingStock={editingStockId === product.id}
              stockEditor={
                editingStockId === product.id ? (
                  <StockManager
                    currentStock={product.stock_cantidad}
                    productId={product.id}
                    onSuccess={handleStockSaveSuccess}
                    disabled={deleteMutation.isPending}
                  />
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total !== undefined && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-sm text-on-surface-variant">
            Mostrando {skip + 1} &ndash; {Math.min(skip + limit, total)} de {total} productos
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={!hasPrev}
              className="px-3 py-1.5 text-sm font-medium border border-outline-variant/50 rounded-lg
                         hover:bg-surface-container transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed
                         text-on-surface"
            >
              Anterior
            </button>
            <span className="text-sm text-on-surface-variant px-2">
              Pág. {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasNext}
              className="px-3 py-1.5 text-sm font-medium border border-outline-variant/50 rounded-lg
                         hover:bg-surface-container transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed
                         text-on-surface"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
