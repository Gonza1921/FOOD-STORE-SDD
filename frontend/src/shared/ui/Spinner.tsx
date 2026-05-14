// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'brand' | 'on-surface' | 'white';
  /** Optional label shown below */
  label?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const sizeStyles: Record<string, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-[4px]',
};

const variantStyles: Record<string, string> = {
  brand: 'border-brand-200 border-t-brand-600',
  'on-surface': 'border-surface-container-highest border-t-on-surface',
  white: 'border-white/30 border-t-white',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Spinner({
  size = 'md',
  variant = 'brand',
  label,
  className = '',
}: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`
          animate-spin rounded-full
          ${sizeStyles[size]}
          ${variantStyles[variant]}
        `.trim()}
        role="status"
        aria-label={label || 'Cargando...'}
      />
      {label && (
        <p className="text-sm text-on-surface-variant">{label}</p>
      )}
    </div>
  );
}
