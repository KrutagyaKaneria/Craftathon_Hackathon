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

export interface Notification extends RealTimeAlert {
  dismissedAt?: string;
}

interface AlertsState {
  // Persistent alerts section (high-risk, long-duration)
  alerts: RealTimeAlert[];
  
  // Notifications section (temporary, top banner)
  notifications: Notification[];
  currentNotification: Notification | null;
  
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions for Alerts
  addAlert: (alert: RealTimeAlert) => void;
  markAsResolved: (alertId: string) => void;
  deleteAlert: (alertId: string) => void;
  clearAlerts: () => void;

  // Actions for Notifications
  addNotification: (notification: Notification) => void;
  dismissNotification: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  setCurrentNotification: (notification: Notification | null) => void;
  deleteNotificationPermanently: (notificationId: string) => void;

  // General actions
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAlerts: (alerts: RealTimeAlert[]) => void;
  setNotifications: (notifications: Notification[]) => void;
}

const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  notifications: [],
  currentNotification: null,
  isConnected: false,
  isLoading: false,
  error: null,

  // Alert actions
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

  deleteAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert._id !== alertId),
    }));
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  // Notification actions
  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      currentNotification: notification,
      error: null,
    }));
  },

  dismissNotification: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif._id === notificationId
          ? { ...notif, dismissedAt: new Date().toISOString() }
          : notif
      ),
      currentNotification: null,
    }));
  },

  removeNotification: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.filter((notif) => notif._id !== notificationId),
      currentNotification:
        state.currentNotification?._id === notificationId ? null : state.currentNotification,
    }));
  },

  setCurrentNotification: (notification: Notification | null) => {
    set({ currentNotification: notification });
  },

  deleteNotificationPermanently: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.filter((notif) => notif._id !== notificationId),
      currentNotification:
        state.currentNotification?._id === notificationId ? null : state.currentNotification,
    }));
  },

  // General actions
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

  setNotifications: (notifications: Notification[]) => {
    set({ notifications });
  },
}));

export default useAlertsStore;
