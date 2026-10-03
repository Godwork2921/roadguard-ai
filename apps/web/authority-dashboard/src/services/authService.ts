import api from '@/lib/api';
import type { AuthResponse, User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
}

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data: response } = await api.post<ApiResponseWrapper<AuthResponse>>(
    '/auth/login',
    credentials
  );
  const auth = response.data;
  localStorage.setItem('access_token', auth.accessToken);
  localStorage.setItem('refresh_token', auth.refreshToken);
  return auth;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const { data: response } = await api.post<ApiResponseWrapper<AuthResponse>>(
    '/auth/register',
    data
  );
  const auth = response.data;
  localStorage.setItem('access_token', auth.accessToken);
  localStorage.setItem('refresh_token', auth.refreshToken);
  return auth;
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  const { data: response } = await api.post<ApiResponseWrapper<AuthResponse>>(
    '/auth/refresh',
    { refreshToken: token }
  );
  const auth = response.data;
  localStorage.setItem('access_token', auth.accessToken);
  localStorage.setItem('refresh_token', auth.refreshToken);
  return auth;
}

export async function getCurrentUser(): Promise<User> {
  const { data: response } = await api.get<ApiResponseWrapper<User>>('/users/me');
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
