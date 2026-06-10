import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface RecentCustomerItem {
  id: number;
  nombre: string;
  email: string;
  creado_en: string;
  total_ordenes: number;
}

export function useAdminRecentCustomers() {
  return useQuery<RecentCustomerItem[]>({
    queryKey: ['admin-recent-customers'],
    queryFn: async () => {
      const { data } = await axiosClient.get<RecentCustomerItem[]>(
        '/api/v1/admin/dashboard/recent-customers'
      );
      return data;
    },
    staleTime: 30000,
  });
}
