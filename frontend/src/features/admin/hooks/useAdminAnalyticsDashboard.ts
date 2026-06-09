import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface DashboardAnalytics {
  ventas_totales: number;
  ventas_mes: number;
  pedidos_totales: number;
  pedidos_pendientes: number;
  pedidos_pagados: number;
  usuarios_totales: number;
  productos_totales: number;
  ticket_promedio: number;
  ventas_por_mes: { mes: string; total: number }[];
  ventas_por_dia: { fecha: string; total: number }[];
  productos_mas_vendidos: { producto: string; cantidad: number }[];
  categorias_mas_vendidas: { categoria: string; cantidad: number }[];
}

export function useAdminAnalyticsDashboard(periodo: string = '30d') {
  return useQuery<DashboardAnalytics>({
    queryKey: ['admin', 'analytics', 'dashboard', periodo],
    queryFn: async () => {
      const { data } = await axiosClient.get<DashboardAnalytics>(
        '/admin/analytics/dashboard',
        { params: { periodo } }
      );
      return data;
    },
    staleTime: 30000,
  });
}
