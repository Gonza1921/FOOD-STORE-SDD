import type { Ingredient } from '../hooks/useIngredients';

interface IngredientListProps {
  ingredients: Ingredient[];
  onEdit: (ing: Ingredient) => void;
  onDelete: (id: number) => void;
}

export function IngredientList({ ingredients, onEdit, onDelete }: IngredientListProps) {
  if (ingredients.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-gray-500">No hay ingredientes registrados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Nombre
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Descripción
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Alérgeno
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => (
            <tr
              key={ing.id}
              className="border-b border-gray-100 transition-colors hover:bg-gray-50"
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-800">{ing.nombre}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{ing.descripcion ?? '—'}</td>
              <td className="px-4 py-3 text-sm">
                {ing.es_alergeno ? (
                  <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    Sí
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    No
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(ing)}
                    className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(ing.id)}
                    className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
