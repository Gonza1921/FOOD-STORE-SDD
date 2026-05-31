/**
 * Tests: useWebSocketCocina (CH-030 — KDS Enhancements)
 *
 * Tests WebSocket connection lifecycle:
 *   - Connects on mount with auth token
 *   - Reconnects within 3 seconds after onclose
 *   - Falls back to polling after 3 failed reconnection attempts
 *   - Handles PEDIDO_CONFIRMADO / EN_PREPARACION / EN_CAMINO / CANCELADO
 *   - Responds to PING with PONG
 *
 * Uses MockWebSocket (vi.stubGlobal) for connection simulation and
 * a ControlledWS variant for the polling fallback test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MockWebSocket } from './mockWebSocket';
import { useWebSocketCocina } from '../hooks/useWebSocketCocina';

// ===========================================================================
// Hoisted mocks (run before module evaluation)
// ===========================================================================

const { mockAxiosGet, mockGetState } = vi.hoisted(() => ({
  mockAxiosGet: vi.fn(),
  mockGetState: vi.fn(),
}));

vi.mock('@/shared/api/axiosClient', () => ({
  default: { get: mockAxiosGet },
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: { getState: mockGetState },
}));

// ===========================================================================
// Controlled WebSocket — does NOT auto-open on construction
// ===========================================================================

/**
 * A WebSocket mock that does NOT auto-open. The test must manually call
 * ``triggerOpen()`` to simulate a successful connection.
 *
 * This is needed for the polling fallback test, where we need to control
 * when the WS opens (or prevent it from opening) to simulate reconnection
 * failures.
 */
class ControlledWS {
  static instances: ControlledWS[] = [];
  static resetAll(): void {
    ControlledWS.instances = [];
  }

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 3;

  url: string;
  readyState: number = ControlledWS.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private _sentData: string[] = [];

  constructor(url: string) {
    this.url = url;
    ControlledWS.instances.push(this);
    // Do NOT auto-open — test must call triggerOpen()
  }

  send(data: string): void {
    this._sentData.push(data);
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === ControlledWS.CLOSED) return;
    this.readyState = ControlledWS.CLOSED;
    const event = new CloseEvent('close', { code, reason, wasClean: true });
    this.onclose?.(event);
  }

  /** Simulate the server accepting the connection. */
  triggerOpen(): void {
    this.readyState = ControlledWS.OPEN;
    const event = new Event('open');
    this.onopen?.(event);
  }

  /** Simulate receiving a JSON message from the server. */
  triggerMessage(data: unknown): void {
    const event = new MessageEvent('message', {
      data: typeof data === 'string' ? data : JSON.stringify(data),
    });
    this.onmessage?.(event);
  }

  get sentData(): string[] {
    return this._sentData;
  }
}

// ===========================================================================
// Shared helpers
// ===========================================================================

const PEDIDOS_LIST_URL = '/cocina/pedidos';

function makePedidoPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    pedido_id: 1,
    estado_anterior: 'PENDIENTE',
    estado_nuevo: 'CONFIRMADO',
    timestamp: '2026-05-28T10:00:00Z',
    items: [
      {
        nombre_snapshot: 'Pizza Muzzarella',
        cantidad: 2,
        precio_snapshot: 800,
        ingredientes_excluidos: [],
      },
    ],
    ...overrides,
  };
}

// ===========================================================================
// Setup / Teardown
// ===========================================================================

