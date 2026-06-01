import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import axiosClient from '@/shared/api/axiosClient';
import { COCINA_API } from '../api/endpoints';

interface ToggleDisponibilidadParams {
  productoId: number;
  disponible: boolean;
}

/**
 * Hook que expone una mutation para cambiar la disponibilidad de un producto
 * via PATCH /cocina/productos/{id}/disponibilidad.
 *
 * On success invalida la query ['kds-pedidos'] para refrescar la UI.
 * On error (404) muestra "Producto no encontrado" y recarga pedidos.
 */
export function useToggleDisponibilidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productoId, disponible }: ToggleDisponibilidadParams) =>
      axiosClient.patch(COCINA_API.DISPONIBILIDAD(productoId), { disponible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-pedidos'] });
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const message =
        error.response?.data?.detail || 'Error al cambiar disponibilidad';
      alert(message);
      // Refetch pedidos on error too (in case state got out of sync)
      queryClient.invalidateQueries({ queryKey: ['kds-pedidos'] });
    },
  });
}
