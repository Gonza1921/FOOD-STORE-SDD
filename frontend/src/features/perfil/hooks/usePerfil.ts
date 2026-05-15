import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PerfilData {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  creadoEn: string;
}

export interface PerfilUpdatePayload {
  nombre?: string;
  apellido?: string;
  telefono?: string | null;
}

export interface CambiarContrasenaPayload {
  contrasenaActual: string;
  nuevaContrasena: string;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const perfilKeys = {
  all: ['perfil'] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function usePerfil() {
  return useQuery<PerfilData>({
    queryKey: perfilKeys.all,
    queryFn: async () => {
      const { data } = await axiosClient.get(API.USUARIOS.PERFIL);
      return data;
    },
  });
}

export function useUpdatePerfil() {
  const queryClient = useQueryClient();

  return useMutation<PerfilData, Error, PerfilUpdatePayload>({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.put(API.USUARIOS.PERFIL, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: perfilKeys.all });
    },
  });
}

export function useCambiarContrasena() {
  return useMutation<{ message: string }, Error, CambiarContrasenaPayload>({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post(
        API.USUARIOS.CAMBIAR_CONTRASENA,
        payload
      );
      return data;
    },
  });
}
