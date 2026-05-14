import React, { useId } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label above the input */
  label?: string;
  /** Error message — shows below the input in error color */
  error?: string;
  /** Material Symbol icon name to show inside the input (left) */
  icon?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Make the input full width */
  fullWidth?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      helperText,
      fullWidth = true,
      className = '',
      id: externalId,
      disabled,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = externalId || autoId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const hasError = !!error;

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {/* ── Label ── */}
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-on-surface"
          >
            {label}
          </label>
        )}

        {/* ── Input wrapper ── */}
        <div className="relative">
          {icon && (
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none select-none"
              style={{ fontSize: '20px', fontVariationSettings: '"wght" 400' }}
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={errorId || helperId}
            className={`
              block w-full rounded-xl border px-4 py-2.5 text-sm
              text-on-surface placeholder:text-on-surface-variant/60
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:pointer-events-none disabled:opacity-50 disabled:bg-surface-container
              ${
                hasError
                  ? 'border-error focus:border-error focus:ring-error/20'
                  : 'border-outline-variant focus:border-brand-600 focus:ring-brand-600/20'
              }
              ${icon ? 'pl-10' : ''}
              ${className}
            `.trim()}
            {...props}
          />
        </div>

        {/* ── Error message ── */}
        {error && (
          <p id={errorId} className="mt-1 text-xs text-error" role="alert">
            {error}
          </p>
        )}

        {/* ── Helper text ── */}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-on-surface-variant/70">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
