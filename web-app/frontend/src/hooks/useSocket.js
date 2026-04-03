import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAppStore from '../store/appStore.js';

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

    socket.on('vehicle_status_updated', (data) => {
      console.log('🚗 Vehicle status update received:', data);
      
      // Update the local vehicles list in the store
      const { vehicleId, status } = data;
      
      setVehicles(prevVehicles => {
        // If we are in the list view, we might want to remove 'in-use' ones
        if (status === 'in-use') {
          return prevVehicles.filter(v => v._id !== vehicleId && v.id !== vehicleId);
        }
        return prevVehicles;
      });

      addAlert({
        type: 'vehicle',
        severity: 'info',
        message: `Vehicle ${data.vehicleNumber} is now ${status}`,
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
