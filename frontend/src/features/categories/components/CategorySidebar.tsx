import { useState } from 'react';
import type { PublicCategory } from '../hooks/usePublicCategories';

interface CategorySidebarProps {
  title: string;
  subcategorias: PublicCategory[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
}

export default function CategorySidebar({
  title,
  subcategorias,
  selectedIds,
  onSelectionChange,
}: CategorySidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggle = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const content = (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h3>
      {subcategorias.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Sin subcategorías</p>
      ) : (
        <ul className="space-y-2">
          {subcategorias.map((sub) => (
            <li key={sub.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface transition-colors hover:text-brand-600">
                <input
                  type="checkbox"
                  checked={selectedIds.has(sub.id)}
                  onChange={() => handleToggle(sub.id)}
                  className="h-4 w-4 rounded border-outline-variant text-brand-600 focus:ring-brand-500"
                />
                <span>{sub.nombre}</span>
                <span className="ml-auto text-xs text-on-surface-variant">
                  ({sub.producto_count})
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block">
        <div className="rounded-2xl bg-surface p-5 shadow-premium-sm">
          {content}
        </div>
      </aside>

      {/* Mobile dropdown */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex w-full items-center justify-between rounded-2xl bg-surface px-5 py-3 shadow-premium-sm transition-colors hover:bg-surface-container-highest"
        >
          <span className="text-sm font-semibold text-on-surface">
            {title} ({selectedIds.size > 0 ? selectedIds.size : 'Todas'})
          </span>
          <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200 data-[open=true]:rotate-180">
            {isMobileOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        {isMobileOpen && (
          <div className="mt-2 rounded-2xl bg-surface p-5 shadow-premium-sm">
            {content}
          </div>
        )}
      </div>
    </>
  );
}
