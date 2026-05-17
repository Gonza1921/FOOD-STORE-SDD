import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

export interface ConfigItem {
  clave: string;
  valor: string;
  descripcion: string | null;
  actualizado_en: string | null;
}

interface ConfiguracionResponse {
  configuraciones: ConfigItem[];
}

interface UpdatePayload {
  clave: string;
  valor: string;
  descripcion?: string | null;
}

const getConfiguracion = async (): Promise<ConfigItem[]> => {
  const response = await axiosClient.get<ConfiguracionResponse>(
    `/api/v1${API.ADMIN.CONFIGURACION}`
  );
  return response.data.configuraciones;
};

export function useAdminConfiguracion() {
  return useQuery({
    queryKey: ['admin-configuracion'],
    queryFn: getConfiguracion,
    staleTime: 30000,
  });
}

export function useUpdateConfiguracion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: UpdatePayload[]) => {
      await axiosClient.put(`/api/v1${API.ADMIN.CONFIGURACION}`, items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-configuracion'] });
    },
  });
}
