import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { ProductForm } from '../../components/ProductForm';

vi.mock('../../hooks', () => ({
  useProductCreate: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
  })),
  useProductUpdate: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
  })),
}));

// Mock sub-components — separate from the main component
vi.mock('../../components/CategoriesSelector', () => ({
  CategoriesSelector: () => <div data-testid="categories-selector" />,
}));

vi.mock('../../components/IngredientsSelector', () => ({
  IngredientsSelector: () => <div data-testid="ingredients-selector" />,
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required form fields', () => {
    const queryClient = new QueryClient();
    render(<ProductForm />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
    expect(screen.getByTestId('categories-selector')).toBeInTheDocument();
    expect(screen.getByTestId('ingredients-selector')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    render(<ProductForm />, { wrapper: createWrapper(queryClient) });

    await user.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/el precio es requerido/i)).toBeInTheDocument();
    });
  });

  it('renders disabled inputs when externalLoading is true', () => {
    const queryClient = new QueryClient();
    render(<ProductForm externalLoading={true} />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByLabelText(/nombre/i)).toBeDisabled();
    expect(screen.getByLabelText(/precio/i)).toBeDisabled();
    expect(screen.getByLabelText(/stock/i)).toBeDisabled();
  });

  it('renders in edit mode with product data', () => {
    const queryClient = new QueryClient();
    const product = {
      id: 1,
      nombre: 'Pizza Test',
      descripcion: 'Delicious',
      precio_base: '25.00',
      stock_cantidad: 10,
      disponible: true,
      categorias: [{ id: 1, nombre: 'Pizzas' }],
      ingredientes: [],
      creado_en: '2024-01-01T00:00:00Z',
      actualizado_en: '2024-01-01T00:00:00Z',
    };

    render(<ProductForm product={product} />, { wrapper: createWrapper(queryClient) });

    const nombreInput = screen.getByLabelText(/nombre/i) as HTMLInputElement;
    expect(nombreInput.value).toBe('Pizza Test');
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    const onCancel = vi.fn();

    render(<ProductForm onCancel={onCancel} />, { wrapper: createWrapper(queryClient) });

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when externalLoading is true', () => {
    const queryClient = new QueryClient();
    render(<ProductForm externalLoading={true} />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByRole('button', { name: /guardando/i })).toBeInTheDocument();
  });
});
