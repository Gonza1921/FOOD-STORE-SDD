import { useAdminTopProductos } from '../hooks/useAdminTopProductos';
import Skeleton from '@/shared/ui/Skeleton';

export function TopProductosTable() {
  const { data, isLoading, isError } = useAdminTopProductos(10);

  if (isLoading) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Top 10 Productos más Vendidos</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="text" width="w-6" height="h-4" />
              <Skeleton variant="text" width="w-40" />
              <Skeleton variant="text" width="w-16" className="ml-auto" />
              <Skeleton variant="text" width="w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Top 10 Productos más Vendidos</h3>
        <p className="text-sm text-on-surface-variant">Error al cargar los datos</p>
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Top 10 Productos más Vendidos</h3>
        <div className="h-32 flex items-center justify-center text-on-surface-variant text-sm">
          Sin datos de ventas disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Top 10 Productos más Vendidos</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider w-8">#</th>
              <th className="text-left text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Producto</th>
              <th className="text-right text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Precio</th>
              <th className="text-right text-xs font-medium text-on-surface-variant pb-2 uppercase tracking-wider">Total Vendido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {data.items.map((product, index) => (
              <tr key={product.id} className="hover:bg-surface-container-high/50 transition-colors">
                <td className="py-3 text-sm font-medium text-on-surface-variant">
                  {index + 1}
                </td>
                <td className="py-3 text-sm font-medium text-on-surface">
                  {product.nombre}
                </td>
                <td className="py-3 text-sm text-on-surface-variant text-right tabular-nums">
                  ${Number(product.precio_base).toFixed(2)}
                </td>
                <td className="py-3 text-sm font-semibold text-on-surface text-right tabular-nums">
                  {product.total_vendido}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
