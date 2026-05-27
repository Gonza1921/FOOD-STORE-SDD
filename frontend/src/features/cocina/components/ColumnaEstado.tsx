import type { CocinaPedidoConUrgencia } from '../types';
import { PedidoCard } from './PedidoCard';

interface ColumnaEstadoProps {
  titulo: string;
  pedidos: CocinaPedidoConUrgencia[];
  onIniciar?: (id: number) => void;
  onListo?: (id: number) => void;
  actingId?: number | null;
  color: 'amber' | 'blue';
}

const headerAccent: Record<'amber' | 'blue', string> = {
  amber: 'bg-warning-container text-warning',
  blue: 'bg-info-container text-info',
};

const emptyMessages: Record<string, string> = {
  'Por preparar': 'No hay pedidos pendientes',
  'En preparación': 'No hay pedidos en preparación',
};

export function ColumnaEstado({ titulo, pedidos, onIniciar, onListo, actingId, color }: ColumnaEstadoProps) {
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
          <p className="text-sm text-on-surface-variant/60 text-center py-12">
            {emptyMessages[titulo] ?? 'Sin pedidos'}
          </p>
        ) : (
          pedidos.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              onIniciar={onIniciar}
              onListo={onListo}
              isActing={actingId === p.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
