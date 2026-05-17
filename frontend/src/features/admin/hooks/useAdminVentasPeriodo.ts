import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface VentasPeriodoItem {
  periodo: string;
  total_ventas: number;
  cantidad_pedidos: number;
}

export interface VentasPeriodoResponse {
  items: VentasPeriodoItem[];
  total_ventas: number;
  desde: string;
  hasta: string;
  granularidad: string;
}

export interface VentasParams {
  desde?: string;
  hasta?: string;
  granularidad?: 'day' | 'week' | 'month';
}

export function useAdminVentasPeriodo(params: VentasParams) {
  const { desde, hasta, granularidad = 'day' } = params;
  return useQuery<VentasPeriodoResponse>({
    queryKey: ['admin', 'metricas', 'ventas', desde, hasta, granularidad],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (desde) searchParams.set('desde', desde);
      if (hasta) searchParams.set('hasta', hasta);
      searchParams.set('granularidad', granularidad);
      const { data } = await axiosClient.get<VentasPeriodoResponse>(
        `/api/v1/admin/metricas/ventas?${searchParams}`
      );
      return data;
    },
    enabled: !!desde && !!hasta,
  });
}
