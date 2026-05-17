import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartItem {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  ingredientes_excluidos?: number[];
  /** Precio al momento de agregar al carrito (para price check) */
  precioCarrito: number;
}

export interface CartStore {
  // State
  items: CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, 'cantidad'> & { cantidad?: number }) => void;
  removeItem: (productoId: number) => void;
  updateQuantity: (productoId: number, cantidad: number) => void;
  updatePrice: (productoId: number, nuevoPrecio: number) => void;
  clearCart: () => void;

  // Selectors (computed via functions)
  totalItems: () => number;
  totalPrice: () => number;
  getItem: (productoId: number) => CartItem | undefined;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // ---- State ----
      items: [],

      // ---- Actions ----

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productoId === item.productoId);
          if (existing) {
            // Increment quantity if product already in cart
            return {
              items: state.items.map((i) =>
                i.productoId === item.productoId
                  ? { ...i, cantidad: i.cantidad + (item.cantidad ?? 1) }
                  : i
              ),
            };
          }
          // Add new item
          return {
            items: [
              ...state.items,
              {
                productoId: item.productoId,
                nombre: item.nombre,
                precio: item.precio,
                precioCarrito: item.precioCarrito ?? item.precio,
                cantidad: item.cantidad ?? 1,
                imagen: item.imagen,
                ingredientes_excluidos: item.ingredientes_excluidos,
              },
            ],
          };
        }),

      removeItem: (productoId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productoId !== productoId),
        })),

      updateQuantity: (productoId, cantidad) =>
        set((state) => {
          if (cantidad <= 0) {
            return {
              items: state.items.filter((i) => i.productoId !== productoId),
            };
          }
          return {
            items: state.items.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i)),
          };
        }),

      updatePrice: (productoId, nuevoPrecio) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productoId === productoId ? { ...i, precio: nuevoPrecio } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      // ---- Selectors ----

      totalItems: (): number => get().items.reduce((sum, item) => sum + item.cantidad, 0),

      totalPrice: (): number =>
        get().items.reduce((sum, item) => sum + item.precio * item.cantidad, 0),

      getItem: (productoId: number): CartItem | undefined =>
        get().items.find((i) => i.productoId === productoId),
    }),
    {
      name: 'food-store-cart',
    }
  )
);
