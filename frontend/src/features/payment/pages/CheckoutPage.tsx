import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePago } from '../hooks';
import { useCartStore } from '../../cart/store';
import { Spinner } from '../../../shared/ui';
import { loadMercadoPagoSDK, initMercadoPago } from '../../../shared/lib/mercadopago';

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoIdParam = searchParams.get('pedido_id');
  const pedidoId = pedidoIdParam ? parseInt(pedidoIdParam, 10) : null;

  const PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  
  if (!PUBLIC_KEY) {
    throw new Error('VITE_MERCADOPAGO_PUBLIC_KEY not configured');
  }

  const { checkoutStep, preferenceId, error, loading, crearPreferencia, verificarPago, limpiar } = usePago();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.totalPrice());

  const mpInitialized = useRef(false);

  // Initialize MercadoPago SDK
  useEffect(() => {
    if (mpInitialized.current) return;

    const initSDK = async () => {
      try {
        await loadMercadoPagoSDK();
        initMercadoPago(PUBLIC_KEY);
        mpInitialized.current = true;

        // After SDK loaded, create preference and open checkout
        if (!pedidoId || checkoutStep !== 'idle') return;

        const initPoint = await crearPreferencia(pedidoId);
        if (initPoint && window.MercadoPago) {
          const mp = window.MercadoPago(PUBLIC_KEY, {
            locale: 'es-AR',
          });

          // preferenceId is set by crearPreferencia before returning initPoint
          mp.checkout({
            preference: {
              id: preferenceId!,
            },
            render: {
              container: '#mp-container',
              label: 'Pagar con MercadoPago',
            },
            autoOpen: true,
          });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize MercadoPago:', err);
      }
    };
    initSDK();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PUBLIC_KEY]);

  // Check payment status periodically
  useEffect(() => {
    if (checkoutStep !== 'payment' || !pedidoId) return;

    const interval = setInterval(() => {
      verificarPago(pedidoId);
    }, 5000);

    // After 3 minutes, stop polling
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 180000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [checkoutStep, pedidoId, verificarPago]);

  // Redirect on success
  useEffect(() => {
    if (checkoutStep === 'success') {
      // Clean cart after successful payment
      useCartStore.getState().clearCart();
      limpiar();
      navigate(`/pedidos/${pedidoId}`);
    }
  }, [checkoutStep, pedidoId, navigate, limpiar]);

  // Show error
  if (checkoutStep === 'error') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">Error en el pago</h2>
          <p className="text-red-600 mb-4">{error || 'El pago fue rechazado. Intenta nuevamente.'}</p>
          <button
            onClick={() => navigate('/carrito')}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Volver al carrito
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || checkoutStep === 'processing') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Preparando pago...</p>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold mb-4">Tu carrito está vacío</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  // Main checkout view
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Resumen del pedido</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.productoId} className="flex justify-between text-sm">
                <span>{item.nombre || `Producto #${item.productoId}`} x {item.cantidad}</span>
                <span className="font-medium">${((item.precio || 0) * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Container */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pago</h2>
          {preferenceId ? (
            <div id="mp-container" className="min-h-[200px]"></div>
          ) : (
            <p className="text-gray-500">Cargando formulario de pago...</p>
          )}
        </div>
      </div>
    </div>
  );
}

