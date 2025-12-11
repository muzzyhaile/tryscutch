/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl border-2 border-rose-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-100 rounded-full mb-6">
              <AlertCircle size={40} className="text-rose-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-zinc-950 mb-3">
              Something went wrong
            </h1>
            
            <p className="text-lg text-zinc-600 mb-8">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {this.state.error && (
              <div className="bg-zinc-50 rounded-xl p-6 mb-8 text-left">
                <p className="text-sm font-mono text-zinc-800 mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-bold text-zinc-600 hover:text-zinc-950">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs text-zinc-600 overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-950 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all"
            >
              <RefreshCw size={20} />
              Try Again
            </button>

            <p className="mt-6 text-sm text-zinc-400">
              If the problem persists, try refreshing the page or clearing your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
