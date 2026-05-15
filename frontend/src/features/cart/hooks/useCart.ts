import { useCartStore } from '../store';

export interface UseCartReturn {
  items: ReturnType<typeof useCartStore.getState>['items'];
  totalItems: number;
  totalPrice: number;
  isEmpty: boolean;
  addItem: ReturnType<typeof useCartStore.getState>['addItem'];
  removeItem: ReturnType<typeof useCartStore.getState>['removeItem'];
  updateQuantity: ReturnType<typeof useCartStore.getState>['updateQuantity'];
  clearCart: ReturnType<typeof useCartStore.getState>['clearCart'];
}

export function useCart(): UseCartReturn {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const totalPrice = useCartStore((s) => s.totalPrice());
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  return {
    items,
    totalItems,
    totalPrice,
    isEmpty: items.length === 0,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}