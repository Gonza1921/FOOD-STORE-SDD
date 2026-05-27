import { useState, useEffect, useRef } from 'react';
import type { CocinaPedido, CocinaPedidoConUrgencia, UrgencyLevel } from '../types';

/** Exported for testing */
export function calcUrgency(seconds: number): UrgencyLevel {
  if (seconds >= 1200) return 'urgent';
  if (seconds >= 600) return 'warning';
  return 'normal';
}

export function useUrgenciaTimer(pedidos: CocinaPedido[]): CocinaPedidoConUrgencia[] {
  const offsetRef = useRef(0);
  const [result, setResult] = useState<CocinaPedidoConUrgencia[]>(() =>
    pedidos.map(p => ({ ...p, urgencyLevel: calcUrgency(p.tiempo_en_estado) })),
  );

  useEffect(() => {
    const id = setInterval(() => {
      offsetRef.current += 15;
      setResult(prev =>
        prev.map(p => ({
          ...p,
          urgencyLevel: calcUrgency(p.tiempo_en_estado + offsetRef.current),
        })),
      );
    }, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    offsetRef.current = 0;
    setResult(pedidos.map(p => ({ ...p, urgencyLevel: calcUrgency(p.tiempo_en_estado) })));
  }, [pedidos]);

  return result;
}
