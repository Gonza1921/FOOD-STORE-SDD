import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface RecentOrderItem {
  id: number;
  cliente_nombre: string;
  total: number;
  estado_codigo: string;
  creado_en: string;
}

export function useAdminRecentOrders(periodo: string) {
  return useQuery<RecentOrderItem[]>({
    queryKey: ['admin-recent-orders', periodo],
    queryFn: async () => {
      const { data } = await axiosClient.get<RecentOrderItem[]>(
        '/api/v1/admin/dashboard/recent-orders',
        { params: { periodo } }
      );
      return data;
    },
    staleTime: 30000,
  });
}
