import { Link } from 'react-router-dom';
import { useAdminRecentCustomers } from '../hooks/useAdminRecentCustomers';
import Skeleton from '@/shared/ui/Skeleton';

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'hace minutos';
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  if (diffDays < 30) return `hace ${diffDays}d`;
  return date.toLocaleDateString('es-AR');
}

export function RecentCustomersTable() {
  const { data, isLoading, isError } = useAdminRecentCustomers();

  if (isLoading) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Clientes Recientes</h3>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="text" width="w-28" />
              <Skeleton variant="text" width="w-32" />
              <Skeleton variant="text" width="w-16" className="ml-auto" />
              <Skeleton variant="text" width="w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Clientes Recientes</h3>
        <p className="text-sm text-on-surface-variant">Error al cargar clientes recientes</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Clientes Recientes</h3>
        <div className="h-24 flex items-center justify-center text-on-surface-variant text-sm">
          No hay clientes registrados
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Clientes Recientes</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Nombre</th>
              <th className="text-left text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Email</th>
              <th className="text-right text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Registrado</th>
              <th className="text-center text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Órdenes</th>
              <th className="text-right text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {data.map((customer) => (
              <tr key={customer.id} className="hover:bg-surface-container-high/50 transition-colors">
                <td className="py-3 text-sm font-medium text-on-surface">{customer.nombre}</td>
                <td className="py-3 text-sm text-on-surface-variant">{customer.email}</td>
                <td className="py-3 text-sm text-on-surface-variant text-right tabular-nums">
                  {formatRelativeDate(customer.creado_en)}
                </td>
                <td className="py-3 text-sm text-on-surface text-center font-medium tabular-nums">
                  {customer.total_ordenes}
                </td>
                <td className="py-3 text-right">
                  <Link
                    to={`/admin/usuarios/${customer.id}`}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
