'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Send to Sentry if available
    if (
      typeof window !== 'undefined' &&
      'Sentry' in window &&
      typeof (window as { Sentry?: { captureException: (err: Error, opts?: unknown) => void } })
        .Sentry?.captureException === 'function'
    ) {
      (
        window as { Sentry: { captureException: (err: Error, opts?: unknown) => void } }
      ).Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--dashboard-page)]">
          <div className="flex max-w-md flex-col gap-6 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-8 text-center">
            <div className="flex flex-col gap-2">
              <h1
                className="text-[length:var(--dashboard-text-xl)] font-bold tracking-tight"
                style={{ color: 'var(--dashboard-text-primary)' }}
              >
                Something went wrong
              </h1>
              <p
                className="text-[length:var(--dashboard-text-sm)] leading-relaxed"
                style={{ color: 'var(--dashboard-text-muted)' }}
              >
                We encountered an unexpected error. Please refresh the page to continue.
              </p>
            </div>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary
                  className="cursor-pointer text-[length:var(--dashboard-text-xs)] font-bold"
                  style={{ color: 'var(--dashboard-text-ghost)' }}
                >
                  Error details
                </summary>
                <pre
                  className="mt-2 overflow-auto rounded-lg bg-[var(--dashboard-overlay-02)] p-3 text-[length:var(--dashboard-text-dense-sm)]"
                  style={{ color: 'var(--dashboard-text-muted)' }}
                >
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="rounded-xl px-6 py-3 text-[length:var(--dashboard-text-sm)] font-bold transition-all duration-150 hover:opacity-90"
              style={{
                backgroundColor: 'var(--dashboard-accent)',
                color: 'var(--dashboard-page)',
              }}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
