import { useAdminMetrics } from '../hooks/useAdminMetrics';
import { useDashboardPeriod } from '../hooks/useDashboardPeriod';
import { MetricCard } from '../components/MetricCard';
import { ChartLine, ChartPie } from '../components/Charts';
import { TopProductosTable } from '../components/TopProductosTable';
import { VentasPeriodoChart } from '../components/VentasPeriodoChart';
import ConfigSection from '../components/ConfigSection';
import { LowStockAlerts } from '../components/LowStockAlerts';
import { RecentOrdersTable } from '../components/RecentOrdersTable';
import { RecentCustomersTable } from '../components/RecentCustomersTable';
import { StaffMetrics } from '../components/StaffMetrics';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { QuickActions } from '../components/QuickActions';
import { SalesTrendChart } from '../components/SalesTrendChart';
import Skeleton from '@/shared/ui/Skeleton';

export default function AdminDashboardPage() {
  const { period } = useDashboardPeriod();
  const { data: metrics, isLoading, error } = useAdminMetrics(period);

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

  const t = metrics?.tendencias;

  return (
    <div className="p-6 space-y-6">
      {/* Date range filter */}
      <DateRangeFilter />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Pedidos"
          value={metrics?.totalPedidos ?? 0}
          icon="shopping_bag"
          trend={t?.pedidos?.cambio !== undefined ? (t.pedidos.cambio > 0 ? 'up' : 'down') : undefined}
          trendValue={t?.pedidos?.cambio !== undefined ? `${t.pedidos.cambio > 0 ? '+' : ''}${t.pedidos.cambio}%` : undefined}
        />
        <MetricCard
          title="Ingresos Totales"
          value={`$${(metrics?.ingresosTotales ?? 0).toLocaleString('es-AR')}`}
          icon="payments"
          trend={t?.ingresos?.cambio !== undefined ? (t.ingresos.cambio > 0 ? 'up' : 'down') : undefined}
          trendValue={t?.ingresos?.cambio !== undefined ? `${t.ingresos.cambio > 0 ? '+' : ''}${t.ingresos.cambio}%` : undefined}
        />
        <MetricCard
          title="Total Clientes"
          value={metrics?.totalClientes ?? 0}
          icon="people"
          trend={t?.clientes?.cambio !== undefined ? (t.clientes.cambio > 0 ? 'up' : 'down') : undefined}
          trendValue={t?.clientes?.cambio !== undefined ? `${t.clientes.cambio > 0 ? '+' : ''}${t.clientes.cambio}%` : undefined}
        />
        <MetricCard
          title="Ticket Promedio"
          value={`$${(metrics?.ticketPromedio ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          icon="receipt"
          trend={t?.ticketPromedio?.cambio !== undefined ? (t.ticketPromedio.cambio > 0 ? 'up' : 'down') : undefined}
          trendValue={t?.ticketPromedio?.cambio !== undefined ? `${t.ticketPromedio.cambio > 0 ? '+' : ''}${t.ticketPromedio.cambio}%` : undefined}
        />
      </div>

      {/* Sales trend + Order status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesTrendChart periodo={period} />
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

      {/* Order trend */}
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">
          Tendencia de Pedidos ({period === 'today' ? 'Hoy' : period === '7d' ? 'Últimos 7 días' : period === '30d' ? 'Últimos 30 días' : 'Personalizado'})
        </h3>
        {metrics?.tendenciaPedidos?.length ? (
          <ChartLine data={metrics.tendenciaPedidos} dataKey="total" nameKey="fecha" height={250} />
        ) : (
          <div className="h-64 flex items-center justify-center text-on-surface-variant">
            Sin datos disponibles
          </div>
        )}
      </div>

      {/* Top products + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductosTable />
        <LowStockAlerts />
      </div>

      {/* Recent orders + Recent customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersTable periodo={period} />
        <RecentCustomersTable />
      </div>

      {/* Staff metrics + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StaffMetrics periodo={period} />
        <QuickActions />
      </div>

      {/* Ventas por período */}
      <VentasPeriodoChart />

      {/* Configuración del sistema */}
      <ConfigSection />
    </div>
  );
}
