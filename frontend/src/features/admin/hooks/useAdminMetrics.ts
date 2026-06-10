import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface AdminMetrics {
  totalPedidos: number;
  pedidosPendientes: number;
  ingresosTotales: number;
  productosStockBajo: number;
  totalClientes: number;
  ticketPromedio: number;
  pedidosPorEstado: Record<string, number>;
  ingresosPorDia: { fecha: string; total: number }[];
  tendenciaPedidos: { fecha: string; total: number }[];
  tendencias?: {
    pedidos: { valor: number; anterior: number; cambio: number };
    ingresos: { valor: number; anterior: number; cambio: number };
    clientes: { valor: number; anterior: number; cambio: number };
    ticketPromedio: { valor: number; anterior: number; cambio: number };
  };
}

const getMetrics = async (periodo: string): Promise<AdminMetrics> => {
  const params: Record<string, string> = {};
  if (periodo !== '30d') params.periodo = periodo;
  const response = await axiosClient.get<AdminMetrics>('/admin/metrics', { params });
  return response.data;
};

export function useAdminMetrics(periodo = '30d') {
  return useQuery({
    queryKey: ['admin-metrics', periodo],
    queryFn: () => getMetrics(periodo),
    staleTime: 30000,
  });
}
