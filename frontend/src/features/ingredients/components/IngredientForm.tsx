import { useState, type FormEvent } from 'react';
import type { IngredientFormData } from '../hooks/useIngredients';
import { Button, Input } from '@/shared/ui';

interface IngredientFormProps {
  onSubmit: (data: IngredientFormData) => Promise<void>;
  initial?: IngredientFormData;
  isLoading?: boolean;
}

export function IngredientForm({ onSubmit, initial, isLoading }: IngredientFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '');
  const [esAlergeno, setEsAlergeno] = useState(initial?.es_alergeno ?? false);
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
        es_alergeno: esAlergeno,
      });
      if (!isEditing) {
        setNombre('');
        setDescripcion('');
        setEsAlergeno(false);
      }
    } catch {
      setError('Error al guardar el ingrediente');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="elevated-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand-subtle">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: '"wght" 500' }}>
            {isEditing ? 'edit' : 'add'}
          </span>
        </div>
        <h3 className="text-base font-semibold text-on-surface">
          {isEditing ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
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

        <Input id="ing-nombre" label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del ingrediente" required />

        <div>
          <label htmlFor="ing-descripcion" className="mb-1.5 block text-sm font-medium text-on-surface">Descripción</label>
          <textarea
            id="ing-descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="block w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:border-brand-600 focus:ring-brand-600/20 transition-all shadow-sm"
            placeholder="Descripción opcional"
            rows={3}
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={esAlergeno}
            onChange={(e) => setEsAlergeno(e.target.checked)}
            className="h-5 w-5 rounded-lg border-outline-variant text-brand-600 focus:ring-brand-600/20 focus:ring-2 focus:ring-offset-0 transition-colors"
          />
          <span className="text-sm font-medium text-on-surface">Es alérgeno</span>
        </label>

        <Button type="submit" variant="premium" size="md" className="w-full" disabled={submitting || isLoading} isLoading={submitting}>
          {isEditing ? 'Actualizar' : 'Crear'}
        </Button>
      </form>
    </div>
  );
}
