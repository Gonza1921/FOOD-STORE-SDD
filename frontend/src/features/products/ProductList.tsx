import React from 'react';
import { ProductoOutPublic } from '@/shared/hooks/useProducts';

interface ProductListProps {
  items: ProductoOutPublic[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * ProductList — Component for displaying paginated list of products
 *
 * Features:
 * - Maps products to ProductCard
 * - Shows "No hay productos" message if empty
 * - Pagination controls
 */
export function ProductList({
  items,
  total,
  page,
  limit,
  has_next,
  has_prev,
  onPageChange,
  isLoading = false,
}: ProductListProps): React.ReactElement {
  const total_pages = Math.ceil(total / limit);

  return (
    <div className="flex-1">
      {/* Products Grid */}
      {items.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-lg text-gray-700">No hay productos que coincidan con tus filtros</p>
          <p className="text-sm text-gray-500 mt-2">Intenta cambiar los filtros o buscar en otra categoría</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {total_pages > 1 && (
            <div className="flex items-center justify-between mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">
                Página {page} de {total_pages} ({total} productos)
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={!has_prev}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  aria-label="Página anterior"
                >
                  ← Anterior
                </button>

                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={!has_next}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  aria-label="Página siguiente"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * ProductCard — Individual product card component
 */
function ProductCard({ product }: { product: ProductoOutPublic }): React.ReactElement {
  const priceInPesos = (product.precio_base / 100).toFixed(2);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      {product.imagen_url ? (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-gray-400">
            image
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
          {product.nombre}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.descripcion || 'Sin descripción'}
        </p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">${priceInPesos}</span>
          {product.disponible ? (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Disponible
            </span>
          ) : (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              No disponible
            </span>
          )}
        </div>

        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          disabled={!product.disponible}
        >
          Ver detalle
        </button>
      </div>
    </div>
  );
}
