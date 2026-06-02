import { useAdminStaffMetrics } from '../hooks/useAdminStaffMetrics';
import Skeleton from '@/shared/ui/Skeleton';

interface StaffMetricsProps {
  periodo: string;
}

export function StaffMetrics({ periodo }: StaffMetricsProps) {
  const { data, isLoading, isError } = useAdminStaffMetrics(periodo);

  if (isLoading) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Métricas Operativas</h3>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Métricas Operativas</h3>
        <p className="text-sm text-on-surface-variant">Error al cargar métricas operativas</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Métricas Operativas</h3>
        <div className="h-24 flex items-center justify-center text-on-surface-variant text-sm">
          Sin datos para hoy
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <h3 className="text-lg font-semibold text-on-surface mb-4">Métricas Operativas</h3>
      <div className="grid grid-cols-3 gap-4">
        {/* Tiempo Promedio */}
        <div className="bg-surface-container-high rounded-xl p-4">
          <p className="text-xs font-medium text-on-surface-variant mb-1">Tiempo Promedio</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-on-surface">{Math.round(data.tiempo_promedio_preparacion)}</span>
            <span className="text-xs text-on-surface-variant">min</span>
            <span className={`text-xs font-medium ml-1 ${
              data.tendencia <= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.tendencia <= 0 ? '↓' : '↑'} {Math.abs(data.tendencia).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Órdenes Hoy */}
        <div className="bg-surface-container-high rounded-xl p-4">
          <p className="text-xs font-medium text-on-surface-variant mb-1">Órdenes Hoy</p>
          <p className="text-2xl font-bold text-on-surface">{data.ordenes_completadas_hoy}</p>
          <p className="text-xs text-on-surface-variant mt-1">completadas</p>
        </div>

        {/* Horas Pico */}
        <div className="bg-surface-container-high rounded-xl p-4">
          <p className="text-xs font-medium text-on-surface-variant mb-1">Horas Pico</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.horas_pico.length > 0 ? (
              data.horas_pico.map((h) => (
                <span
                  key={h}
                  className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-brand-100 text-brand-800"
                >
                  {h}:00
                </span>
              ))
            ) : (
              <span className="text-xs text-on-surface-variant">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
