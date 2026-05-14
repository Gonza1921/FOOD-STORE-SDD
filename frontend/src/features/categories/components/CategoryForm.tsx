import { useState, type FormEvent } from 'react';
import type { Category, CategoryFormData } from '../hooks/useCategories';
import { Button, Input } from '@/shared/ui';

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
    <div className="elevated-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand-subtle">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: '"wght" 500' }}>
            {isEditing ? 'edit' : 'add'}
          </span>
        </div>
        <h3 className="text-base font-semibold text-on-surface">
          {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="feedback-banner--error">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"wght" 500' }}>
                error
              </span>
              {error}
            </span>
          </div>
        )}

        <Input id="cat-nombre" label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la categoría" required />

        <div>
          <label htmlFor="cat-descripcion" className="mb-1.5 block text-sm font-medium text-on-surface">Descripción</label>
          <textarea
            id="cat-descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="block w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:border-brand-600 focus:ring-brand-600/20 transition-all shadow-sm"
            placeholder="Descripción opcional"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="cat-parentId" className="mb-1.5 block text-sm font-medium text-on-surface">Categoría Padre</label>
          <select
            id="cat-parentId"
            value={parentId ?? ''}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
            className="block w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:border-brand-600 focus:ring-brand-600/20 transition-all shadow-sm"
          >
            <option value="">— Ninguna (raíz) —</option>
            {availableParents.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        <Button type="submit" variant="premium" size="md" className="w-full" disabled={submitting || isLoading} isLoading={submitting}>
          {isEditing ? 'Actualizar' : 'Crear'}
        </Button>
      </form>
    </div>
  );
}
