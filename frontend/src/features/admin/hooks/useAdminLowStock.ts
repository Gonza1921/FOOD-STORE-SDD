import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface LowStockItem {
  id: number;
  nombre: string;
  stock_cantidad: number;
  stock_minimo: number;
  severidad: string;
  porcentaje: number;
}

export function useAdminLowStock() {
  return useQuery<LowStockItem[]>({
    queryKey: ['admin-low-stock'],
    queryFn: async () => {
      const { data } = await axiosClient.get<LowStockItem[]>(
        '/api/v1/admin/dashboard/low-stock'
      );
      return data;
    },
    staleTime: 30000,
  });
}
