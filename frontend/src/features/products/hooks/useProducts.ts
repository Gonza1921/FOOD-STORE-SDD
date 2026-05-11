export interface UseProductsReturn {
  products: Array<{ id: string; name: string }>;
  isLoading: boolean;
}

export function useProducts(): UseProductsReturn {
  return {
    products: [],
    isLoading: false,
  };
}
