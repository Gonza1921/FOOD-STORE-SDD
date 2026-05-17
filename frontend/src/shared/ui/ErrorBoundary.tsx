import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ErrorBoundary — catches rendering errors in the child component tree and
 * displays a user-friendly fallback UI with a retry button.
 *
 * Uses class component lifecycle (required by React for error boundaries).
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log the error for debugging/monitoring
    console.error('[ErrorBoundary] Caught rendering error:', error, info);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface px-4">
          <div className="max-w-md text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
              <span
                className="material-symbols-outlined text-error"
                style={{ fontSize: '32px', fontVariationSettings: '"wght" 500' }}
              >
                error_outline
              </span>
            </div>

            {/* Title */}
            <h1 className="mb-2 text-2xl font-bold text-on-surface">
              Algo salió mal
            </h1>

            {/* Message */}
            <p className="mb-8 text-on-surface-variant">
              Ocurrió un error inesperado. Esto puede deberse a un problema temporal.
              Presioná "Reintentar" para volver a intentar o recargá la página.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-600/30 focus-visible:outline-none"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', fontVariationSettings: '"wght" 500' }}
                >
                  refresh
                </span>
                Reintentar
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface shadow-sm transition-all hover:bg-surface-container-highest hover:shadow-md focus-visible:ring-2 focus-visible:ring-outline-variant/30 focus-visible:outline-none"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', fontVariationSettings: '"wght" 500' }}
                >
                  refresh
                </span>
                Recargar página
              </button>
            </div>

            {/* Error detail (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-on-surface-variant hover:text-on-surface">
                  Detalles del error
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-surface-container p-4 text-xs text-on-surface-variant">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
