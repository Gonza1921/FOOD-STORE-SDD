import { useEffect, useState } from 'react';
import { useCategories, type Category, type CategoryFormData } from '../hooks/useCategories';
import { CategoryList } from '../components/CategoryList';
import { CategoryForm } from '../components/CategoryForm';

export function CategoriesAdminPage() {
  const { categories, isLoading, error, create, update, remove, refetch } = useCategories();
  const [editing, setEditing] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleCreate = async (data: CategoryFormData) => {
    await create(data);
    setFeedback('Categoría creada exitosamente');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleUpdate = async (data: CategoryFormData) => {
    if (!editing) return;
    await update(editing.id, data);
    setEditing(null);
    setFeedback('Categoría actualizada exitosamente');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
    await remove(id);
    setFeedback('Categoría eliminada exitosamente');
    setTimeout(() => setFeedback(null), 3000);
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Gestión de Categorías</h1>

      {feedback && (
        <div className="mb-4 rounded border border-green-400 bg-green-50 px-4 py-2 text-sm text-green-700">
          {feedback}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading && categories.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg bg-white p-12 shadow">
              <p className="text-gray-500">Cargando categorías...</p>
            </div>
          ) : (
            <CategoryList categories={categories} onEdit={startEdit} onDelete={handleDelete} />
          )}
        </div>

        <div>
          <CategoryForm
            key={editing?.id ?? 'create'}
            onSubmit={editing ? handleUpdate : handleCreate}
            initial={
              editing
                ? {
                    nombre: editing.nombre,
                    descripcion: editing.descripcion,
                    parent_id: editing.parent_id,
                  }
                : undefined
            }
            categories={categories}
            isLoading={isLoading}
          />
          {editing && (
            <button
              onClick={cancelEdit}
              className="mt-2 w-full rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