beforeEach(() => {
  MockWebSocket.resetAll();
  ControlledWS.resetAll();
  mockAxiosGet.mockReset();
  mockGetState.mockReset();
  mockGetState.mockReturnValue({ accessToken: 'test-jwt-token' });
  mockAxiosGet.mockResolvedValue({ data: [] });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ===========================================================================
// Tests
// ===========================================================================

describe('useWebSocketCocina', () => {
  // -----------------------------------------------------------------------
  // Connection
  // -----------------------------------------------------------------------

  describe('connection', () => {
    it('connects WebSocket on mount', async () => {
      vi.stubGlobal('WebSocket', MockWebSocket);

      const { result } = renderHook(() => useWebSocketCocina());

      // Wait for initial data fetch + WS creation (wrapped in act by RTL)
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledWith(PEDIDOS_LIST_URL);
      });

      // Wait for WS to open (wrapped in act by RTL)
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });
    });

    it('fetches initial pedidos data on mount', async () => {
      vi.stubGlobal('WebSocket', MockWebSocket);

      const mockPedidos = [
        { id: 1, estado_codigo: 'CONFIRMADO', cliente_nombre: 'Test' },
      ];
      mockAxiosGet.mockResolvedValue({ data: mockPedidos });

      const { result } = renderHook(() => useWebSocketCocina());

      await waitFor(() => {
        expect(result.current.pedidos).toEqual(mockPedidos);
      });
    });

    it('sets error state when initial fetch fails', async () => {
      // Use ControlledWS to prevent auto-open from overriding the error
      vi.stubGlobal('WebSocket', ControlledWS);
      mockAxiosGet.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWebSocketCocina());

      // Flush microtask (init catch) + React state update inside act
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  // -----------------------------------------------------------------------
  // Reconnection
  // -----------------------------------------------------------------------

  describe('reconnection', () => {
    it('reconnects within 3 seconds after onclose', async () => {
      vi.stubGlobal('WebSocket', MockWebSocket);

      const { result } = renderHook(() => useWebSocketCocina());

      // Wait for initial connection
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      // ENTER FAKE TIMERS for timer control
      vi.useFakeTimers();

      // Simulate disconnection (synchronous onclose inside act → state committed)
      act(() => {
        MockWebSocket.instances[0].simulateClose();
      });

      expect(result.current.connectionStatus).toBe('reconnecting');

      // Advance time by 3s → setTimeout(connectWS, 3000) fires
      vi.advanceTimersByTime(3000);

      // connectWS ran synchronously → new MockWebSocket created
      expect(MockWebSocket.instances).toHaveLength(2);

      // Temporarily restore real timers so microtasks + React commit flush
      vi.useRealTimers();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      vi.useFakeTimers();

      // onopen ran → setConnectionStatus('live') committed
      expect(result.current.connectionStatus).toBe('live');

      // EXIT FAKE TIMERS
      vi.useRealTimers();
    });

    it('sets status to reconnecting after close', async () => {
      vi.stubGlobal('WebSocket', MockWebSocket);

      const { result } = renderHook(() => useWebSocketCocina());

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      act(() => {
        MockWebSocket.instances[0].simulateClose();
      });

      expect(result.current.connectionStatus).toBe('reconnecting');
    });

    it('limits reconnection to 3 attempts before polling', async () => {
      // Use ControlledWS so we can prevent WS from opening
      vi.stubGlobal('WebSocket', ControlledWS);

      const { result } = renderHook(() => useWebSocketCocina());

      // Wait for init to complete and ControlledWS to be created
      await waitFor(() => {
        expect(ControlledWS.instances).toHaveLength(1);
      });

      // Manually open the first connection (inside act to flush React)
      act(() => {
        ControlledWS.instances[0].triggerOpen();
      });

      // Wait for onopen to fire and React to flush
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      // ENTER FAKE TIMERS for timer control
      vi.useFakeTimers();

      // Simulate 3 close events WITHOUT the new WS opening
      // Each close → reconnect timer → advance timer → new WS created → close again
      for (let i = 0; i < 3; i++) {
        const ws =
          ControlledWS.instances[ControlledWS.instances.length - 1];

        // Wrap close in act() to flush React state updates
        act(() => {
          ws.close();
        });

        if (i < 2) {
          // Should be reconnecting after close
          expect(result.current.connectionStatus).toBe('reconnecting');

          // Advance time to trigger reconnect
          vi.advanceTimersByTime(3000);

          // New WS should be created (but NOT opened — ControlledWS)
          expect(ControlledWS.instances).toHaveLength(i + 2);
        }
      }

      // After 3rd close: reconnectAttempts = 3, setTimeout(3000) pending
      // Advance to trigger connectWS → 4th WS created
      vi.advanceTimersByTime(3000);

      // Close 4th WS → reconnectAttempts(3) < 3 → FALSE → startPolling()
      act(() => {
        ControlledWS.instances[ControlledWS.instances.length - 1].close();
      });

      // Restore real timers to let React flush the polling state update
      vi.useRealTimers();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.connectionStatus).toBe('polling');
    });
  });

  // -----------------------------------------------------------------------
  // Polling fallback
  // -----------------------------------------------------------------------

  describe('polling fallback', () => {
    it('starts polling every 30s after reconnection failures', async () => {
      vi.stubGlobal('WebSocket', ControlledWS);

      const { result } = renderHook(() => useWebSocketCocina());

      // Wait for ControlledWS to be created
      await waitFor(() => {
        expect(ControlledWS.instances).toHaveLength(1);
      });

      // Open initial connection
      act(() => {
        ControlledWS.instances[0].triggerOpen();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      // ENTER FAKE TIMERS — stay in fake timers for the entire test
      vi.useFakeTimers();

      // Simulate 3 close events without reconnection success
      for (let i = 0; i < 3; i++) {
        const ws =
          ControlledWS.instances[ControlledWS.instances.length - 1];
        act(() => {
          ws.close();
        });
        if (i < 2) {
          vi.advanceTimersByTime(3000); // Reconnect timer fires → new WS
        }
      }

      // After 3rd close: reconnectAttempts = 3, setTimeout(3000) pending.
      // Advance to trigger connectWS → 4th WS created
      vi.advanceTimersByTime(3000);

      // Close 4th WS → reconnectAttempts(3) < 3 → FALSE → startPolling()
      // act() flushes React state synchronously even with fake timers
      act(() => {
        ControlledWS.instances[ControlledWS.instances.length - 1].close();
      });

      // State was flushed by act() — no need to switch timers
      expect(result.current.connectionStatus).toBe('polling');

      // Clear the initial fetch calls
      mockAxiosGet.mockClear();

      // Advance time by 30s for polling interval
      // setInterval(async () => { await axiosClient.get(...) }, 30000) fires
      // The axiosClient.get() call is SYNCHRONOUS (mockResolvedValue)
      vi.advanceTimersByTime(30000);

      // mockAxiosGet was called inside the interval callback
      expect(mockAxiosGet).toHaveBeenCalledWith(PEDIDOS_LIST_URL);

      // EXIT FAKE TIMERS
      vi.useRealTimers();
    });

    it('returns to live when WebSocket reconnects during polling', async () => {
      vi.stubGlobal('WebSocket', ControlledWS);

      const { result } = renderHook(() => useWebSocketCocina());

      await waitFor(() => {
        expect(ControlledWS.instances).toHaveLength(1);
      });
      act(() => {
        ControlledWS.instances[0].triggerOpen();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      // ENTER FAKE TIMERS for timer control
      vi.useFakeTimers();

      // Trigger 3 closes to reach reconnectAttempts = 3
      for (let i = 0; i < 3; i++) {
        const ws =
          ControlledWS.instances[ControlledWS.instances.length - 1];
        act(() => {
          ws.close();
        });
        if (i < 2) vi.advanceTimersByTime(3000);
      }

      // After 3rd close: reconnectAttempts = 3, setTimeout(3000) pending.
      // Advance to trigger connectWS → 4th WS created
      vi.advanceTimersByTime(3000);

      // Close 4th WS → reconnectAttempts(3) < 3 → FALSE → startPolling()
      // act() flushes React state synchronously even with fake timers
      act(() => {
        ControlledWS.instances[ControlledWS.instances.length - 1].close();
      });

      expect(result.current.connectionStatus).toBe('polling');

      // When polling is active, there's a background reconnect attempt
      // every 30s via bgReconnectRef setInterval.
      // Advance to trigger it and manually open the new WS.
      vi.advanceTimersByTime(30000);

      // The bgReconnect creates a new WS, but our ControlledWS doesn't
      // auto-open. Trigger the open manually (synchronous onopen).
      const newWs =
        ControlledWS.instances[ControlledWS.instances.length - 1];
      act(() => {
        newWs.triggerOpen();
      });

      // onopen ran → setConnectionStatus('live') committed
      expect(result.current.connectionStatus).toBe('live');

      // EXIT FAKE TIMERS
      vi.useRealTimers();
    });
  });

  // -----------------------------------------------------------------------
  // WebSocket events — PEDIDO_CONFIRMADO
  // -----------------------------------------------------------------------

  describe('PEDIDO_CONFIRMADO event', () => {
    it('adds a new pedido to the list on PEDIDO_CONFIRMADO', async () => {
      vi.stubGlobal('WebSocket', MockWebSocket);

      const { result } = renderHook(() => useWebSocketCocina());

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      const ws = MockWebSocket.instances[0];
      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_CONFIRMADO',
          payload: makePedidoPayload({ pedido_id: 42 }),
        });
      });

      expect(result.current.pedidos).toHaveLength(1);
      expect(result.current.pedidos[0].id).toBe(42);
      expect(result.current.pedidos[0].estado_codigo).toBe('CONFIRMADO');
    });

    it('does NOT duplicate pedidos with the same id', async () => {
      vi.stubGlobal('WebSocket', MockWebSocket);

      const { result } = renderHook(() => useWebSocketCocina());

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      const ws = MockWebSocket.instances[0];

      // Send same pedido twice
      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_CONFIRMADO',
          payload: makePedidoPayload({ pedido_id: 42 }),
        });
      });

      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_CONFIRMADO',
          payload: makePedidoPayload({ pedido_id: 42 }),
        });
      });

      expect(result.current.pedidos).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // WebSocket events — PEDIDO_EN_PREPARACION
  // -----------------------------------------------------------------------

  describe('PEDIDO_EN_PREPARACION event', () => {
    it('changes estado_codigo to EN_PREP', async () => {
      vi.stubGlobal('WebSocket', MockWebSocket);

      const { result } = renderHook(() => useWebSocketCocina());

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      const ws = MockWebSocket.instances[0];

      // Add a pedido first
      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_CONFIRMADO',
          payload: makePedidoPayload({ pedido_id: 42 }),
        });
      });

      expect(result.current.pedidos[0].estado_codigo).toBe('CONFIRMADO');

      // Now send EN_PREPARACION
      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_EN_PREPARACION',
          payload: makePedidoPayload({
            pedido_id: 42,
            estado_anterior: 'CONFIRMADO',
            estado_nuevo: 'EN_PREP',
          }),
        });
      });

      expect(result.current.pedidos[0].estado_codigo).toBe('EN_PREP');
    });
  });

  // -----------------------------------------------------------------------
  // WebSocket events — PEDIDO_EN_CAMINO
  // -----------------------------------------------------------------------

  describe('PEDIDO_EN_CAMINO event', () => {
    it('removes the pedido from the list', async () => {
      vi.stubGlobal('WebSocket', MockWebSocket);

      const { result } = renderHook(() => useWebSocketCocina());

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      const ws = MockWebSocket.instances[0];

      // Add two pedidos
      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_CONFIRMADO',
          payload: makePedidoPayload({ pedido_id: 1 }),
        });
      });
      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_CONFIRMADO',
          payload: makePedidoPayload({ pedido_id: 2 }),
        });
      });

      expect(result.current.pedidos).toHaveLength(2);

      // Send EN_CAMINO for one of them
      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_EN_CAMINO',
          payload: makePedidoPayload({
            pedido_id: 1,
            estado_anterior: 'EN_PREP',
            estado_nuevo: 'EN_CAMINO',
          }),
        });
      });

      expect(result.current.pedidos).toHaveLength(1);
      expect(result.current.pedidos[0].id).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // WebSocket events — PEDIDO_CANCELADO
  // -----------------------------------------------------------------------

  describe('PEDIDO_CANCELADO event', () => {
    it('removes the pedido from the list on cancel', async () => {
      vi.stubGlobal('WebSocket', MockWebSocket);

      const { result } = renderHook(() => useWebSocketCocina());

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      const ws = MockWebSocket.instances[0];

      // Add a pedido
      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_CONFIRMADO',
          payload: makePedidoPayload({ pedido_id: 7 }),
        });
      });

      expect(result.current.pedidos).toHaveLength(1);

      // Cancel it
      act(() => {
        ws.simulateMessage({
          tipo: 'PEDIDO_CANCELADO',
          payload: makePedidoPayload({
            pedido_id: 7,
            estado_anterior: 'CONFIRMADO',
            estado_nuevo: 'CANCELADO',
          }),
        });
      });

      expect(result.current.pedidos).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // PING / PONG
  // -----------------------------------------------------------------------

  describe('PING/PONG keepalive', () => {
    it('responds to PING with PONG', async () => {
      vi.stubGlobal('WebSocket', ControlledWS);

      const { result, unmount } = renderHook(() =>
        useWebSocketCocina(),
      );

      await waitFor(() => {
        expect(ControlledWS.instances).toHaveLength(1);
      });

      act(() => {
        ControlledWS.instances[0].triggerOpen();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('live');
      });

      const ws = ControlledWS.instances[0];
      // Spy on send to track PONG
      const sendSpy = vi.spyOn(ws, 'send');

      // Send PING
      act(() => {
        ws.triggerMessage({ tipo: 'PING' });
      });

      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({ tipo: 'PONG' }));

      unmount();
    });
  });
});
