import { useMemo, type ReactNode } from 'react';
import type { Category } from '../hooks/useCategories';
import { Button, Badge } from '@/shared/ui';

interface CategoryListProps {
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
}

// ── Tree building ──

function buildCategoryTree(flat: Category[]): Category[] {
  const map = new Map<number, Category>();
  const roots: Category[] = [];
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(node);
    } else if (!c.parent_id) {
      roots.push(node);
    }
  });
  return roots;
}

// ── Tree node ──

function TreeNode({
  node,
  depth,
  onEdit,
  onDelete,
}: {
  node: Category;
  depth: number;
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
}): ReactNode {
  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 hover:bg-surface-container/30 transition-colors"
        style={{ paddingLeft: `${16 + depth * 28}px` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {depth > 0 && (
            <span className="text-outline-variant/40 select-none text-xs">└─</span>
          )}
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
              depth === 0
                ? 'gradient-brand-subtle'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: '"wght" 500' }}>
              {depth === 0 ? 'category' : 'subdirectory_arrow_right'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">{node.nombre}</p>
            {node.descripcion && (
              <p className="text-xs text-on-surface-variant/70 truncate">{node.descripcion}</p>
            )}
          </div>
          {node.children && node.children.length > 0 && (
            <Badge variant="neutral" size="sm">
              {node.children.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" icon="edit" onClick={() => onEdit(node)} aria-label={`Editar ${node.nombre}`}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="delete"
            onClick={() => onDelete(node.id)}
            aria-label={`Eliminar ${node.nombre}`}
            className="text-error hover:text-error hover:bg-error-container/50"
          >
            Eliminar
          </Button>
        </div>
      </div>
      {node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

// ── Main ──

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  if (categories.length === 0) {
    return (
      <div className="elevated-card flex flex-col items-center justify-center py-14 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container mb-4">
          <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: '32px', fontVariationSettings: '"wght" 300' }}>
            category
          </span>
        </div>
        <p className="text-sm font-medium text-on-surface mb-1">Sin categorías</p>
        <p className="text-xs text-on-surface-variant/70">Creá tu primera categoría usando el formulario</p>
      </div>
    );
  }

  return (
    <div className="elevated-card overflow-hidden !p-0 animate-fade-in-up">
      <div className="divide-y divide-outline-variant/10">
        {tree.map((node, i) => (
          <div key={node.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <TreeNode node={node} depth={0} onEdit={onEdit} onDelete={onDelete} />
          </div>
        ))}
      </div>
    </div>
  );
}
