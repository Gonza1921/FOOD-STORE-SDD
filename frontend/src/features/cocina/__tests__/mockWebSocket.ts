/**
 * MockWebSocket — A test double for the browser WebSocket API.
 *
 * Usage in tests:
 *
 *   import { MockWebSocket } from './mockWebSocket';
 *
 *   beforeEach(() => {
 *     vi.stubGlobal('WebSocket', MockWebSocket);
 *   });
 *
 *   afterEach(() => {
 *     vi.unstubAllGlobals();
 *     MockWebSocket.resetAll();
 *   });
 *
 * The mock records all created instances in MockWebSocket.instances and
 * provides utility methods (resetAll, simulateEvent) so tests can control
 * connection lifecycle without a real server.
 */

// Re-usable type for event listeners (matches browser WebSocket API)
type WSEventListener = ((event: Event | MessageEvent | CloseEvent) => void) | null;

export class MockWebSocket {
  /** All instances created since the last reset. */
  static instances: MockWebSocket[] = [];

  /** Reset the static instance registry (call in afterEach). */
  static resetAll(): void {
    MockWebSocket.instances = [];
  }

  // ---- Static constants matching the browser WebSocket API ----
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  // ---- State ----
  url: string;
  readyState: number = MockWebSocket.CONNECTING;

  // ---- Event listener callbacks ----
  onopen: WSEventListener = null;
  onclose: WSEventListener = null;
  onmessage: WSEventListener = null;
  onerror: WSEventListener = null;

  // ---- Internal listener map (for addEventListener/removeEventListener) ----
  private _listeners: Map<string, Set<EventListenerOrEventListenerObject>> = new Map();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);

    // Simulate async open (next microtask)
    Promise.resolve().then(() => {
      this.readyState = MockWebSocket.OPEN;
      const event = new Event('open');
      this.onopen?.(event);
      this._dispatchEvent('open', event);
    });
  }

  // ==================================================================
  // Public API — mirrors browser WebSocket
  // ==================================================================

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    // No-op in base mock. Subclass or override if you need assertions.
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === MockWebSocket.CLOSED) return;

    this.readyState = MockWebSocket.CLOSED;
    const event = new CloseEvent('close', { code, reason, wasClean: true });
    this.onclose?.(event);
    this._dispatchEvent('close', event);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    _options?: AddEventListenerOptions | boolean,
  ): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    _options?: EventListenerOptions | boolean,
  ): void {
    this._listeners.get(type)?.delete(listener);
  }

  // ==================================================================
  // Test helpers — simulate real WS events
  // ==================================================================

  /** Simulate receiving a JSON message from the server. */
  simulateMessage(data: unknown): void {
    const event = new MessageEvent('message', {
      data: typeof data === 'string' ? data : JSON.stringify(data),
    });
    this.onmessage?.(event);
    this._dispatchEvent('message', event);
  }

  /** Simulate a connection error. */
  simulateError(): void {
    const event = new Event('error');
    this.onerror?.(event);
    this._dispatchEvent('error', event);
  }

  /** Simulate a close event (e.g., server disconnection). */
  simulateClose(code: number = 1000, reason: string = ''): void {
    this.close(code, reason);
  }

  // ==================================================================
  // Internal
  // ==================================================================

  private _dispatchEvent(type: string, event: Event | MessageEvent | CloseEvent): void {
    const listeners = this._listeners.get(type);
    if (!listeners) return;

    for (const listener of listeners) {
      if (typeof listener === 'function') {
        (listener as (evt: unknown) => void)(event);
      } else if (listener && typeof listener.handleEvent === 'function') {
        listener.handleEvent(event);
      }
    }
  }
}
