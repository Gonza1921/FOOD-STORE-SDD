import { useMutation } from '@tanstack/react-query';
import axiosClient from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

export function useUpdateEstado() {
  return useMutation({
    mutationFn: ({ id, estado_nuevo }: { id: number; estado_nuevo: string }) =>
      axiosClient.patch(API.ORDERS.UPDATE_STATUS(String(id)), { estado_nuevo }),
  });
}
