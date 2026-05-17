interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className = ''
}: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className={`bg-surface-container rounded-2xl p-5 border border-outline-variant/20 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-on-surface-variant mb-1">{title}</p>
          <p className="text-3xl font-bold text-on-surface">{value}</p>
          {subtitle && (
            <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <p className={`text-xs font-medium mt-2 ${trendColors[trend]}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}