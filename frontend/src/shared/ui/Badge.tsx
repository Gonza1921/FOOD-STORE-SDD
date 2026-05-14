import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BadgeProps {
  children: ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'error' | 'neutral' | 'info';
  size?: 'sm' | 'md';
  /** Show a colored indicator dot before the text */
  dot?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const variantStyles: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success-container text-success',
  warning: 'bg-warning-container text-warning',
  error: 'bg-error-container text-error',
  neutral: 'bg-surface-container-high text-on-surface-variant',
  info: 'bg-surface-container text-brand-700',
};

const dotColors: Record<string, string> = {
  brand: 'bg-brand-500',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  neutral: 'bg-on-surface-variant/50',
  info: 'bg-brand-400',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium leading-none
        rounded-full whitespace-nowrap
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
    >
      {dot && (
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
