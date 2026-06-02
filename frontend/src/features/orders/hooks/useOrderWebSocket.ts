/**
 * useOrderWebSocket — Manages WebSocket connection for real-time order tracking.
 * Features:
 * - Auto-connect with JWT auth
 * - Auto-reconnect with exponential backoff (1s -> 2s -> 5s -> 10s -> max 30s)
 * - Fallback polling (5s interval) when WebSocket fails
 * - Toast notifications on status changes
 */

import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useOrderTrackingStore, type PedidoTracking } from '../store';
import { useAuthStore } from '@/features/auth/store';
import { useToastStore } from '@/shared/hooks/useToast';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
const POLL_INTERVAL = 5000;
const MAX_RECONNECT_DELAY = 30000;

export function useOrderWebSocket(pedidoId: number | null) {
  const { setOrder, setConnectionStatus } = useOrderTrackingStore();
  const { addToast } = useToastStore();
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const isPollingRef = useRef(false);
  const mountedRef = useRef(true);
  const connectRef = useRef<() => void>();

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    isPollingRef.current = false;
    reconnectDelayRef.current = 1000;
  }, []);

  const startPolling = useCallback(() => {
    if (isPollingRef.current || !pedidoId || !mountedRef.current) return;
    isPollingRef.current = true;

    pollRef.current = setInterval(async () => {
      if (!pedidoId || !mountedRef.current) return;
      try {
        const { data } = await axios.get<PedidoTracking>(`/api/v1/pedidos/${pedidoId}`);
        if (mountedRef.current) {
          setOrder(data);
        }
      } catch {
        // Silently fail
      }
    }, POLL_INTERVAL);
  }, [pedidoId, setOrder]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connectRef.current?.();
      }
    }, reconnectDelayRef.current);

    reconnectDelayRef.current = Math.min(
      reconnectDelayRef.current * 1.5,
      MAX_RECONNECT_DELAY
    );
  }, []);

  const connect = useCallback(() => {
    if (!pedidoId || !mountedRef.current) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      setConnectionStatus('fallback');
      startPolling();
      return;
    }

    try {
      const ws = new WebSocket(
        `${WS_BASE}/api/v1/pedidos/${pedidoId}/track?token=${token}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        setConnectionStatus('conectado');
        reconnectDelayRef.current = 1000;
        stopPolling();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);

          if (data.tipo === 'WELCOME') {
            setOrder(data.pedido);
            return;
          }

          setOrder(data.pedido);

          const toastMessages: Record<string, string> = {
            PEDIDO_CONFIRMADO: 'Tu pedido ha sido confirmado',
            PEDIDO_EN_PREPARACION: 'Tu pedido está siendo preparado',
            PEDIDO_LISTO: 'Tu pedido está listo',
            PEDIDO_EN_CAMINO: 'Tu pedido está en camino',
            PEDIDO_ENTREGADO: 'Tu pedido ha sido entregado',
            PEDIDO_CANCELADO: 'Tu pedido ha sido cancelado',
          };

          const message = toastMessages[data.tipo];
          if (message) {
            addToast({
              type: data.tipo === 'PEDIDO_CANCELADO' ? 'info' : 'success',
              message,
            });
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setConnectionStatus('reconectando');
        startPolling();
        scheduleReconnect();
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        if (wsRef.current === ws) {
          setConnectionStatus('reconectando');
          startPolling();
          scheduleReconnect();
        }
      };
    } catch {
      setConnectionStatus('fallback');
      startPolling();
    }
  }, [pedidoId, setOrder, setConnectionStatus, startPolling, stopPolling, scheduleReconnect]);

  // Keep connectRef in sync so scheduleReconnect always calls the latest version
  connectRef.current = connect;

  useEffect(() => {
    mountedRef.current = true;
    cleanup();

    if (pedidoId && pedidoId > 0) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [pedidoId, connect, cleanup]);

  return {
    reconnect: connect,
  };
}
