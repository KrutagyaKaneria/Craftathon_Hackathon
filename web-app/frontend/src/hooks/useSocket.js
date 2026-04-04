import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAppStore from '../store/appStore.js';
import { telemetryService } from '../services/telemetryService.js';

const SOCKET_URL = 'http://localhost:5000';

const useSocket = (ownerId) => {
  const socketRef = useRef(null);
  const { setWsConnected, addAlert, setVehicles, vehicles } = useAppStore();

  useEffect(() => {
    if (!ownerId) return;

    console.log(`🔌 Connecting to socket for owner: ${ownerId}`);
    
    // In a real app, we'd pass a JWT here. 
    // For this hackathon/demo, we'll authenticate with the ownerId.
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    socketRef.current = socket;
    telemetryService.setSocket(socket);

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setWsConnected(true);
      
      // Authenticate to join the owner room
      // The backend socketHandler.js expects an 'authenticate' event with a token
      // But since we are bypassing auth for the terminal as per internal flow:
      socket.emit('authenticate', ownerId); 
    });

    socket.on('authenticated', () => {
      console.log(`👤 Authenticated for owner room: ${ownerId}`);
    });

    // Listen for real-time alerts from backend
    socket.on('new_alert', (alert) => {
      console.log('🔔 Received alert from backend:', alert);
      
      // Format alert for display
      const formattedAlert = {
        type: alert.type || alert.event_type || 'system',
        severity: alert.severity || 'medium',
        message: alert.message || alert.description || 'New alert received',
        timestamp: alert.timestamp || new Date(),
        driverId: alert.driver_id,
        sessionId: alert.session_id,
        data: alert.data || alert.metrics || {},
      };
      
      // Add to local alert store
      addAlert(formattedAlert);
      
      // Optional: Play sound and flash for high severity
      if (alert.severity === 'high') {
        const { utils } = require('../utils/utils.js');
        utils.playAlertSound();
        utils.flashScreen();
      }
    });

    socket.on('vehicle_status_updated', (data) => {
      console.log('🚗 Vehicle status update received:', data);
      
      // Update the local vehicles list in the store
      const { vehicleId, status } = data;
      
      if (Array.isArray(vehicles)) {
        let updatedVehicles = vehicles;
        
        // If we are in the list view, we might want to remove 'in-use' ones
        if (status === 'in-use') {
          updatedVehicles = vehicles.filter(v => v._id !== vehicleId && v.id !== vehicleId);
        }
        
        setVehicles(updatedVehicles);
      }

      addAlert({
        type: 'vehicle',
        severity: 'info',
        message: `Vehicle ${data.vehicleNumber} is now ${status}`,
      });
    });

    socket.on('session_started', (sessionEvent) => {
      console.log('🚀 Session started event received:', sessionEvent);
      
      addAlert({
        type: 'session',
        severity: sessionEvent.severity || 'low',
        message: sessionEvent.message || `Session started for ${sessionEvent.session?.driverName}`,
        timestamp: sessionEvent.timestamp,
      });
    });

    socket.on('session_ended', (sessionEvent) => {
      console.log('🛑 Session ended event received:', sessionEvent);
      
      addAlert({
        type: 'session',
        severity: sessionEvent.severity || 'low',
        message: sessionEvent.message || `Session ended for ${sessionEvent.session?.driverName}`,
        timestamp: sessionEvent.timestamp,
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setWsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [ownerId, setWsConnected, addAlert, setVehicles]);

  return socketRef.current;
};

export default useSocket;
