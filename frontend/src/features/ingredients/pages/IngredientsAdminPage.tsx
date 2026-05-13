import { useEffect, useState } from 'react';
import { useIngredients, type Ingredient, type IngredientFormData } from '../hooks/useIngredients';
import { IngredientList } from '../components/IngredientList';
import { IngredientForm } from '../components/IngredientForm';

export function IngredientsAdminPage() {
  const { ingredients, isLoading, error, create, update, remove, refetch } = useIngredients();
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleCreate = async (data: IngredientFormData) => {
    await create(data);
    setFeedback('Ingrediente creado exitosamente');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleUpdate = async (data: IngredientFormData) => {
    if (!editing) return;
    await update(editing.id, data);
    setEditing(null);
    setFeedback('Ingrediente actualizado exitosamente');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este ingrediente?')) return;
    await remove(id);
    setFeedback('Ingrediente eliminado exitosamente');
    setTimeout(() => setFeedback(null), 3000);
  };

  const startEdit = (ing: Ingredient) => {
    setEditing(ing);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Gestión de Ingredientes</h1>

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
          {isLoading && ingredients.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg bg-white p-12 shadow">
              <p className="text-gray-500">Cargando ingredientes...</p>
            </div>
          ) : (
            <IngredientList ingredients={ingredients} onEdit={startEdit} onDelete={handleDelete} />
          )}
        </div>

        <div>
          <IngredientForm
            key={editing?.id ?? 'create'}
            onSubmit={editing ? handleUpdate : handleCreate}
            initial={
              editing
                ? {
                    nombre: editing.nombre,
                    descripcion: editing.descripcion,
                    es_alergeno: editing.es_alergeno,
                  }
                : undefined
            }
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
