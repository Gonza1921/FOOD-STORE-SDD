import { useState } from 'react';
import type { CocinaPedidoConUrgencia } from '../types';
import { UrgenciaBadge } from './UrgenciaBadge';

interface PedidoCardProps {
  pedido: CocinaPedidoConUrgencia;
  onIniciar?: (id: number) => void;
  onListo?: (id: number) => void;
  isActing?: boolean;
  onToggleDisponibilidad?: (productoId: number, disponible: boolean) => void;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount);

function borderColor(urgencyLevel: CocinaPedidoConUrgencia['urgencyLevel']) {
  if (urgencyLevel === 'urgent') return 'border-l-error';
  if (urgencyLevel === 'warning') return 'border-l-warning';
  return 'border-l-outline-variant';
}

export function PedidoCard({ pedido, onIniciar, onListo, isActing, onToggleDisponibilidad }: PedidoCardProps) {
  const { id, estado_codigo, cliente_nombre, items, notas, total, urgencyLevel, tiempo_en_estado } = pedido;

  // Track which product IDs have been toggled as "no disponible" (local optimistic UI)
  const [noDisponibles, setNoDisponibles] = useState<Set<number>>(new Set());

  const handleClick = () => {
    const isIniciar = estado_codigo === 'CONFIRMADO';
    const label = isIniciar ? 'iniciar' : 'marcar como listo';
    if (!window.confirm(`¿Estás seguro de ${label} el pedido #${id}?`)) return;
    const cb = isIniciar ? onIniciar : onListo;
    cb?.(id);
  };

  const handleToggleItem = (productoId: number, currentNoDisponible: boolean) => {
    const label = currentNoDisponible ? 'habilitar' : 'marcar como no disponible';
    if (!window.confirm(`¿Estás seguro de ${label} este producto?`)) return;
    const nextDisponible = currentNoDisponible; // si estaba no disponible → ahora disponible
    setNoDisponibles((prev) => {
      const next = new Set(prev);
      if (currentNoDisponible) {
        next.delete(productoId);
      } else {
        next.add(productoId);
      }
      return next;
    });
    onToggleDisponibilidad?.(productoId, nextDisponible);
  };

  return (
    <article
      className={`rounded-xl bg-surface-container-lowest shadow-soft border border-outline-variant/10 border-l-4 ${borderColor(urgencyLevel)} p-4 space-y-3 transition-all duration-200`}
    >
      {/* Header: name + urgency */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-on-surface truncate">{cliente_nombre}</h3>
        <UrgenciaBadge seconds={tiempo_en_estado} urgencyLevel={urgencyLevel} />
      </div>

      {/* Items list with per-item "No disponible" button */}
      <ul className="space-y-1">
        {items.map((item, i) => {
          const isItemNoDisponible = noDisponibles.has(item.producto_id);
          return (
            <li
              key={i}
              className={`flex items-center justify-between gap-2 text-sm text-on-surface ${
                isItemNoDisponible ? 'opacity-50' : ''
              }`}
            >
              <span className="truncate">
                <span className="font-medium text-on-surface-variant">{item.cantidad}x</span>{' '}
                <span className={isItemNoDisponible ? 'line-through' : ''}>
                  {item.nombre_snapshot}
                </span>
              </span>

              {/* Per-item disponibilidad toggle */}
              {onToggleDisponibilidad && (
                <button
                  type="button"
                  onClick={() => handleToggleItem(item.producto_id, isItemNoDisponible)}
                  disabled={isActing}
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-surface-container-lowest disabled:cursor-not-allowed ${
                    isItemNoDisponible
                      ? 'border-green-500/60 text-green-500 hover:bg-green-500/10'
                      : 'border-red-500/60 text-red-500 hover:bg-red-500/10'
                  }`}
                >
                  {isItemNoDisponible ? 'Disponible' : 'No disponible'}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Notas */}
      {notas && (
        <p className="text-sm italic text-on-surface-variant/80 leading-snug border-t border-outline-variant/10 pt-2">
          📝 {notas}
        </p>
      )}

      {/* Footer: total + action */}
      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10">
        <span className="text-base font-bold text-on-surface">{formatPrice(total)}</span>

        <div className="flex items-center gap-2">
          {/* Boton Iniciar / Listo */}
          {(estado_codigo === 'CONFIRMADO' || estado_codigo === 'EN_PREP') && (
            <button
              type="button"
              onClick={handleClick}
              disabled={isActing}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ${
                estado_codigo === 'CONFIRMADO'
                  ? 'bg-success hover:bg-success/90 disabled:bg-success/60'
                  : 'bg-info hover:bg-info/90 disabled:bg-info/60'
              } disabled:cursor-not-allowed`}
            >
              {isActing && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              {estado_codigo === 'CONFIRMADO' ? 'Iniciar' : 'Listo'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
