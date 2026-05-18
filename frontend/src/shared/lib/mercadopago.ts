/**
 * MercadoPago SDK Utilities
 * 
 * Provides async SDK loading with error handling
 * SDK is injected on-demand (not critical path)
 */

let sdkLoadPromise: Promise<void> | null = null;

/**
 * Load MercadoPago SDK from CDN
 * Returns after window.MercadoPago is available
 * Handles errors with timeout
 */
export async function loadMercadoPagoSDK(): Promise<void> {
  // Return cached promise if already loading
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.MercadoPago) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;

    // Timeout after 10 seconds
    const timeoutId = setTimeout(() => {
      reject(new Error('MercadoPago SDK load timeout'));
    }, 10000);

    script.onload = () => {
      clearTimeout(timeoutId);
      if (window.MercadoPago) {
        resolve();
      } else {
        reject(new Error('MercadoPago SDK not available after load'));
      }
    };

    script.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load MercadoPago SDK'));
    };

    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

/**
 * Initialize MercadoPago with public key
 * Must call after loadMercadoPagoSDK()
 */
export function initMercadoPago(publicKey: string): void {
  if (!publicKey) {
    throw new Error('MercadoPago public key is required');
  }

  if (!window.MercadoPago) {
    throw new Error('MercadoPago SDK not loaded. Call loadMercadoPagoSDK() first');
  }

  window.MercadoPago.setPublishableKey(publicKey);
}

/**
 * Type definitions for global MercadoPago object
 */
declare global {
  interface Window {
    MercadoPago: any;
  }
}
