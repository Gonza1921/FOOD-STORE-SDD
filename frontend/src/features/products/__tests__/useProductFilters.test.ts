/**
 * useProductFilters.test.ts - Unit tests for useProductFilters Zustand store
 * 
 * Phase 8.2: Tests that useProductFilters store should persist en localStorage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductFilters } from '../useProductFilters';

describe('useProductFilters Store (Zustand)', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset all modules to get fresh store instance
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debería inicializar con valores por defecto', () => {
    const { result } = renderHook(() => useProductFilters());

    expect(result.current.price_min).toBeUndefined();
    expect(result.current.price_max).toBeUndefined();
    expect(result.current.sort_by).toBe('reciente');
    expect(result.current.page).toBe(1);
  });

  it('debería actualizar filtros de precio', () => {
    const { result } = renderHook(() => useProductFilters());

    act(() => {
      result.current.setFilters({ price_min: 1000, price_max: 5000 });
    });

    expect(result.current.price_min).toBe(1000);
    expect(result.current.price_max).toBe(5000);
  });

  it('debería resetear página a 1 cuando se cambian filtros', () => {
    const { result } = renderHook(() => useProductFilters());

    // Set page to 5
    act(() => {
      result.current.setPage(5);
    });
    expect(result.current.page).toBe(5);

    // Change filters — page should reset to 1
    act(() => {
      result.current.setFilters({ price_min: 1000 });
    });

    expect(result.current.page).toBe(1);
  });

  it('debería actualizar sort_by', () => {
    const { result } = renderHook(() => useProductFilters());

    act(() => {
      result.current.setFilters({ sort_by: 'price_asc' });
    });

    expect(result.current.sort_by).toBe('price_asc');
  });

  it('debería limpiar todos los filtros', () => {
    const { result } = renderHook(() => useProductFilters());

    // Set various filters
    act(() => {
      result.current.setFilters({
        price_min: 1000,
        price_max: 5000,
        sort_by: 'price_desc',
      });
      result.current.setPage(3);
    });

    // Clear filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.price_min).toBeUndefined();
    expect(result.current.price_max).toBeUndefined();
    expect(result.current.sort_by).toBe('reciente');
    expect(result.current.page).toBe(1);
  });

  it('debería cambiar página sin afectar otros filtros', () => {
    const { result } = renderHook(() => useProductFilters());

    // Set filters
    act(() => {
      result.current.setFilters({
        price_min: 1000,
        price_max: 5000,
        sort_by: 'price_asc',
      });
    });

    // Change page
    act(() => {
      result.current.setPage(2);
    });

    // Other filters should persist
    expect(result.current.price_min).toBe(1000);
    expect(result.current.price_max).toBe(5000);
    expect(result.current.sort_by).toBe('price_asc');
    expect(result.current.page).toBe(2);
  });

  it('debería persistir estado en localStorage', () => {
    const { result } = renderHook(() => useProductFilters());

    // Set filters
    act(() => {
      result.current.setFilters({
        price_min: 2000,
        price_max: 8000,
        sort_by: 'nombre_asc',
      });
    });

    // Check localStorage
    const stored = localStorage.getItem('product-filters');
    expect(stored).toBeDefined();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.price_min).toBe(2000);
    expect(parsed.price_max).toBe(8000);
    expect(parsed.sort_by).toBe('nombre_asc');
  });

  it('debería restaurar estado desde localStorage', () => {
    // Set stored data
    const storedState = {
      price_min: 3000,
      price_max: 9000,
      sort_by: 'nombre_desc',
      page: 1,
    };
    localStorage.setItem(
      'product-filters',
      JSON.stringify(storedState)
    );

    // Render new hook instance — should restore from localStorage
    const { result } = renderHook(() => useProductFilters());

    // Note: Zustand's persist middleware might not restore immediately 
    // in test environment, but the structure should support it
    expect(result.current.sort_by).toBe('nombre_desc');
  });
});
