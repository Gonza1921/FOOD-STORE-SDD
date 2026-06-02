/**
 * OrderEstimatedTime — Shows ETA based on current order state.
 */

interface OrderEstimatedTimeProps {
  estado: string;
  creado_en?: string;
  timestamps?: Record<string, string>;
}

function calculateETA(
  estado: string,
  creado_en?: string,
  timestamps: Record<string, string> = {}
): { label: string; time: string } | null {
  const now = new Date();

  if (estado === 'ENTREGADO' && timestamps.entregado_en) {
    const delivered = new Date(timestamps.entregado_en);
    const created = creado_en ? new Date(creado_en) : null;
    const totalMin = created
      ? Math.round((delivered.getTime() - created.getTime()) / 60000)
      : null;
    return {
      label: 'Entregado',
      time: totalMin
        ? `En ${totalMin} min`
        : delivered.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  if (estado === 'CANCELADO') {
    return { label: 'Cancelado', time: '—' };
  }

  if (['CONFIRMADO', 'EN_PREPARACION'].includes(estado)) {
    if (creado_en) {
      const created = new Date(creado_en);
      const elapsed = Math.round((now.getTime() - created.getTime()) / 60000);
      const remaining = Math.max(5, 30 - elapsed);
      return { label: 'Tiempo estimado', time: `~${remaining} min` };
    }
    return { label: 'Tiempo estimado', time: '~30 min' };
  }

  if (['LISTO', 'EN_CAMINO'].includes(estado)) {
    return { label: 'Entrega estimada', time: '~20 min' };
  }

  return null;
}

export function OrderEstimatedTime({ estado, creado_en, timestamps }: OrderEstimatedTimeProps) {
  const eta = calculateETA(estado, creado_en, timestamps);

  if (!eta) return null;

  const isDelivered = estado === 'ENTREGADO';
  const isCancelled = estado === 'CANCELADO';

  return (
    <div
      className={`rounded-lg px-4 py-3 flex items-center justify-between ${
        isDelivered
          ? 'bg-green-50 border border-green-200'
          : isCancelled
          ? 'bg-red-50 border border-red-200'
          : 'bg-blue-50 border border-blue-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`material-symbols-outlined text-lg ${
            isDelivered ? 'text-green-600' : isCancelled ? 'text-red-500' : 'text-blue-600'
          }`}
        >
          {isDelivered ? 'check_circle' : isCancelled ? 'cancel' : 'schedule'}
        </span>
        <span
          className={`text-sm font-medium ${
            isDelivered ? 'text-green-800' : isCancelled ? 'text-red-700' : 'text-blue-800'
          }`}
        >
          {eta.label}
        </span>
      </div>
      <span
        className={`text-sm font-semibold ${
          isDelivered ? 'text-green-700' : isCancelled ? 'text-red-600' : 'text-blue-700'
        }`}
      >
        {eta.time}
      </span>
    </div>
  );
}
