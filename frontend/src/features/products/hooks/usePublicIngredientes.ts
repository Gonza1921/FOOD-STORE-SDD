import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

interface IngredientePublic {
  id: number;
  nombre: string;
  es_alergeno: boolean;
}

export function usePublicIngredientes() {
  return useQuery<IngredientePublic[]>({
    queryKey: ['ingredientes', 'publico'],
    queryFn: async () => {
      const { data } = await axiosClient.get<IngredientePublic[]>(
        '/ingredientes/publico'
      );
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });
}
