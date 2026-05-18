import { useState } from 'react';
import { usePaymentStore } from '../store';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

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
    } catch (error: any) {
      // Handle FastAPI validation error format properly
      const detail = error.response?.data?.detail;
      let message = 'Error al crear preferencia de pago';

      if (detail) {
        if (Array.isArray(detail)) {
          // FastAPI returns array of validation errors
          message = detail.map((e: any) => e.msg).join(', ');
        } else if (typeof detail === 'string') {
          message = detail;
        } else {
          message = JSON.stringify(detail);
        }
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      console.error('Error creating preference:', error.response?.data);
      setError(message);
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
    } catch (error: any) {
      console.error('Error verificando pago:', error);
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