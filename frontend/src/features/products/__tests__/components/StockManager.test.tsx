import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { StockManager } from '../../components/StockManager';

const mockStockMutate = vi.fn();

vi.mock('../../hooks', () => ({
  useProductStockUpdate: vi.fn(() => ({
    mutate: mockStockMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
  })),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('StockManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows current stock and edit button initially', () => {
    const queryClient = new QueryClient();
    render(<StockManager currentStock={42} productId={1} />, {
      wrapper: createWrapper(queryClient),
    });

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Editar')).toBeInTheDocument();
  });

  it('enters editing mode when edit is clicked', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    render(<StockManager currentStock={10} productId={1} />, {
      wrapper: createWrapper(queryClient),
    });

    await user.click(screen.getByText('Editar'));

    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('10');
  });

  it('increments stock value with + button', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    render(<StockManager currentStock={5} productId={1} />, {
      wrapper: createWrapper(queryClient),
    });

    await user.click(screen.getByText('Editar'));
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('5');

    await user.click(screen.getByText('+'));
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('6');
  });

  it('decrements stock value with - button', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    render(<StockManager currentStock={10} productId={1} />, {
      wrapper: createWrapper(queryClient),
    });

    await user.click(screen.getByText('Editar'));
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('10');

    await user.click(screen.getByText('-'));
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('9');
  });

  it('does not decrement below 0', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    render(<StockManager currentStock={0} productId={1} />, {
      wrapper: createWrapper(queryClient),
    });

    await user.click(screen.getByText('Editar'));
    expect(screen.getByText('-')).toBeDisabled();
  });

  it('calls updateStock on save with new value', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    const onSuccess = vi.fn();

    render(<StockManager currentStock={5} productId={1} onSuccess={onSuccess} />, {
      wrapper: createWrapper(queryClient),
    });

    await user.click(screen.getByText('Editar'));
    await user.click(screen.getByText('+'));

    await user.click(screen.getByText('Guardar'));
    await waitFor(() => {
      expect(mockStockMutate).toHaveBeenCalledWith({ id: 1, nueva_cantidad: 6 });
    });
  });

  it('cancels editing and reverts value', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(<StockManager currentStock={5} productId={1} />, {
      wrapper: createWrapper(queryClient),
    });

    await user.click(screen.getByText('Editar'));
    await user.click(screen.getByText('+'));
    await user.click(screen.getByText('Cancelar'));

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Editar')).toBeInTheDocument();
  });
});
