/** PaymentPage — MercadoPago checkout integration
 *  Path: /pagar/:pedidoId
 *
 *  Flow:
 *    1. Receive pedido_id from URL
 *    2. Call API to create MP preference
 *    3. Show MP checkout
 *    4. Poll for payment status
 *    5. On success: clear cart, navigate to order detail
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { usePaymentStore } from '../store';
import { useCartStore } from '../../cart/store';
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
  return 'Error al iniciar pago';
}

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

interface PreferenciaResponse {
  preference_id: string;
  init_point: string;
  pedido_id: number;
}

export function PaymentPage() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  console.log('🔥 [PaymentPage] SE RENDERIZÓ', { pedidoId });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updatePaymentStatus, resetPayment } = usePaymentStore();
  const { clearCart } = useCartStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!pedidoId || initialized.current) return;
    initialized.current = true;

    const initPayment = async () => {
      try {
        const response = await axiosClient.post<PreferenciaResponse>(
          API.PAGOS.CREAR_PREFERENCIA,
          { pedido_id: parseInt(pedidoId, 10) }
        );
        setLoading(false);

        // ── Logs de depuración ────────────────────────────────────────
        console.log('MP_PUBLIC_KEY:', MP_PUBLIC_KEY);
        console.log('window.MercadoPago:', window.MercadoPago);
        console.log('Response crear-preferencia:', response.data);

        // Initialize MercadoPago checkout
        if (!window.MercadoPago) {
          const msg = 'El SDK de Mercado Pago no se cargó. Revisá la conexión a internet o recargá la página.';
          console.error('ERROR:', msg);
          setError(msg);
          return;
        }

        try {
          const mp = window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' });
          console.log('Instancia MP:', mp);

          mp.checkout({
            preference: { id: response.data.preference_id },
            render: { container: '#mp-checkout-container', label: 'Pagar ahora' },
            autoOpen: true,
          });

          console.log('checkout ejecutado sin error');
        } catch (err) {
          console.error('Error creando checkout MP:', err);
        }
      } catch (err: unknown) {
        // 🔍 LOG: respuesta completa del backend para diagnosticar 422
        console.log('🔍 [PaymentPage] Error completo:', err);
        const axiosError = err as AxiosError<{ detail: unknown }>;
        console.log('🔍 [PaymentPage] Response status:', axiosError.response?.status);
        console.log('🔍 [PaymentPage] Response data:', JSON.stringify(axiosError.response?.data, null, 2));
        console.log('🔍 [PaymentPage] Mensaje extraído:', extractErrorMessage(err));

        setError(extractErrorMessage(err));
        setLoading(false);
      }
    };

    initPayment();
  }, [pedidoId]);

  // Poll for payment status
  useEffect(() => {
    if (!pedidoId) return;

    const checkStatus = setInterval(async () => {
      try {
        const response = await axiosClient.get(API.PAGOS.DETALLE(parseInt(pedidoId, 10)));
        const status = response.data.mp_status;

        if (status === 'approved') {
          updatePaymentStatus('approved');
          clearCart();
          resetPayment();
          navigate(`/mis-pedidos/${pedidoId}`);
        } else if (status === 'rejected') {
          updatePaymentStatus('rejected');
          setError('Pago rechazado. Intenta nuevamente.');
        }
      } catch {
        // Ignore errors during polling
      }
    }, 3000);

    return () => clearInterval(checkStatus);
  }, [pedidoId, navigate, updatePaymentStatus, clearCart, resetPayment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4" />
          <p className="text-on-surface-variant">Iniciando pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="max-w-md bg-surface-container-lowest rounded-xl border border-error/30 p-6 text-center">
          <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
          <h2 className="text-lg font-semibold text-on-surface mb-2">Error en el pago</h2>
          <p className="text-on-surface-variant mb-4">{error}</p>
          <button
            onClick={() => navigate('/carrito')}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
          >
            Volver al carrito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-on-surface mb-6">Pago del Pedido #{pedidoId}</h1>
        <div
          id="mp-checkout-container"
          className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 min-h-[300px]"
        />
      </div>
    </div>
  );
}

