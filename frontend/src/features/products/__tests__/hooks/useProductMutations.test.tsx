import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, type ReactNode } from 'react';
import {
  useProductCreate,
  useProductUpdate,
  useProductDelete,
  useProductStockUpdate,
} from '../../hooks/useProductMutations';

vi.mock('../../api/endpoints', () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  updateProductStock: vi.fn(),
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

import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from '../../api/endpoints';

const mockProduct = {
  id: 1,
  nombre: 'Test',
  descripcion: 'Desc',
  precio_base: '10.99',
  stock_cantidad: 50,
  disponible: true,
  categorias: [],
  ingredientes: [],
  creado_en: '2024-01-01T00:00:00Z',
  actualizado_en: '2024-01-01T00:00:00Z',
};

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useProductCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createProduct with correct data', async () => {
    vi.mocked(createProduct).mockResolvedValue(mockProduct);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useProductCreate(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        nombre: 'New Product',
        precio_base: '15.00',
        stock_cantidad: 10,
        disponible: true,
        categoria_id: 1,
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(createProduct).toHaveBeenCalledWith({
      nombre: 'New Product',
      precio_base: '15.00',
      stock_cantidad: 10,
      disponible: true,
      categoria_id: 1,
    });
  });
});

describe('useProductUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateProduct with correct id and data', async () => {
    vi.mocked(updateProduct).mockResolvedValue(mockProduct);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useProductUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ id: 1, data: { nombre: 'Updated' } });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(updateProduct).toHaveBeenCalledWith(1, { nombre: 'Updated' });
  });
});

describe('useProductDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteProduct with correct id', async () => {
    vi.mocked(deleteProduct).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useProductDelete(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(deleteProduct).toHaveBeenCalledWith(1);
  });
});

describe('useProductStockUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateProductStock with correct id and quantity', async () => {
    vi.mocked(updateProductStock).mockResolvedValue(mockProduct);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useProductStockUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ id: 1, nueva_cantidad: 100 });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(updateProductStock).toHaveBeenCalledWith(1, 100);
  });
});
