import { useState } from 'react';
import { useAdminVentasPeriodo } from '../hooks/useAdminVentasPeriodo';
import { ChartBar } from './Charts';
import Skeleton from '@/shared/ui/Skeleton';

type Granularidad = 'day' | 'week' | 'month';

const GRANULARIDAD_OPTIONS: { value: Granularidad; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDefaultDesde(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return formatDate(d);
}

function getDefaultHasta(): string {
  return formatDate(new Date());
}

export function VentasPeriodoChart() {
  const [granularidad, setGranularidad] = useState<Granularidad>('day');
  const [desde, setDesde] = useState(getDefaultDesde());
  const [hasta, setHasta] = useState(getDefaultHasta());

  const { data, isLoading, isError } = useAdminVentasPeriodo({
    desde,
    hasta,
    granularidad,
  });

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-on-surface">Ventas por Período</h3>

        <div className="flex items-center gap-2">
          {/* Granularidad selector */}
          <div className="flex rounded-lg border border-outline-variant/30 overflow-hidden">
            {GRANULARIDAD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGranularidad(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  granularidad === opt.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-lg border border-outline-variant/30 bg-surface-container px-2.5 py-1.5 text-xs text-on-surface"
          />
          <span className="text-xs text-on-surface-variant">—</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-lg border border-outline-variant/30 bg-surface-container px-2.5 py-1.5 text-xs text-on-surface"
          />
        </div>
      </div>

      {isLoading && (
        <Skeleton variant="rectangular" height="h-72" />
      )}

      {isError && (
        <div className="h-72 flex items-center justify-center text-on-surface-variant text-sm">
          Error al cargar las ventas
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {data.items.length > 0 ? (
            <ChartBar
              data={data.items.map((item) => ({
                ...item,
                total: item.total_ventas,
                fecha: item.periodo,
              }))}
              dataKey="total"
              nameKey="fecha"
              height={280}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-on-surface-variant text-sm">
              Sin datos de ventas en el período seleccionado
            </div>
          )}

          {data.items.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant border-t border-outline-variant/10 pt-3">
              <span>
                Total ventas: <strong className="text-on-surface">
                  ${Number(data.total_ventas).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </strong>
              </span>
              <span>
                {data.items.length} período{data.items.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
