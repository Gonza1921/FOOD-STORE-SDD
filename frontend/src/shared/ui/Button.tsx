import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  /** Material Symbol icon name to show before text */
  icon?: string;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const variantStyles: Record<string, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 ' +
    'shadow-sm hover:shadow-md active:shadow-sm ' +
    'focus-visible:ring-brand-600/30',
  premium:
    'gradient-brand shadow-glow-sm hover:shadow-glow active:shadow-sm ' +
    'focus-visible:ring-brand-600/30',
  secondary:
    'bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:bg-surface-container-highest/80 ' +
    'shadow-sm hover:shadow-md active:shadow-sm ' +
    'focus-visible:ring-on-surface/10',
  danger:
    'bg-error text-white hover:bg-error/90 active:bg-error/80 ' +
    'shadow-sm hover:shadow-md active:shadow-sm ' +
    'focus-visible:ring-error/30',
  outline:
    'border border-outline-variant text-on-surface hover:bg-surface-container active:bg-surface-container-high ' +
    'focus-visible:ring-on-surface/10 bg-transparent',
  ghost:
    'text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:bg-surface-container-high ' +
    'focus-visible:ring-on-surface/10 bg-transparent',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      icon,
      children,
      className = '',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-250 ' +
      'rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
      'disabled:pointer-events-none disabled:opacity-50 select-none ' +
      'active:scale-[0.98]';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            <span>{children}</span>
          </span>
        ) : (
          <>
            {icon && (
              <span
                className="material-symbols-outlined text-[1.1em]"
                style={{ fontVariationSettings: '"wght" 500' }}
              >
                {icon}
              </span>
            )}
            {children}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
