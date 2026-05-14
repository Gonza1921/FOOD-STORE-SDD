/**
 * ProductsAdminPage — Main admin page for product management.
 * Stitch-inspired dashboard layout with search, stats, card list, and FAB.
 * Phase 7.6: Assembles ProductList + ProductForm (modal/panel), handles CRUD flows.
 */

import { useState, useEffect } from 'react';
import { ProductList } from './ProductList';
import { ProductForm } from './ProductForm';
import { ProductSearch } from './ProductSearch';
import { ProductStats } from './ProductStats';
import { type Producto, useProductDetail } from '../hooks';

export function ProductsAdminPage() {
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch product detail for editing
  const { data: productDetail, isLoading: isLoadingDetail } = useProductDetail({
    id: editingProductId || 0,
    enabled: !!editingProductId,
  });

  // Handlers
  const handleNewProduct = () => {
    setEditingProductId(null);
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Producto) => {
    setEditingProductId(product.id);
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProductId(null);
    setSelectedProduct(null);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProductId(null);
    setSelectedProduct(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Update selectedProduct when detail loads
  useEffect(() => {
    if (productDetail && editingProductId) {
      setSelectedProduct(productDetail);
    }
  }, [productDetail, editingProductId]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Page Header ── */}
        <header className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
                Inventario de Productos
              </h1>
              <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
                Gestiona y supervisa el stock de tu tienda
              </p>
            </div>

            {/* Search */}
            <ProductSearch
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={isFormOpen}
            />
          </div>
        </header>

        {/* ── Form View ── */}
        {isFormOpen ? (
          <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-xl border border-outline-variant/30 shadow-sm">
            {isLoadingDetail && editingProductId ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <svg className="animate-spin h-8 w-8 mb-3 text-brand-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm">Cargando datos del producto...</p>
              </div>
            ) : (
              <ProductForm
                product={selectedProduct}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            )}
          </div>
        ) : (
          <>
            {/* ── Stats Overview ── */}
            <ProductStats isLoading={false} />

            {/* ── Product List ── */}
            <ProductList onEdit={handleEditProduct} onNew={handleNewProduct} />
          </>
        )}
      </div>

      {/* ── Floating Action Button (FAB) ── */}
      {!isFormOpen && (
        <button
          type="button"
          onClick={handleNewProduct}
          className="fixed right-6 bottom-24 bg-brand-600 text-white w-14 h-14 rounded-full shadow-lg
                     flex items-center justify-center active:scale-95 transition-all duration-200
                     hover:bg-brand-700 hover:shadow-xl z-40"
          aria-label="Agregar nuevo producto"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"wght" 600' }}>
            add
          </span>
        </button>
      )}
    </div>
  );
}

export default ProductsAdminPage;
