/**
 * useProducts.test.ts - Unit tests for useProducts hook
 * 
 * Phase 8.1: Tests that useProducts hook retorna items when fetch exitoso (Vitest + msw)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from '../hooks/useProducts';
import { listProducts } from '../api/endpoints';

// Mock the API endpoint
vi.mock('../api/endpoints', () => ({
  listProducts: vi.fn(),
  PRODUCT_QUERY_KEYS: {
    list: ({ skip, limit }: any) => ['products', 'list', skip, limit],
  },
}));

describe('useProducts Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('debería retornar items cuando el fetch es exitoso', async () => {
    const mockData = {
      items: [
        {
          id: 1,
          nombre: 'Leche descremada',
          precio_base: 1500,
          stock_cantidad: 10,
          disponible: true,
          categoria_id: 2,
          descripcion: 'Leche descremada 1L',
        },
        {
          id: 2,
          nombre: 'Pan de harina integral',
          precio_base: 800,
          stock_cantidad: 20,
          disponible: true,
          categoria_id: 1,
          descripcion: 'Pan integral 500g',
        },
      ],
      total: 2,
      page: 1,
      total_pages: 1,
    };

    vi.mocked(listProducts).mockResolvedValue(mockData);

    const { result } = renderHook(() => useProducts({ skip: 0, limit: 20 }), {
      wrapper,
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for query to resolve
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that data is returned
    expect(result.current.data).toEqual(mockData);
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.items[0].nombre).toBe('Leche descremada');
    expect(result.current.total).toBe(2);
  });

  it('debería capturar error cuando el fetch falla', async () => {
    const error = new Error('Network error');
    vi.mocked(listProducts).mockRejectedValue(error);

    const { result } = renderHook(() => useProducts({ skip: 0, limit: 20 }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('debería usar parámetros skip y limit correctamente', async () => {
    vi.mocked(listProducts).mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      total_pages: 1,
    });

    renderHook(() => useProducts({ skip: 20, limit: 10 }), { wrapper });

    await waitFor(() => {
      expect(listProducts).toHaveBeenCalledWith(20, 10, false);
    });
  });

  it('debería deshabilitar query cuando enabled es false', () => {
    vi.mocked(listProducts).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      total_pages: 1,
    });

    const { result } = renderHook(
      () => useProducts({ skip: 0, limit: 20, enabled: false }),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(listProducts).not.toHaveBeenCalled();
  });
});
