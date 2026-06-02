/**
 * OrderTimeline — Visual progress of order through FSM states.
 * Horizontal on desktop (flex-row), vertical on mobile (flex-col).
 */

const FSM_STATES = [
  { estado: 'CONFIRMADO', label: 'Confirmado', icon: 'check_circle' },
  { estado: 'EN_PREPARACION', label: 'Preparación', icon: 'cooking' },
  { estado: 'LISTO', label: 'Listo', icon: 'inventory_2' },
  { estado: 'EN_CAMINO', label: 'En Camino', icon: 'local_shipping' },
  { estado: 'ENTREGADO', label: 'Entregado', icon: 'check_circle' },
] as const;

const STATE_ORDER: Record<string, number> = {
  PENDIENTE: -1,
  CONFIRMADO: 0,
  EN_PREPARACION: 1,
  LISTO: 2,
  EN_CAMINO: 3,
  ENTREGADO: 4,
  CANCELADO: -2,
};

interface OrderTimelineProps {
  currentState: string;
  timestamps?: Record<string, string>;
}

export function OrderTimeline({ currentState, timestamps = {} }: OrderTimelineProps) {
  const currentIndex = STATE_ORDER[currentState] ?? -1;
  const isCancelled = currentState === 'CANCELADO';

  return (
    <div className="w-full py-4">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-center justify-between relative">
        {FSM_STATES.map((step, idx) => {
          const isReached = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const ts = timestamps[step.estado];

          return (
            <div key={step.estado} className="flex flex-col items-center relative flex-1">
              {/* Connecting line */}
              {idx < FSM_STATES.length - 1 && (
                <div
                  className={`absolute top-5 left-[60%] w-[80%] h-0.5 ${
                    idx < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors ${
                  isCancelled
                    ? 'bg-red-100 text-red-500'
                    : isCurrent
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200 animate-pulse'
                    : isReached
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{step.icon}</span>
              </div>
              {/* Label */}
              <span className={`text-xs mt-2 font-medium ${
                isReached ? 'text-on-surface' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
              {/* Timestamp */}
              {ts && (
                <span className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(ts).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="sm:hidden flex flex-col gap-0 relative">
        {FSM_STATES.map((step, idx) => {
          const isReached = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const ts = timestamps[step.estado];

          return (
            <div key={step.estado} className="flex items-start gap-3 relative pb-6 last:pb-0">
              {/* Connecting line */}
              {idx < FSM_STATES.length - 1 && (
                <div
                  className={`absolute left-[19px] top-10 w-0.5 h-full ${
                    idx < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 ${
                  isCancelled
                    ? 'bg-red-100 text-red-500'
                    : isCurrent
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                    : isReached
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{step.icon}</span>
              </div>
              {/* Content */}
              <div className="flex flex-col pt-1.5">
                <span className={`text-sm font-medium ${
                  isReached ? 'text-on-surface' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
                {ts && (
                  <span className="text-xs text-gray-400 mt-0.5">
                    {new Date(ts).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
