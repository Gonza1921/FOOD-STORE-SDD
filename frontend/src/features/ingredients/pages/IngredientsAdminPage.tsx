import { useEffect, useState } from 'react';
import { useIngredients, type Ingredient, type IngredientFormData } from '../hooks/useIngredients';
import { IngredientList } from '../components/IngredientList';
import { IngredientForm } from '../components/IngredientForm';
import { Button } from '@/shared/ui';

export function IngredientsAdminPage() {
  const { ingredients, isLoading, error, create, update, remove, refetch } = useIngredients();
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    refetch();
  }, [refetch]);

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreate = async (data: IngredientFormData) => {
    try {
      await create(data);
      showFeedback('Ingrediente creado exitosamente');
    } catch {
      showFeedback('Error al crear el ingrediente', 'error');
    }
  };

  const handleUpdate = async (data: IngredientFormData) => {
    if (!editing) return;
    try {
      await update(editing.id, data);
      setEditing(null);
      showFeedback('Ingrediente actualizado exitosamente');
    } catch {
      showFeedback('Error al actualizar el ingrediente', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este ingrediente?')) return;
    try {
      await remove(id);
      showFeedback('Ingrediente eliminado exitosamente');
    } catch {
      showFeedback('Error al eliminar el ingrediente', 'error');
    }
  };

  const startEdit = (ing: Ingredient) => {
    setEditing(ing);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  return (
    <div className="page-container animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="page-heading">Gestión de Ingredientes</h1>
        <p className="page-subtitle">Administrá los ingredientes del catálogo</p>
      </div>

      {/* ── Feedback ── */}
      {feedback && (
        <div className={`mb-4 animate-slide-in-right feedback-banner--${feedbackType}`}>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"wght" 500' }}>
              {feedbackType === 'success' ? 'check_circle' : 'error'}
            </span>
            {feedback}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 feedback-banner--error animate-slide-in-right">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"wght" 500' }}>
              error
            </span>
            {error}
          </span>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading && ingredients.length === 0 ? (
            <div className="elevated-card flex items-center justify-center py-12">
              <p className="text-sm text-on-surface-variant">Cargando ingredientes...</p>
            </div>
          ) : (
            <IngredientList ingredients={ingredients} onEdit={startEdit} onDelete={handleDelete} />
          )}
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <IngredientForm
            key={editing?.id ?? 'create'}
            onSubmit={editing ? handleUpdate : handleCreate}
            initial={
              editing
<<<<<<< HEAD
                ? { nombre: editing.nombre, descripcion: editing.descripcion, es_alergeno: editing.es_alergeno }
=======
                ? {
                    nombre: editing.nombre,
                    descripcion: editing.descripcion,
                    es_alergeno: editing.es_alergeno,
                  }
>>>>>>> origin/main
                : undefined
            }
            isLoading={isLoading}
          />
          {editing && (
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={cancelEdit}>
              Cancelar edición
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IngredientsAdminPage;
