import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardProps {
  children: ReactNode;
  /** Card visual variant */
  variant?: 'elevated' | 'outlined' | 'glass' | 'gradient';
  /** Remove padding */
  noPadding?: boolean;
  /** Click handler (makes card interactive) */
  onClick?: () => void;
  /** Additional classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Styles by variant
// ---------------------------------------------------------------------------

const variantStyles: Record<string, string> = {
  elevated:
    'bg-surface-container-lowest shadow-premium border border-outline-variant/10',
  outlined:
    'bg-surface-container-lowest border border-outline-variant/30 shadow-sm',
  glass:
    'glass-card',
  gradient:
    'gradient-brand-subtle',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Card({
  children,
  variant = 'elevated',
  noPadding = false,
  onClick,
  className = '',
  style,
}: CardProps) {
  const isInteractive = !!onClick;

  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        rounded-xl
        ${variantStyles[variant]}
        ${noPadding ? '' : 'p-4 sm:p-6'}
        ${
          isInteractive
            ? 'cursor-pointer transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-0.5 active:scale-[0.99]'
            : ''
        }
        animate-fade-in-up
        ${className}
      `.trim()}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
