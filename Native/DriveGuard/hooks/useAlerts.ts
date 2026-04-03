import { useEffect, useState } from 'react';
import socketService from '../services/socketService';

export interface AlertData {
  type: string;
  subtype: string;
  severity: string;
  metrics: any;
  timestamp: string;
  driverName: string;
  vehicleNumber: string;
  sessionId: string;
}

export const useAlerts = () => {
  const [currentAlert, setCurrentAlert] = useState<AlertData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  useEffect(() => {
    // Subscribe to new_alert events from socket service
    const unsubscribe = socketService.on('new_alert', (alert: AlertData) => {
      console.log('📣 useAlerts hook received alert:', alert);
      setCurrentAlert(alert);
      setAlerts((prev) => [alert, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const clearAlert = () => {
    setCurrentAlert(null);
  };

  return {
    currentAlert,
    alerts,
    clearAlert,
  };
};

export default useAlerts;
