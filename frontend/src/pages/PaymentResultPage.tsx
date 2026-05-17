/**
 * PaymentResultPage — Payment result page after returning from MercadoPago.
 * Shows visual feedback for approved/rejected/pending payments with polling.
 * Path: /pago/resultado/:pedidoId
 *
 * Flow:
 *   1. Receive pedidoId from URL params + query params from MP (collection_status, payment_id)
 *   2. Show immediate feedback based on query params
 *   3. Start polling backend for real payment status (if pending)
 *   4. Update UI dynamically if status changes during polling
 *   5. Stop polling after terminal status or 5-minute timeout
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

type PaymentStatus = 'approved' | 'rejected' | 'pending' | 'loading' | null;

const POLLING_INTERVAL = 5000; // 5 seconds
const POLLING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function PaymentResultPage() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const [searchParams] = useSearchParams();
  const pedidoIdNum = pedidoId ? parseInt(pedidoId, 10) : 0;

  // Get status from MP query params for immediate feedback
  const initialStatus = searchParams.get('collection_status') || searchParams.get('status');
  const [displayStatus, setDisplayStatus] = useState<PaymentStatus>(
    (initialStatus as PaymentStatus) || 'pending'
  );
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStartRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const checkPaymentStatus = useCallback(async () => {
    if (!pedidoIdNum) return;

    try {
      const response = await axiosClient.get(API.PAGOS.DETALLE(pedidoIdNum));
      const mpStatus = response.data?.mp_status;

      if (!mpStatus) return;

      if (mpStatus === 'approved') {
        setDisplayStatus('approved');
        setStatusMessage('¡Pago aprobado!');
        stopPolling();
      } else if (mpStatus === 'rejected') {
        setDisplayStatus('rejected');
        setStatusMessage('Pago rechazado');
        stopPolling();
      } else if (mpStatus === 'pending' || mpStatus === 'in_process') {
        setDisplayStatus('pending');
        setStatusMessage('El pago está siendo procesado');

        // Check timeout
        if (Date.now() - pollingStartRef.current > POLLING_TIMEOUT) {
          stopPolling();
          setStatusMessage('El pago está tardando más de lo esperado. Podés verificar el estado en Mis Pedidos.');
        }
      }
    } catch {
      // Ignore polling errors
    }
  }, [pedidoIdNum, stopPolling]);

  // Start polling if status is pending
  useEffect(() => {
    if (!pedidoIdNum) return;

    // Set initial message based on query params
    if (initialStatus === 'approved') {
      setDisplayStatus('approved');
      setStatusMessage('¡Pago aprobado!');
      return;
    }

    if (initialStatus === 'rejected') {
      setDisplayStatus('rejected');
      setStatusMessage('Pago rechazado');
      return;
    }

    // For pending or unknown, start polling
    setDisplayStatus('pending');
    setStatusMessage('Consultando estado del pago...');
    pollingStartRef.current = Date.now();
    setIsPolling(true);

    // Immediate first check
    checkPaymentStatus();

    // Then poll periodically
    pollingRef.current = setInterval(checkPaymentStatus, POLLING_INTERVAL);

    return () => {
      stopPolling();
    };
  }, [pedidoIdNum, initialStatus, checkPaymentStatus, stopPolling]);

  // ── Loading state ──
  if (displayStatus === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4" />
          <p className="text-on-surface-variant">Verificando pago...</p>
        </div>
      </div>
    );
  }

  const isApproved = displayStatus === 'approved';
  const isRejected = displayStatus === 'rejected';
  const isPending = displayStatus === 'pending';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-8 text-center">
        {/* ── Icon ── */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isApproved
              ? 'bg-success/10'
              : isRejected
              ? 'bg-error/10'
              : 'bg-warning/10'
          }`}
        >
          <span
            className={`material-symbols-outlined text-5xl ${
              isApproved
                ? 'text-success'
                : isRejected
                ? 'text-error'
                : 'text-warning'
            }`}
            style={{ fontVariationSettings: '"wght" 400' }}
          >
            {isApproved ? 'check_circle' : isRejected ? 'cancel' : 'pending'}
          </span>
        </div>

        {/* ── Title ── */}
        <h1
          className={`text-2xl font-semibold mb-2 ${
            isApproved
              ? 'text-success'
              : isRejected
              ? 'text-error'
              : 'text-warning'
          }`}
        >
          {isApproved
            ? '¡Pago aprobado!'
            : isRejected
            ? 'Pago rechazado'
            : 'Pago pendiente'}
        </h1>

        {/* ── Message ── */}
        <p className="text-on-surface-variant mb-2">
          {statusMessage}
        </p>

        {pedidoId && (
          <p className="text-sm text-on-surface-variant/70 mb-8">
            Pedido #{pedidoId}
          </p>
        )}

        {/* ── Polling indicator ── */}
        {isPending && isPolling && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span className="text-xs text-on-surface-variant">
              Verificando estado automáticamente...
            </span>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3">
          {isApproved && (
            <>
              <Link
                to={`/mis-pedidos/${pedidoId}`}
                className="bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 transition-all text-sm font-semibold"
              >
                Ver mi pedido
              </Link>
              <Link
                to="/dashboard"
                className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
              >
                Volver al inicio
              </Link>
            </>
          )}

          {isRejected && (
            <>
              <Link
                to={`/pagar/${pedidoId}`}
                className="bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 transition-all text-sm font-semibold"
              >
                Reintentar pago
              </Link>
              <Link
                to={`/mis-pedidos/${pedidoId}`}
                className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
              >
                Ver mi pedido
              </Link>
            </>
          )}

          {isPending && !isPolling && (
            <>
              <button
                type="button"
                onClick={checkPaymentStatus}
                className="bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 transition-all text-sm font-semibold"
              >
                Verificar estado
              </button>
              <Link
                to={`/mis-pedidos/${pedidoId}`}
                className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
              >
                Ver mi pedido
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentResultPage;
