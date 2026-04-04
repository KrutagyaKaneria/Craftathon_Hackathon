import { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';

/**
 * Session Telemetry Interface
 */
export interface SessionTelemetry {
  sessionId?: string;
  driverId?: string;
  distance?: number; // in km
  duration?: number; // in seconds
  maxAcceleration?: number; // m/s²
  avgSpeed?: number; // km/h
  maxSpeed?: number; // km/h
  maxBraking?: number; // m/s²
  safetyPercentage?: number; // 0-100
  status?: string;
  timestamp?: string;
}

interface UseSessionTelemetryReturn {
  telemetry: SessionTelemetry | null;
  isActive: boolean;
  error: string | null;
  clearTelemetry: () => void;
}

/**
 * Hook to listen for real-time session telemetry from WebSocket
 * @returns {UseSessionTelemetryReturn} Telemetry data, active status, error, and clear function
 */
export function useSessionTelemetry(): UseSessionTelemetryReturn {
  const [telemetry, setTelemetry] = useState<SessionTelemetry | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for session summary (real-time telemetry updates)
    const unsubscribe = socketService.on('session_summary', (data) => {
      console.log('📊 Received telemetry data:', {
        distance: data.telemetrySnapshot?.distance || data.distance,
        duration: data.duration,
        maxAccel: data.maxAcceleration,
        avgSpeed: data.avgSpeed,
        maxSpeed: data.maxSpeed,
        maxBraking: data.maxDeceleration,
        safety: data.telemetrySnapshot?.safetyScore || data.safetyPercentage
      });

      const newTelemetry: SessionTelemetry = {
        sessionId: data.sessionId,
        driverId: data.driverId,
        distance: data.telemetrySnapshot?.distance || data.distance || 0,
        duration: data.duration || 0,
        maxAcceleration: data.maxAcceleration || 0,
        avgSpeed: data.avgSpeed || 0,
        maxSpeed: data.maxSpeed || 0,
        maxBraking: data.maxDeceleration || 0,
        safetyPercentage: data.telemetrySnapshot?.safetyScore || data.safetyPercentage || 100,
        status: data.status || 'ACTIVE',
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setTelemetry(newTelemetry);
      setIsActive(true);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe?.();
    };
  }, []);

  const clearTelemetry = () => {
    setTelemetry(null);
    setIsActive(false);
  };

  return {
    telemetry,
    isActive,
    error,
    clearTelemetry,
  };
}
