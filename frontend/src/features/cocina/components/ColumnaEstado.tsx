import type { CocinaPedidoConUrgencia } from '../types';
import { PedidoCard } from './PedidoCard';

interface ColumnaEstadoProps {
  titulo: string;
  pedidos: CocinaPedidoConUrgencia[];
  onIniciar?: (id: number) => void;
  onListo?: (id: number) => void;
  actingId?: number | null;
  color: 'amber' | 'blue';
  onToggleDisponibilidad?: (productoId: number, disponible: boolean) => void;
}

const headerAccent: Record<'amber' | 'blue', string> = {
  amber: 'bg-warning-container text-warning',
  blue: 'bg-info-container text-info',
};

const emptyMessages: Record<string, string> = {
  'Por preparar': 'No hay pedidos pendientes',
  'En preparación': 'No hay pedidos en preparación',
};

export function ColumnaEstado({
  titulo,
  pedidos,
  onIniciar,
  onListo,
  actingId,
  color,
  onToggleDisponibilidad,
}: ColumnaEstadoProps) {
  return (
    <section className="flex flex-col h-full rounded-2xl bg-surface-container-lowest/50 backdrop-blur-sm border border-outline-variant/10 overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2 px-5 py-3 ${headerAccent[color]} bg-opacity-10`}>
        <span className="text-sm font-bold uppercase tracking-wider">{titulo}</span>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-current/20 px-1.5 text-xs font-bold">
          {pedidos.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant/60">
            {/* SVG inline de plato vacio */}
            <svg
              className="h-16 w-16 animate-pulse"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Plato base */}
              <ellipse cx="32" cy="40" rx="22" ry="8" />
              <ellipse cx="32" cy="40" rx="22" ry="8" fill="currentColor" fillOpacity="0.1" />
              {/* Plato superficie */}
              <ellipse cx="32" cy="36" rx="18" ry="6" />
              {/* Tapa/domo */}
              <path d="M14 36 C14 24, 22 16, 32 16 C42 16, 50 24, 50 36" />
              {/* Vaporcito */}
              <path d="M28 14 C28 10, 30 8, 30 6" strokeWidth="1" opacity="0.5">
                <animate attributeName="d" values="M28 14 C28 10,30 8,30 6;M28 14 C28 10,30 8,30 6;M28 14 C28 10,30 8,30 6" dur="2s" repeatCount="indefinite" />
              </path>
              <path d="M36 12 C36 8, 38 6, 38 4" strokeWidth="1" opacity="0.5">
                <animate attributeName="d" values="M36 12 C36 8,38 6,38 4;M36 12 C36 8,38 6,38 4;M36 12 C36 8,38 6,38 4" dur="2s" repeatCount="indefinite" />
              </path>
            </svg>
            <p className="text-sm font-medium">
              {emptyMessages[titulo] ?? 'Sin pedidos'}
            </p>
          </div>
        ) : (
          pedidos.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              onIniciar={onIniciar}
              onListo={onListo}
              isActing={actingId === p.id}
              onToggleDisponibilidad={onToggleDisponibilidad}
            />
          ))
        )}
      </div>
    </section>
  );
}
