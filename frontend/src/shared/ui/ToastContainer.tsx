import { useUiStore, type Toast } from '@/features/ui/store';

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const typeStyles: Record<Toast['type'], { container: string; icon: string; iconName: string }> = {
  success: {
    container: 'border-l-4 border-success bg-success-container text-success',
    icon: 'text-success',
    iconName: 'check_circle',
  },
  error: {
    container: 'border-l-4 border-error bg-error-container text-error',
    icon: 'text-error',
    iconName: 'error',
  },
  info: {
    container: 'border-l-4 border-info bg-info-container text-info',
    icon: 'text-info',
    iconName: 'info',
  },
  warning: {
    container: 'border-l-4 border-warning bg-warning-container text-warning',
    icon: 'text-warning',
    iconName: 'warning',
  },
};

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const style = typeStyles[toast.type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl p-4 shadow-premium-md backdrop-blur-sm animate-slide-in-right ${style.container}`}
    >
      {/* Icon */}
      <span
        className={`material-symbols-outlined mt-0.5 shrink-0 ${style.icon}`}
        style={{ fontSize: '20px', fontVariationSettings: '"wght" 500' }}
      >
        {style.iconName}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
        aria-label="Cerrar notificación"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '16px', fontVariationSettings: '"wght" 500' }}
        >
          close
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToastContainer
// ---------------------------------------------------------------------------

/**
 * ToastContainer — renders all toasts from the global UI store as a fixed
 * overlay in the bottom-right corner.
 *
 * Must be mounted inside `<BrowserRouter>` but outside `<Routes>` so it
 * persists across page navigations.
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex w-80 flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
}
