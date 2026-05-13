import { useMemo, type ReactNode } from 'react';
import type { Category } from '../hooks/useCategories';

interface CategoryListProps {
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
}

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
      <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
        <td
          className="px-4 py-3 text-sm text-gray-800"
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          <span className="flex items-center gap-2">
            {depth > 0 && <span className="text-xs text-gray-400">└─</span>}
            <span className="font-medium">{node.nombre}</span>
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{node.descripcion ?? '—'}</td>
        <td className="px-4 py-3 text-sm">
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(node)}
              className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
      {node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  if (categories.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-gray-500">No hay categorías registradas.</p>
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
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {tree.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
