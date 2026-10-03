import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, usersApi } from '@/lib/api';
import type { User, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  coins: number;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; auth: AuthResponse } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'INITIALIZED'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_COINS'; payload: number };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokenAction: () => Promise<void>;
  setUser: (user: User) => void;
  addCoins: (amount: number) => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  coins: Math.max(0, parseInt(localStorage.getItem('coins') || '0', 10) || 0),
};

function readCoins(): number {
  return Math.max(0, parseInt(localStorage.getItem('coins') || '0', 10) || 0);
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.auth.accessToken,
        refreshToken: action.payload.auth.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        coins: readCoins(),
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        coins: readCoins(),
      };
    case 'INITIALIZED':
      return {
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        coins: readCoins(),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_COINS': {
      const coins = readCoins() + action.payload;
      localStorage.setItem('coins', String(coins));
      return { ...state, coins };
    }
    default:
      return state;
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  const initialize = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');

    if (!token || !refresh) {
      dispatch({ type: 'AUTH_FAILURE' });
      return;
    }

    try {
      const response = await authApi.refresh(refresh);
      const auth: AuthResponse = response.data.data;
      localStorage.setItem('access_token', auth.accessToken);
      localStorage.setItem('refresh_token', auth.refreshToken);

      const userResponse = await usersApi.getMe();
      dispatch({
        type: 'INITIALIZED',
        payload: {
          user: userResponse.data.data,
          token: auth.accessToken,
          refreshToken: auth.refreshToken,
        },
      });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      dispatch({ type: 'AUTH_FAILURE' });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authApi.login(email, password);
      const auth: AuthResponse = response.data.data;
      localStorage.setItem('access_token', auth.accessToken);
      localStorage.setItem('refresh_token', auth.refreshToken);

      const userResponse = await usersApi.getMe();
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: userResponse.data.data, auth },
      });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
    }) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const response = await authApi.register(data);
        const auth: AuthResponse = response.data.data;
        localStorage.setItem('access_token', auth.accessToken);
        localStorage.setItem('refresh_token', auth.refreshToken);

        const userResponse = await usersApi.getMe();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: userResponse.data.data, auth },
        });
      } catch (error) {
        dispatch({ type: 'AUTH_FAILURE' });
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      queryClient.clear();
      dispatch({ type: 'LOGOUT' });
    }
  }, [queryClient]);

  const refreshTokenAction = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error('No refresh token');

    const response = await authApi.refresh(refresh);
    const auth: AuthResponse = response.data.data;
    localStorage.setItem('access_token', auth.accessToken);
    localStorage.setItem('refresh_token', auth.refreshToken);
  }, []);

  const setUser = useCallback((user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const addCoins = useCallback((amount: number) => {
    dispatch({ type: 'ADD_COINS', payload: amount });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshTokenAction,
      setUser,
      addCoins,
    }),
    [state, login, register, logout, refreshTokenAction, setUser, addCoins]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
