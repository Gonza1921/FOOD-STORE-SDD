/**
 * Toast component — slide-in notification with auto-dismiss.
 * Types: success (green), info (blue), error (red).
 */

import { useEffect, useState } from 'react';

export interface ToastData {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const bgColor = {
    success: 'bg-green-600',
    info: 'bg-blue-600',
    error: 'bg-red-600',
  }[toast.type];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px] max-w-md transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <span className="material-symbols-outlined text-lg">
        {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
      </span>
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="text-white/80 hover:text-white"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
