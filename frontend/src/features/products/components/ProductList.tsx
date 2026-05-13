/**
 * ProductList - Table component for displaying products with pagination
 * Phase 7.4: Table with pagination, columns (id, nombre, precio, stock, disponible, actions)
 * Delete/edit/stock buttons, loading/error states
 */

import { useState } from 'react';
import { useProducts, useProductDelete, type Producto } from '../hooks';
import { StockManager } from './StockManager';

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
          {onNew && (
            <button
              type="button"
              onClick={onNew}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Nuevo Producto
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setIncludeDeleted(e.target.checked);
              setSkip(0);
            }}
            className="rounded border-gray-300"
          />
          Incluir eliminados
        </label>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cargando productos...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600">
            <p>Error al cargar productos</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm underline"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.items.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{product.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{product.nombre}</div>
                    {product.descripcion && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {product.descripcion}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    ${product.precio_base}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingStockId === product.id ? (
                      <StockManager
                        currentStock={product.stock_cantidad}
                        productId={product.id}
                        onSuccess={handleStockSaveSuccess}
                        disabled={deleteMutation.isPending}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{product.stock_cantidad}</span>
                        <button
                          type="button"
                          onClick={() => setEditingStockId(product.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        product.disponible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.disponible ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm space-x-2">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No hay productos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total !== undefined && total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {skip + 1} - {Math.min(skip + limit, total)} de {total} productos
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={!hasPrev}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasNext}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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