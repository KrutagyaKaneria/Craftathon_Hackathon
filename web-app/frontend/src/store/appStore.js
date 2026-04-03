import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  drivers: [],
  selectedDriver: null,
  verifiedDriver: null,

  vehicles: [],
  selectedVehicle: null,

  session: null,
  sessionStartTime: null,

  cameraStream: null,
  fatigueStatus: 'alert',

  acceleration: 0,
  brake: 0,
  steering: 0,

  alerts: [],
  toasts: [],
  cameraError: '',
  wsConnected: false,

  setDrivers: (drivers) => set({ drivers }),
  setSelectedDriver: (driver) => set({ selectedDriver: driver }),
  setVerifiedDriver: (driver) => set({ verifiedDriver: driver }),
  setVehicles: (vehicles) => set({ vehicles }),
  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  setSession: (session) => set({ session, sessionStartTime: new Date() }),
  setCameraStream: (stream) => set({ cameraStream: stream }),
  setFatigueStatus: (status) => set({ fatigueStatus: status }),
  setAcceleration: (value) => set({ acceleration: value }),
  setBrake: (value) => set({ brake: value }),
  setSteering: (value) => set({ steering: value }),
  setCameraError: (message) => set({ cameraError: message }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  addAlert: (alert) =>
    set((state) => {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: alert.type || 'system',
        severity: alert.severity || 'low',
        message: alert.message || 'Alert received',
        timestamp: alert.timestamp ? new Date(alert.timestamp) : new Date(),
      };
      return {
        alerts: [...state.alerts, entry].slice(-50),
        toasts: [...state.toasts, entry].slice(-6),
      };
    }),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clearAlerts: () => set({ alerts: [] }),

  reset: () => set({
    selectedDriver: null,
    verifiedDriver: null,
    vehicles: [],
    selectedVehicle: null,
    session: null,
    sessionStartTime: null,
    cameraStream: null,
    fatigueStatus: 'alert',
    acceleration: 0,
    brake: 0,
    steering: 0,
    alerts: [],
    toasts: [],
    cameraError: '',
    wsConnected: false,
  }),
}));

export default useAppStore;