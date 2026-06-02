import { Link } from 'react-router-dom';

interface ActionCard {
  label: string;
  icon: string;
  to: string;
  description: string;
}

const actions: ActionCard[] = [
  {
    label: 'Nuevo Producto',
    icon: 'add_box',
    to: '/admin/productos',
    description: 'Agregar un nuevo producto al catálogo',
  },
  {
    label: 'Nuevo Pedido',
    icon: 'post_add',
    to: '/admin/pedidos/nuevo',
    description: 'Crear un pedido manualmente',
  },
  {
    label: 'Usuarios',
    icon: 'group_add',
    to: '/admin/usuarios',
    description: 'Gestionar usuarios del sistema',
  },
  {
    label: 'Catálogo',
    icon: 'storefront',
    to: '/catalogo',
    description: 'Ver el catálogo público',
  },
];

export function QuickActions() {
  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="flex flex-col items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-high/50 p-4 text-center transition-all hover:bg-surface-container-high hover:border-brand-300 hover:shadow-sm"
          >
            <span
              className="material-symbols-outlined text-brand-600"
              style={{ fontSize: '28px', fontVariationSettings: '"wght" 400' }}
            >
              {action.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-on-surface">{action.label}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
