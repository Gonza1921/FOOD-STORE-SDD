import { useState } from 'react';
import type { AxiosError } from 'axios';
import { usePaymentStore } from '../store';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

interface ApiErrorDetail {
  msg: string;
  loc?: string[];
  type?: string;
}

function extractErrorMessage(err: unknown): string {
  const axiosError = err as AxiosError<{ detail: unknown; message?: string }>;
  const detail = axiosError.response?.data?.detail;
  if (detail) {
    if (Array.isArray(detail)) {
      return (detail as ApiErrorDetail[]).map((e) => e.msg).join(', ');
    }
    if (typeof detail === 'string') {
      return detail;
    }
    return JSON.stringify(detail);
  }
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }
  return 'Error al crear preferencia de pago';
}

interface CrearPreferenciaResponse {
  preference_id: string;
  init_point: string;
  pedido_id: number;
}

export function usePago() {
  const { startCheckout, setPreference, updatePaymentStatus, setError, resetPayment, ...store } = usePaymentStore();
  const [loading, setLoading] = useState(false);

  const crearPreferencia = async (pedidoId: number): Promise<string | null> => {
    setLoading(true);
    startCheckout(pedidoId);

    try {
      const response = await axiosClient.post<CrearPreferenciaResponse>(
        API.PAGOS.CREAR_PREFERENCIA,
        { pedido_id: pedidoId }
      );

      const { preference_id, init_point } = response.data;
      setPreference(preference_id);
      setLoading(false);
      return init_point;
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error creating preference:', err);
      setError(extractErrorMessage(err));
      setLoading(false);
      return null;
    }
  };

  const verificarPago = async (pedidoId: number): Promise<void> => {
    try {
      const response = await axiosClient.get(
        API.PAGOS.DETALLE(pedidoId)
      );

      const status = response.data.mp_status;
      if (status === 'approved') {
        updatePaymentStatus('approved');
      } else if (status === 'rejected') {
        updatePaymentStatus('rejected');
      } else {
        updatePaymentStatus('pending');
      }
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error verificando pago:', err);
    }
  };

  const limpiar = () => {
    resetPayment();
  };

  return {
    ...store,
    loading,
    crearPreferencia,
    verificarPago,
    limpiar,
  };
}