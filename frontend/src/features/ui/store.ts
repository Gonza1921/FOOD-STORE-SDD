import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface UiStore {
  // State
  theme: Theme;
  sidebarOpen: boolean;
  toasts: Toast[];

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let toastCounter = 0;

function generateToastId(): string {
  toastCounter += 1;
  return `toast-${toastCounter}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      // ---- State ----
      theme: 'light',
      sidebarOpen: true,
      toasts: [],

      // ---- Actions ----

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setTheme: (theme: Theme) => set({ theme }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      addToast: (toast) => {
        const id = generateToastId();
        const newToast: Toast = {
          ...toast,
          id,
          duration: toast.duration ?? 3000,
        };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove after duration
        if ((newToast.duration ?? 0) > 0) {
          setTimeout(() => {
            const current = get().toasts;
            if (current.some((t) => t.id === id)) {
              get().removeToast(id);
            }
          }, newToast.duration);
        }
      },

      removeToast: (id: string) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      clearToasts: () => set({ toasts: [] }),
    }),
    {
      name: 'food-store-ui',
      // Only persist the theme preference — sidebars and toasts are transient
      partialize: (state) => ({
        theme: state.theme,
      }),
    },
  ),
);
