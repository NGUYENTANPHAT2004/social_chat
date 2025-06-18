'use client';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface OAuthCallbackProps {
  provider: 'google' | 'facebook';
}

const OAuthCallback: React.FC<OAuthCallbackProps> = ({ provider }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser, clearError } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        clearError();
        
        // Get parameters from URL
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
          console.error(`${provider} OAuth error:`, error);
          router.push('/auth/login?error=' + encodeURIComponent(error));
          return;
        }

        if (token && refreshToken) {
          // Store tokens
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);

          // Parse user data if provided
          if (userParam) {
            try {
              const userData = JSON.parse(decodeURIComponent(userParam));
              updateUser(userData);
            } catch (parseError) {
              console.error('Error parsing user data:', parseError);
            }
          }

          // Redirect to dashboard or intended page
          const redirect = localStorage.getItem('oauth_redirect') || '/dashboard';
          localStorage.removeItem('oauth_redirect');
          router.push(redirect);
        } else {
          // Missing required parameters
          router.push('/auth/login?error=' + encodeURIComponent('Authentication failed'));
        }
      } catch (error) {
        console.error(`${provider} OAuth callback error:`, error);
        router.push('/auth/login?error=' + encodeURIComponent('Authentication failed'));
      }
    };

    handleOAuthCallback();
  }, [provider, router, searchParams, updateUser, clearError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="font-bold text-white text-2xl">LM</span>
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Completing sign in...</span>
        </div>
        <p className="text-gray-300 text-sm">
          Please wait while we finish setting up your account.
        </p>
      </div>
    </div>
  );
};
export default OAuthCallback;
