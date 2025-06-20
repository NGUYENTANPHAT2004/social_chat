// src/components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error monitoring service (e.g., Sentry)
    // this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Example: Report to monitoring service
    // Sentry.captureException(error, { extra: errorInfo });
    
    // Or send to custom logging endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(console.error);
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-2">
                Oops! Đã xảy ra lỗi
              </h2>
              
              <p className="text-gray-300 mb-6">
                Ứng dụng gặp sự cố không mong muốn. Chúng tôi đã ghi nhận lỗi này và sẽ khắc phục sớm nhất.
              </p>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-600 text-left">
                  <h3 className="text-sm font-medium text-red-400 mb-2">Error Details:</h3>
                  <p className="text-xs text-gray-300 mb-2 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs text-gray-400">
                      <summary className="cursor-pointer mb-1">Stack Trace</summary>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Thử lại
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Trang chủ
                  </button>
                  
                  <button
                    onClick={this.handleReload}
                    className="flex items-center justify-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Tải lại
                  </button>
                </div>
              </div>

              {/* Help text */}
              <p className="text-xs text-gray-500 mt-4">
                Nếu lỗi tiếp tục xảy ra, vui lòng liên hệ support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC wrapper for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
    console.error('Captured error:', errorObj);
  }, []);

  // Throw error to be caught by ErrorBoundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Safe component renderer that prevents object rendering errors
export const SafeRender: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = <span className="text-red-400">Lỗi hiển thị</span> 
}) => {
  try {
    // Check if children is an error object
    if (children && typeof children === 'object' && 'message' in children) {
      console.warn('Prevented error object from being rendered:', children);
      return <span className="text-red-400">{(children as unknown as Error).message}</span>;
    }
    
    // Check if children is a plain object (not React element)
    if (children && typeof children === 'object' && !React.isValidElement(children)) {
      console.warn('Prevented plain object from being rendered:', children);
      return fallback as React.ReactElement;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('SafeRender error:', error);
    return fallback as React.ReactElement;
  }
};

export default ErrorBoundary;