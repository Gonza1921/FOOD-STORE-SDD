import { useAdminMetrics } from '../hooks/useAdminMetrics';
import { MetricCard } from '../components/MetricCard';
import { ChartBar, ChartLine, ChartPie } from '../components/Charts';
import { TopProductosTable } from '../components/TopProductosTable';
import { VentasPeriodoChart } from '../components/VentasPeriodoChart';
import Skeleton from '@/shared/ui/Skeleton';

export default function AdminDashboardPage() {
  const { data: metrics, isLoading, error } = useAdminMetrics();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-error-container text-on-error-container p-4 rounded-xl">
          Error al cargar métricas del dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Pedidos"
          value={metrics?.totalPedidos ?? 0}
          icon="shopping_bag"
        />
        <MetricCard
          title="Pedidos Pendientes"
          value={metrics?.pedidosPendientes ?? 0}
          icon="pending"
        />
        <MetricCard
          title="Ingresos Totales"
          value={`$${(metrics?.ingresosTotales ?? 0).toLocaleString('es-AR')}`}
          icon="payments"
        />
        <MetricCard
          title="Stock Bajo"
          value={metrics?.productosStockBajo ?? 0}
          icon="inventory_2"
          subtitle="Productos con menos de 10 unidades"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por período */}
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
          <h3 className="text-lg font-semibold text-on-surface mb-4">
            Ingresos por Período (Últimos 30 días)
          </h3>
          {metrics?.ingresosPorDia?.length ? (
            <ChartBar data={metrics.ingresosPorDia} dataKey="total" nameKey="fecha" height={250} />
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant">
              Sin datos disponibles
            </div>
          )}
        </div>

        {/* Pedidos por estado */}
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
          <h3 className="text-lg font-semibold text-on-surface mb-4">
            Pedidos por Estado
          </h3>
          {metrics?.pedidosPorEstado && Object.keys(metrics.pedidosPorEstado).length > 0 ? (
            <ChartPie data={Object.entries(metrics.pedidosPorEstado).map(([name, value]) => ({ name, value }))} height={250} />
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant">
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Tendencia de pedidos */}
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">
          Tendencia de Pedidos (Últimos 7 días)
        </h3>
        {metrics?.tendenciaPedidos?.length ? (
          <ChartLine data={metrics.tendenciaPedidos} dataKey="total" nameKey="fecha" height={250} />
        ) : (
          <div className="h-64 flex items-center justify-center text-on-surface-variant">
            Sin datos disponibles
          </div>
        )}
      </div>

      {/* Nuevos widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductosTable />
        <VentasPeriodoChart />
      </div>
    </div>
  );
}