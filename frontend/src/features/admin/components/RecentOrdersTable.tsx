import { Link } from 'react-router-dom';
import { useAdminRecentOrders } from '../hooks/useAdminRecentOrders';
import Skeleton from '@/shared/ui/Skeleton';

interface RecentOrdersTableProps {
  periodo: string;
}

const estadoColors: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  ENTREGADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
  EN_PREPARACION: 'bg-orange-100 text-orange-800',
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'hace minutos';
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString('es-AR');
}

export function RecentOrdersTable({ periodo }: RecentOrdersTableProps) {
  const { data, isLoading, isError } = useAdminRecentOrders(periodo);

  if (isLoading) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Órdenes Recientes</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="text" width="w-8" />
              <Skeleton variant="text" width="w-28" />
              <Skeleton variant="text" width="w-16" className="ml-auto" />
              <Skeleton variant="text" width="w-20" />
              <Skeleton variant="text" width="w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Órdenes Recientes</h3>
        <p className="text-sm text-on-surface-variant">Error al cargar órdenes recientes</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Órdenes Recientes</h3>
        <div className="h-24 flex items-center justify-center text-on-surface-variant text-sm">
          No hay órdenes recientes
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Órdenes Recientes</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider w-8">#</th>
              <th className="text-left text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Cliente</th>
              <th className="text-right text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Total</th>
              <th className="text-center text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Estado</th>
              <th className="text-right text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {data.map((order) => (
              <tr key={order.id} className="hover:bg-surface-container-high/50 transition-colors">
                <td className="py-3 text-sm font-medium text-on-surface-variant">
                  <Link to={`/admin/pedidos/${order.id}`} className="text-brand-600 hover:underline">
                    #{order.id}
                  </Link>
                </td>
                <td className="py-3 text-sm text-on-surface">{order.cliente_nombre}</td>
                <td className="py-3 text-sm text-on-surface text-right tabular-nums font-medium">
                  ${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                    estadoColors[order.estado_codigo] || 'bg-gray-100 text-gray-700'
                  }`}>
                    {order.estado_codigo}
                  </span>
                </td>
                <td className="py-3 text-sm text-on-surface-variant text-right tabular-nums">
                  {formatRelativeDate(order.creado_en)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
