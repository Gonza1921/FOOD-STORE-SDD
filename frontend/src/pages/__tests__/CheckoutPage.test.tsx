/**
 * CheckoutPage Component Tests
 *
 * Tests the cart checkout flow: displays items, allows quantity updates,
 * and creates orders via API.
 */

// ---------------------------------------------------------------------------
// Mocks - Must be at top level for vitest hoisting
// ---------------------------------------------------------------------------

// Mock cart store
const mockCartItems = [
  {
    productoId: 1,
    nombre: 'Pizza Margherita',
    precio: 15.0,
    cantidad: 2,
    imagen: 'https://example.com/pizza.jpg',
  },
  {
    productoId: 2,
    nombre: 'Refresco Cola',
    precio: 3.5,
    cantidad: 3,
    imagen: '',
  },
];

const mockCartStore = {
  items: mockCartItems,
  totalPrice: () => 41.5,
  totalItems: () => 5,
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
};

// Mock useCreatePedido hook
const mockCreatePedido = vi.fn();

vi.mock('@/features/cart/store', () => ({
  useCartStore: vi.fn(() => mockCartStore),
}));

vi.mock('@/features/pedidos', () => ({
  useCreatePedido: vi.fn(() => ({
    mutate: mockCreatePedido,
    mutateAsync: mockCreatePedido,
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
  })),
}));

vi.mock('@/features/ui/store', () => ({
  useUiStore: vi.fn(() => ({
    addToast: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CheckoutPage } from '../CheckoutPage';

function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header', () => {
    renderWithRouter(<CheckoutPage />);

    expect(screen.getByText('Finalizar Compra')).toBeInTheDocument();
    expect(screen.getByText('Revisá los productos antes de confirmar')).toBeInTheDocument();
  });

  it('displays cart items with details', () => {
    renderWithRouter(<CheckoutPage />);

    // Use getAllByText because items appear in both desktop table and mobile cards
    expect(screen.getAllByText('Pizza Margherita').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Refresco Cola').length).toBeGreaterThan(0);
  });

  it('displays order summary with total', () => {
    renderWithRouter(<CheckoutPage />);

    expect(screen.getByText('Resumen de la compra')).toBeInTheDocument();
  });

  it('displays checkout button', () => {
    renderWithRouter(<CheckoutPage />);

    expect(screen.getByText('Confirmar Compra')).toBeInTheDocument();
  });

  it('calls handleCheckout when confirm button clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CheckoutPage />);

    const checkoutButton = screen.getByText('Confirmar Compra');
    await user.click(checkoutButton);

    expect(mockCreatePedido).toHaveBeenCalledWith({
      items: [
        { producto_id: 1, cantidad: 2 },
        { producto_id: 2, cantidad: 3 },
      ],
    });
  });

  it('navigates to catalog when "Seguir comprando" is clicked', () => {
    renderWithRouter(<CheckoutPage />);

    const link = screen.getByRole('link', { name: /seguir comprando/i });
    expect(link).toHaveAttribute('href', '/catalogo');
  });
});

describe('CheckoutPage - Empty Cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty cart state when no items', async () => {
    // Re-mock with empty cart
    const { useCartStore } = await import('@/features/cart/store');
    vi.mocked(useCartStore).mockReturnValue({
      items: [],
      totalPrice: () => 0,
      totalItems: () => 0,
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
    });

    renderWithRouter(<CheckoutPage />);

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver catálogo/i })).toBeInTheDocument();
  });
});

