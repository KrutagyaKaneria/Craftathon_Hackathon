import { create } from 'zustand';
import { DashboardData, DashboardAlert } from '../services/dashboardService';
import { useAuthStore } from './authStore';

export interface DashboardState {
  // Data
  dashboard: DashboardData | null;
  alerts: DashboardAlert[];
  
  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefreshTime: string | null;
  
  // Actions
  setDashboard: (dashboard: DashboardData) => void;
  setAlerts: (alerts: DashboardAlert[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  updateLastRefreshTime: () => void;
  
  // API Actions
  fetchDashboard: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  
  // Cleanup
  clearDashboard: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  dashboard: null,
  alerts: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastRefreshTime: null,

  // Setters
  setDashboard: (dashboard: DashboardData) => {
    set({ dashboard, error: null });
  },

  setAlerts: (alerts: DashboardAlert[]) => {
    set({ alerts });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setRefreshing: (refreshing: boolean) => {
    set({ isRefreshing: refreshing });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  updateLastRefreshTime: () => {
    const now = new Date().toISOString();
    set({ lastRefreshTime: now });
  },

  // API Actions
  fetchDashboard: async () => {
    const { setLoading, setError, setDashboard, setAlerts, updateLastRefreshTime } = get();
    
    try {
      // Check if user is authenticated
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.token) {
        setError('User not authenticated');
        return;
      }

      setLoading(true);
      setError(null);

      // Import here to avoid circular dependencies
      const { default: dashboardAPI } = await import('../services/dashboardService');
      
      const data = await dashboardAPI.getDashboard();
      setDashboard(data);
      
      if (data.recentAlerts) {
        setAlerts(data.recentAlerts);
      }
      
      updateLastRefreshTime();
      console.log('✅ Dashboard data fetched for user:', authState.user?.email);
    } catch (error: any) {
      const message = error.message || 'Failed to fetch dashboard';
      setError(message);
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  },

  refreshDashboard: async () => {
    const { setRefreshing, setError, setDashboard, setAlerts, updateLastRefreshTime } = get();
    
    try {
      // Check if user is authenticated
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.token) {
        setError('User not authenticated');
        return;
      }

      setRefreshing(true);
      setError(null);

      // Import here to avoid circular dependencies
      const { default: dashboardAPI } = await import('../services/dashboardService');
      
      const data = await dashboardAPI.getDashboard();
      setDashboard(data);
      
      if (data.recentAlerts) {
        setAlerts(data.recentAlerts);
      }
      
      updateLastRefreshTime();
      console.log('🔄 Dashboard refreshed');
    } catch (error: any) {
      const message = error.message || 'Failed to refresh dashboard';
      setError(message);
      console.error('Dashboard refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  },

  acknowledgeAlert: async (alertId: string) => {
    try {
      // Check if user is authenticated
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.token) {
        console.warn('User not authenticated');
        return;
      }

      const { default: dashboardAPI } = await import('../services/dashboardService');
      await dashboardAPI.acknowledgeAlert(alertId);
      
      // Remove acknowledged alert from list
      const currentAlerts = get().alerts;
      const updatedAlerts = currentAlerts.filter(alert => alert.id !== alertId);
      get().setAlerts(updatedAlerts);
      console.log('✅ Alert acknowledged:', alertId);
    } catch (error: any) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  },

  // Cleanup
  clearDashboard: () => {
    set({
      dashboard: null,
      alerts: [],
      error: null,
      isLoading: false,
      isRefreshing: false,
      lastRefreshTime: null,
    });
  },
}));

export default useDashboardStore;
