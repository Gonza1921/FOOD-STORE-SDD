export interface UseCartReturn {
  items: Array<{ id: string; quantity: number }>
  total: number
}

export function useCart(): UseCartReturn {
  return {
    items: [],
    total: 0,
  }
}
