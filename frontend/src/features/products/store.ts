import { create } from 'zustand';

export interface ProductsStore {
  selectedProduct: string | null;
  setSelectedProduct: (id: string) => void;
}

export const useProductsStore = create<ProductsStore>((set) => ({
  selectedProduct: null,
  setSelectedProduct: (id: string) => set({ selectedProduct: id }),
}));
