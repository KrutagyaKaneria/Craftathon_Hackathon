import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

// Default backend URL for development
// On Android emulator, 10.0.2.2 refers to the host machine's localhost
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.44.202.155:5000';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  connect(token: string) {
    if (this.socket?.connected && this.token === token) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.token = token;
    
    console.log('🔌 Connecting to WebSocket:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      // Authenticate as soon as connected
      this.socket?.emit('authenticate', token);
    });

    this.socket.on('authenticated', (data) => {
      console.log('🔓 WebSocket authenticated:', data);
      this.notifyListeners('authenticated', data);
    });

    this.socket.on('new_alert', (alert) => {
      console.log('🔔 Received new alert via WebSocket:', alert);
      this.notifyListeners('new_alert', alert);
    });

    this.socket.on('session_summary', (summary) => {
      console.log('🏁 Received session summary via WebSocket:', summary);
      this.notifyListeners('session_summary', summary);
    });

    this.socket.on('vehicle_status_updated', (data) => {
      console.log('🚗 Received vehicle status update:', data);
      this.notifyListeners('vehicle_status_updated', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('👋 Disconnected from WebSocket server:', reason);
      this.notifyListeners('disconnect', reason);
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      this.notifyListeners('error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    // Return cleanup function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        this.listeners.set(
          event,
          callbacks.filter((cb) => cb !== callback)
        );
      }
    };
  }

  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }
}

export const socketService = new SocketService();
export default socketService;
