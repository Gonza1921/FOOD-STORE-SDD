/**
 * ProductForm — Form component for creating and updating products
 * Phase 7.1: Fields (nombre, descripcion, precio_base, stock_cantidad, disponible, categoria_id)
 * Uses TanStack Form validation, submit (create/update)
 * Refactored with Stitch-inspired styling.
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

<<<<<<< HEAD
// ── Reusable input class builder ──

const inputBase =
  'mt-1 block w-full rounded-xl border bg-surface-container-lowest px-3 py-2.5 ' +
  'font-sans text-[16px] leading-[24px] text-on-surface ' +
  'placeholder:text-on-surface-variant/50 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'transition-all duration-200';

function inputBorder(error?: string): string {
  return error
    ? 'border-error focus:border-error focus:ring-error/20'
    : 'border-outline-variant/50 hover:border-outline-variant';
}

const labelStyle = 'block text-sm font-medium text-on-surface mb-0.5';
const errorTextStyle = 'mt-1 text-sm text-error';

export function ProductForm({
  product,
  onSuccess,
  onCancel,
  externalLoading,
}: ProductFormProps) {
=======
export function ProductForm({ product, onSuccess, onCancel, externalLoading }: ProductFormProps) {
>>>>>>> origin/main
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
<<<<<<< HEAD
      setPrincipalCategoria(product.categorias[0]?.id || null);
=======
      setPrincipalCategoria(
        product.categorias.find((c: CategoriaRef) => c.id === formData.categoria_id)?.id || null
      );
>>>>>>> origin/main
    } else {
      setFormData(initialFormData);
      setSelectedCategorias([]);
      setSelectedIngredientes([]);
      setPrincipalCategoria(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const categoriasOrdenadas = [
      principalCategoria || formData.categoria_id,
      ...selectedCategorias.filter(
        (id) => id !== principalCategoria && id !== formData.categoria_id
      ),
    ].filter(Boolean) as number[];

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

  const isLoading =
    isSubmitting || externalLoading || createMutation.isPending || updateMutation.isPending;

  const set = (field: string, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] leading-[28px] font-semibold text-on-surface">
          {isEditMode ? (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-600">edit</span>
              Editar Producto
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-600">add_circle</span>
              Nuevo Producto
            </span>
          )}
        </h2>
      </div>

      {/* Error Submit */}
      {errors.submit && (
        <div className="p-3 rounded-xl bg-error-container/20 border border-error/20 text-error text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {errors.submit}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label htmlFor="nombre" className={labelStyle}>
          Nombre <span className="text-error">*</span>
        </label>
        <input
          type="text"
          id="nombre"
          value={formData.nombre}
          onChange={(e) => set('nombre', e.target.value)}
          disabled={isLoading}
          maxLength={200}
          placeholder="Ej: Pizza Margherita"
          className={`${inputBase} ${inputBorder(errors.nombre)}`}
        />
<<<<<<< HEAD
        {errors.nombre && <p className={errorTextStyle}>{errors.nombre}</p>}
=======
        {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
>>>>>>> origin/main
      </div>

      {/* Descripcion */}
      <div>
        <label htmlFor="descripcion" className={labelStyle}>
          Descripción
        </label>
        <textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          disabled={isLoading}
          rows={3}
          maxLength={500}
          placeholder="Descripción del producto..."
          className={`${inputBase} ${inputBorder(errors.descripcion)} resize-none`}
        />
<<<<<<< HEAD
        {errors.descripcion && <p className={errorTextStyle}>{errors.descripcion}</p>}
=======
        {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
>>>>>>> origin/main
      </div>

      {/* Precio y Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="precio_base" className={labelStyle}>
            Precio (ARS) <span className="text-error">*</span>
          </label>
<<<<<<< HEAD
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-on-surface-variant font-medium">$</span>
            </div>
            <input
              type="number"
              id="precio_base"
              value={formData.precio_base}
              onChange={(e) => set('precio_base', e.target.value)}
              disabled={isLoading}
              step="0.01"
              min="0.01"
              placeholder="19.99"
              className={`${inputBase} ${inputBorder(errors.precio_base)} pl-8`}
            />
          </div>
          {errors.precio_base && <p className={errorTextStyle}>{errors.precio_base}</p>}
=======
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
          {errors.precio_base && <p className="mt-1 text-sm text-red-600">{errors.precio_base}</p>}
>>>>>>> origin/main
        </div>

        <div>
          <label htmlFor="stock_cantidad" className={labelStyle}>
            Stock
          </label>
          <input
            type="number"
            id="stock_cantidad"
            value={formData.stock_cantidad}
<<<<<<< HEAD
            onChange={(e) => set('stock_cantidad', parseInt(e.target.value) || 0)}
=======
            onChange={(e) =>
              setFormData({ ...formData, stock_cantidad: parseInt(e.target.value) || 0 })
            }
>>>>>>> origin/main
            disabled={isLoading}
            min="0"
            placeholder="0"
            className={`${inputBase} ${inputBorder(errors.stock_cantidad)}`}
          />
          {errors.stock_cantidad && <p className={errorTextStyle}>{errors.stock_cantidad}</p>}
        </div>
      </div>

      {/* Disponible */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20">
        <input
          type="checkbox"
          id="disponible"
          checked={formData.disponible}
          onChange={(e) => set('disponible', e.target.checked)}
          disabled={isLoading}
          className="w-5 h-5 rounded border-outline-variant text-brand-600 focus:ring-brand-600/30"
        />
        <label htmlFor="disponible" className="text-sm text-on-surface cursor-pointer select-none">
          Producto disponible para venta
        </label>
      </div>

      {/* Categoría Principal */}
      <div>
        <label htmlFor="categoria_id" className={labelStyle}>
          Categoría Principal <span className="text-error">*</span>
        </label>
        <select
          id="categoria_id"
          value={formData.categoria_id}
<<<<<<< HEAD
          onChange={(e) => set('categoria_id', e.target.value ? parseInt(e.target.value) : '')}
=======
          onChange={(e) =>
            setFormData({
              ...formData,
              categoria_id: e.target.value ? parseInt(e.target.value) : '',
            })
          }
>>>>>>> origin/main
          disabled={isLoading}
          className={`${inputBase} ${inputBorder(errors.categoria_id)} appearance-none bg-no-repeat`}
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27%2357423b%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M8 11L3 6h10l-5 5z%27/%3E%3C/svg%3E")', backgroundPosition: 'right 12px center', paddingRight: '36px' }}
        >
          <option value="">Seleccionar categoría</option>
<<<<<<< HEAD
          {selectedCategorias.map((catId) => (
            <option key={catId} value={catId}>Categoría {catId}</option>
          ))}
        </select>
        {errors.categoria_id && <p className={errorTextStyle}>{errors.categoria_id}</p>}
=======
          {selectedCategorias.map((catId) => {
            // We'll rely on the categories selector to populate this
            return (
              <option key={catId} value={catId}>
                Categoría {catId}
              </option>
            );
          })}
        </select>
        {errors.categoria_id && <p className="mt-1 text-sm text-red-600">{errors.categoria_id}</p>}
>>>>>>> origin/main
      </div>

      {/* Categorías Adicionales */}
      <div>
<<<<<<< HEAD
        <p className={labelStyle}>Categorías Adicionales</p>
        <div className="mt-1">
          <CategoriesSelector
            value={selectedCategorias}
            onChange={setSelectedCategorias}
            disabled={isLoading}
            showPrincipal={true}
            principalId={principalCategoria}
            onPrincipalChange={setPrincipalCategoria}
          />
        </div>
=======
        <label
          htmlFor="categorias-adicionales"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
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
>>>>>>> origin/main
      </div>

      {/* Ingredientes */}
      <div>
        <p className={labelStyle}>Ingredientes</p>
        <div className="mt-1">
          <IngredientsSelector
            value={selectedIngredientes}
            onChange={setSelectedIngredientes}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-on-surface bg-surface-container-lowest border border-outline-variant/50 rounded-xl
                       hover:bg-surface-container transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-xl
                     hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600/40
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 inline-flex items-center gap-2"
        >
          {isLoading ? (
            <>
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
              Guardando...
<<<<<<< HEAD
            </>
          ) : isEditMode ? 'Actualizar Producto' : 'Crear Producto'}
=======
            </span>
          ) : isEditMode ? (
            'Actualizar'
          ) : (
            'Crear'
          )}
>>>>>>> origin/main
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
