import { useEffect, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Max width class (default: max-w-md) */
  maxWidth?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      />

      {/* Panel */}
      <div
        className={`
          relative w-full ${maxWidth}
          rounded-xl border border-outline-variant/30
          bg-surface-container-lowest shadow-xl
          p-6 animate-in fade-in zoom-in-95
          duration-200
        `.trim()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg
                     text-on-surface-variant hover:bg-surface-container hover:text-on-surface
                     transition-colors"
          aria-label="Cerrar"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px', fontVariationSettings: '"wght" 500' }}
          >
            close
          </span>
        </button>

        {/* Title */}
        {title && (
          <h2 className="mb-4 text-lg font-semibold text-on-surface pr-8">
            {title}
          </h2>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
