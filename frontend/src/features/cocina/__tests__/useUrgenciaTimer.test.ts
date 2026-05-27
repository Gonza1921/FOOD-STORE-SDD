/**
 * Tests: useUrgenciaTimer (CH-024 — KDS Cocina)
 *
 * Tests the urgency timer logic:
 *   - calcUrgency pure function (exported for testing)
 *   - Hook renders with correct initial state
 *   - Hook resets offset when pedidos reference changes
 *
 * IMPORTANT: pedidos must use a STABLE reference (initialProps) to avoid
 * infinite loops caused by the [pedidos] effect dependency.
 * See: zzz-hook-test.test.ts debugging session.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useUrgenciaTimer, calcUrgency } from '../hooks/useUrgenciaTimer';
import type { CocinaPedido } from '../types';

afterEach(() => {
  cleanup();
});

function createPedido(overrides: Partial<CocinaPedido> = {}): CocinaPedido {
  return {
    id: 1,
    estado_codigo: 'CONFIRMADO',
    subtotal: 1000,
    total: 1000,
    notas: null,
    creado_en: '2026-05-27T10:00:00Z',
    tiempo_en_estado: 0,
    cliente_nombre: 'Test',
    items: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calcUrgency (pure function — no hooks or timers needed)
// ---------------------------------------------------------------------------

describe('calcUrgency', () => {
  it('returns "normal" for < 600 seconds', () => {
    expect(calcUrgency(300)).toBe('normal');
  });

  it('returns "normal" at 0 seconds', () => {
    expect(calcUrgency(0)).toBe('normal');
  });

  it('returns "normal" at 599 seconds (boundary)', () => {
    expect(calcUrgency(599)).toBe('normal');
  });

  it('returns "warning" at 600 seconds', () => {
    expect(calcUrgency(600)).toBe('warning');
  });

  it('returns "warning" at 900 seconds', () => {
    expect(calcUrgency(900)).toBe('warning');
  });

  it('returns "warning" at 1199 seconds (boundary)', () => {
    expect(calcUrgency(1199)).toBe('warning');
  });

  it('returns "urgent" at 1200 seconds', () => {
    expect(calcUrgency(1200)).toBe('urgent');
  });

  it('returns "urgent" for > 1200 seconds', () => {
    expect(calcUrgency(1500)).toBe('urgent');
  });
});

// ---------------------------------------------------------------------------
// Hook — initial state (stable pedidos via initialProps)
// ---------------------------------------------------------------------------

describe('useUrgenciaTimer — initial state', () => {
  it('returns correct urgency for a single pedido', () => {
    const pedidos = [createPedido({ tiempo_en_estado: 300 })];
    const { result, unmount } = renderHook(
      ({ p }: { p: CocinaPedido[] }) => useUrgenciaTimer(p),
      { initialProps: { p: pedidos } },
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].urgencyLevel).toBe('normal');
    unmount();
  });

  it('handles multiple pedidos with different levels', () => {
    const pedidos = [
      createPedido({ id: 1, tiempo_en_estado: 300 }),
      createPedido({ id: 2, tiempo_en_estado: 900 }),
      createPedido({ id: 3, tiempo_en_estado: 1500 }),
    ];

    const { result, unmount } = renderHook(
      ({ p }: { p: CocinaPedido[] }) => useUrgenciaTimer(p),
      { initialProps: { p: pedidos } },
    );

    expect(result.current[0].urgencyLevel).toBe('normal');
    expect(result.current[1].urgencyLevel).toBe('warning');
    expect(result.current[2].urgencyLevel).toBe('urgent');
    unmount();
  });

  it('returns empty array for empty pedidos', () => {
    const { result, unmount } = renderHook(
      ({ p }: { p: CocinaPedido[] }) => useUrgenciaTimer(p),
      { initialProps: { p: [] } },
    );
    expect(result.current).toEqual([]);
    unmount();
  });

  it('preserves all pedido fields', () => {
    const pedido = createPedido({ id: 42, cliente_nombre: 'Juan', total: 2500 });
    const { result, unmount } = renderHook(
      ({ p }: { p: CocinaPedido[] }) => useUrgenciaTimer(p),
      { initialProps: { p: [pedido] } },
    );

    expect(result.current[0].id).toBe(42);
    expect(result.current[0].cliente_nombre).toBe('Juan');
    expect(result.current[0].total).toBe(2500);
    unmount();
  });
});

// ---------------------------------------------------------------------------
// Hook — offset reset on pedidos change
// ---------------------------------------------------------------------------

describe('useUrgenciaTimer — offset reset on pedidos change', () => {
  it('resets urgency when pedidos list reference changes', () => {
    const pedidosA = [createPedido({ id: 1, tiempo_en_estado: 600 })];
    const { result, rerender, unmount } = renderHook(
      ({ p }: { p: CocinaPedido[] }) => useUrgenciaTimer(p),
      { initialProps: { p: pedidosA } },
    );

    // Initial: 600s → 'warning'
    expect(result.current[0].urgencyLevel).toBe('warning');

    // Rerender with new pedidos at different time
    rerender({ p: [createPedido({ id: 2, tiempo_en_estado: 300 })] });

    // Should recalculate based on new tiempo_en_estado
    expect(result.current[0].urgencyLevel).toBe('normal');
    expect(result.current[0].id).toBe(2);
    unmount();
  });

  it('re-renders with same data keeps urgency level', () => {
    const pedidos = [createPedido({ id: 1, tiempo_en_estado: 600 })];
    const { result, rerender, unmount } = renderHook(
      ({ p }: { p: CocinaPedido[] }) => useUrgenciaTimer(p),
      { initialProps: { p: pedidos } },
    );

    expect(result.current[0].urgencyLevel).toBe('warning');

    // Same reference, just re-render
    rerender({ p: pedidos });

    // Still 'warning'
    expect(result.current[0].urgencyLevel).toBe('warning');
    unmount();
  });
});
