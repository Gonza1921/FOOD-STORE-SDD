import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckoutStep = 'idle' | 'processing' | 'payment' | 'confirming' | 'success' | 'error';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';

export interface PaymentStore {
  // State
  checkoutStep: CheckoutStep;
  pedidoId: number | null;
  preferenceId: string | null;
  paymentStatus: PaymentStatus | null;
  error: string | null;

  // Actions
  startCheckout: (pedidoId: number) => void;
  setPreference: (preferenceId: string) => void;
  updatePaymentStatus: (status: PaymentStatus) => void;
  setError: (error: string | null) => void;
  resetPayment: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState = {
  checkoutStep: 'idle' as CheckoutStep,
  pedidoId: null as number | null,
  preferenceId: null as string | null,
  paymentStatus: null as PaymentStatus | null,
  error: null as string | null,
};

// ---------------------------------------------------------------------------
// Store (no persist — transient session state only)
// ---------------------------------------------------------------------------

export const usePaymentStore = create<PaymentStore>()((set) => ({
  ...initialState,

  startCheckout: (pedidoId: number) =>
    set({
      checkoutStep: 'processing',
      pedidoId,
      preferenceId: null,
      paymentStatus: null,
      error: null,
    }),

  setPreference: (preferenceId: string) =>
    set({
      checkoutStep: 'payment',
      preferenceId,
    }),

  updatePaymentStatus: (status: PaymentStatus) =>
    set({
      paymentStatus: status,
      checkoutStep: status === 'approved' ? 'success' : status === 'rejected' || status === 'cancelled' ? 'error' : 'confirming',
    }),

  setError: (error: string | null) =>
    set({
      error,
      checkoutStep: error ? 'error' : 'processing',
    }),

  resetPayment: () => set({ ...initialState }),
}));
