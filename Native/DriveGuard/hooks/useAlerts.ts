import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import useAlertsStore from '../store/alertsStore';

export interface AlertData {
  type?: string;
  subtype?: string;
  severity?: string;
  metrics?: any;
  data?: any;
  timestamp?: string;
  driverName?: string;
  driver_name?: string;
  vehicleNumber?: string;
  vehicle_number?: string;
  sessionId?: string;
  session_id?: string;
  event?: string;
  status?: string;
  [key: string]: any;
}

export const useAlerts = () => {
  const [currentAlert, setCurrentAlert] = useState<AlertData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  
  const addAlert = useAlertsStore((state) => state.addAlert);
  const addNotification = useAlertsStore((state) => state.addNotification);

  useEffect(() => {
    // Subscribe to new_alert events from socket service
    const unsubscribe = socketService.on('new_alert', (rawAlert: any) => {
      console.log('📣 useAlerts hook received alert:', rawAlert);
      
      // Normalize the incoming alert data (backend sends different field names)
      const alert: AlertData = {
        type: rawAlert.type,
        event: rawAlert.event,
        status: rawAlert.status,
        severity: rawAlert.severity || 'high',
        timestamp: rawAlert.timestamp,
        driverName: rawAlert.driver_name || rawAlert.driverName,
        vehicleNumber: rawAlert.vehicle_number || rawAlert.vehicleNumber,
        sessionId: rawAlert.session_id || rawAlert.sessionId,
        metrics: rawAlert.data || rawAlert.metrics,
        subtype: rawAlert.status || rawAlert.event || 'Alert',
      };

      setCurrentAlert(alert);
      setAlerts((prev) => [alert, ...prev]);

      try {
        // Add to persistent alerts store
        addAlert({
          _id: alert.sessionId || `alert-${Date.now()}`,
          driverName: alert.driverName || 'Unknown',
          vehicleNumber: alert.vehicleNumber || 'Unknown',
          eventType: alert.type || 'Alert',
          subtype: alert.subtype,
          severity: (alert.severity || 'high') as 'high' | 'medium' | 'low',
          timestamp: alert.timestamp || new Date().toISOString(),
          telemetryData: alert.metrics,
          resolved: false,
        });

        // Add to notifications for top banner display
        addNotification({
          _id: alert.sessionId || `notif-${Date.now()}`,
          driverName: alert.driverName || 'Unknown',
          vehicleNumber: alert.vehicleNumber || 'Unknown',
          eventType: alert.type || 'Alert',
          title: `🚨 ${alert.type || 'Alert'} - ${alert.status || 'Detected'}`,
          message: `${alert.driverName || 'Driver'} (${alert.vehicleNumber || 'Vehicle'})`,
          subtype: alert.subtype,
          severity: (alert.severity || 'high') as 'high' | 'medium' | 'low',
          timestamp: alert.timestamp || new Date().toISOString(),
          telemetryData: alert.metrics,
          resolved: false,
        } as any);
      } catch (error) {
        console.error('❌ Error processing alert:', error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addAlert, addNotification]);

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
