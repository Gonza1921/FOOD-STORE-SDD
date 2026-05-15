import { useState } from 'react';
import { usePaymentStore } from '../store';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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
      const response = await axios.post<CrearPreferenciaResponse>(
        `${API_URL}/pagos/crear-preferencia`,
        { pedido_id: pedidoId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      const { preference_id, init_point } = response.data;
      setPreference(preference_id);
      setLoading(false);
      return init_point;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al crear preferencia de pago';
      setError(message);
      setLoading(false);
      return null;
    }
  };

  const verificarPago = async (pedidoId: number): Promise<void> => {
    try {
      const response = await axios.get(
        `${API_URL}/pagos/${pedidoId}`,
        { withCredentials: true }
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