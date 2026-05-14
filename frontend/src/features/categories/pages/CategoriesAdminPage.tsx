import { useEffect, useState } from 'react';
import { useCategories, type Category, type CategoryFormData } from '../hooks/useCategories';
import { CategoryList } from '../components/CategoryList';
import { CategoryForm } from '../components/CategoryForm';
import { Button } from '@/shared/ui';

export function CategoriesAdminPage() {
  const { categories, isLoading, error, create, update, remove, refetch } = useCategories();
  const [editing, setEditing] = useState<Category | null>(null);
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

  const handleCreate = async (data: CategoryFormData) => {
    try {
      await create(data);
      showFeedback('Categoría creada exitosamente');
    } catch {
      showFeedback('Error al crear la categoría', 'error');
    }
  };

  const handleUpdate = async (data: CategoryFormData) => {
    if (!editing) return;
    try {
      await update(editing.id, data);
      setEditing(null);
      showFeedback('Categoría actualizada exitosamente');
    } catch {
      showFeedback('Error al actualizar la categoría', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await remove(id);
      showFeedback('Categoría eliminada exitosamente');
    } catch {
      showFeedback('Error al eliminar la categoría', 'error');
    }
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  return (
    <div className="page-container animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="page-heading">Gestión de Categorías</h1>
        <p className="page-subtitle">Organizá tu catálogo en categorías jerárquicas</p>
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
          {isLoading && categories.length === 0 ? (
            <div className="elevated-card flex items-center justify-center py-12">
              <p className="text-sm text-on-surface-variant">Cargando categorías...</p>
            </div>
          ) : (
            <CategoryList categories={categories} onEdit={startEdit} onDelete={handleDelete} />
          )}
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <CategoryForm
            key={editing?.id ?? 'create'}
            onSubmit={editing ? handleUpdate : handleCreate}
            initial={
              editing
                ? { nombre: editing.nombre, descripcion: editing.descripcion, parent_id: editing.parent_id }
                : undefined
            }
            categories={categories}
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

export default CategoriesAdminPage;
