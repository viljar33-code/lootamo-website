import { AxiosInstance } from 'axios';

export interface User {
  id: string | number;
  email: string;
  name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
  is_verified?: boolean;
  is_superuser?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  phone?: string;
  avatar_url?: string | null;
  uuid?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitializing: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  api: AxiosInstance;
  apiBase: string;
}
