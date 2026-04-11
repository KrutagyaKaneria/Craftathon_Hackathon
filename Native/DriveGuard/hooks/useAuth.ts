import { useCallback, useMemo } from 'react';
import { useAuthStore, UserData } from '../store/authStore';
import { authAPI } from '../services/api';

export const useAuth = () => {
  // Use individual selectors to prevent infinite loops
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const store = useAuthStore.getState();
        store.setLoading(true);
        store.setError(null);
        
        console.log('🔐 Login attempt for:', email);
        const data = await authAPI.login(email, password);
        
        console.log('📩 Server response received');
        
        if (data.token) {
          console.log('Token received from server:', data.token.substring(0, 30) + '...');
          // Save token
          await store.setToken(data.token);
          
          // Save user data with ownerId
          const userData: UserData = {
            id: data.ownerId,
            ownerId: data.ownerId,
            email: data.email,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            name: data.firstName || email.split('@')[0],
          };
          console.log('Saving user data:', { ownerId: userData.ownerId, email: userData.email });
          await store.setUser(userData);
          
          store.setLoading(false);
          console.log('Login successful, token saved');
          return { success: true, data };
        } else {
          throw new Error('No token received from server');
        }
      } catch (err: any) {
        const store = useAuthStore.getState();
        const errorMessage = err.message || 'Login failed';
        console.error('❌ Login error:', errorMessage);
        store.setError(errorMessage);
        store.setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      try {
        const store = useAuthStore.getState();
        store.setLoading(true);
        store.setError(null);
        
        console.log('📝 Starting signup for:', email);
        const data = await authAPI.signup(email, password);
        
        if (data.token) {
          // Save token
          await store.setToken(data.token);
          
          // Save user data with ownerId
          const userData: UserData = {
            id: data.ownerId,
            ownerId: data.ownerId,
            email: data.email,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            name: data.firstName || email.split('@')[0],
          };
          await store.setUser(userData);
          
          store.setLoading(false);
          console.log('✅ Signup successful');
          return { success: true, data };
        } else {
          const err = 'No token received from server';
          console.error('❌ ' + err);
          throw new Error(err);
        }
      } catch (err: any) {
        const store = useAuthStore.getState();
        
        // Extract error message from different error formats
        let errorMessage = 'Signup failed';
        
        if (typeof err === 'object' && err?.message) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        console.error('❌ Signup failed:', errorMessage);
        store.setError(errorMessage);
        store.setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const store = useAuthStore.getState();
      store.setLoading(true);
      await authAPI.logout();
      await store.clearAuth();
      store.setLoading(false);
    } catch (err) {
      console.warn('Logout error:', err);
      const store = useAuthStore.getState();
      await store.clearAuth();
      store.setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      signup,
      logout,
    }),
    [token, user, isAuthenticated, isLoading, error, login, signup, logout]
  );
};
