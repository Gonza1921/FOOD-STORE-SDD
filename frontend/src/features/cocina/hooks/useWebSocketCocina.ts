import { useState, useEffect, useRef } from 'react';
import axiosClient from '@/shared/api/axiosClient';
import { useAuthStore } from '@/features/auth/store';
import { COCINA_API } from '../api/endpoints';
import type { CocinaPedido, ConnectionStatus, WSEvent } from '../types';

export function useWebSocketCocina() {
  const [pedidos, setPedidos] = useState<CocinaPedido[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgReconnectRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const stopPolling = () => {
      isPollingRef.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (bgReconnectRef.current) clearInterval(bgReconnectRef.current);
      pollIntervalRef.current = null;
      bgReconnectRef.current = null;
    };

    const startPolling = () => {
      isPollingRef.current = true;
      setConnectionStatus('polling');

      pollIntervalRef.current = setInterval(async () => {
        try {
          const { data } = await axiosClient.get<CocinaPedido[]>(COCINA_API.PEDIDOS_LIST);
          setPedidos(prev => {
            const map = new Map(prev.map(p => [p.id, p]));
            for (const p of data) map.set(p.id, p);
            return Array.from(map.values());
          });
        } catch {
          /* silent */
        }
      }, 30000);

      bgReconnectRef.current = setInterval(() => {
        if (isMountedRef.current) connectWS();
      }, 30000);
    };

    const handleEvent = (event: WSEvent) => {
      switch (event.tipo) {
        case 'PEDIDO_CONFIRMADO':
          setPedidos(prev =>
            prev.some(p => p.id === event.payload.pedido_id)
              ? prev
              : [
                  ...prev,
                  {
                    id: event.payload.pedido_id,
                    estado_codigo: 'CONFIRMADO',
                    subtotal: 0,
                    total: 0,
                    notas: null,
                    creado_en: event.payload.timestamp,
                    tiempo_en_estado: 0,
                    cliente_nombre: '—',
                    items: event.payload.items ?? [],
                  },
                ],
          );
          break;
        case 'PEDIDO_EN_PREPARACION':
          setPedidos(prev =>
            prev.map(p =>
              p.id === event.payload.pedido_id ? { ...p, estado_codigo: 'EN_PREP' as const } : p,
            ),
          );
          break;
        case 'PEDIDO_EN_CAMINO':
        case 'PEDIDO_CANCELADO':
          setPedidos(prev => prev.filter(p => p.id !== event.payload.pedido_id));
          break;
        case 'PING':
          wsRef.current?.send(JSON.stringify({ tipo: 'PONG' }));
          break;
      }
    };

    const connectWS = () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) return;

      const ws = new WebSocket(`${COCINA_API.WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        reconnectAttemptsRef.current = 0;
        setConnectionStatus('live');
        setError(null);
        stopPolling();
      };

      ws.onclose = () => {
        if (!isMountedRef.current || wsRef.current !== ws) return;
        wsRef.current = null;

        if (reconnectAttemptsRef.current < 3) {
          reconnectAttemptsRef.current += 1;
          setConnectionStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(connectWS, 3000);
        } else if (!isPollingRef.current) {
          startPolling();
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          handleEvent(JSON.parse(event.data));
        } catch {
          /* ignore malformed */
        }
      };

      ws.onerror = () => ws.close();
    };

    const init = async () => {
      try {
        const { data } = await axiosClient.get<CocinaPedido[]>(COCINA_API.PEDIDOS_LIST);
        if (!isMountedRef.current) return;
        setPedidos(data);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Error al obtener pedidos');
      }
      if (isMountedRef.current) connectWS();
    };

    init();

    return () => {
      isMountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (bgReconnectRef.current) clearInterval(bgReconnectRef.current);
    };
  }, []);

  return { pedidos, connectionStatus, error };
}
