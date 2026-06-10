import { useAdminMetrics } from '../hooks/useAdminMetrics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Skeleton from '@/shared/ui/Skeleton';

interface SalesTrendChartProps {
  periodo: string;
}

export function SalesTrendChart({ periodo }: SalesTrendChartProps) {
  const { data: metrics, isLoading, isError } = useAdminMetrics(periodo);

  if (isLoading) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Tendencia de Ventas</h3>
        <Skeleton variant="rectangular" height="h-72" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Tendencia de Ventas</h3>
        <p className="text-sm text-on-surface-variant">Error al cargar tendencia de ventas</p>
      </div>
    );
  }

  const ingresos = metrics?.ingresosPorDia ?? [];
  const tendencia = metrics?.tendenciaPedidos ?? [];

  if (!ingresos.length && !tendencia.length) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Tendencia de Ventas</h3>
        <div className="h-72 flex items-center justify-center text-on-surface-variant text-sm">
          Sin datos disponibles
        </div>
      </div>
    );
  }

  // Merge data by fecha for combined chart
  const dateMap = new Map<string, { fecha: string; Ventas: number; Ordenes: number }>();
  for (const d of ingresos) {
    dateMap.set(d.fecha, { fecha: d.fecha, Ventas: d.total, Ordenes: 0 });
  }
  for (const d of tendencia) {
    const existing = dateMap.get(d.fecha);
    if (existing) {
      existing.Ordenes = d.total;
    } else {
      dateMap.set(d.fecha, { fecha: d.fecha, Ventas: 0, Ordenes: d.total });
    }
  }

  const chartData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Tendencia de Ventas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
          <XAxis dataKey="fecha" stroke="var(--on-surface-variant)" fontSize={12} />
          <YAxis stroke="var(--on-surface-variant)" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-container)',
              border: '1px solid var(--outline-variant)',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Ventas"
            stroke="#6750A4"
            strokeWidth={2}
            dot={{ fill: '#6750A4' }}
            name="Ventas ($)"
          />
          <Line
            type="monotone"
            dataKey="Ordenes"
            stroke="#00C49F"
            strokeWidth={2}
            dot={{ fill: '#00C49F' }}
            name="Órdenes"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
