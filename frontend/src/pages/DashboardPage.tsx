import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAdminAnalyticsDashboard } from '@/features/admin/hooks/useAdminAnalyticsDashboard';
import { MetricCard } from '@/features/admin/components/MetricCard';
import Skeleton from '@/shared/ui/Skeleton';

// ── Constants ─────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: '7d' | '30d' | '90d' | '1y'; label: string }[] = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: '1y', label: 'Último año' },
];

const CHART_COLORS = [
  '#6750A4', '#625B71', '#7C5264', '#9A4A4A',
  '#B94E3A', '#D85C2B', '#F46A1C', '#FF8F12',
  '#FFB422', '#FFD53E',
];

const PIE_COLORS = ['#6750A4', '#625B71', '#7C5264', '#9A4A4A', '#B94E3A'];

// ── Helpers ────────────────────────────────────────────────────────

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const formatNumber = (value: number): string =>
  value.toLocaleString('es-AR');

// ── Chart tooltip styles (dark-mode compatible) ───────────────────

const tooltipStyle = {
  backgroundColor: 'var(--surface-container)',
  border: '1px solid var(--outline-variant)',
  borderRadius: '8px',
  color: 'var(--on-surface)',
  fontSize: '13px',
};

// ── Chart Skeleton ────────────────────────────────────────────────

function ChartSkeleton() {
  return <Skeleton variant="rectangular" height="h-[300px]" />;
}

// ── Period Filter ─────────────────────────────────────────────────

function PeriodFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: '7d' | '30d' | '90d' | '1y') => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-outline-variant/30 bg-surface-container p-1 gap-1">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            value === opt.value
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Chart wrapper ─────────────────────────────────────────────────

function ChartCard({
  title,
  children,
  isEmpty,
  emptyMessage = 'Sin datos disponibles',
}: {
  title: string;
  children: React.ReactNode;
  isEmpty: boolean;
  emptyMessage?: string;
}) {
  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <h3 className="text-lg font-semibold text-on-surface mb-4">{title}</h3>
      {isEmpty ? (
        <div className="h-[300px] flex items-center justify-center text-on-surface-variant text-sm">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { data, isLoading, error } = useAdminAnalyticsDashboard(periodo);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="mb-8">
          <Skeleton variant="text" width="w-64" height="h-8" />
          <Skeleton variant="text" width="w-48" height="h-4" className="mt-2" />
        </div>
        <div className="flex gap-2 mb-8">
          {PERIOD_OPTIONS.map((_, i) => (
            <Skeleton key={i} width="w-32" height="h-10" rounded="rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} variant="card" height="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="mb-6">
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="page-container animate-fade-in">
        <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '22px' }}
          >
            error
          </span>
          <span className="text-sm font-medium">
            Error al cargar métricas del dashboard
          </span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ── Data prepared for charts ──
  const ventasPorMes = data.ventas_por_mes ?? [];
  const ventasPorDia = data.ventas_por_dia ?? [];
  const productosMasVendidos = data.productos_mas_vendidos ?? [];
  const categoriasMasVendidas = data.categorias_mas_vendidas ?? [];

  return (
    <div className="page-container animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[26px] leading-[34px] font-bold text-on-surface">
            Dashboard de Métricas
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Analytics y estadísticas del sistema en tiempo real
          </p>
        </div>
        <PeriodFilter value={periodo} onChange={setPeriodo} />
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Ventas Totales"
          value={formatCurrency(data.ventas_totales)}
          icon="payments"
        />
        <MetricCard
          title="Ventas del Mes"
          value={formatCurrency(data.ventas_mes)}
          icon="trending_up"
        />
        <MetricCard
          title="Pedidos Totales"
          value={formatNumber(data.pedidos_totales)}
          icon="shopping_bag"
        />
        <MetricCard
          title="Pedidos Pendientes"
          value={formatNumber(data.pedidos_pendientes)}
          icon="pending_actions"
        />
        <MetricCard
          title="Usuarios Registrados"
          value={formatNumber(data.usuarios_totales)}
          icon="person"
        />
        <MetricCard
          title="Productos Activos"
          value={formatNumber(data.productos_totales)}
          icon="inventory_2"
        />
        <MetricCard
          title="Ticket Promedio"
          value={formatCurrency(data.ticket_promedio)}
          icon="receipt"
        />
      </div>

      {/* ── Charts: Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ventas por Día (Line) */}
        <ChartCard
          title="Ventas por Día"
          isEmpty={ventasPorDia.length === 0}
          emptyMessage="Sin datos de ventas diarias"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasPorDia} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
              <XAxis
                dataKey="fecha"
                stroke="var(--on-surface-variant)"
                fontSize={11}
                tickFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00');
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis stroke="var(--on-surface-variant)" fontSize={11} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                labelFormatter={(label: string) => {
                  const d = new Date(label + 'T00:00:00');
                  return d.toLocaleDateString('es-AR');
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6750A4"
                strokeWidth={2}
                dot={{ fill: '#6750A4', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Ventas por Mes (Bar) */}
        <ChartCard
          title="Ventas por Mes"
          isEmpty={ventasPorMes.length === 0}
          emptyMessage="Sin datos de ventas mensuales"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorMes} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
              <XAxis
                dataKey="mes"
                stroke="var(--on-surface-variant)"
                fontSize={11}
                tickFormatter={(v: string) => {
                  // v = "YYYY-MM"
                  const parts = v.split('-');
                  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                  return `${months[parseInt(parts[1], 10) - 1]}`;
                }}
              />
              <YAxis stroke="var(--on-surface-variant)" fontSize={11} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                labelFormatter={(label: string) => {
                  const parts = label.split('-');
                  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                  return `${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
                }}
              />
              <Bar dataKey="total" fill="#625B71" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Charts: Row 2 ── */}
      <div className="mb-6">
        {/* Productos Más Vendidos (Horizontal Bar) */}
        <ChartCard
          title="Productos Más Vendidos"
          isEmpty={productosMasVendidos.length === 0}
          emptyMessage="Sin datos de productos vendidos"
        >
          <ResponsiveContainer width="100%" height={Math.max(200, productosMasVendidos.length * 40)}>
            <BarChart
              data={productosMasVendidos}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
              <XAxis type="number" stroke="var(--on-surface-variant)" fontSize={11} />
              <YAxis
                type="category"
                dataKey="producto"
                stroke="var(--on-surface-variant)"
                fontSize={11}
                width={110}
                tickFormatter={(v: string) =>
                  v.length > 18 ? v.substring(0, 16) + '...' : v
                }
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatNumber(value), 'Cantidad vendida']}
              />
              <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                {productosMasVendidos.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Charts: Row 3 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Categorías Más Vendidas (Pie) */}
        <ChartCard
          title="Categorías Más Vendidas"
          isEmpty={categoriasMasVendidas.length === 0}
          emptyMessage="Sin datos de categorías"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoriasMasVendidas}
                dataKey="cantidad"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                outerRadius={90}
label={({ percent }: { percent: number }) =>
  `${(percent * 100).toFixed(0)}%`
}
              >
                {categoriasMasVendidas.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, _name: string) => [formatNumber(value), 'Cantidad']}
              />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: 'var(--on-surface-variant)', fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
