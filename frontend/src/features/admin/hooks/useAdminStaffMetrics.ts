import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface StaffMetrics {
  tiempo_promedio_preparacion: number;
  ordenes_completadas_hoy: number;
  horas_pico: number[];
  tendencia: number;
}

export function useAdminStaffMetrics(periodo: string) {
  return useQuery<StaffMetrics>({
    queryKey: ['admin-staff-metrics', periodo],
    queryFn: async () => {
      const { data } = await axiosClient.get<StaffMetrics>(
        '/api/v1/admin/dashboard/staff-metrics',
        { params: { periodo } }
      );
      return data;
    },
    staleTime: 30000,
  });
}
