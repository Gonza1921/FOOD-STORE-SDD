/**
 * ProductCatalogPage.test.tsx - Integration tests for ProductCatalogPage
 * 
 * Phase 8.5: Tests that ProductCatalogPage should mostrar "No hay productos" cuando array vacío
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductCatalogPage from '../../pages/ProductCatalogPage';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { useProductFilters } from '../useProductFilters';

// Mock the hooks
vi.mock('../hooks/usePublicCatalog', () => ({
  usePublicCatalog: vi.fn(),
}));

vi.mock('../useProductFilters', () => ({
  useProductFilters: vi.fn(),
}));

vi.mock('../FilterContainer', () => ({
  FilterContainer: () => <div data-testid="filter-container">Filters</div>,
}));

vi.mock('../ProductList', () => ({
  ProductList: ({ items, isLoading }: any) => (
    <div data-testid="product-list">
      {isLoading ? (
        <div>Cargando...</div>
      ) : items.length === 0 ? (
        <div>No hay productos que coincidan con tus filtros</div>
      ) : (
        <div>{items.length} productos</div>
      )}
    </div>
  ),
}));

describe('ProductCatalogPage Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Default mock for useProductFilters
    vi.mocked(useProductFilters).mockReturnValue({
      page: 1,
      price_min: undefined,
      price_max: undefined,
      sort_by: 'reciente',
      categoria_id: undefined,
      setPage: vi.fn(),
      clearFilters: vi.fn(),
      setFilters: vi.fn(),
    } as any);
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('debería renderizar página con filtros y lista de productos', async () => {
    vi.mocked(usePublicCatalog).mockReturnValue({
      data: {
        items: [
          { id: 1, nombre: 'Producto 1', precio_base: 1000, disponible: true } as any,
        ],
        total: 1,
        page: 1,
      } as any,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ProductCatalogPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('filter-container')).toBeInTheDocument();
      expect(screen.getByTestId('product-list')).toBeInTheDocument();
    });
  });

  it('debería mostrar spinner mientras carga', async () => {
    vi.mocked(usePublicCatalog).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<ProductCatalogPage />, { wrapper });

    // Wait for hydration to complete
    await waitFor(() => {
      expect(screen.getByText(/cargando productos/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debería mostrar mensaje "No hay productos" cuando resultados vacíos', async () => {
    vi.mocked(usePublicCatalog).mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
      } as any,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ProductCatalogPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/no hay productos que coincidan/i)).toBeInTheDocument();
    });
  });

  it('debería mostrar estado de error con botón "Reintentar"', async () => {
    vi.mocked(usePublicCatalog).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any);

    render(<ProductCatalogPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/error al cargar productos/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });

  it('debería pasar filtros correctos a usePublicCatalog hook', async () => {
    vi.mocked(useProductFilters).mockReturnValue({
      page: 2,
      price_min: 1000,
      price_max: 5000,
      sort_by: 'price_asc',
      categoria_id: 3,
      setPage: vi.fn(),
      clearFilters: vi.fn(),
      setFilters: vi.fn(),
    } as any);

    vi.mocked(usePublicCatalog).mockReturnValue({
      data: { items: [], total: 0, page: 2 } as any,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ProductCatalogPage />, { wrapper });

    await waitFor(() => {
      expect(usePublicCatalog).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 2 - 1) * 20
          limit: 20,
          precio_min: 1000,
          precio_max: 5000,
          sort_by: 'price_asc',
          categoria_id: 3,
        })
      );
    });
  });
});
