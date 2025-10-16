import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { getErrorMessage } from '@/utils/error';

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

// Global refresh token promise to prevent race conditions
let globalRefreshTokenPromise: Promise<string> | null = null;

const createApiInstance = (baseURL: string) => {
  const root = baseURL.replace(/\/$/, '');
  const baseWithV1 = /\/api\/v\d+$/i.test(root) ? root : `${root}/api/v1`;
  const instance = axios.create({
    baseURL: baseWithV1,
    headers: {
      'Content-Type': 'application/json',
    },
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

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean });
      const url = originalRequest?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/password-reset');

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isAuthEndpoint) {
          return Promise.reject(error);
        }
        originalRequest._retry = true;

        try {
          // Use global mutex to prevent race conditions
          if (globalRefreshTokenPromise) {
            const newToken = await globalRefreshTokenPromise;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }

          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            return Promise.reject(error);
          }

          globalRefreshTokenPromise = new Promise(async (resolve, reject) => {
            try {
              const response = await axios.post(`${baseURL}/auth/refresh`, {
                refresh_token: refreshToken
              });

              const { access_token, refresh_token } = response.data;

              localStorage.setItem('access_token', access_token);
              if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
              }

              resolve(access_token);
            } catch (refreshError) {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
              }
              reject(refreshError);
            } finally {
              globalRefreshTokenPromise = null;
            }
          });

          const newToken = await globalRefreshTokenPromise;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          return instance(originalRequest);
        } catch (refreshError) {
          globalRefreshTokenPromise = null;
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

  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isInitializing: true,
  });

  const refreshTokenPromise = useRef<Promise<string> | null>(null);
  const api = useMemo(() => createApiInstance(apiBase), [apiBase]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [api]);

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

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

  const refreshAccessToken = useCallback(async (): Promise<string> => {
    // Use global mutex to prevent race conditions across all refresh attempts
    if (globalRefreshTokenPromise) {
      return globalRefreshTokenPromise;
    }

    if (refreshTokenPromise.current) {
      return refreshTokenPromise.current;
    }

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Set both local and global promises to the same instance
      const promise = new Promise<string>(async (resolve, reject) => {
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
          globalRefreshTokenPromise = null;
        }
      });

      refreshTokenPromise.current = promise;
      globalRefreshTokenPromise = promise;

      return promise;
    } catch (error) {
      refreshTokenPromise.current = null;
      globalRefreshTokenPromise = null;
      throw error;
    }
  }, [api, clearAuthData]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      updateState({ loading: true });

      await clearAuthData();

      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.warn('Logout API call failed, but continuing with client-side cleanup', error);
      }

      // Check if user is on admin page and redirect accordingly
      const isAdminPage = router.pathname.startsWith('/admin');
      router.push(isAdminPage ? '/admin/login' : '/signin');
    } catch (error) {
      console.error('Error during logout:', error);
      updateState({
        error: 'Failed to log out. Please try again.',
        loading: false,
      });
      throw error;
    }
  }, [api, clearAuthData, router, updateState]);

  const fetchUserData = useCallback(async (): Promise<User> => {
    try {
      updateState({ loading: true });

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token available');
      }

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
        if (axiosError.response?.status === 403) {
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

      if ('response' in error && error.response?.status === 403) {
        throw new Error('You do not have permission to access this resource. Please contact an administrator.');
      }

      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            await refreshAccessToken();
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

  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<ApiResponse<User>> => {
    try {
      updateState({ loading: true, error: null });

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

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      if (api.defaults.headers.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      }

      const user = await fetchUserData();

      updateState({ user, loading: false, error: null });

      localStorage.setItem('user', JSON.stringify(user));

      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/';
      router.push(redirectPath);

      return { data: user };
    } catch (error) {
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

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      if (api.defaults.headers.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }

      const tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
      localStorage.setItem('token_expiry', tokenExpiry.toString());

      try {
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

        try {
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

        if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        if (isAuthEndpoint) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          const newToken = await refreshAccessToken();

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          updateState({ isInitializing: false, loading: false });
          return;
        }

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
