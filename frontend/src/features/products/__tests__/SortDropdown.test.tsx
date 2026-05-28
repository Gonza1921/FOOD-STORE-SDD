/**
 * SortDropdown.test.tsx - Unit tests for SortDropdown component
 * 
 * Phase 8.4: Tests that SortDropdown should renderizar todas 5 opciones
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortDropdown } from '../SortDropdown';
import { useProductFilters } from '../useProductFilters';

// Mock the hook
vi.mock('../useProductFilters', () => ({
  useProductFilters: vi.fn(),
}));

describe('SortDropdown Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar todas las 5 opciones de ordenamiento', () => {
    vi.mocked(useProductFilters).mockReturnValue({
      sort_by: 'reciente',
      setFilters: vi.fn(),
    } as any);

    render(<SortDropdown />);

    const select = screen.getByDisplayValue('Más reciente');
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);

    expect(options[0]).toHaveTextContent('Más reciente');
    expect(options[1]).toHaveTextContent('Nombre A-Z');
    expect(options[2]).toHaveTextContent('Nombre Z-A');
    expect(options[3]).toHaveTextContent('Menor precio');
    expect(options[4]).toHaveTextContent('Mayor precio');
  });

  it('debería mostrar opción seleccionada correctamente', () => {
    vi.mocked(useProductFilters).mockReturnValue({
      sort_by: 'price_asc',
      setFilters: vi.fn(),
    } as any);

    render(<SortDropdown />);

    const select = screen.getByDisplayValue('Menor precio');
    expect(select).toBeInTheDocument();
  });

  it('debería llamar setFilters cuando se selecciona nueva opción', async () => {
    const user = userEvent.setup();
    const mockSetFilters = vi.fn();
    vi.mocked(useProductFilters).mockReturnValue({
      sort_by: 'reciente',
      setFilters: mockSetFilters,
    } as any);

    render(<SortDropdown />);

    const select = screen.getByLabelText(/ordenar por/i);
    await user.selectOptions(select, 'price_desc');

    expect(mockSetFilters).toHaveBeenCalledWith({ sort_by: 'price_desc' });
  });

  it('debería mapear correctamente todos los valores backend', async () => {
    const user = userEvent.setup();
    const mockSetFilters = vi.fn();
    vi.mocked(useProductFilters).mockReturnValue({
      sort_by: 'reciente',
      setFilters: mockSetFilters,
    } as any);

    render(<SortDropdown />);

    const select = screen.getByLabelText(/ordenar por/i);

    // Test each option
    await user.selectOptions(select, 'price_asc');
    expect(mockSetFilters).toHaveBeenCalledWith({ sort_by: 'price_asc' });

    await user.selectOptions(select, 'nombre_desc');
    expect(mockSetFilters).toHaveBeenCalledWith({ sort_by: 'nombre_desc' });

    await user.selectOptions(select, 'reciente');
    expect(mockSetFilters).toHaveBeenCalledWith({ sort_by: 'reciente' });
  });

  it('debería tener aria-label para accesibilidad', () => {
    vi.mocked(useProductFilters).mockReturnValue({
      sort_by: 'reciente',
      setFilters: vi.fn(),
    } as any);

    render(<SortDropdown />);

    const select = screen.getByLabelText(/ordenar por/i);
    expect(select).toHaveAttribute('aria-label', 'Opción de ordenamiento');
  });
});
