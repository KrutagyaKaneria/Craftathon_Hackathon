import { create } from 'zustand';
import { safeStorage } from '../utils/safeStorage';

let initializationInProgress = false;

export interface UserData {
  id?: string;
  ownerId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  name?: string;
}

export interface AuthState {
  // Auth token
  token: string | null;
  
  // User data
  user: UserData | null;
  
  // Status flags
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Actions
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: UserData | null) => Promise<void>;
  clearAuth: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  setToken: async (token: string | null) => {
    if (token) {
      console.log('💾 Saving token to storage:', token.substring(0, 30) + '...');
      await safeStorage.setItem('authToken', token);
      const saved = await safeStorage.getItem('authToken');
      console.log('✅ Token saved and verified:', saved ? saved.substring(0, 30) + '...' : 'FAILED TO SAVE');
      set({ token, isAuthenticated: true, error: null });
    } else {
      console.log('🗑️ Clearing token from storage');
      await safeStorage.removeItem('authToken');
      set({ token: null, isAuthenticated: false });
    }
  },

  setUser: async (user: UserData | null) => {
    if (user) {
      await safeStorage.setItem('userData', JSON.stringify(user));
      set({ user });
    } else {
      await safeStorage.removeItem('userData');
      set({ user: null });
    }
  },

  clearAuth: async () => {
    await safeStorage.removeItem('authToken');
    await safeStorage.removeItem('userData');
    set({ 
      token: null, 
      user: null,
      isAuthenticated: false, 
      error: null 
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  initializeAuth: async () => {
    // Prevent multiple concurrent initialization attempts
    if (initializationInProgress) {
      console.log('⏳ Auth initialization already in progress...');
      return;
    }

    try {
      initializationInProgress = true;
      set({ isInitializing: true });
      
      console.log('🔍 Checking for saved auth...');
      
      // Try to restore token and user data from storage
      const token = await safeStorage.getItem('authToken');
      const userDataStr = await safeStorage.getItem('userData');
      
      console.log('📦 Storage check - Token exists:', !!token);
      console.log('📦 Storage check - UserData exists:', !!userDataStr);
      
      if (token) {
        console.log('🎫 Token found (first 30 chars):', token.substring(0, 30) + '...');
      }
      
      let user = null;
      if (userDataStr) {
        try {
          user = JSON.parse(userDataStr);
          console.log('👤 User data found:', user.email);
        } catch (e) {
          console.warn('❌ Failed to parse user data:', e);
        }
      }

      if (token && user) {
        // Token exists - user is logged in
        set({ 
          token, 
          user,
          isAuthenticated: true,
          isInitializing: false,
        });
        console.log('✅ Auth restored - User:', user.email);
      } else {
        // No token - user needs to login
        set({ 
          token: null, 
          user: null,
          isAuthenticated: false,
          isInitializing: false,
        });
        console.log('ℹ️ No saved auth found - User needs to login');
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      set({ 
        token: null, 
        user: null,
        isAuthenticated: false,
        isInitializing: false,
        error: 'Failed to restore session'
      });
    } finally {
      initializationInProgress = false;
    }
  },
}));

export default useAuthStore;
