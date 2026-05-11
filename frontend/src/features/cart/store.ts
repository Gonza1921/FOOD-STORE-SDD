import { create } from 'zustand'

export interface CartStore {
  cartOpen: boolean
  toggleCart: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  cartOpen: false,
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
}))
