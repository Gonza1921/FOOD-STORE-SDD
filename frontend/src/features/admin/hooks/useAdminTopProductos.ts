import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface TopProductoItem {
  id: number;
  nombre: string;
  total_vendido: number;
  precio_base: number;
}

export interface TopProductosResponse {
  items: TopProductoItem[];
  total: number;
}

export function useAdminTopProductos(limite = 10) {
  return useQuery<TopProductosResponse>({
    queryKey: ['admin', 'metricas', 'productos-top', limite],
    queryFn: async () => {
      const { data } = await axiosClient.get<TopProductosResponse>(
        '/admin/metricas/productos-top',
        { params: { limite } }
      );
      return data;
    },
  });
}
