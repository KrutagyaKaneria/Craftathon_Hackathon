import React, { useEffect } from 'react';
import { useAuthStore, type AuthState } from '../store/authStore';

// Hook to initialize auth
export const useAuthInit = () => {
  const checkAuth = useAuthStore((state: AuthState) => state.initializeAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
};

// Hook to use auth state
export const useAuth = () => {
  return useAuthStore((state: AuthState) => ({
    user: state.token,
    token: state.token,
    loading: state.isLoading,
    error: state.error,
    isInitialized: state.isAuthenticated,
  }));
};

// Hook to use auth actions
export const useAuthActions = () => {
  return useAuthStore((state: AuthState) => ({
    login: state.setToken,
    signup: state.setToken,
    logout: state.clearAuth,
    clearError: state.setError,
    setLoading: state.setLoading,
  }));
};
