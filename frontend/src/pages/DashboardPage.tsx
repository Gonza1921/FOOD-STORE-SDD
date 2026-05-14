import { useAuthStore } from '@/features/auth/store';
import { useProducts } from '@/features/products';
import { useCategories } from '@/features/categories';
import { useIngredients } from '@/features/ingredients';
import { Card } from '@/shared/ui';

export interface DashboardPageProps {}

// ── Stat card config ─────────────────────────────────────────────

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  href: string;
  gradient: string;
  badge?: string;
}

// ── Component ────────────────────────────────────────────────────

export default function DashboardPage(_props: DashboardPageProps) {
  const { user } = useAuthStore();
  const { total: productTotal, isLoading: prodLoading } = useProducts({ limit: 1 });
  const { categories, isLoading: catLoading } = useCategories();
  const { ingredients, isLoading: ingLoading } = useIngredients();

  const stats: StatCard[] = [
    {
      label: 'Productos',
      value: prodLoading ? '...' : (productTotal ?? 0),
      icon: 'inventory_2',
      href: '/admin/productos',
      gradient: 'from-brand-500 to-brand-700',
    },
    {
      label: 'Categorías',
      value: catLoading ? '...' : categories.length,
      icon: 'category',
      href: '/admin/categorias',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Ingredientes',
      value: ingLoading ? '...' : ingredients.length,
      icon: 'nutrition',
      href: '/admin/ingredientes',
      gradient: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="page-container animate-fade-in">
      {/* ── Welcome section ── */}
      <div className="mb-8">
        <h1 className="text-[26px] leading-[34px] font-bold text-on-surface">
          Bienvenido, {user?.nombre || 'Usuario'}
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Panel de administración de Food Store
        </p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, i) => (
          <a
            key={stat.label}
            href={stat.href}
            className="group relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-premium border border-outline-variant/10 p-5 
                       transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-0.5 active:scale-[0.99] block animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Gradient accent bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}
            />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-on-surface-variant/70 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-on-surface tabular-nums">
                  {stat.value}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '24px', fontVariationSettings: '"wght" 500' }}
                >
                  {stat.icon}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1 text-xs text-on-surface-variant/60 group-hover:text-brand-600 transition-colors duration-200">
              <span>Ver detalle</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </a>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-on-surface mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Nuevo producto', icon: 'add', href: '/admin/productos' },
            { label: 'Nueva categoría', icon: 'add', href: '/admin/categorias' },
            { label: 'Nuevo ingrediente', icon: 'add', href: '/admin/ingredientes' },
            { label: 'Catálogo público', icon: 'visibility', href: '/catalogo' },
          ].map((action, i) => (
            <a
              key={action.label}
              href={action.href}
              className="glass-card flex flex-col items-center justify-center gap-2 py-4 px-3 text-center
                         transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] animate-fade-in-up"
              style={{ animationDelay: `${(i + 3) * 80}ms` }}
            >
              <span
                className="material-symbols-outlined text-brand-600"
                style={{ fontSize: '22px', fontVariationSettings: '"wght" 500' }}
              >
                {action.icon}
              </span>
              <span className="text-xs font-medium text-on-surface">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Info card ── */}
      <Card variant="glass" className="!p-5 animate-fade-in-up" style={{ animationDelay: '400ms' } as React.CSSProperties}>
        <div className="flex items-start gap-3">
          <span
            className="material-symbols-outlined text-brand-600 mt-0.5"
            style={{ fontSize: '20px', fontVariationSettings: '"wght" 500' }}
          >
            info
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">
              Dashboard en construcción
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
              Las métricas en tiempo real, gráficos de ventas y estadísticas avanzadas
              estarán disponibles en próximas versiones (CH-020+).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
