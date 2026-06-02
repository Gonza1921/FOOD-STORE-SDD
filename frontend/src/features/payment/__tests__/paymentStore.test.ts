/**
 * Tests: Payment Store (CH-021, Task 4.3)
 *
 * Tests the Zustand payment store that manages checkout flow state,
 * preference IDs, and payment status transitions.
 */

import { usePaymentStore } from '../store';

describe('PaymentStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePaymentStore.setState({
      checkoutStep: 'idle',
      pedidoId: null,
      preferenceId: null,
      paymentStatus: null,
      error: null,
    });
  });

  it('startCheckout sets pedidoId and transitions to processing', () => {
    const store = usePaymentStore.getState();
    store.startCheckout(42);

    const state = usePaymentStore.getState();
    expect(state.pedidoId).toBe(42);
    expect(state.checkoutStep).toBe('processing');
    expect(state.preferenceId).toBeNull();
    expect(state.paymentStatus).toBeNull();
    expect(state.error).toBeNull();
  });

  it('setPreference updates preferenceId and transitions to payment step', () => {
    const store = usePaymentStore.getState();
    store.startCheckout(42);
    store.setPreference('pref_abc123');

    const state = usePaymentStore.getState();
    expect(state.preferenceId).toBe('pref_abc123');
    expect(state.checkoutStep).toBe('payment');
  });

  it('updatePaymentStatus with approved transitions to success', () => {
    const store = usePaymentStore.getState();
    store.startCheckout(42);
    store.updatePaymentStatus('approved');

    const state = usePaymentStore.getState();
    expect(state.paymentStatus).toBe('approved');
    expect(state.checkoutStep).toBe('success');
  });

  it('updatePaymentStatus with rejected transitions to error', () => {
    const store = usePaymentStore.getState();
    store.startCheckout(42);
    store.updatePaymentStatus('rejected');

    const state = usePaymentStore.getState();
    expect(state.paymentStatus).toBe('rejected');
    expect(state.checkoutStep).toBe('error');
  });

  it('updatePaymentStatus with pending transitions to confirming', () => {
    const store = usePaymentStore.getState();
    store.startCheckout(42);
    store.updatePaymentStatus('pending');

    const state = usePaymentStore.getState();
    expect(state.paymentStatus).toBe('pending');
    expect(state.checkoutStep).toBe('confirming');
  });

  it('setError updates error and transitions to error step', () => {
    const store = usePaymentStore.getState();
    store.setError('Payment declined');

    const state = usePaymentStore.getState();
    expect(state.error).toBe('Payment declined');
    expect(state.checkoutStep).toBe('error');
  });

  it('resetPayment clears all state back to initial values', () => {
    const store = usePaymentStore.getState();
    store.startCheckout(42);
    store.setPreference('pref_abc123');
    store.updatePaymentStatus('approved');

    // Now reset
    store.resetPayment();

    const state = usePaymentStore.getState();
    expect(state.pedidoId).toBeNull();
    expect(state.preferenceId).toBeNull();
    expect(state.paymentStatus).toBeNull();
    expect(state.checkoutStep).toBe('idle');
    expect(state.error).toBeNull();
  });
});
