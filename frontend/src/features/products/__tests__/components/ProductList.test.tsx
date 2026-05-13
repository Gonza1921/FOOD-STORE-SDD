import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { ProductList } from '../../components/ProductList';

const mockMutate = vi.fn();
const mockStockMutate = vi.fn();

vi.mock('../../hooks', () => ({
  useProducts: vi.fn(),
  useProductDelete: vi.fn(() => ({
    mutate: mockMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useProductStockUpdate: vi.fn(() => ({
    mutate: mockStockMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
  })),
}));

vi.mock('../../components/StockManager', () => ({
  StockManager: () => <div data-testid="stock-manager" />,
}));

import { useProducts } from '../../hooks';

const mockProducts = [
  {
    id: 1,
    nombre: 'Pizza Margherita',
    descripcion: 'Classic',
    precio_base: '15.00',
    stock_cantidad: 20,
    disponible: true,
    categorias: [{ id: 1, nombre: 'Pizzas' }],
    ingredientes: [],
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    nombre: 'Hamburguesa',
    descripcion: null,
    precio_base: '12.00',
    stock_cantidad: 5,
    disponible: false,
    categorias: [{ id: 2, nombre: 'Burgers' }],
    ingredientes: [],
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z',
  },
];

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProducts).mockReturnValue({
      data: { items: mockProducts, total: 2, skip: 0, limit: 10, page: 1, total_pages: 1 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      total: 2,
      page: 1,
      totalPages: 1,
    });
  });

  it('renders a list of products', () => {
    const queryClient = new QueryClient();
    render(<ProductList />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    expect(screen.getByText('Hamburguesa')).toBeInTheDocument();
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('$12.00')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useProducts).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      total: undefined,
      page: undefined,
      totalPages: undefined,
    });

    const queryClient = new QueryClient();
    render(<ProductList />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText(/cargando productos/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(useProducts).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API Error'),
      refetch: vi.fn(),
      total: undefined,
      page: undefined,
      totalPages: undefined,
    });

    const queryClient = new QueryClient();
    render(<ProductList />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText(/error al cargar productos/i)).toBeInTheDocument();
  });

  it('shows pagination controls', () => {
    vi.mocked(useProducts).mockReturnValue({
      data: { items: mockProducts, total: 25, skip: 0, limit: 10, page: 1, total_pages: 3 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      total: 25,
      page: 1,
      totalPages: 3,
    });

    const queryClient = new QueryClient();
    render(<ProductList />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText(/página 1 de 3/i)).toBeInTheDocument();
    expect(screen.getByText(/anterior/i)).toBeDisabled();
    expect(screen.getByText(/siguiente/i)).toBeEnabled();
  });

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    const onEdit = vi.fn();

    render(<ProductList onEdit={onEdit} />, { wrapper: createWrapper(queryClient) });

    const editButtons = screen.getAllByText('Editar');
    // Second Editar button is the "Edit Product" action (first is stock edit)
    await user.click(editButtons[1]);

    expect(onEdit).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('shows empty state when no products', () => {
    vi.mocked(useProducts).mockReturnValue({
      data: { items: [], total: 0, skip: 0, limit: 10, page: 1, total_pages: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      total: 0,
      page: 1,
      totalPages: 0,
    });

    const queryClient = new QueryClient();
    render(<ProductList />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText(/no hay productos registrados/i)).toBeInTheDocument();
  });
});
