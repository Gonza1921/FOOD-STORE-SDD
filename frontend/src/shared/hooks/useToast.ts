import { create } from 'zustand';
import type { ToastData } from '@/shared/components/Toast';

interface ToastStore {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export function useToast() {
  const { toasts, addToast, removeToast } = useToastStore();

  return {
    toasts,
    showSuccess: (message: string) => addToast({ type: 'success', message }),
    showInfo: (message: string) => addToast({ type: 'info', message }),
    showError: (message: string) => addToast({ type: 'error', message }),
    dismiss: removeToast,
  };
}
