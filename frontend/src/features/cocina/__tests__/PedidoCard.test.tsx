/**
 * Tests: PedidoCard (CH-024 — KDS Cocina)
 *
 * Tests the PedidoCard component rendering for different states:
 *   - Client name, items, and total rendering
 *   - "Iniciar" button for CONFIRMADO pedidos
 *   - "Listo" button for EN_PREP pedidos
 *   - UrgenciaBadge display
 *   - isActing disables button and shows spinner
 *   - onIniciar / onListo callbacks with window.confirm
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PedidoCard } from '../components/PedidoCard';
import type { CocinaPedidoConUrgencia } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const basePedido: CocinaPedidoConUrgencia = {
  id: 42,
  estado_codigo: 'CONFIRMADO',
  subtotal: 2500,
  total: 2750,
  notas: null,
  creado_en: '2026-05-27T10:00:00Z',
  tiempo_en_estado: 300,
  cliente_nombre: 'Juan Pérez',
  items: [
    { nombre_snapshot: 'Pizza Muzza', cantidad: 2, precio_snapshot: 800, ingredientes_excluidos: [] },
    { nombre_snapshot: 'Empanada JyQ', cantidad: 3, precio_snapshot: 200, ingredientes_excluidos: ['Pimentón'] },
  ],
  urgencyLevel: 'normal',
};

const confirmadoPedido: CocinaPedidoConUrgencia = {
  ...basePedido,
  estado_codigo: 'CONFIRMADO',
  urgencyLevel: 'warning',
  tiempo_en_estado: 900,
};

const enPrepPedido: CocinaPedidoConUrgencia = {
  ...basePedido,
  id: 43,
  estado_codigo: 'EN_PREP',
  urgencyLevel: 'urgent',
  tiempo_en_estado: 1500,
  cliente_nombre: 'María García',
};

const pedidoConNotas: CocinaPedidoConUrgencia = {
  ...confirmadoPedido,
  id: 44,
  notas: 'Sin cebolla, por favor',
  cliente_nombre: 'Carlos López',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PedidoCard', () => {
  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  describe('rendering', () => {
    it('renders client name', () => {
      render(<PedidoCard pedido={confirmadoPedido} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('renders all items with quantities', () => {
      render(<PedidoCard pedido={confirmadoPedido} />);

      expect(screen.getByText('2x')).toBeInTheDocument();
      expect(screen.getByText('Pizza Muzza')).toBeInTheDocument();
      expect(screen.getByText('3x')).toBeInTheDocument();
      expect(screen.getByText('Empanada JyQ')).toBeInTheDocument();
    });

    it('renders the total price', () => {
      const { container } = render(<PedidoCard pedido={confirmadoPedido} />);

      // formatPrice with es-AR locale produces e.g. "$ 2.750,00"
      expect(container.textContent).toContain('$');
      expect(container.textContent).toContain('2.750');
    });

    it('renders notas when present', () => {
      render(<PedidoCard pedido={pedidoConNotas} />);

      expect(screen.getByText(/Sin cebolla, por favor/)).toBeInTheDocument();
    });

    it('does NOT render notas section when notas is null', () => {
      render(<PedidoCard pedido={confirmadoPedido} />);

      // The pedido has notas: null, so the notes paragraph should NOT exist
      expect(screen.queryByText(/📝/)).not.toBeInTheDocument();
    });

    it('renders UrgenciaBadge showing correct minutes', () => {
      render(<PedidoCard pedido={confirmadoPedido} />);

      // tiempo_en_estado: 900 → 15 min with warning urgency
      expect(screen.getByText('15 min')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Button: CONFIRMADO → "Iniciar"
  // -----------------------------------------------------------------------

  describe('CONFIRMADO pedido — "Iniciar" button', () => {
    it('shows "Iniciar" button for CONFIRMADO pedidos', () => {
      render(<PedidoCard pedido={confirmadoPedido} />);

      const button = screen.getByRole('button', { name: /iniciar/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('calls onIniciar with pedido id when confirmed', async () => {
      const onIniciar = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();

      render(<PedidoCard pedido={confirmadoPedido} onIniciar={onIniciar} />);

      await user.click(screen.getByRole('button', { name: /iniciar/i }));

      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('iniciar'));
      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('#42'));
      expect(onIniciar).toHaveBeenCalledWith(42);

      confirmSpy.mockRestore();
    });

    it('does NOT call onIniciar when confirm is cancelled', async () => {
      const onIniciar = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const user = userEvent.setup();

      render(<PedidoCard pedido={confirmadoPedido} onIniciar={onIniciar} />);

      await user.click(screen.getByRole('button', { name: /iniciar/i }));

      expect(confirmSpy).toHaveBeenCalled();
      expect(onIniciar).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // Button: EN_PREP → "Listo"
  // -----------------------------------------------------------------------

  describe('EN_PREP pedido — "Listo" button', () => {
    it('shows "Listo" button for EN_PREP pedidos', () => {
      render(<PedidoCard pedido={enPrepPedido} />);

      const button = screen.getByRole('button', { name: /listo/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('calls onListo with pedido id when confirmed', async () => {
      const onListo = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();

      render(<PedidoCard pedido={enPrepPedido} onListo={onListo} />);

      await user.click(screen.getByRole('button', { name: /listo/i }));

      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('listo'));
      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('#43'));
      expect(onListo).toHaveBeenCalledWith(43);

      confirmSpy.mockRestore();
    });

    it('does NOT call onListo when confirm is cancelled', async () => {
      const onListo = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const user = userEvent.setup();

      render(<PedidoCard pedido={enPrepPedido} onListo={onListo} />);

      await user.click(screen.getByRole('button', { name: /listo/i }));

      expect(confirmSpy).toHaveBeenCalled();
      expect(onListo).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // isActing state
  // -----------------------------------------------------------------------

  describe('isActing state', () => {
    it('disables the button when isActing is true', () => {
      render(<PedidoCard pedido={confirmadoPedido} onIniciar={vi.fn()} isActing={true} />);

      const button = screen.getByRole('button', { name: /iniciar/i });
      expect(button).toBeDisabled();
    });

    it('shows spinner SVG when isActing is true', () => {
      const { container } = render(
        <PedidoCard pedido={confirmadoPedido} onIniciar={vi.fn()} isActing={true} />,
      );

      // The SVG has class "animate-spin"
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner!.tagName).toBe('svg');
    });

    it('button is enabled when isActing is false', () => {
      render(<PedidoCard pedido={confirmadoPedido} onIniciar={vi.fn()} isActing={false} />);

      const button = screen.getByRole('button', { name: /iniciar/i });
      expect(button).not.toBeDisabled();
    });

    it('does NOT show spinner when isActing is false', () => {
      const { container } = render(
        <PedidoCard pedido={confirmadoPedido} onIniciar={vi.fn()} isActing={false} />,
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('does not call handler when button is clicked while acting', async () => {
      const onIniciar = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();

      render(<PedidoCard pedido={confirmadoPedido} onIniciar={onIniciar} isActing={true} />);

      const button = screen.getByRole('button', { name: /iniciar/i });
      await user.click(button);

      // Button is disabled, so click should not trigger confirm
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(onIniciar).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  it('does not render action button for unexpected estado_codigo (not CONFIRMADO or EN_PREP)', () => {
    const invalidPedido: CocinaPedidoConUrgencia = {
      ...basePedido,
      // @ts-expect-error — testing defensive rendering for unexpected state
      estado_codigo: 'ENTREGADO',
    };

    render(<PedidoCard pedido={invalidPedido} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
