'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import {
  AuthState,
  AuthContextType,
  LoginCredentials,
  RegisterData,
  MFAVerification,
  UserProfile,
  UserPreferences,
  User,
  AuthTokens,
} from '@/types/auth';
import { AuthService } from '@/lib/auth/service';
import { TokenStorage, JWTManager } from '@/lib/auth/jwt';

// Auth reducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { user: User; tokens: AuthTokens } };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        error: null,
      };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (state.tokens && state.isAuthenticated) {
      const interval = setInterval(() => {
        checkAndRefreshToken();
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => clearInterval(interval);
    }
  }, [state.tokens, state.isAuthenticated]);

  const initializeAuth = async () => {
    try {
      const tokens = TokenStorage.getTokens();
      if (!tokens) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Check if access token is expired
      if (JWTManager.isTokenExpired(tokens.accessToken)) {
        // Try to refresh token
        await refreshToken();
      } else {
        // Verify token and get user data
        const payload = JWTManager.verifyAccessToken(tokens.accessToken);
        if (payload) {
          // In a real app, you might want to fetch fresh user data from the server
          // For now, we'll reconstruct user from token payload
          const user = await reconstructUserFromToken(payload);
          if (user) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user, tokens } });
          } else {
            TokenStorage.clearTokens();
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          TokenStorage.clearTokens();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      TokenStorage.clearTokens();
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const reconstructUserFromToken = async (payload: any): Promise<User | null> => {
    try {
      // In a real app, fetch user data from API using payload.userId
      // For now, we'll use the mock service
      const user = await AuthService.getUserById(payload.userId);
      return user || null;
    } catch {
      return null;
    }
  };

  const checkAndRefreshToken = async () => {
    if (!state.tokens) return;

    const timeUntilExpiry = state.tokens.expiresAt.getTime() - Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Refresh if token expires in less than 5 minutes
    if (timeUntilExpiry < fiveMinutes) {
      await refreshToken();
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const result = await AuthService.login(credentials);
      
      // Store tokens
      TokenStorage.setTokens(result.tokens);
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const result = await AuthService.register(data);
      
      // Store tokens
      TokenStorage.setTokens(result.tokens);
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear stored tokens
      TokenStorage.clearTokens();
      
      // Reset state
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if server logout fails
      TokenStorage.clearTokens();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const refreshToken = TokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const result = await AuthService.refreshToken(refreshToken);
      
      // Store new tokens
      TokenStorage.setTokens(result.tokens);
      
      dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: result });
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      TokenStorage.clearTokens();
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  };

  const setupMFA = async () => {
    if (!state.user) throw new Error('User not authenticated');
    
    try {
      return await AuthService.setupMFA(state.user.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MFA setup failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const verifyMFA = async (verification: MFAVerification): Promise<void> => {
    if (!state.user) throw new Error('User not authenticated');
    
    try {
      const isValid = await AuthService.verifyMFA(state.user.id, verification);
      if (!isValid) {
        throw new Error('Invalid MFA code');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MFA verification failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const updateProfile = async (profile: Partial<UserProfile>): Promise<void> => {
    if (!state.user) throw new Error('User not authenticated');
    
    try {
      const updatedUser = await AuthService.updateProfile(state.user.id, profile);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>): Promise<void> => {
    if (!state.user) throw new Error('User not authenticated');
    
    try {
      const updatedUser = await AuthService.updatePreferences(state.user.id, preferences);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Preferences update failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    setupMFA,
    verifyMFA,
    updateProfile,
    updatePreferences,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}