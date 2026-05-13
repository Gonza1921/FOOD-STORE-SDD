/**
 * ProductForm - Form component for creating and updating products
 * Phase 7.1: Form with fields (nombre, descripcion, precio_base, stock_cantidad, disponible, categoria_id)
 * Uses TanStack Form validation, submit (create/update)
 */

import { useState, useEffect } from 'react';
import {
  type Producto,
  type ProductoCreate,
  type ProductoUpdate,
  useProductCreate,
  useProductUpdate,
} from '../hooks';
import type { CategoriaRef, IngredienteRef } from '../api/endpoints';
import { CategoriesSelector } from './CategoriesSelector';
import { IngredientsSelector } from './IngredientsSelector';

export interface ProductFormProps {
  /** Initial product data for edit mode */
  product?: Producto | null;
  /** Callback on successful save */
  onSuccess?: (product: Producto) => void;
  /** Callback on cancel */
  onCancel?: () => void;
  /** Loading state from parent */
  externalLoading?: boolean;
}

const initialFormData: Omit<ProductoCreate, 'categoria_id'> & { categoria_id: number | '' } = {
  nombre: '',
  descripcion: '',
  precio_base: '',
  stock_cantidad: 0,
  disponible: true,
  categoria_id: '',
  categorias: [],
  ingredientes: [],
};

export function ProductForm({
  product,
  onSuccess,
  onCancel,
  externalLoading,
}: ProductFormProps) {
  const isEditMode = !!product;

  // Form state
  const [formData, setFormData] = useState(initialFormData);
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [selectedIngredientes, setSelectedIngredientes] = useState<number[]>([]);
  const [principalCategoria, setPrincipalCategoria] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutations
  const createMutation = useProductCreate({
    onSuccess: (product) => {
      setIsSubmitting(false);
      onSuccess?.(product);
    },
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ submit: error.message });
    },
  });

  const updateMutation = useProductUpdate({
    onSuccess: (product) => {
      setIsSubmitting(false);
      onSuccess?.(product);
    },
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ submit: error.message });
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        precio_base: product.precio_base,
        stock_cantidad: product.stock_cantidad,
        disponible: product.disponible,
        categoria_id: product.categorias[0]?.id || '',
      });
      setSelectedCategorias(product.categorias.map((c: CategoriaRef) => c.id));
      setSelectedIngredientes(product.ingredientes.map((i: IngredienteRef) => i.id));
      setPrincipalCategoria(product.categorias.find((c: CategoriaRef) => c.id === formData.categoria_id)?.id || null);
    } else {
      setFormData(initialFormData);
      setSelectedCategorias([]);
      setSelectedIngredientes([]);
      setPrincipalCategoria(null);
    }
  }, [product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length > 200) {
      newErrors.nombre = 'El nombre debe tener máximo 200 caracteres';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'La categoría principal es requerida';
    }

    if (!formData.precio_base) {
      newErrors.precio_base = 'El precio es requerido';
    } else {
      const precio = parseFloat(formData.precio_base);
      if (isNaN(precio) || precio <= 0) {
        newErrors.precio_base = 'El precio debe ser mayor a 0';
      }
    }

    if (formData.stock_cantidad < 0) {
      newErrors.stock_cantidad = 'El stock no puede ser negativo';
    }

    if (formData.descripcion && formData.descripcion.length > 500) {
      newErrors.descripcion = 'La descripción debe tener máximo 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const categoriasOrdenadas = [principalCategoria || formData.categoria_id, ...selectedCategorias.filter(id => id !== principalCategoria && id !== formData.categoria_id)].filter(Boolean) as number[];

    if (isEditMode && product) {
      const updateData: ProductoUpdate = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        precio_base: formData.precio_base,
        disponible: formData.disponible,
        categorias: categoriasOrdenadas,
        ingredientes: selectedIngredientes,
      };

      updateMutation.mutate({ id: product.id, data: updateData });
    } else {
      const createData: ProductoCreate = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        precio_base: formData.precio_base,
        stock_cantidad: formData.stock_cantidad,
        disponible: formData.disponible,
        categoria_id: formData.categoria_id as number,
        categorias: categoriasOrdenadas,
        ingredientes: selectedIngredientes,
      };

      createMutation.mutate(createData);
    }
  };

  const isLoading = isSubmitting || externalLoading || createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Submit */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
          {errors.submit}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nombre"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          disabled={isLoading}
          maxLength={200}
          className={`mt-1 block w-full rounded-md border ${
            errors.nombre ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
        />
        {errors.nombre && (
          <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
        )}
      </div>

      {/* Descripcion */}
      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          disabled={isLoading}
          rows={3}
          maxLength={500}
          className={`mt-1 block w-full rounded-md border ${
            errors.descripcion ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
        />
        {errors.descripcion && (
          <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
        )}
      </div>

      {/* Precio y Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="precio_base" className="block text-sm font-medium text-gray-700">
            Precio (ARS) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="precio_base"
            value={formData.precio_base}
            onChange={(e) => setFormData({ ...formData, precio_base: e.target.value })}
            disabled={isLoading}
            step="0.01"
            min="0.01"
            placeholder="19.99"
            className={`mt-1 block w-full rounded-md border ${
              errors.precio_base ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
          />
          {errors.precio_base && (
            <p className="mt-1 text-sm text-red-600">{errors.precio_base}</p>
          )}
        </div>

        <div>
          <label htmlFor="stock_cantidad" className="block text-sm font-medium text-gray-700">
            Stock
          </label>
          <input
            type="number"
            id="stock_cantidad"
            value={formData.stock_cantidad}
            onChange={(e) => setFormData({ ...formData, stock_cantidad: parseInt(e.target.value) || 0 })}
            disabled={isLoading}
            min="0"
            className={`mt-1 block w-full rounded-md border ${
              errors.stock_cantidad ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
          />
          {errors.stock_cantidad && (
            <p className="mt-1 text-sm text-red-600">{errors.stock_cantidad}</p>
          )}
        </div>
      </div>

      {/* Disponible */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="disponible"
          checked={formData.disponible}
          onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
          disabled={isLoading}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="disponible" className="text-sm text-gray-700">
          Producto disponible para venta
        </label>
      </div>

      {/* Categoría Principal */}
      <div>
        <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700">
          Categoría Principal <span className="text-red-500">*</span>
        </label>
        <select
          id="categoria_id"
          value={formData.categoria_id}
          onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value ? parseInt(e.target.value) : '' })}
          disabled={isLoading}
          className={`mt-1 block w-full rounded-md border ${
            errors.categoria_id ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
        >
          <option value="">Seleccionar categoría</option>
          {selectedCategorias.map((catId) => {
            // We'll rely on the categories selector to populate this
            return <option key={catId} value={catId}>Categoría {catId}</option>;
          })}
        </select>
        {errors.categoria_id && (
          <p className="mt-1 text-sm text-red-600">{errors.categoria_id}</p>
        )}
      </div>

      {/* Categorías Adicionales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categorías Adicionales
        </label>
        <CategoriesSelector
          value={selectedCategorias}
          onChange={setSelectedCategorias}
          disabled={isLoading}
          showPrincipal={true}
          principalId={principalCategoria}
          onPrincipalChange={setPrincipalCategoria}
        />
      </div>

      {/* Ingredientes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ingredientes
        </label>
        <IngredientsSelector
          value={selectedIngredientes}
          onChange={setSelectedIngredientes}
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </span>
          ) : isEditMode ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;