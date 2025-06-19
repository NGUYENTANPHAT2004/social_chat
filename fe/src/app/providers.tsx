// src/app/providers.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import { useAuthInitialization } from '@/features/auth';

// Create a client
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          // Don't retry on 401, 403, 404
          if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
            return false;
          }
          return failureCount < 3;
        },
      },
      mutations: {
        retry: (failureCount, error: any) => {
          // Don't retry mutations on client errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
  });
};

// Auth initialization component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initializeAuth } = useAuthInitialization();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth state from localStorage
    initializeAuth();
    setIsInitialized(true);
  }, [initializeAuth]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Đang khởi tạo...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Theme provider component
function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply theme based on user preference or system preference
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return <>{children}</>;
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // You can also log the error to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="max-w-md w-full text-center">
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-2">
                Đã xảy ra lỗi
              </h2>
              <p className="text-gray-300 mb-4">
                Ứng dụng gặp sự cố. Vui lòng tải lại trang.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main providers component
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthInitializer>
            {children}
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f3f4f6',
                  border: '1px solid #374151',
                },
                success: {
                  style: {
                    background: '#065f46',
                    border: '1px solid #059669',
                  },
                },
                error: {
                  style: {
                    background: '#7f1d1d',
                    border: '1px solid #dc2626',
                  },
                },
              }}
            />
            
            {/* React Query Devtools (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools 
                initialIsOpen={false}
                buttonPosition="bottom-left"
              />
            )}
          </AuthInitializer>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Hook to access query client
export const useQueryClient : any = () => {
  const client = useQueryClient();
  return client;
};

// Utility to prefetch queries
export const prefetchQuery = async (queryKey: any[], queryFn: () => Promise<any>) => {
  const queryClient = createQueryClient();
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
  return queryClient;
};