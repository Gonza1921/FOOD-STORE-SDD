import { create } from 'zustand';

export type PaymentStatus = 'idle' | 'creating' | 'processing' | 'success' | 'error';

interface PaymentState {
  // State
  pedido_id: number | null;
  preference_id: string | null;
  payment_status: PaymentStatus;
  error: string | null;

  // Actions
  initiate(pedido_id: number): void;
  setPreference(preference_id: string): void;
  setStatus(status: PaymentStatus): void;
  setError(error: string | null): void;
  reset(): void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  // Initial state
  pedido_id: null,
  preference_id: null,
  payment_status: 'idle',
  error: null,

  // Actions
  initiate: (pedido_id: number) => {
    set({
      pedido_id,
      payment_status: 'creating',
      error: null,
    });
  },

  setPreference: (preference_id: string) => {
    set({ preference_id });
  },

  setStatus: (status: PaymentStatus) => {
    set({ payment_status: status });
  },

  setError: (error: string | null) => {
    set({
      error,
      payment_status: error ? 'error' : 'idle',
    });
  },

  reset: () => {
    set({
      pedido_id: null,
      preference_id: null,
      payment_status: 'idle',
      error: null,
    });
  },
}));
