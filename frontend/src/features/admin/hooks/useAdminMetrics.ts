import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface AdminMetrics {
  totalPedidos: number;
  pedidosPendientes: number;
  ingresosTotales: number;
  productosStockBajo: number;
  pedidosPorEstado: Record<string, number>;
  ingresosPorDia: { fecha: string; total: number }[];
  tendenciaPedidos: { fecha: string; total: number }[];
}

const getMetrics = async (): Promise<AdminMetrics> => {
  const response = await axiosClient.get<AdminMetrics>(    '/admin/metrics');
  return response.data;
};

export function useAdminMetrics() {
  return useQuery({
    queryKey: ['admin-metrics'],
    queryFn: getMetrics,
    staleTime: 30000, // 30 segundos
  });
}