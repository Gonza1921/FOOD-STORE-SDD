import { useState, type FormEvent } from 'react';
import type { Category, CategoryFormData } from '../hooks/useCategories';

interface CategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>;
  initial?: CategoryFormData;
  categories: Category[];
  isLoading?: boolean;
}

export function CategoryForm({ onSubmit, initial, categories, isLoading }: CategoryFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '');
  const [parentId, setParentId] = useState<number | null>(initial?.parent_id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!initial;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        parent_id: parentId ?? undefined,
      });
      if (!isEditing) {
        setNombre('');
        setDescripcion('');
        setParentId(null);
      }
    } catch {
      setError('Error al guardar la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  const availableParents = categories.filter((c) => c.id !== initial?.parent_id);

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
      </h3>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Nombre de la categoría"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descripción opcional"
          rows={3}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="parentId" className="mb-1 block text-sm font-medium text-gray-700">
          Categoría Padre
        </label>
        <select
          id="parentId"
          value={parentId ?? ''}
          onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— Ninguna (raíz) —</option>
          {availableParents.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting || isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
      </button>
    </form>
  );
}
