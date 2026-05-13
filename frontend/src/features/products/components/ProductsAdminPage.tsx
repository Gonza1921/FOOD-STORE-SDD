/**
 * ProductsAdminPage - Main admin page for products management
 * Phase 7.6: Assembles ProductList + ProductForm (modal or panel), handles CRUD flows
 */

import { useEffect, useState } from 'react';
import { ProductList } from './ProductList';
import { ProductForm } from './ProductForm';
import { type Producto, useProductDetail } from '../hooks';

export function ProductsAdminPage() {
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

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

  // Update selectedProduct when detail loads
  useEffect(() => {
    if (productDetail && editingProductId) {
      setSelectedProduct(productDetail);
    }
  }, [productDetail, editingProductId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra el catálogo de productos, stock y disponibilidad
          </p>
        </div>

        {/* Product List or Form */}
        {isFormOpen ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingProductId ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
            </div>

            {isLoadingDetail && editingProductId ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
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
          <ProductList onEdit={handleEditProduct} onNew={handleNewProduct} />
        )}
      </div>
    </div>
  );
}

export default ProductsAdminPage;