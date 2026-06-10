import { Link } from 'react-router-dom';
import { useAdminLowStock } from '../hooks/useAdminLowStock';
import Skeleton from '@/shared/ui/Skeleton';

const severityBadgeColors: Record<string, string> = {
  critica: 'bg-red-100 text-red-800',
  media: 'bg-yellow-100 text-yellow-800',
};

export function LowStockAlerts() {
  const { data, isLoading, isError } = useAdminLowStock();

  if (isLoading) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Alertas de Stock Bajo</h3>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="text" width="w-32" />
              <Skeleton variant="text" width="w-12" className="ml-auto" />
              <Skeleton variant="text" width="w-12" />
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
        <h3 className="text-lg font-semibold text-on-surface mb-4">Alertas de Stock Bajo</h3>
        <p className="text-sm text-on-surface-variant">Error al cargar alertas de stock</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Alertas de Stock Bajo</h3>
        <div className="h-24 flex items-center justify-center gap-2 text-on-surface-variant text-sm">
          <span className="material-symbols-outlined text-green-500">check_circle</span>
          No hay productos con stock bajo
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Alertas de Stock Bajo</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Producto</th>
              <th className="text-right text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Stock Actual</th>
              <th className="text-right text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Mínimo</th>
              <th className="text-center text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Severidad</th>
              <th className="text-right text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {data.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors ${
                  item.severidad === 'critica' ? 'bg-red-50/40' : item.severidad === 'media' ? 'bg-yellow-50/40' : ''
                }`}
              >
                <td className="py-3 text-sm font-medium text-on-surface">{item.nombre}</td>
                <td className={`py-3 text-sm text-right tabular-nums font-semibold ${
                  item.severidad === 'critica' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {item.stock_cantidad}
                </td>
                <td className="py-3 text-sm text-on-surface-variant text-right tabular-nums">{item.stock_minimo}</td>
                <td className="py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase ${
                    severityBadgeColors[item.severidad] || 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.severidad}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <Link
                    to={`/admin/productos/${item.id}`}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Reabastecer
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
