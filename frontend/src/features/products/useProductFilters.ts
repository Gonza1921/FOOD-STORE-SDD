import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * ProductFiltersState — Zustand store for product filter persistence
 *
 * Features:
 * - Persists filters to localStorage (key: "product-filters")
 * - Automatic restoration on page refresh
 * - Resets to defaults when filters are cleared
 */
export interface ProductFiltersState {
  // State
  categoria_id?: number;
  price_min?: number;
  price_max?: number;
  sort_by: 'price_asc' | 'price_desc' | 'nombre_asc' | 'nombre_desc' | 'reciente';
  page: number;

  // Actions
  setFilters: (filters: Partial<Omit<ProductFiltersState, 'setFilters' | 'clearFilters' | 'setPage'>>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
}

const initialState = {
  categoria_id: undefined,
  price_min: undefined,
  price_max: undefined,
  sort_by: 'reciente' as const,
  page: 1,
};

export const useProductFilters = create<ProductFiltersState>()(
  persist(
    (set) => ({
      ...initialState,

      setFilters: (filters) => {
        set((state) => ({
          ...state,
          ...filters,
          page: 1, // Reset to page 1 when filters change
        }));
      },

      clearFilters: () => {
        set(initialState);
      },

      setPage: (page) => {
        set({ page });
      },
    }),
    {
      name: 'product-filters', // localStorage key
      version: 1,
      partialize: (state) => ({
        categoria_id: state.categoria_id,
        price_min: state.price_min,
        price_max: state.price_max,
        sort_by: state.sort_by,
        page: state.page,
      }),
    }
  )
);
