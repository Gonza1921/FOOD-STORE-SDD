/**
 * Integration Tests: Checkout & Payment Flow (CH-021, Task 4.4)
 *
 * Tests the payment flow integration:
 * - CheckoutPage renders with order summary and "Finalizar Compra"
 * - PaymentPage initializes MercadoPago checkout
 * - Error states are handled gracefully
 *
 * NOTE: These tests use mock adapters for axios and do NOT
 * require a real backend or MercadoPago sandbox.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { CheckoutPage } from '../pages/CheckoutPage';
import { PaymentPage } from '../pages/PaymentPage';
import { usePaymentStore } from '../store';
import { useCartStore } from '../../cart/store';

// ---------------------------------------------------------------------------
// Mock ALL possible resolutions of the axiosClient module.
// Vite resolves @/shared/api/axiosClient with extension order .mjs,.js,.mts,.ts
// — so the .js file might be resolved before .ts. We mock both.
// All data is inside vi.hoisted() to ensure it's available before vi.mock.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mock axiosClient module. Uses vi.hoisted to create shared mock fns that
// survive the vi.mock hoisting.
// ---------------------------------------------------------------------------

const { mockPost, mockGet } = vi.hoisted(() => {
  const post = vi.fn().mockName('mockPost');
  const get = vi.fn().mockName('mockGet');
  return { mockPost: post, mockGet: get };
});

vi.mock('@/shared/api/axiosClient', () => ({
  axiosClient: { post: mockPost, get: mockGet, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  default: { post: mockPost, get: mockGet, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));

beforeEach(() => {
  mockPost.mockReset();
  mockGet.mockReset();
});

afterEach(() => {
  usePaymentStore.setState({
    checkoutStep: 'idle',
    pedidoId: null,
    preferenceId: null,
    paymentStatus: null,
    error: null,
  });
  useCartStore.setState({ items: [] });
});

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

function PaymentPageWrapper({ pedidoId }: { pedidoId: string }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/pagar/${pedidoId}`]}>
        <Routes>
          <Route path="/pagar/:pedidoId" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Mocks for MercadoPago SDK
// ---------------------------------------------------------------------------

// Mock window.MercadoPago — add property without replacing entire window
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as Record<string, any>).MercadoPago = vi.fn().mockReturnValue({
    checkout: vi.fn(),
  });
});

vi.mock('@/shared/lib/mercadopago', () => ({
  loadMercadoPagoSDK: vi.fn().mockResolvedValue(undefined),
  initMercadoPago: vi.fn(),
}));

// Mock environment variable
vi.stubEnv('VITE_MERCADOPAGO_PUBLIC_KEY', 'TEST-1234');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Payment Flow Integration', () => {
  describe('CheckoutPage', () => {
    it('renders checkout with title when cart has items', () => {
      // Set items in cart so the page doesn't show empty state
      useCartStore.setState({
        items: [{ productoId: 1, nombre: 'Pizza', precio: 10, cantidad: 2 }],
      });

      render(<CheckoutPage />, { wrapper: Wrapper });

      // Should render the main title
      expect(screen.getByText('Finalizar Compra')).toBeInTheDocument();
    });

    it('shows empty cart state when there are no items', () => {
      useCartStore.setState({ items: [] });

      render(<CheckoutPage />, { wrapper: Wrapper });

      // Should show empty cart message
      expect(screen.getByText(/vacío/i)).toBeInTheDocument();
      expect(screen.getByText(/volver al catálogo/i)).toBeInTheDocument();
    });
  });

  describe('PaymentPage', () => {
    it('shows loading state on initial render', async () => {
      // Keep promise pending so loading state persists
      mockPost.mockReturnValue(new Promise(() => {}));

      render(<PaymentPageWrapper pedidoId="42" />);

      expect(screen.getByText(/iniciando pago/i)).toBeInTheDocument();
    });

    it('shows error state when API call fails', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      render(<PaymentPageWrapper pedidoId="42" />);

      await waitFor(() => {
        expect(screen.getByText(/Error en el pago/i)).toBeInTheDocument();
      });
    });

    it('renders payment page on successful API call', async () => {
      mockPost.mockResolvedValue({
        status: 201,
        data: {
          preference_id: 'pref_123',
          init_point: 'https://mercadopago.com/checkout/123',
          pedido_id: 42,
        },
      });

      render(<PaymentPageWrapper pedidoId="42" />);

      await waitFor(() => {
        expect(screen.getByText(/pedido #42/i)).toBeInTheDocument();
      });
    });
  });
});
