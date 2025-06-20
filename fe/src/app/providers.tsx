// src/app/providers.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import { useAuthInitialization } from '@/features/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Initialize auth state from localStorage
      initializeAuth();
      setIsInitialized(true);
    } catch (error) {
      console.error('Auth initialization error:', error);
      setInitError(error instanceof Error ? error.message : 'Lỗi khởi tạo xác thực');
      setIsInitialized(true); // Still set to true to not block the app
    }
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

  // Show error if auth initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Lỗi khởi tạo
            </h2>
            <p className="text-gray-300 mb-4">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Theme provider component
function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      // Apply theme based on user preference or system preference
      const theme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Theme initialization error:', error);
      // Fallback to dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  return <>{children}</>;
}

// Custom error handler for React Query
const handleQueryError = (error: any) => {
  console.error('React Query Error:', error);
  
  // Don't show toast for common errors that are handled elsewhere
  if (error?.status === 401 || error?.status === 403) {
    return;
  }

  // Show generic error toast for unexpected errors
  import('react-hot-toast').then(({ default: toast }) => {
    toast.error('Đã xảy ra lỗi không mong muốn');
  });
};

// Main providers component
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    
    // Add global error handler
    client.setDefaultOptions({
      ...client.getDefaultOptions(),
      queries: {
        ...client.getDefaultOptions().queries,
      },
      mutations: {
        ...client.getDefaultOptions().mutations,
        onError: handleQueryError,
      },
    });
    
    return client;
  });

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error Boundary:', error, errorInfo);
        
        // Report to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry.captureException(error, { extra: errorInfo });
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthInitializer>
            <ErrorBoundary
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">
                      Lỗi ứng dụng
                    </h2>
                    <p className="text-gray-300 mb-4">
                      Có lỗi xảy ra khi tải ứng dụng
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Tải lại trang
                    </button>
                  </div>
                </div>
              }
            >
              {children}
            </ErrorBoundary>
            
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
                loading: {
                  style: {
                    background: '#1e40af',
                    border: '1px solid #3b82f6',
                  },
                },
              }}
            />
            
            {/* React Query Devtools (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <ErrorBoundary
                fallback={<div>DevTools Error</div>}
                onError={(error) => console.error('DevTools Error:', error)}
              >
                <ReactQueryDevtools 
                  initialIsOpen={false}
                  buttonPosition="bottom-left"
                />
              </ErrorBoundary>
            )}
          </AuthInitializer>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Hook to access query client safely
export const useQueryClientSafe = () => {
  try {
    const { useQueryClient } = require('@tanstack/react-query');
    return useQueryClient();
  } catch (error) {
    console.error('Query client access error:', error);
    return null;
  }
};

// Utility to prefetch queries safely
export const prefetchQuery = async (queryKey: any[], queryFn: () => Promise<any>) => {
  try {
    const queryClient = createQueryClient();
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
    return queryClient;
  } catch (error) {
    console.error('Prefetch query error:', error);
    return null;
  }
};