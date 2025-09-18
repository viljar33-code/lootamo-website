import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { getErrorMessage } from '@/utils/error';

// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status?: number;
  message?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  name?: string;
  phone?: string;
  role: string;
  avatar_url: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  state?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitializing: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<ApiResponse<User>>;
  loginWithOAuth: (accessToken: string, refreshToken: string, userId: string) => Promise<ApiResponse<User>>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  api: AxiosInstance;
  apiBase: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createApiInstance = (baseURL: string) => {
  // Normalize and ensure a single versioned prefix
  const root = baseURL.replace(/\/$/, '');
  const baseWithV1 = /\/api\/v\d+$/i.test(root) ? root : `${root}/api/v1`;
  const instance = axios.create({
    baseURL: baseWithV1,
    headers: {
      'Content-Type': 'application/json',
    },
    // Using Authorization header for JWTs (not cookies)
    withCredentials: false,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle token refresh
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean });
      const url = originalRequest?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/password-reset');

      // If the error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        // For auth endpoints, don't refresh or redirect; let UI display error
        if (isAuthEndpoint) {
          return Promise.reject(error);
        }
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            // No refresh token: surface error so UI can decide next steps
            return Promise.reject(error);
          }

          // Try to refresh the token
          const response = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: refreshToken
          });

          const { access_token, refresh_token } = response.data;

          // Store the new tokens
          localStorage.setItem('access_token', access_token);
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }

          // Update the authorization header
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          // Retry the original request with the new token
          return instance(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear tokens but do not redirect automatically
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

  // State
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isInitializing: true,
  });

  // Refs
  const refreshTokenPromise = useRef<Promise<string> | null>(null);
  const api = useMemo(() => createApiInstance(apiBase), [apiBase]);

  // Initialize auth token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [api]);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Clear all auth data
  const clearAuthData = useCallback(async (): Promise<void> => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('login_redirect');
    localStorage.removeItem('pending_redirect');
    localStorage.removeItem('user_id');
    localStorage.removeItem('token_expiry');

    if (api.defaults.headers.common) {
      delete api.defaults.headers.common['Authorization'];
    }

    updateState({
      user: null,
      loading: false,
      isInitializing: false,
    });
  }, [api, updateState]);

  // Handle token refresh
  const refreshAccessToken = useCallback(async (): Promise<string> => {
    if (refreshTokenPromise.current) {
      return refreshTokenPromise.current;
    }

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      refreshTokenPromise.current = new Promise(async (resolve, reject) => {
        try {
          const response = await api.post<TokenResponse>('/auth/refresh', {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;

          localStorage.setItem('access_token', access_token);
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }

          resolve(access_token);
        } catch (error) {
          await clearAuthData();
          reject(error);
        } finally {
          refreshTokenPromise.current = null;
        }
      });

      return refreshTokenPromise.current;
    } catch (error) {
      refreshTokenPromise.current = null;
      throw error;
    }
  }, [api, clearAuthData]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      updateState({ loading: true });

      // Clear all auth data
      await clearAuthData();

      // Optional: Call backend logout endpoint if needed
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.warn('Logout API call failed, but continuing with client-side cleanup', error);
      }

      // Redirect to login page
      router.push('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
      updateState({
        error: 'Failed to log out. Please try again.',
        loading: false,
      });
      throw error;
    }
  }, [api, clearAuthData, router, updateState]);

  // Fetch user data with token refresh handling
  const fetchUserData = useCallback(async (): Promise<User> => {
    try {
      updateState({ loading: true });

      // Ensure we have an access token
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token available');
      }

      // Make sure the token is set in the headers
      if (api.defaults.headers.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await api.get<User>('/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response?.data) {
          throw new Error('No user data received');
        }

        const userData = response.data;

        updateState({
          user: userData,
          loading: false,
          error: null,
        });

        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      } catch (error) {
        const axiosError = error as AxiosError;
        // Handle 403 - Forbidden (Insufficient permissions)
        if (axiosError.response?.status === 403) {
          // Try to get user data from local storage as fallback
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              updateState({
                user,
                loading: false,
                error: 'Limited access: Some features may not be available',
              });
              return user;
            } catch (e) {
              console.warn('Failed to parse user data from local storage:', e);
            }
          }
          throw new Error('You do not have permission to access this resource. Please contact an administrator.');
        }
        throw error;
      }
    } catch (err) {
      const error = err as Error | AxiosError;
      console.error('Error fetching user data:', error);

      // Handle 403 - Forbidden (Insufficient permissions)
      if ('response' in error && error.response?.status === 403) {
        throw new Error('You do not have permission to access this resource. Please contact an administrator.');
      }

      // Handle 401 - Unauthorized (Token expired/invalid)
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            await refreshAccessToken();
            // Retry the request with the new token
            return fetchUserData();
          }
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          await clearAuthData();
          router.push('/signin');
        }
      }

      const errorMessage = getErrorMessage(error, 'Failed to fetch user data');

      updateState({
        error: errorMessage,
        loading: false,
      });

      throw error;
    }
  }, [api, clearAuthData, refreshAccessToken, router, updateState]);

  // Login with email/password
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<ApiResponse<User>> => {
    try {
      updateState({ loading: true, error: null });

      // Do not throw on 4xx/5xx; handle manually for friendly errors
      const response = await api.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
      }>(
        '/auth/login',
        { email_or_username: email, password },
        { validateStatus: () => true }
      );

      if (!response || response.status < 200 || response.status >= 300) {
        const payload = response?.data as { detail?: string; message?: string } | undefined;
        const detail = payload?.detail || payload?.message;
        const errorMessage = typeof detail === 'string' && detail.trim().length
          ? detail
          : 'Incorrect email/username or password';

        updateState({ error: errorMessage, loading: false });
        return { error: errorMessage, status: response?.status };
      }

      const { access_token, refresh_token } = response.data;

      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Update axios instance with new token
      if (api.defaults.headers.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      }

      // Fetch user data with the new token
      const user = await fetchUserData();

      // Update state
      updateState({ user, loading: false, error: null });

      // Store user data
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on role
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/';
      router.push(redirectPath);

      return { data: user };
    } catch (error) {
      // Network or unexpected errors
      const errorMessage = getErrorMessage(error, 'Login failed. Please check your credentials.');
      updateState({ error: errorMessage, loading: false });
      return { error: errorMessage, status: (error as AxiosError)?.response?.status };
    }
  }, [api, router, updateState, fetchUserData]);

  // OAuth login
  const loginWithOAuth = useCallback(async (
    accessToken: string,
    refreshToken: string,
    userId: string
  ): Promise<ApiResponse<User>> => {
    try {
      updateState({ loading: true, error: null, isInitializing: true });

      // Store tokens
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      // Update axios instance with new token
      if (api.defaults.headers.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }

      // Set token expiry (23 hours from now)
      const tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
      localStorage.setItem('token_expiry', tokenExpiry.toString());

      try {
        // First try to get user data from the OAuth response (if available)
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            updateState({
              user,
              loading: false,
              error: null,
              isInitializing: false
            });
            return { data: user };
          } catch (e) {
            console.warn('Failed to parse user data from local storage:', e);
          }
        }

        // If no user data in localStorage, try to fetch it
        try {
          // First try the /me endpoint
          const token = localStorage.getItem('access_token');
          if (!token) {
            throw new Error('No access token available');
          }

          const response = await api.get<User>('/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          if (response.data) {
            const user = response.data;
            localStorage.setItem('user', JSON.stringify(user));
            updateState({
              user,
              loading: false,
              error: null,
              isInitializing: false
            });
            return { data: user };
          }
        } catch (meError) {
          console.warn('Failed to fetch user with /me endpoint, trying with user ID:', meError);

          // If we have a userId, try to fetch the user by ID
          if (userId) {
            try {
              const response = await api.get<User>(`/users/${userId}`);
              if (response.data) {
                const user = response.data;
                localStorage.setItem('user', JSON.stringify(user));
                updateState({
                  user,
                  loading: false,
                  error: null,
                  isInitializing: false
                });
                return { data: user };
              }
            } catch (idError) {
              const axiosIdError = idError as AxiosError;
              console.error('Failed to fetch user by ID:', axiosIdError);

              // If we have user data in localStorage, use it as fallback
              const userStr = localStorage.getItem('user');
              if (userStr) {
                try {
                  const user = JSON.parse(userStr) as User;
                  updateState({
                    user,
                    loading: false,
                    error: 'Limited access: Using cached user data',
                    isInitializing: false
                  });
                  return { data: user };
                } catch (e) {
                  console.warn('Failed to parse cached user data:', e);
                }
              }

              // If we have a 403, provide a more specific error message
              if (axiosIdError.response?.status === 403) {
                throw new Error('You do not have permission to access user information');
              }

              throw new Error('Failed to fetch user information');
            }
          }

          throw new Error('No user data available after OAuth login');
        }
      } catch (error) {
        console.error('Error during OAuth login:', error);

        const statusCode = (error as AxiosError)?.response?.status || 500;
        const errorMessage = getErrorMessage(error, 'Authentication failed');

        // Clear any potentially invalid auth data
        await clearAuthData();

        updateState({
          error: errorMessage,
          loading: false,
          isInitializing: false
        });

        return {
          error: errorMessage,
          status: statusCode,
        };
      }

      // This should never be reached, but TypeScript needs a return
      return { error: 'An unknown error occurred during OAuth login' };
    } catch (error) {
      console.error('Unexpected error in loginWithOAuth:', error);
      return {
        error: 'An unexpected error occurred during OAuth login',
        status: 500
      };
    }
  }, [api, clearAuthData, updateState]);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean });
        const url = originalRequest?.url || '';
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/password-reset');

        // If error is not 401 or we've already tried to refresh, reject
        if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        // Do not attempt refresh for auth endpoints; let UI handle the 401
        if (isAuthEndpoint) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          const newToken = await refreshAccessToken();

          // Update the auth header
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request with new token
          return api(originalRequest);
        } catch (refreshError) {
          await logout();
          return Promise.reject(refreshError);
        }
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [api, updateState, clearAuthData, refreshAccessToken, router, fetchUserData, logout]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          updateState({ isInitializing: false, loading: false });
          return;
        }

        // If we have a token but no user data, fetch it
        await fetchUserData();
      } catch (error) {
        console.error('Auth initialization failed:', error);
        await clearAuthData();
      } finally {
        updateState({
          isInitializing: false,
          loading: false,
        });
      }
    };

    initializeAuth();
  }, [clearAuthData, fetchUserData, updateState]);

  // Context value
  const value = useMemo(() => ({
    ...state,
    login,
    loginWithOAuth,
    logout,
    isAuthenticated: !!state.user,
    api,
    apiBase,
  }), [
    state,
    login,
    loginWithOAuth,
    logout,
    api,
    apiBase,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
