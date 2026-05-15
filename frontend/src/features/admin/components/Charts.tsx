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
  Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface ChartProps {
  data: unknown[];
  dataKey?: string;
  nameKey?: string;
  width?: number | string;
  height?: number;
}

// Gráfico de barras para ingresos por día
export function ChartBar({ data, dataKey = 'total', nameKey = 'fecha', width = '100%', height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
        <XAxis dataKey={nameKey} stroke="var(--on-surface-variant)" fontSize={12} />
        <YAxis stroke="var(--on-surface-variant)" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--surface-container)',
            border: '1px solid var(--outline-variant)',
            borderRadius: '8px'
          }}
        />
        <Bar dataKey={dataKey} fill="#6750A4" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Gráfico de línea para tendencia de pedidos
export function ChartLine({ data, dataKey = 'total', nameKey = 'fecha', width = '100%', height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
        <XAxis dataKey={nameKey} stroke="var(--on-surface-variant)" fontSize={12} />
        <YAxis stroke="var(--on-surface-variant)" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--surface-container)',
            border: '1px solid var(--outline-variant)',
            borderRadius: '8px'
          }}
        />
        <Line type="monotone" dataKey={dataKey} stroke="#6750A4" strokeWidth={2} dot={{ fill: '#6750A4' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Gráfico de torta para pedidos por estado
interface PieChartProps extends ChartProps {
  colors?: string[];
}

export function ChartPie({
  data,
  dataKey = 'value',
  nameKey = 'name',
  width = '100%',
  height = 300,
  colors = COLORS
}: PieChartProps) {
  // Transformar datos si viene como objeto { PENDIENTE: 5, CONFIRMADO: 10 }
  let chartData: { name: string; value: number }[];
  if (Array.isArray(data)) {
    chartData = data as { name: string; value: number }[];
  } else if (data && typeof data === 'object') {
    chartData = Object.entries(data as Record<string, number>).map(([name, value]) => ({ name, value }));
  } else {
    chartData = [];
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((_: unknown, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--surface-container)',
            border: '1px solid var(--outline-variant)',
            borderRadius: '8px'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}