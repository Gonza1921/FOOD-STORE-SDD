import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useProducts } from '../../hooks/useProducts';

vi.mock('../../api/endpoints', () => ({
  listProducts: vi.fn(),
  PRODUCT_QUERY_KEYS: {
    all: ['products'],
    lists: () => ['products', 'list'],
    list: (params: Record<string, unknown>) => ['products', 'list', params],
    details: () => ['products', 'detail'],
    detail: (id: number) => ['products', 'detail', id],
    public: () => ['products', 'public'],
    publicCatalog: (params: Record<string, unknown>) => ['products', 'public', 'catalog', params],
  },
}));

import { listProducts } from '../../api/endpoints';

const mockItem = {
  id: 1,
  nombre: 'Test Product',
  descripcion: 'Desc',
  precio_base: '10.99',
  stock_cantidad: 100,
  disponible: true,
  categorias: [{ id: 1, nombre: 'Cat' }],
  ingredientes: [],
  creado_en: '2024-01-01T00:00:00Z',
  actualizado_en: '2024-01-01T00:00:00Z',
};

const mockResponse = {
  items: [mockItem],
  total: 1,
  skip: 0,
  limit: 20,
  page: 1,
  total_pages: 1,
};

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products with default params', async () => {
    vi.mocked(listProducts).mockResolvedValue(mockResponse);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listProducts).toHaveBeenCalledWith(0, 20, false);
    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.total).toBe(1);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it('passes pagination and include_deleted params', async () => {
    vi.mocked(listProducts).mockResolvedValue(mockResponse);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(() => useProducts({ skip: 10, limit: 5, include_deleted: true }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(listProducts).toHaveBeenCalledWith(10, 5, true));
  });

  it('does not fetch when enabled is false', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useProducts({ enabled: false }), {
      wrapper: createWrapper(queryClient),
    });

    expect(listProducts).not.toHaveBeenCalled();
  });
});
