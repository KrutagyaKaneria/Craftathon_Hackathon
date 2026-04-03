import { create } from 'zustand';

export interface Session {
  _id: string;
  driverId: string;
  driverName: string;
  driverPhoto?: string;
  vehicleNumber: string;
  vehicleModel: string;
  status: 'active' | 'ended';
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  safetyScore: number; // 0-100
  alertsCount: number;
  heartRate?: number;
  eyeTracking?: string;
  lastBreak?: string;
  alert?: {
    type: string; // 'FATIGUE_DETECTED', 'SPEEDING', etc
    level?: number; // 1-5
    severity?: 'low' | 'medium' | 'high';
  };
  createdAt: string;
  updatedAt: string;
}

interface SessionsState {
  sessions: Session[];
  activeSessions: Session[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  removeSession: (sessionId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSessions: () => void;
}

const useSessionsStore = create<SessionsState>((set) => ({
  sessions: [],
  activeSessions: [],
  isLoading: false,
  error: null,

  setSessions: (sessions) => {
    // Separate active and ended sessions
    const activeSessions = sessions.filter((s) => s.status === 'active');
    set({
      sessions,
      activeSessions,
    });
  },

  addSession: (session) =>
    set((state) => {
      const updated = [session, ...state.sessions];
      const activeSessions = updated.filter((s) => s.status === 'active');
      return {
        sessions: updated,
        activeSessions,
      };
    }),

  updateSession: (sessionId, updates) =>
    set((state) => {
      const updated = state.sessions.map((s) =>
        s._id === sessionId ? { ...s, ...updates } : s
      );
      const activeSessions = updated.filter((s) => s.status === 'active');
      return {
        sessions: updated,
        activeSessions,
      };
    }),

  removeSession: (sessionId) =>
    set((state) => {
      const updated = state.sessions.filter((s) => s._id !== sessionId);
      const activeSessions = updated.filter((s) => s.status === 'active');
      return {
        sessions: updated,
        activeSessions,
      };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearSessions: () =>
    set({
      sessions: [],
      activeSessions: [],
      error: null,
    }),
}));

export default useSessionsStore;
