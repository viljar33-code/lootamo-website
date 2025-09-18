import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '@/utils/error';

const OAuthCallback = () => {
  const router = useRouter();
  const { loginWithOAuth, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const processAuth = useCallback(async () => {
    try {
      const { 
        access_token, 
        refresh_token, 
        user_id, 
        error: authError,
        // Handle OAuth flows
        code,
        state,
        provider = 'google' // Default to google for backward compatibility
      } = router.query;

      if (authError) {
        throw new Error(`Authentication failed: ${authError}`);
      }

      if (access_token && refresh_token) {
        try {
          // Store tokens first
          const tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
          localStorage.setItem('access_token', access_token as string);
          localStorage.setItem('refresh_token', refresh_token as string);
          localStorage.setItem('token_expiry', tokenExpiry.toString());
          
          if (user_id) {
            localStorage.setItem('user_id', user_id as string);
            
            // Try to fetch user data using the user_id
            try {
              const userResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                }
              );
              
              if (userResponse.data) {
                localStorage.setItem('user', JSON.stringify(userResponse.data));
              }
            } catch {
              console.warn('Could not fetch user details, using minimal user info');
              // Create a minimal user object if we can't fetch full details
              const minimalUser = {
                id: user_id,
                email: '',
                name: 'Facebook User'
              };
              localStorage.setItem('user', JSON.stringify(minimalUser));
            }
          }

          // Update auth context
          await loginWithOAuth(
            access_token as string,
            refresh_token as string,
            user_id as string || ''
          );
          
          // Redirect after successful login
          const redirectPath = localStorage.getItem('redirect_after_login') || '/';
          localStorage.removeItem('redirect_after_login');
          window.location.href = redirectPath;
          return;
          
        } catch (error) {
          console.error('Error in Facebook OAuth callback:', error);
          setError('Failed to complete Facebook login. Please try again.');
          setIsLoading(false);
          return;
        }
      } 
      
      if (code) {
        try {
          const oauthEndpoint = provider === 'facebook' ? 'facebook' : 'google';
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/${oauthEndpoint}/callback?code=${code}&state=${state || ''}&redirect_uri=${encodeURIComponent(`${window.location.origin}/auth/callback`)}`,
            { withCredentials: true }
          );

          const { access_token, refresh_token, user } = response.data;
          
          if (access_token && refresh_token) {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            localStorage.setItem('user', JSON.stringify(user));
            
            const tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
            localStorage.setItem('token_expiry', tokenExpiry.toString());
            
            await loginWithOAuth(access_token, refresh_token, user.id.toString());
          }
        } catch (err) {
          console.error('Error exchanging code for tokens:', err);
          throw new Error(getErrorMessage(err, 'Failed to authenticate with OAuth provider'));
        }
      } else {
        throw new Error('Missing authentication tokens or code');
      }

      // Handle redirect after successful authentication
      const redirectPath = localStorage.getItem('redirect_after_login') || '/';
      localStorage.removeItem('redirect_after_login');
      router.push(redirectPath);

    } catch (err) {
      console.error('Authentication error:', err);
      setError(getErrorMessage(err, 'An unknown error occurred'));
      setIsLoading(false);
    }
  }, [router, loginWithOAuth]);

  useEffect(() => {
    if (router.isReady) {
      processAuth();
    }
  }, [router.isReady, processAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = localStorage.getItem('redirect_after_login') || '/';
      localStorage.removeItem('redirect_after_login');
      router.push(redirectPath);
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Signing you in</h2>
          <p className="text-gray-600">Please wait while we authenticate your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 border-solid"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Successful!</h2>
        <p className="text-gray-600">Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
