/**
 * PriceRangeFilter.test.tsx - Unit tests for PriceRangeFilter component
 * 
 * Phase 8.3: Tests that PriceRangeFilter should disable button cuando min > max
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriceRangeFilter } from '../PriceRangeFilter';
import { useProductFilters } from '../useProductFilters';

// Mock the hook
vi.mock('../useProductFilters', () => ({
  useProductFilters: vi.fn(),
}));

describe('PriceRangeFilter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProductFilters).mockReturnValue({
      setFilters: vi.fn(),
    } as any);
  });

  it('debería renderizar dos inputs de precio (min y max)', () => {
    render(<PriceRangeFilter />);

    const minInput = screen.getByLabelText(/precio mínimo/i);
    const maxInput = screen.getByLabelText(/precio máximo/i);

    expect(minInput).toBeInTheDocument();
    expect(maxInput).toBeInTheDocument();
  });

  it('debería llamar setFilters cuando se envía el formulario con valores válidos', async () => {
    const user = userEvent.setup();
    const mockSetFilters = vi.fn();
    vi.mocked(useProductFilters).mockReturnValue({
      setFilters: mockSetFilters,
    } as any);

    render(<PriceRangeFilter />);

    const minInput = screen.getByLabelText(/precio mínimo/i) as HTMLInputElement;
    const maxInput = screen.getByLabelText(/precio máximo/i) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /filtrar/i });

    await user.type(minInput, '10');
    await user.type(maxInput, '50');
    await user.click(button);

    expect(mockSetFilters).toHaveBeenCalledWith({
      price_min: 1000,
      price_max: 5000,
    });
  });

  it('debería mostrar error cuando min > max', async () => {
    const user = userEvent.setup();
    render(<PriceRangeFilter />);

    const minInput = screen.getByLabelText(/precio mínimo/i) as HTMLInputElement;
    const maxInput = screen.getByLabelText(/precio máximo/i) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /filtrar/i });

    await user.type(minInput, '50');
    await user.type(maxInput, '10');
    await user.click(button);

    const errorMsg = screen.getByText(/el precio mínimo no puede ser mayor/i);
    expect(errorMsg).toBeInTheDocument();
  });

  it('debería permitir rango válido: 0 a 100', async () => {
    const user = userEvent.setup();
    const mockSetFilters = vi.fn();
    vi.mocked(useProductFilters).mockReturnValue({
      setFilters: mockSetFilters,
    } as any);

    render(<PriceRangeFilter />);

    const minInput = screen.getByLabelText(/precio mínimo/i);
    const maxInput = screen.getByLabelText(/precio máximo/i);
    const button = screen.getByRole('button', { name: /filtrar/i });

    await userEvent.type(minInput, '0');
    await userEvent.type(maxInput, '100');
    await userEvent.click(button);

    expect(mockSetFilters).toHaveBeenCalledWith({
      price_min: 0,
      price_max: 10000,
    });
  });

  it('debería permitir dejar uno de los campos vacío (filtro parcial)', async () => {
    const user = userEvent.setup();
    const mockSetFilters = vi.fn();
    vi.mocked(useProductFilters).mockReturnValue({
      setFilters: mockSetFilters,
    } as any);

    render(<PriceRangeFilter />);

    const minInput = screen.getByLabelText(/precio mínimo/i);
    const button = screen.getByRole('button', { name: /filtrar/i });

    await user.type(minInput, '20');
    await user.click(button);

    expect(mockSetFilters).toHaveBeenCalledWith({
      price_min: 2000,
      price_max: undefined,
    });
  });
});
