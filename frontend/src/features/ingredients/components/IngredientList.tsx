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
