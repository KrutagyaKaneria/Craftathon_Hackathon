import { create } from 'zustand';

export interface RealTimeAlert {
  _id: string;
  driverName: string;
  vehicleNumber: string;
  vehicleModel?: string;
  eventType: string;
  subtype?: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  telemetryData?: {
    eyeClosureDuration?: string;
    [key: string]: any;
  };
  resolved?: boolean;
  driverPhoto?: string;
}

interface AlertsState {
  alerts: RealTimeAlert[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  addAlert: (alert: RealTimeAlert) => void;
  markAsResolved: (alertId: string) => void;
  removeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAlerts: (alerts: RealTimeAlert[]) => void;
}

const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  isConnected: false,
  isLoading: false,
  error: null,

  addAlert: (alert: RealTimeAlert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
      error: null,
    }));
  },

  markAsResolved: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert._id === alertId ? { ...alert, resolved: true } : alert
      ),
    }));
  },

  removeAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert._id !== alertId),
    }));
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
    console.log(`WebSocket connection status: ${connected ? 'Connected ✅' : 'Disconnected ❌'}`);
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setAlerts: (alerts: RealTimeAlert[]) => {
    set({ alerts });
  },
}));

export default useAlertsStore;
