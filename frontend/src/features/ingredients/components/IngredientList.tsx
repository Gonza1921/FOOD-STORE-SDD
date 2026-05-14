import type { Ingredient } from '../hooks/useIngredients';
import { Badge, Button } from '@/shared/ui';

interface IngredientListProps {
  ingredients: Ingredient[];
  onEdit: (ing: Ingredient) => void;
  onDelete: (id: number) => void;
}

export function IngredientList({ ingredients, onEdit, onDelete }: IngredientListProps) {
  if (ingredients.length === 0) {
    return (
      <div className="elevated-card flex flex-col items-center justify-center py-14 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container mb-4">
          <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: '32px', fontVariationSettings: '"wght" 300' }}>
            nutrition
          </span>
        </div>
        <p className="text-sm font-medium text-on-surface mb-1">Sin ingredientes</p>
        <p className="text-xs text-on-surface-variant/70">Creá tu primer ingrediente usando el formulario</p>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="elevated-card overflow-hidden !p-0 animate-fade-in-up">
      <div className="divide-y divide-outline-variant/10">
        {ingredients.map((ing, i) => (
          <div
            key={ing.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-surface-container/30 transition-colors animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                ing.es_alergeno
                  ? 'bg-error-container text-error'
                  : 'bg-surface-container text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: '"wght" 400' }}>
                  {ing.es_alergeno ? 'warning' : 'nutrition'}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-on-surface truncate">{ing.nombre}</p>
                  {ing.es_alergeno && <Badge variant="error" size="sm" dot>Alérgeno</Badge>}
=======
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
>>>>>>> origin/main
                </div>
                {ing.descripcion && (
                  <p className="text-xs text-on-surface-variant/70 truncate">{ing.descripcion}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="ghost" size="sm" icon="edit" onClick={() => onEdit(ing)} aria-label={`Editar ${ing.nombre}`}>
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon="delete"
                onClick={() => onDelete(ing.id)}
                aria-label={`Eliminar ${ing.nombre}`}
                className="text-error hover:text-error hover:bg-error-container/50"
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
